/**
 * Netlify Serverless Function: export-evaluations
 * Exports matching evaluation records as a standard Excel file (.xlsx).
 * Features:
 * - Requires MANAGER_API_KEY (role-based access)
 * - Filtering by search text, star rating, date range (startDate, endDate)
 * - Excludes soft-deleted records by default (unless includeDeleted=true)
 * - Formatted summary columns for managerial reporting and spreadsheet analysis
 */

import { connectToDatabase, COLLECTION_NAME } from './db.js';
import { validateRole, ROLE_MANAGER, authErrorResponse } from './auth.js';
import ExcelJS from 'exceljs'; // Ensure you ran: npm install exceljs

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

    // 1. Fetch & Filter Data
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
          (r.assessorId || '').toLowerCase().includes(search) ||
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
            (r.assessorId || '').toLowerCase().includes(search) ||
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

    // 2. Generate Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Telematics Audit');

    // Define columns
    sheet.columns = [
      { header: 'Evaluation ID', key: 'id', width: 25 },
      { header: 'Assessment Date', key: 'assessmentDate', width: 15 },
      { header: 'Company Name', key: 'companyName', width: 25 },
      { header: 'Device Model', key: 'deviceModel', width: 20 },
      { header: 'Package Tier', key: 'packageName', width: 20 },
      { header: 'Assessor ID', key: 'assessorId', width: 15 },
      { header: 'Assessor Name', key: 'assessorName', width: 25 },
      { header: 'Section A Score (Max 33)', key: 'sectionAScore', width: 20 },
      { header: 'Section B Score (Max 10)', key: 'sectionBScore', width: 20 },
      { header: 'Total Score (Max 43)', key: 'totalScore', width: 20 },
      { header: 'Star Rating (Scale 1-5)', key: 'starRating', width: 20 },
      { header: 'Stars Count', key: 'starsCount', width: 12 },
      { header: 'MIROS Grade Classification', key: 'ratingLabel', width: 25 },
      { header: 'Rubric Version', key: 'rubricVersion', width: 15 },
      { header: 'Record Lifecycle', key: 'lifecycle', width: 22 },
      { header: 'Approval Status', key: 'status', width: 20 },
      { header: 'Approved By', key: 'approvedBy', width: 20 },
      { header: 'Approved At', key: 'approvedAt', width: 22 },
      { header: 'Rejection Reason', key: 'rejectionReason', width: 30 },
      { header: 'Soft-Deleted At', key: 'deletedAt', width: 20 },
      { header: 'Soft-Deleted By', key: 'deletedBy', width: 20 },
      { header: 'Edit History Count', key: 'historyCount', width: 18 },
      { header: 'Created Timestamp', key: 'createdAt', width: 22 },
      { header: 'Last Updated Timestamp', key: 'updatedAt', width: 22 }
    ];

    // Make the header row bold
    sheet.getRow(1).font = { bold: true };

    // 3. Map Data to Rows
    const rows = records.map(r => ({
      id: r._id || r.id || '',
      assessmentDate: r.assessmentDate || (r.createdAt ? r.createdAt.substring(0, 10) : ''),
      companyName: r.companyName || '',
      deviceModel: r.deviceModel || '',
      packageName: r.packageName || 'Standard Evaluation',
      assessorId: r.assessorId || 'N/A',
      assessorName: r.assessorName || '',
      sectionAScore: Number(r.sectionAScore || 0).toFixed(2),
      sectionBScore: Number(r.sectionBScore || 0).toFixed(2),
      totalScore: Number(r.totalScore || 0).toFixed(2),
      starRating: Number(r.starRating || 0).toFixed(2),
      starsCount: r.starsCount || 1,
      ratingLabel: r.ratingLabel || '',
      rubricVersion: r.rubricVersion || '1.0.0',
      lifecycle: r.deletedAt ? 'Soft-Deleted (Archived)' : 'Active',
      status: r.status || 'pending_review',
      approvedBy: r.approvedBy || '',
      approvedAt: r.approvedAt || '',
      rejectionReason: r.rejectionReason || '',
      deletedAt: r.deletedAt || '',
      deletedBy: r.deletedBy || '',
      historyCount: Array.isArray(r.evaluationHistory) ? r.evaluationHistory.length : 0,
      createdAt: r.createdAt || '',
      updatedAt: r.updatedAt || ''
    }));

    sheet.addRows(rows);

    // 4. Output as Base64 for Netlify Response
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `trackscore_evaluations_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error exporting evaluations to Excel:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Failed to export evaluations to Excel'
      })
    };
  }
};

export default { handler };