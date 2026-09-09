/**
 * Integration Tests for save-evaluation.js
 * Covers:
 * 1. Valid payload (200)
 * 2. Tampered totals that don't match recomputed score (400)
 * 3. Missing/invalid API key (401)
 * 4. Duplicate Company + Device + Assessor + Date (409)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from '../netlify/functions/save-evaluation.js';
import { DEFAULT_ASSESSOR_KEY } from '../netlify/functions/auth.js';
import { closeDatabaseConnection } from '../netlify/functions/db.js';

describe('save-evaluation.js Integration Suite', () => {
  const validApiKey = process.env.ASSESSOR_API_KEY || DEFAULT_ASSESSOR_KEY;

  after(async () => {
    await closeDatabaseConnection();
  });

  // Build a legitimate evaluation payload with matching scores
  function createValidPayload(overrides = {}) {
    const timestamp = Date.now();
    const breakdown = [
      { id: 'trip_history', selectedOption: '3m', points: 1.0 },
      { id: 'realtime_tracking', selectedOption: 'Available', points: 1.0 },
      { id: 'geofence', selectedOption: 'Radius', points: 1.0 }
    ];
    // sectionA = 3.0, sectionB = 0.0, total = 3.0, starRating = (3/43)*5 = 0.35
    return {
      companyName: `Test Fleet Corp ${timestamp}`,
      deviceModel: `TG-800-${timestamp}`,
      packageName: 'Premium Enterprise',
      assessorName: `Assessor-${timestamp}`,
      assessmentDate: '2026-03-15',
      breakdown,
      sectionAScore: 3.0,
      sectionBScore: 0.0,
      totalScore: 3.0,
      starRating: 0.35,
      ...overrides
    };
  }

  // 1. Missing / Invalid API Key (401)
  it('should return 401 when x-api-key header is missing', async () => {
    const payload = createValidPayload();
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    const response = await handler(event, {});
    assert.equal(response.statusCode, 401, 'Should reject request with 401 Unauthorized');
    const body = JSON.parse(response.body);
    assert.ok(body.error, 'Response body should contain error message');
    assert.match(body.error, /Unauthorized|API key/i);
  });

  it('should return 401 when x-api-key is invalid/unrecognized', async () => {
    const payload = createValidPayload();
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'completely-wrong-unauthorized-key'
      },
      body: JSON.stringify(payload)
    };

    const response = await handler(event, {});
    assert.equal(response.statusCode, 401, 'Should return 401 for bad API key');
  });

  // 2. Valid Payload (200)
  it('should return 200 and persist evaluation when payload and API key are valid', async () => {
    const payload = createValidPayload();
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': validApiKey
      },
      body: JSON.stringify(payload)
    };

    const response = await handler(event, {});
    assert.equal(response.statusCode, 200, 'Should accept valid payload with 200 OK');
    const body = JSON.parse(response.body);
    assert.equal(body.success, true);
    assert.ok(body.id, 'Should return inserted record id');
    assert.equal(body.verifiedScores.totalScore, 3.0);
  });

  // 3. Tampered totals that do not match recomputed score (400)
  it('should return 400 when client submits tampered total score', async () => {
    const payload = createValidPayload({
      // Breakdown points sum to 3.0, but client tries to claim 42.50
      totalScore: 42.50
    });
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': validApiKey
      },
      body: JSON.stringify(payload)
    };

    const response = await handler(event, {});
    assert.equal(response.statusCode, 400, 'Should reject tampered score with 400 Bad Request');
    const body = JSON.parse(response.body);
    assert.match(body.error, /tampered|integrity|mismatch/i);
  });

  // 4. Duplicate Company + Device + Assessor + Date (409)
  it('should return 409 Conflict when duplicate evaluation record is submitted', async () => {
    const uniqueCompany = `DuplicateCorp-${Date.now()}`;
    const uniqueModel = `Tracker-X-${Date.now()}`;
    const uniqueAssessor = 'Lead Assessor Rizal';
    const specificDate = '2026-03-20';

    const payload = createValidPayload({
      companyName: uniqueCompany,
      deviceModel: uniqueModel,
      assessorName: uniqueAssessor,
      assessmentDate: specificDate
    });

    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': validApiKey
      },
      body: JSON.stringify(payload)
    };

    // First submission -> 200
    const firstRes = await handler(event, {});
    assert.equal(firstRes.statusCode, 200, 'First submission should succeed with 200');

    // Second submission with exact same Company, Device, Assessor, Date -> 409
    const secondRes = await handler(event, {});
    assert.equal(secondRes.statusCode, 409, 'Duplicate submission should be rejected with 409 Conflict');
    const body = JSON.parse(secondRes.body);
    assert.match(body.error, /duplicate|already exists/i);
  });
});
