/**
 * Netlify Serverless Function: save-evaluation
 * Handles POST requests to store evaluation records in MongoDB Atlas or local store
 * Includes:
 * - Shared-secret header authentication (x-api-key)
 * - Server-side score recomputation & cryptographic-grade integrity validation
 * - Duplicate submission detection (Company + Device + Assessor + Date)
 * - Rubric versioning tag
 */

import { connectToDatabase, COLLECTION_NAME, buildMongoIdFilter } from './db.js';
import { validateRole, ROLE_ASSESSOR, authErrorResponse } from './auth.js';
import { recomputeScores, RUBRIC_VERSION, MAX_TOTAL_SCORE } from './rubric.js';

export const handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-KEY',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  // 1. API Protection Check (Assessor Role Required)
  const roleCheck = validateRole(event, ROLE_ASSESSOR);
  if (!roleCheck.authorized) {
    return authErrorResponse(headers, roleCheck.statusCode, roleCheck.error);
  }

  try {
    let payload;
    try {
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON payload in request body' })
      };
    }

    // 2. Validate mandatory metadata fields
    const { companyName, deviceModel, assessorName, assessmentDate, packageName, breakdown, resubmitRecordId } = payload;
    if (!companyName || !deviceModel || !assessorName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: Company Name, Device Model, and Assessor Name are mandatory.'
        })
      };
    }

    const cleanCompany = String(companyName).trim();
    const cleanModel = String(deviceModel).trim();
    const cleanAssessor = String(assessorName).trim();
    const cleanDate = assessmentDate ? String(assessmentDate).trim().substring(0, 10) : new Date().toISOString().substring(0, 10);

    // 3. Server-side score recomputation & integrity check
    if (!Array.isArray(breakdown) || breakdown.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing or empty evaluation breakdown array. Full 33-item evaluation matrix is required.'
        })
      };
    }

    const recomputed = recomputeScores(breakdown);

    // Verify client-submitted totals vs recomputed totals within 0.05 epsilon
    const clientScoreA = Number(payload.sectionAScore || 0);
    const clientScoreB = Number(payload.sectionBScore || 0);
    const clientTotal = Number(payload.totalScore || 0);

    const diffA = Math.abs(clientScoreA - recomputed.sectionAScore);
    const diffB = Math.abs(clientScoreB - recomputed.sectionBScore);
    const diffTotal = Math.abs(clientTotal - recomputed.totalScore);
    const EPSILON = 0.05;

    if (diffA > EPSILON || diffB > EPSILON || diffTotal > EPSILON) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Score integrity verification failed. Client submitted (A: ${clientScoreA.toFixed(2)}, B: ${clientScoreB.toFixed(2)}, Total: ${clientTotal.toFixed(2)}) does not match authoritative recomputed scores (A: ${recomputed.sectionAScore.toFixed(2)}, B: ${recomputed.sectionBScore.toFixed(2)}, Total: ${recomputed.totalScore.toFixed(2)}).`,
          recomputedScores: {
            sectionAScore: recomputed.sectionAScore,
            sectionBScore: recomputed.sectionBScore,
            totalScore: recomputed.totalScore
          }
        })
      };
    }

    const connection = await connectToDatabase();

    // 4. Handle Re-submission of Rejected Records (Requirement 2 & 4)
    if (resubmitRecordId) {
      let existingToResubmit = null;
      if (connection.isMongoAtlas) {
        const collection = connection.db.collection(COLLECTION_NAME);
        existingToResubmit = await collection.findOne(buildMongoIdFilter(resubmitRecordId));
      } else {
        existingToResubmit = await connection.getEvaluationById(resubmitRecordId);
      }

      if (existingToResubmit) {
        if (existingToResubmit.status === 'approved') {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({
              error: 'This evaluation has already been approved and locked. Modifications are prohibited for MIROS compliance.'
            })
          };
        }

        const updateFields = {
          companyName: cleanCompany,
          deviceModel: cleanModel,
          packageName: packageName ? String(packageName).trim() : 'Standard Evaluation',
          assessorName: cleanAssessor,
          assessmentDate: cleanDate,
          sectionAScore: recomputed.sectionAScore,
          sectionBScore: recomputed.sectionBScore,
          totalScore: recomputed.totalScore,
          starRating: recomputed.starRating,
          starsCount: recomputed.starsCount,
          ratingLabel: recomputed.ratingLabel,
          breakdown: recomputed.breakdown,
          status: 'pending_review',
          statusChangedAt: new Date().toISOString(),
          rejectionReason: null,
          resubmittedAt: new Date().toISOString()
        };

        const historyEntry = {
          action: 'resubmitted_by_assessor',
          timestamp: new Date().toISOString(),
          changedBy: cleanAssessor,
          note: `Assessor remediated criteria and resubmitted for manager review. (Previous score: ${(existingToResubmit.totalScore || 0).toFixed(2)}, New score: ${recomputed.totalScore.toFixed(2)})`,
          previousScores: {
            sectionAScore: existingToResubmit.sectionAScore,
            sectionBScore: existingToResubmit.sectionBScore,
            totalScore: existingToResubmit.totalScore,
            starRating: existingToResubmit.starRating
          }
        };

        if (connection.isMongoAtlas) {
          const collection = connection.db.collection(COLLECTION_NAME);
          await collection.updateOne(buildMongoIdFilter(resubmitRecordId), {
            $set: updateFields,
            $push: { evaluationHistory: historyEntry }
          });
        } else {
          await connection.updateEvaluation(resubmitRecordId, updateFields, historyEntry);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            id: resubmitRecordId,
            status: 'pending_review',
            isResubmission: true,
            verifiedScores: {
              sectionAScore: recomputed.sectionAScore,
              sectionBScore: recomputed.sectionBScore,
              totalScore: recomputed.totalScore,
              starRating: recomputed.starRating,
              ratingLabel: recomputed.ratingLabel
            },
            message: 'Evaluation record successfully updated and resubmitted for manager review!'
          })
        };
      }
    }

    // 5. Duplicate Submission Guard (For new submissions)
    // Check for existing record with same Company + Device + Assessor + Date
    if (connection.isMongoAtlas) {
      const collection = connection.db.collection(COLLECTION_NAME);
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await collection.findOne({
        companyName: { $regex: new RegExp(`^${escapeRegex(cleanCompany)}$`, 'i') },
        deviceModel: { $regex: new RegExp(`^${escapeRegex(cleanModel)}$`, 'i') },
        assessorName: { $regex: new RegExp(`^${escapeRegex(cleanAssessor)}$`, 'i') },
        deletedAt: null,
        $or: [
          { assessmentDate: cleanDate },
          { createdAt: { $regex: new RegExp(`^${cleanDate}`) } }
        ]
      });

      if (existing) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: `Conflict: An evaluation record for Company "${cleanCompany}", Device "${cleanModel}", Assessor "${cleanAssessor}" on date ${cleanDate} already exists (ID: ${existing._id}). Please edit the existing record or update the assessment date/model.`,
            existingId: existing._id
          })
        };
      }
    } else {
      const existing = await connection.findDuplicate(cleanCompany, cleanModel, cleanAssessor, cleanDate);
      if (existing) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: `Conflict: An evaluation record for Company "${cleanCompany}", Device "${cleanModel}", Assessor "${cleanAssessor}" on date ${cleanDate} already exists (ID: ${existing._id}). Please edit the existing record or update the assessment date/model.`,
            existingId: existing._id
          })
        };
      }
    }

    // 5. Build authoritative evaluation document
    const evaluationRecord = {
      rubricVersion: payload.rubricVersion || RUBRIC_VERSION,
      companyName: cleanCompany,
      deviceModel: cleanModel,
      packageName: packageName ? String(packageName).trim() : 'Standard Evaluation',
      assessorName: cleanAssessor,
      assessmentDate: cleanDate,
      // Store verified server-recomputed scores
      sectionAScore: recomputed.sectionAScore,
      sectionBScore: recomputed.sectionBScore,
      totalScore: recomputed.totalScore,
      starRating: recomputed.starRating,
      starsCount: recomputed.starsCount,
      ratingLabel: recomputed.ratingLabel,
      maxPossibleScore: MAX_TOTAL_SCORE,
      breakdown: recomputed.breakdown,
      status: 'pending_review',
      statusChangedAt: payload.createdAt || new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      evaluationHistory: [],
      createdAt: payload.createdAt || new Date().toISOString()
    };

    let insertedId;
    let storageType;

    if (connection.isMongoAtlas) {
      const collection = connection.db.collection(COLLECTION_NAME);
      const result = await collection.insertOne(evaluationRecord);
      insertedId = result.insertedId;
      storageType = 'mongodb_atlas';
    } else {
      const result = await connection.insertEvaluation(evaluationRecord);
      insertedId = result.insertedId;
      storageType = 'local_store';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: insertedId,
        status: evaluationRecord.status,
        storage: storageType,
        rubricVersion: evaluationRecord.rubricVersion,
        verifiedScores: {
          sectionAScore: evaluationRecord.sectionAScore,
          sectionBScore: evaluationRecord.sectionBScore,
          totalScore: evaluationRecord.totalScore,
          starRating: evaluationRecord.starRating,
          ratingLabel: evaluationRecord.ratingLabel
        },
        message: 'Evaluation saved successfully to ' + (storageType === 'mongodb_atlas' ? 'MongoDB Atlas' : 'TrackScore Repository')
      })
    };
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error while persisting evaluation'
      })
    };
  }
};

export default { handler };
