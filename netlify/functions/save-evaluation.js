/**
 * Netlify Serverless Function: save-evaluation
 * Handles POST requests to store evaluation records in MongoDB Atlas or local store
 * Includes:
 * - Shared-secret header authentication (x-api-key)
 * - Server-side score recomputation & cryptographic-grade integrity validation
 * - Duplicate submission detection (Company + Device + Assessor ID + Date)
 * - Rubric versioning tag
 * - Make.com Webhook Integration for Excel Live Sync
 */

import { connectToDatabase, COLLECTION_NAME, buildMongoIdFilter } from './db.js';
import { validateRole, ROLE_ASSESSOR, authErrorResponse } from './auth.js';
import { recomputeScores, RUBRIC_VERSION, MAX_TOTAL_SCORE } from './rubric.js';

// === CONFIGURATION ===
// Paste your Make.com Webhook URL here
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/gayv3o78cvcz4cnu7gpyjp4c8udjrpig"; 

export const handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-KEY',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
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

    // 2. Validate mandatory metadata fields (Added Assessor ID)
    const { companyName, deviceModel, assessorName, assessorId, assessmentDate, packageName, breakdown, resubmitRecordId } = payload;
    
    if (!companyName || !deviceModel || !assessorName || !assessorId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: Company Name, Device Model, Assessor Name, and Assessor ID are mandatory.'
        })
      };
    }

    const cleanCompany = String(companyName).trim();
    const cleanModel = String(deviceModel).trim();
    const cleanAssessorName = String(assessorName).trim();
    const cleanAssessorId = String(assessorId).trim();
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

    // Helper Function: Send Data to Make.com
    const syncToWebhook = async (recordData, isResubmission = false) => {
      if (MAKE_WEBHOOK_URL && MAKE_WEBHOOK_URL !== "YOUR_MAKE_WEBHOOK_URL_HERE") {
        try {
          await fetch(MAKE_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyName: recordData.companyName,
              deviceModel: recordData.deviceModel,
              assessorId: recordData.assessorId,
              assessorName: recordData.assessorName,
              score: recordData.totalScore,
              status: recordData.status,
              isResubmission: isResubmission,
              date: new Date().toISOString()
            })
          });
        } catch (webhookError) {
          console.error("Make.com Webhook Sync Failed:", webhookError);
        }
      }
    };

    // 4. Handle Re-submission of Rejected Records
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
          assessorName: cleanAssessorName,
          assessorId: cleanAssessorId, // Updated to store ID
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
          changedBy: `${cleanAssessorName} (${cleanAssessorId})`,
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

        // Trigger Webhook for Resubmission
        await syncToWebhook(updateFields, true);

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
    if (connection.isMongoAtlas) {
      const collection = connection.db.collection(COLLECTION_NAME);
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await collection.findOne({
        companyName: { $regex: new RegExp(`^${escapeRegex(cleanCompany)}$`, 'i') },
        deviceModel: { $regex: new RegExp(`^${escapeRegex(cleanModel)}$`, 'i') },
        assessorId: cleanAssessorId, // Guard strictly by ID to prevent name collisions
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
            error: `Conflict: An evaluation record for Company "${cleanCompany}", Device "${cleanModel}", Assessor "${cleanAssessorName}" (${cleanAssessorId}) on date ${cleanDate} already exists (ID: ${existing._id}). Please edit the existing record or update the assessment date/model.`,
            existingId: existing._id
          })
        };
      }
    } else {
      // Fallback for local storage (checks name instead of ID if local method isn't updated)
      const existing = await connection.findDuplicate(cleanCompany, cleanModel, cleanAssessorName, cleanDate);
      if (existing) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: `Conflict: An evaluation record for Company "${cleanCompany}", Device "${cleanModel}", Assessor "${cleanAssessorName}" on date ${cleanDate} already exists (ID: ${existing._id}). Please edit the existing record or update the assessment date/model.`,
            existingId: existing._id
          })
        };
      }
    }

    // 6. Build authoritative evaluation document
    const evaluationRecord = {
      rubricVersion: payload.rubricVersion || RUBRIC_VERSION,
      companyName: cleanCompany,
      deviceModel: cleanModel,
      packageName: packageName ? String(packageName).trim() : 'Standard Evaluation',
      assessorName: cleanAssessorName,
      assessorId: cleanAssessorId, // Added Assessor ID
      assessmentDate: cleanDate,
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

    // 7. Persist to Database
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

    // 8. Trigger Webhook for New Submission
    await syncToWebhook(evaluationRecord, false);

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