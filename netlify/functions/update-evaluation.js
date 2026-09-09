/**
 * Netlify Serverless Function: update-evaluation
 * Handles PUT / PATCH requests to update an existing evaluation record by _id.
 * Features:
 * - Shared-secret header authentication (x-api-key)
 * - Automatic score recomputation if breakdown is updated
 * - Updates in MongoDB Atlas or local fallback storage
 */

import { connectToDatabase, COLLECTION_NAME, buildMongoIdFilter } from './db.js';
import { validateRole, ROLE_MANAGER, authErrorResponse } from './auth.js';
import { recomputeScores } from './rubric.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-KEY',
    'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use PUT or PATCH.' })
    };
  }

  // 1. API Protection Check (Manager Role Required)
  const roleCheck = validateRole(event, ROLE_MANAGER);
  if (!roleCheck.authorized) {
    return authErrorResponse(headers, roleCheck.statusCode, roleCheck.error);
  }

  try {
    let payload;
    try {
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON payload in request body' })
      };
    }

    const id = event.queryStringParameters?.id || payload?._id || payload?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing evaluation ID (_id or ?id= parameter required)' })
      };
    }

    const connection = await connectToDatabase();

    // 2. Fetch existing document to create audit snapshot
    let existingRecord = null;
    let filter = null;
    let collection = null;

    if (connection.isMongoAtlas) {
      collection = connection.db.collection(COLLECTION_NAME);
      filter = buildMongoIdFilter(id);
      existingRecord = await collection.findOne(filter);
    } else {
      existingRecord = await connection.getEvaluationById(id);
    }

    if (!existingRecord) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Evaluation record not found for ID: ${id}` })
      };
    }

    // 3. Immutability Enforcement: Approved evaluations are locked and cannot be edited
    if (existingRecord.status === 'approved') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Approved evaluations are locked and cannot be edited. Contact a manager to reject and resubmit if a correction is needed.'
        })
      };
    }

    // 4. Prepare audit trail snapshot
    const historySnapshot = {
      editedAt: new Date().toISOString(),
      editedBy: payload.editedBy || payload.assessorName || 'Manager',
      previousScores: {
        sectionAScore: existingRecord.sectionAScore ?? 0,
        sectionBScore: existingRecord.sectionBScore ?? 0,
        totalScore: existingRecord.totalScore ?? 0,
        starRating: existingRecord.starRating ?? 0,
        starsCount: existingRecord.starsCount ?? 1,
        ratingLabel: existingRecord.ratingLabel ?? 'Unrated'
      },
      previousBreakdown: Array.isArray(existingRecord.breakdown) ? [...existingRecord.breakdown] : []
    };

    const updateFields = {};
    if (payload.companyName) updateFields.companyName = String(payload.companyName).trim();
    if (payload.deviceModel) updateFields.deviceModel = String(payload.deviceModel).trim();
    if (payload.packageName) updateFields.packageName = String(payload.packageName).trim();
    if (payload.assessorName) updateFields.assessorName = String(payload.assessorName).trim();
    if (payload.assessmentDate) updateFields.assessmentDate = String(payload.assessmentDate).trim();

    // If breakdown array provided, recompute scores server-side
    if (Array.isArray(payload.breakdown) && payload.breakdown.length > 0) {
      const recomputed = recomputeScores(payload.breakdown);
      updateFields.breakdown = recomputed.breakdown;
      updateFields.sectionAScore = recomputed.sectionAScore;
      updateFields.sectionBScore = recomputed.sectionBScore;
      updateFields.totalScore = recomputed.totalScore;
      updateFields.starRating = recomputed.starRating;
      updateFields.starsCount = recomputed.starsCount;
      updateFields.ratingLabel = recomputed.ratingLabel;
      updateFields.rubricVersion = recomputed.rubricVersion;
    }

    updateFields.updatedAt = new Date().toISOString();

    if (connection.isMongoAtlas) {
      const result = await collection.updateOne(filter, {
        $set: updateFields,
        $push: { evaluationHistory: historySnapshot }
      });

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: `Evaluation record not found for ID: ${id}` })
        };
      }

      const updatedRecord = await collection.findOne(filter);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Evaluation updated successfully with audit trail snapshot in MongoDB Atlas',
          id,
          updatedFields: Object.keys(updateFields),
          auditSnapshot: historySnapshot,
          data: updatedRecord
        })
      };
    } else {
      const result = await connection.updateEvaluation(id, updateFields, historySnapshot);
      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: `Evaluation record not found for ID: ${id}` })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Evaluation updated successfully with audit trail snapshot in local store',
          id,
          updatedFields: Object.keys(updateFields),
          auditSnapshot: historySnapshot,
          data: result.updatedDoc
        })
      };
    }
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error while updating evaluation'
      })
    };
  }
};

export default { handler };
