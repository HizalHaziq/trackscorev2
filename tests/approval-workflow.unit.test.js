import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handler as approveHandler } from '../netlify/functions/approve-evaluation.js';
import { DEFAULT_MANAGER_KEY, DEFAULT_ASSESSOR_KEY } from '../netlify/functions/auth.js';

describe('Approval & Review Workflow Unit Tests', () => {
  const managerKey = process.env.MANAGER_API_KEY || DEFAULT_MANAGER_KEY;
  const assessorKey = process.env.ASSESSOR_API_KEY || DEFAULT_ASSESSOR_KEY;

  it('should reject Assessor role attempting to approve or reject with 403 Forbidden', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': assessorKey
      },
      body: JSON.stringify({
        id: 'rec-123',
        action: 'approve'
      })
    };

    const res = await approveHandler(event, {});
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.match(body.error, /requires Manager privileges/i);
  });

  it('should reject invalid action with 400 Bad Request', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': managerKey
      },
      body: JSON.stringify({
        id: 'rec-123',
        action: 'invalid_action'
      })
    };

    const res = await approveHandler(event, {});
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.match(body.error, /Invalid status or action/i);
  });

  it('should reject rejection action when reason is missing with 400 Bad Request', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': managerKey
      },
      body: JSON.stringify({
        id: 'rec-123',
        action: 'reject',
        reason: '   ' // empty whitespace
      })
    };

    const res = await approveHandler(event, {});
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.match(body.error, /Rejection reason is required/i);
  });
});
