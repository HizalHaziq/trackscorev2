/**
 * Netlify Serverless Function: delete-evaluation
 * Handles DELETE requests to remove an evaluation record by _id.
 * Features:
 * - Shared-secret header authentication (x-api-key)
 * - Safe deletion in MongoDB Atlas or local fallback store
 */

import { connectToDatabase, COLLECTION_NAME, buildMongoIdFilter } from './db.js';
import { validateRole, ROLE_MANAGER, authErrorResponse } from './auth.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-KEY',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use DELETE.' })
    };
  }

  // 1. API Protection Check (Manager Role Required)
  const roleCheck = validateRole(event, ROLE_MANAGER);
  if (!roleCheck.authorized) {
    return authErrorResponse(headers, roleCheck.statusCode, roleCheck.error);
  }

  try {
    let id = event.queryStringParameters?.id;
    let deletedBy = event.queryStringParameters?.deletedBy || 'Manager';

    if (!id && event.body) {
      try {
        const parsed = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        id = parsed._id || parsed.id;
        if (parsed.deletedBy) deletedBy = parsed.deletedBy;
      } catch {
        // body wasn't JSON
      }
    }

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing evaluation ID to delete (?id= or JSON body {_id} required)' })
      };
    }

    const connection = await connectToDatabase();
    const deletedTimestamp = new Date().toISOString();

    if (connection.isMongoAtlas) {
      const collection = connection.db.collection(COLLECTION_NAME);
      const filter = buildMongoIdFilter(id);

      // Soft delete: set deletedAt and deletedBy, logging audit event in evaluationHistory
      const result = await collection.updateOne(filter, {
        $set: {
          deletedAt: deletedTimestamp,
          deletedBy
        },
        $push: {
          evaluationHistory: {
            action: 'soft_deleted',
            timestamp: deletedTimestamp,
            deletedBy,
            note: 'Evaluation record archived / soft-deleted for compliance'
          }
        }
      });

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: `Evaluation record with ID "${id}" not found.` })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Evaluation record "${id}" successfully soft-deleted (auditable) from MongoDB Atlas.`,
          softDeleted: true,
          deletedAt: deletedTimestamp,
          deletedBy
        })
      };
    } else {
      const result = await connection.deleteEvaluation(id, deletedBy);
      if (result.matchedCount === 0 && result.deletedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: `Evaluation record with ID "${id}" not found.` })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Evaluation record "${id}" successfully soft-deleted (auditable) from local repository.`,
          softDeleted: true,
          deletedAt: deletedTimestamp,
          deletedBy
        })
      };
    }
  } catch (error) {
    console.error('Error soft-deleting evaluation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error while deleting evaluation'
      })
    };
  }
};

export default { handler };

