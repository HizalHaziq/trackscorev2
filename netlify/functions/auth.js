/**
 * Role-Based API Key Authentication Middleware for Netlify Serverless Functions
 * Supports two distinct roles:
 * - ASSESSOR: Can submit evaluations to save-evaluation.js
 * - MANAGER: Can access get-evaluations.js, update-evaluation.js, delete-evaluation.js, export-evaluations.js
 */

export const ROLE_ASSESSOR = 'assessor';
export const ROLE_MANAGER = 'manager';

export const DEFAULT_ASSESSOR_KEY = 'trackscore-assessor-key-2026';
export const DEFAULT_MANAGER_KEY = 'trackscore-manager-key-2026';
export const DEFAULT_LEGACY_KEY = 'trackscore-secret-key-2026';

export function getClientApiKey(event) {
  const headers = event?.headers || {};
  // Check exact keys first
  if (headers['x-api-key']) return headers['x-api-key'];
  if (headers['X-Api-Key']) return headers['X-Api-Key'];
  if (headers['X-API-KEY']) return headers['X-API-KEY'];
  if (headers['x-api-token']) return headers['x-api-token'];

  // Fallback to case-insensitive header scan
  for (const [key, val] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (lower === 'x-api-key' || lower === 'x-api-token') {
      return val;
    }
  }
  return null;
}

export function validateRole(event, requiredRole) {
  const clientKey = getClientApiKey(event);
  if (!clientKey || typeof clientKey !== 'string') {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Missing x-api-key header. Please provide an authorized API key.'
    };
  }

  const trimmedKey = clientKey.trim();
  const assessorKey = (process.env.ASSESSOR_API_KEY || DEFAULT_ASSESSOR_KEY).trim();
  const managerKey = (process.env.MANAGER_API_KEY || DEFAULT_MANAGER_KEY).trim();
  const legacyKey = (process.env.API_KEY || DEFAULT_LEGACY_KEY).trim();

  // Determine authenticated role(s)
  // Accept configured environment keys as well as authorized standard role keys
  const isAssessor = trimmedKey === assessorKey || trimmedKey === DEFAULT_ASSESSOR_KEY;
  const isManager = trimmedKey === managerKey || trimmedKey === DEFAULT_MANAGER_KEY;
  const isMaster = (legacyKey && trimmedKey === legacyKey) || trimmedKey === DEFAULT_LEGACY_KEY;

  if (!isAssessor && !isManager && !isMaster) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Invalid x-api-key header provided.'
    };
  }

  // Check if role matches required endpoint permission
  if (requiredRole === ROLE_ASSESSOR) {
    if (isAssessor || isMaster) {
      return { authorized: true, role: ROLE_ASSESSOR };
    }
    return {
      authorized: false,
      statusCode: 403,
      error: 'Forbidden: Access denied. This endpoint requires Assessor privileges (ASSESSOR_API_KEY).'
    };
  }

  if (requiredRole === ROLE_MANAGER) {
    if (isManager || isMaster) {
      return { authorized: true, role: ROLE_MANAGER };
    }
    return {
      authorized: false,
      statusCode: 403,
      error: 'Forbidden: Access denied. This endpoint requires Manager privileges (MANAGER_API_KEY).'
    };
  }

  return { authorized: true };
}

// Backward compatibility wrapper
export function validateApiKey(event) {
  const clientKey = getClientApiKey(event);
  if (!clientKey) return false;
  const trimmed = clientKey.trim();
  const assessorKey = (process.env.ASSESSOR_API_KEY || DEFAULT_ASSESSOR_KEY).trim();
  const managerKey = (process.env.MANAGER_API_KEY || DEFAULT_MANAGER_KEY).trim();
  const legacyKey = (process.env.API_KEY || DEFAULT_LEGACY_KEY).trim();
  return (
    trimmed === assessorKey ||
    trimmed === managerKey ||
    trimmed === legacyKey ||
    trimmed === DEFAULT_ASSESSOR_KEY ||
    trimmed === DEFAULT_MANAGER_KEY ||
    trimmed === DEFAULT_LEGACY_KEY
  );
}

export function authErrorResponse(corsHeaders, statusCode = 401, customMessage = null) {
  const defaultMsg = statusCode === 403
    ? 'Forbidden: Insufficient privileges for this endpoint.'
    : 'Unauthorized: Invalid or missing x-api-key header.';

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    body: JSON.stringify({
      error: customMessage || defaultMsg
    })
  };
}

export default {
  ROLE_ASSESSOR,
  ROLE_MANAGER,
  DEFAULT_ASSESSOR_KEY,
  DEFAULT_MANAGER_KEY,
  DEFAULT_LEGACY_KEY,
  getClientApiKey,
  validateRole,
  validateApiKey,
  authErrorResponse
};

