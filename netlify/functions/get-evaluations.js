/**
 * Netlify Serverless Function: get-evaluations
 * Handles GET requests to retrieve historical evaluations sorted by date descending.
 * Features:
 * - Shared-secret header authentication (x-api-key)
 * - Server-side pagination via ?page=&limit= query parameters (default limit: 20)
 */

import { connectToDatabase, COLLECTION_NAME } from './db.js';
import { validateRole, ROLE_MANAGER, authErrorResponse } from './auth.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-KEY',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use GET.' })
    };
  }

  // Diagnostic console.log for Netlify function logs (masked to last 4 chars for security)
  const incomingKey = event?.headers?.['x-api-key'] ||
                      event?.headers?.['X-Api-Key'] ||
                      event?.headers?.['X-API-KEY'] ||
                      Object.entries(event?.headers || {}).find(([k]) => k.toLowerCase() === 'x-api-key')?.[1];
  const mask = (k) => {
    if (!k || typeof k !== 'string') return '(empty/missing)';
    const trimmed = k.trim();
    if (trimmed.length <= 4) return `***${trimmed} (len: ${trimmed.length})`;
    return `***${trimmed.slice(-4)} (len: ${trimmed.length})`;
  };
  console.log(`[AUTH-DEBUG get-evaluations] Received x-api-key: ${mask(incomingKey)} | Expected MANAGER_API_KEY: ${mask(process.env.MANAGER_API_KEY)} | Fallback default: ${mask('trackscore-manager-key-2026')}`);

  // 1. API Protection Check (Manager Role Required)
  const roleCheck = validateRole(event, ROLE_MANAGER);
  if (!roleCheck.authorized) {
    return authErrorResponse(headers, roleCheck.statusCode, roleCheck.error);
  }

  try {
    const params = event.queryStringParameters || {};
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(params.limit, 10) || 20));
    const includeDeleted = params.includeDeleted === 'true' || params.includeDeleted === '1';
    const statusFilter = (params.status || '').trim().toLowerCase();
    const sortBy = params.sortBy === 'statusChangedAt' ? 'statusChangedAt' : 'createdAt';

    const connection = await connectToDatabase();
    let evaluations = [];
    let total = 0;

    if (connection.isMongoAtlas) {
      const collection = connection.db.collection(COLLECTION_NAME);
      const queryFilter = includeDeleted ? {} : { deletedAt: { $exists: false } };
      if (statusFilter && statusFilter !== 'all') {
        queryFilter.status = statusFilter;
      }
      total = await collection.countDocuments(queryFilter);
      const sortDoc = {};
      sortDoc[sortBy] = -1;
      evaluations = await collection
        .find(queryFilter)
        .sort(sortDoc)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
    } else {
      let allEvaluations = await connection.getEvaluations(includeDeleted);
      if (statusFilter && statusFilter !== 'all') {
        allEvaluations = allEvaluations.filter(d => (d.status || 'pending_review').toLowerCase() === statusFilter);
      }
      if (sortBy === 'statusChangedAt') {
        allEvaluations.sort((a, b) => new Date(b.statusChangedAt || b.createdAt) - new Date(a.statusChangedAt || a.createdAt));
      }
      total = allEvaluations.length;
      evaluations = allEvaluations.slice((page - 1) * limit, page * limit);
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: evaluations.length,
        total,
        page,
        limit,
        totalPages,
        includeDeleted,
        isMongoAtlas: connection.isMongoAtlas,
        atlasDiagnostic: connection.atlasDiagnostic || null,
        data: evaluations
      })
    };
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error while retrieving evaluations'
      })
    };
  }
};

export default { handler };
