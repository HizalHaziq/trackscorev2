/**
 * Netlify Serverless Function: approve-evaluation
 * Handles POST requests to approve or reject an evaluation record.
 * Requirements:
 * - Protected by MANAGER_API_KEY (role-based access)
 * - Approves: sets status='approved', approvedBy, approvedAt, statusChangedAt
 * - Rejects: sets status='rejected', rejectedBy, rejectedAt, rejectionReason (required), statusChangedAt
 * - Appends audit action to evaluationHistory
 */

import { connectToDatabase, COLLECTION_NAME, buildMongoIdFilter } from './db.js';
import { validateRole, ROLE_MANAGER, authErrorResponse } from './auth.js';

export const handler = async (event, context) => {
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

  // 1. Validate Manager privileges
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
        body: JSON.stringify({ error: 'Missing evaluation ID (_id or id required)' })
      };
    }

    // Determine requested action: 'approved' | 'rejected'
    const rawAction = String(payload.action || payload.status || '').trim().toLowerCase();
    let targetStatus = null;
    if (rawAction === 'approve' || rawAction === 'approved') {
      targetStatus = 'approved';
    } else if (rawAction === 'reject' || rawAction === 'rejected') {
      targetStatus = 'rejected';
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid status or action "${rawAction}". Permitted values: "approved" or "rejected".`
        })
      };
    }

    // Validate rejection reason when status is rejected
    const rejectionReason = (payload.rejectionReason || payload.reason || '').trim();
    if (targetStatus === 'rejected' && !rejectionReason) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Rejection reason is required when rejecting an evaluation.'
        })
      };
    }

    const connection = await connectToDatabase();
    const nowIso = new Date().toISOString();
    const managerIdentifier = (payload.managerName || payload.approvedBy || payload.rejectedBy || 'Manager').trim();

    // Fetch current document
    let existing = null;
    let collection = null;
    let filter = null;

    if (connection.isMongoAtlas) {
      collection = connection.db.collection(COLLECTION_NAME);
      filter = buildMongoIdFilter(id);
      existing = await collection.findOne(filter);
    } else {
      existing = await connection.getEvaluationById(id);
    }

    if (!existing) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Evaluation record with ID "${id}" not found.` })
      };
    }

    // Build update document and audit history
    let updateFields = {};
    let historyEntry = {};

    if (targetStatus === 'approved') {
      updateFields = {
        status: 'approved',
        approvedBy: managerIdentifier,
        approvedAt: nowIso,
        statusChangedAt: nowIso,
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null
      };

      historyEntry = {
        action: 'approved',
        timestamp: nowIso,
        changedBy: managerIdentifier,
        note: payload.note || 'Evaluation approved and locked by manager'
      };
    } else {
      updateFields = {
        status: 'rejected',
        rejectedBy: managerIdentifier,
        rejectedAt: nowIso,
        rejectionReason,
        statusChangedAt: nowIso
      };

      historyEntry = {
        action: 'rejected',
        timestamp: nowIso,
        changedBy: managerIdentifier,
        rejectionReason,
        note: `Evaluation rejected: ${rejectionReason}`
      };
    }

    // Apply update to persistent storage
    if (connection.isMongoAtlas) {
      await collection.updateOne(filter, {
        $set: updateFields,
        $push: { evaluationHistory: historyEntry }
      });
    } else {
      await connection.updateEvaluation(id, updateFields, historyEntry);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id,
        status: targetStatus,
        statusChangedAt: nowIso,
        approvedBy: updateFields.approvedBy || null,
        approvedAt: updateFields.approvedAt || null,
        rejectedBy: updateFields.rejectedBy || null,
        rejectedAt: updateFields.rejectedAt || null,
        rejectionReason: updateFields.rejectionReason || null,
        message: targetStatus === 'approved'
          ? `Evaluation "${id}" approved successfully and locked against edits.`
          : `Evaluation "${id}" rejected with reason recorded.`
      })
    };
  } catch (error) {
    console.error('Error approving/rejecting evaluation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error during evaluation status update'
      })
    };
  }
};

export default { handler };
