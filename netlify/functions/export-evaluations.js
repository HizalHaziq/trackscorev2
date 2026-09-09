/**
 * Netlify Serverless Function: export-evaluations
 * Exports matching evaluation records as a standard CSV format (RFC 4180).
 * Features:
 * - Requires MANAGER_API_KEY (role-based access)
 * - Filtering by search text, star rating, date range (startDate, endDate)
 * - Excludes soft-deleted records by default (unless includeDeleted=true)
 * - Formatted summary columns for managerial reporting and spreadsheet analysis
 */

import { connectToDatabase, COLLECTION_NAME } from './db.js';
import { validateRole, ROLE_MANAGER, authErrorResponse } from './auth.js';

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export const handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-KEY',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed. Use GET.' })
    };
  }

  // Role validation: Manager required
  const roleCheck = validateRole(event, ROLE_MANAGER);
  if (!roleCheck.authorized) {
    return authErrorResponse(corsHeaders, roleCheck.statusCode, roleCheck.error);
  }

  try {
    const params = event.queryStringParameters || {};
    const search = (params.search || '').trim().toLowerCase();
    const ratingFilter = params.rating || params.starsCount || 'all';
    const startDate = params.startDate ? new Date(params.startDate) : null;
    const endDate = params.endDate ? new Date(params.endDate) : null;
    const includeDeleted = params.includeDeleted === 'true' || params.includeDeleted === '1';

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const connection = await connectToDatabase();
    let records = [];

    if (connection.isMongoAtlas) {
      const collection = connection.db.collection(COLLECTION_NAME);
      const query = includeDeleted ? {} : { deletedAt: { $exists: false } };

      if (ratingFilter !== 'all' && !isNaN(parseInt(ratingFilter, 10))) {
        query.starsCount = parseInt(ratingFilter, 10);
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate.toISOString();
        if (endDate) query.createdAt.$lte = endDate.toISOString();
      }

      records = await collection.find(query).sort({ createdAt: -1 }).toArray();

      if (search) {
        records = records.filter(r =>
          (r.companyName || '').toLowerCase().includes(search) ||
          (r.deviceModel || '').toLowerCase().includes(search) ||
          (r.assessorName || '').toLowerCase().includes(search) ||
          (r.packageName || '').toLowerCase().includes(search)
        );
      }
    } else {
      const all = await connection.getEvaluations(includeDeleted);
      records = all.filter(r => {
        // Search filter
        if (search) {
          const matchSearch =
            (r.companyName || '').toLowerCase().includes(search) ||
            (r.deviceModel || '').toLowerCase().includes(search) ||
            (r.assessorName || '').toLowerCase().includes(search) ||
            (r.packageName || '').toLowerCase().includes(search);
          if (!matchSearch) return false;
        }

        // Rating filter
        if (ratingFilter !== 'all' && !isNaN(parseInt(ratingFilter, 10))) {
          if (r.starsCount !== parseInt(ratingFilter, 10)) return false;
        }

        // Date range filter
        const recDateStr = r.assessmentDate || r.createdAt;
        if (recDateStr) {
          const recDate = new Date(recDateStr);
          if (startDate && recDate < startDate) return false;
          if (endDate && recDate > endDate) return false;
        }

        return true;
      });
    }

    // Generate CSV Header
    const csvHeaders = [
      'Evaluation ID',
      'Assessment Date',
      'Company Name',
      'Device Model',
      'Package Tier',
      'Assessor',
      'Section A Score (Max 33)',
      'Section B Score (Max 10)',
      'Total Score (Max 43)',
      'Star Rating (Scale 1-5)',
      'Stars Count',
      'MIROS Grade Classification',
      'Rubric Version',
      'Record Lifecycle',
      'Approval Status',
      'Approved By',
      'Approved At',
      'Rejection Reason',
      'Soft-Deleted At',
      'Soft-Deleted By',
      'Edit History Count',
      'Created Timestamp',
      'Last Updated Timestamp'
    ];

    const rows = [csvHeaders.map(escapeCsvField).join(',')];

    for (const r of records) {
      const row = [
        r._id || r.id || '',
        r.assessmentDate || (r.createdAt ? r.createdAt.substring(0, 10) : ''),
        r.companyName || '',
        r.deviceModel || '',
        r.packageName || 'Standard Evaluation',
        r.assessorName || '',
        (r.sectionAScore || 0).toFixed(2),
        (r.sectionBScore || 0).toFixed(2),
        (r.totalScore || 0).toFixed(2),
        (r.starRating || 0).toFixed(2),
        r.starsCount || 1,
        r.ratingLabel || '',
        r.rubricVersion || '1.0.0',
        r.deletedAt ? 'Soft-Deleted (Archived)' : 'Active',
        r.status || 'pending_review',
        r.approvedBy || '',
        r.approvedAt || '',
        r.rejectionReason || '',
        r.deletedAt || '',
        r.deletedBy || '',
        Array.isArray(r.evaluationHistory) ? r.evaluationHistory.length : 0,
        r.createdAt || '',
        r.updatedAt || ''
      ];
      rows.push(row.map(escapeCsvField).join(','));
    }

    const csvContent = rows.join('\r\n');
    const filename = `trackscore_evaluations_${new Date().toISOString().slice(0, 10)}.csv`;

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      body: csvContent
    };
  } catch (error) {
    console.error('Error exporting evaluations to CSV:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Failed to export evaluations to CSV'
      })
    };
  }
};

export default { handler };
