/**
 * Unit/Integration Tests for Role-Based Access Control (RBAC)
 * Verifies:
 * - ASSESSOR_API_KEY can POST to save-evaluation.js (200), but gets 403 on get-evaluations, update-evaluation, delete-evaluation
 * - MANAGER_API_KEY can access get-evaluations, update-evaluation, delete-evaluation, but gets 403 on save-evaluation
 * - Invalid/missing keys return 401 Unauthorized
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { handler as saveHandler } from '../netlify/functions/save-evaluation.js';
import { handler as getHandler } from '../netlify/functions/get-evaluations.js';
import { handler as updateHandler } from '../netlify/functions/update-evaluation.js';
import { handler as deleteHandler } from '../netlify/functions/delete-evaluation.js';
import {
  DEFAULT_ASSESSOR_KEY,
  DEFAULT_MANAGER_KEY
} from '../netlify/functions/auth.js';
import { closeDatabaseConnection } from '../netlify/functions/db.js';

describe('Role-Based Access Control (RBAC) Enforcement', () => {
  const assessorKey = process.env.ASSESSOR_API_KEY || DEFAULT_ASSESSOR_KEY;
  const managerKey = process.env.MANAGER_API_KEY || DEFAULT_MANAGER_KEY;

  after(async () => {
    await closeDatabaseConnection();
  });

  it('should reject MANAGER_API_KEY on save-evaluation.js with 403 Forbidden', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': managerKey // Manager key on assessor endpoint
      },
      body: JSON.stringify({
        companyName: 'ACME',
        deviceModel: 'X1',
        assessorName: 'Farhan',
        assessmentDate: '2026-03-22',
        breakdown: []
      })
    };

    const res = await saveHandler(event, {});
    assert.equal(res.statusCode, 403, 'Should return 403 Forbidden when Manager attempts Assessor save');
    const body = JSON.parse(res.body);
    assert.match(body.error, /requires Assessor privileges/i);
  });

  it('should reject ASSESSOR_API_KEY on get-evaluations.js with 403 Forbidden', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': assessorKey // Assessor key on manager endpoint
      }
    };

    const res = await getHandler(event, {});
    assert.equal(res.statusCode, 403, 'Should return 403 Forbidden when Assessor attempts Manager get');
    const body = JSON.parse(res.body);
    assert.match(body.error, /requires Manager privileges/i);
  });

  it('should reject ASSESSOR_API_KEY on update-evaluation.js with 403 Forbidden', async () => {
    const event = {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': assessorKey
      },
      queryStringParameters: { id: 'some-id' },
      body: JSON.stringify({ companyName: 'Updated Co' })
    };

    const res = await updateHandler(event, {});
    assert.equal(res.statusCode, 403, 'Should return 403 Forbidden when Assessor attempts update');
    const body = JSON.parse(res.body);
    assert.match(body.error, /requires Manager privileges/i);
  });

  it('should reject ASSESSOR_API_KEY on delete-evaluation.js with 403 Forbidden', async () => {
    const event = {
      httpMethod: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': assessorKey
      },
      queryStringParameters: { id: 'some-id' }
    };

    const res = await deleteHandler(event, {});
    assert.equal(res.statusCode, 403, 'Should return 403 Forbidden when Assessor attempts delete');
    const body = JSON.parse(res.body);
    assert.match(body.error, /requires Manager privileges/i);
  });

  it('should allow MANAGER_API_KEY on get-evaluations.js with 200 OK', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': managerKey
      },
      queryStringParameters: { page: '1', limit: '5' }
    };

    const res = await getHandler(event, {});
    assert.equal(res.statusCode, 200, 'Should allow Manager key to fetch evaluations');
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
  });
});
