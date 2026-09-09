/**
 * Netlify Serverless Function: lookup-evaluation
 * Allows assessors (or managers) to look up evaluation submissions by Assessor ID / Name or record ID.
 * Specifically surfaces rejection reasons prominently for rejected assessments,
 * and allows loading previous evaluations for correction.
 */

import { connectToDatabase, COLLECTION_NAME, buildMongoIdFilter } from './db.js';
import { validateRole, ROLE_ASSESSOR, ROLE_MANAGER, authErrorResponse } from './auth.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-KEY',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use GET.' })
    };
  }

  // Either Assessor or Manager privileges can perform lookup
  const assessorCheck = validateRole(event, ROLE_ASSESSOR);
  const managerCheck = validateRole(event, ROLE_MANAGER);
  if (!assessorCheck.authorized && !managerCheck.authorized) {
    return authErrorResponse(headers, 401, 'Valid Assessor or Manager API key required for lookup.');
  }

  try {
    const params = event.queryStringParameters || {};
    const assessorQuery = (params.assessorId || params.query || '').trim().toLowerCase();
    const idQuery = (params.id || '').trim();

    if (!assessorQuery && !idQuery) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please provide ?assessorId= or ?id= to look up evaluations.' })
      };
    }

    const connection = await connectToDatabase();
    let records = [];

    if (connection.isMongoAtlas) {
      const collection = connection.db.collection(COLLECTION_NAME);
      let filter = { deletedAt: { $exists: false } };

      if (idQuery) {
        filter = buildMongoIdFilter(idQuery);
        const single = await collection.findOne(filter);
        if (single) records = [single];
      } else {
        const regex = new RegExp(assessorQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { assessorName: regex },
          { companyName: regex },
          { deviceModel: regex }
        ];
        records = await collection.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
      }
    } else {
      const all = await connection.getEvaluations(false);
      if (idQuery) {
        const single = all.find(d => String(d._id) === idQuery || String(d.id) === idQuery);
        if (single) records = [single];
      } else {
        records = all.filter(d => {
          const a = String(d.assessorName || '').toLowerCase();
          const c = String(d.companyName || '').toLowerCase();
          const m = String(d.deviceModel || '').toLowerCase();
          return a.includes(assessorQuery) || c.includes(assessorQuery) || m.includes(assessorQuery);
        }).slice(0, 20);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: records.length,
        data: records.map(r => ({
          _id: r._id || r.id,
          companyName: r.companyName,
          deviceModel: r.deviceModel,
          packageName: r.packageName,
          assessorName: r.assessorName,
          assessmentDate: r.assessmentDate,
          totalScore: r.totalScore,
          sectionAScore: r.sectionAScore,
          sectionBScore: r.sectionBScore,
          starRating: r.starRating,
          starsCount: r.starsCount,
          ratingLabel: r.ratingLabel,
          status: r.status || 'pending_review',
          statusChangedAt: r.statusChangedAt || r.createdAt,
          rejectionReason: r.rejectionReason || null,
          rejectedBy: r.rejectedBy || null,
          rejectedAt: r.rejectedAt || null,
          approvedBy: r.approvedBy || null,
          approvedAt: r.approvedAt || null,
          breakdown: r.breakdown || [],
          createdAt: r.createdAt
        }))
      })
    };
  } catch (error) {
    console.error('Error during evaluation lookup:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error during evaluation lookup'
      })
    };
  }
};

export default { handler };
