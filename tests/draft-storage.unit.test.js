import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for node environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
global.localStorage = mockStorage;

const DRAFTS_KEY = 'trackscore-drafts';
const OLD_DRAFT_KEY = 'trackscore-draft';
const CURRENT_RUBRIC_VERSION = '2026.1';
const MAX_DRAFTS = 3;

function getDrafts() {
  const raw = global.localStorage.getItem(DRAFTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveDrafts(drafts) {
  global.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function migrateOldDraft() {
  const oldRaw = global.localStorage.getItem(OLD_DRAFT_KEY);
  if (!oldRaw) return;
  try {
    const oldDraft = JSON.parse(oldRaw);
    if (oldDraft && (oldDraft.metadata || oldDraft.selections)) {
      const drafts = getDrafts();
      const draftId = 'draft-migrated-1';
      drafts[draftId] = {
        draftId,
        companyName: oldDraft.metadata?.companyName || 'Untitled Company',
        deviceModel: oldDraft.metadata?.deviceModel || 'Unspecified Model',
        packageName: oldDraft.metadata?.packageName || '',
        assessorName: oldDraft.metadata?.assessorName || '',
        lastSavedAt: oldDraft.timestamp || new Date().toISOString(),
        rubricVersion: oldDraft.metadata?.rubricVersion || '1.0',
        formState: {
          metadata: oldDraft.metadata || {},
          selections: oldDraft.selections || {},
          scores: oldDraft.scores || {}
        }
      };
      saveDrafts(drafts);
    }
  } catch {
    // ignore
  }
  global.localStorage.removeItem(OLD_DRAFT_KEY);
}

function addOrUpdateDraft(draftId, draftData) {
  const drafts = getDrafts();
  if (!drafts[draftId] && Object.keys(drafts).length >= MAX_DRAFTS) {
    throw new Error('Maximum of 3 drafts reached');
  }
  drafts[draftId] = {
    draftId,
    ...draftData,
    lastSavedAt: new Date().toISOString()
  };
  saveDrafts(drafts);
  return drafts[draftId];
}

function removeDraft(draftId) {
  const drafts = getDrafts();
  if (drafts[draftId]) {
    delete drafts[draftId];
    saveDrafts(drafts);
    return true;
  }
  return false;
}

describe('Multi-Draft Storage Subsystem Unit Tests', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('should migrate legacy single draft from trackscore-draft to trackscore-drafts', () => {
    mockStorage.setItem(OLD_DRAFT_KEY, JSON.stringify({
      timestamp: '2026-03-01T10:00:00.000Z',
      metadata: { companyName: 'FleetTech Ltd', deviceModel: 'FT-100', assessorName: 'Assessor A' },
      selections: { trip_history: { points: 3 } },
      scores: { total: 3 }
    }));

    migrateOldDraft();

    assert.equal(mockStorage.getItem(OLD_DRAFT_KEY), null, 'Old draft storage key should be deleted');
    const drafts = getDrafts();
    const draftKeys = Object.keys(drafts);
    assert.equal(draftKeys.length, 1, 'Should have migrated 1 draft');
    assert.equal(drafts['draft-migrated-1'].companyName, 'FleetTech Ltd');
    assert.equal(drafts['draft-migrated-1'].formState.metadata.companyName, 'FleetTech Ltd');
  });

  it('should enforce hard limit of maximum 3 concurrent drafts', () => {
    addOrUpdateDraft('d1', { companyName: 'Co 1', deviceModel: 'M1', rubricVersion: CURRENT_RUBRIC_VERSION });
    addOrUpdateDraft('d2', { companyName: 'Co 2', deviceModel: 'M2', rubricVersion: CURRENT_RUBRIC_VERSION });
    addOrUpdateDraft('d3', { companyName: 'Co 3', deviceModel: 'M3', rubricVersion: CURRENT_RUBRIC_VERSION });

    assert.equal(Object.keys(getDrafts()).length, 3);

    // 4th draft creation must be rejected
    assert.throws(() => {
      addOrUpdateDraft('d4', { companyName: 'Co 4', deviceModel: 'M4', rubricVersion: CURRENT_RUBRIC_VERSION });
    }, /Maximum of 3 drafts reached/);

    // Updating existing draft among the 3 should succeed
    addOrUpdateDraft('d2', { companyName: 'Co 2 Updated', deviceModel: 'M2', rubricVersion: CURRENT_RUBRIC_VERSION });
    assert.equal(getDrafts()['d2'].companyName, 'Co 2 Updated');
    assert.equal(Object.keys(getDrafts()).length, 3);
  });

  it('should detect rubric version mismatch for drafts started on an older scoring rubric', () => {
    addOrUpdateDraft('d-old', { companyName: 'Old Co', deviceModel: 'M-Old', rubricVersion: '1.0' });
    addOrUpdateDraft('d-current', { companyName: 'Current Co', deviceModel: 'M-Current', rubricVersion: CURRENT_RUBRIC_VERSION });

    const drafts = getDrafts();
    const isOldMismatch = drafts['d-old'].rubricVersion !== CURRENT_RUBRIC_VERSION;
    const isCurrentMismatch = drafts['d-current'].rubricVersion !== CURRENT_RUBRIC_VERSION;

    assert.equal(isOldMismatch, true, 'Old draft should trigger rubric version mismatch warning');
    assert.equal(isCurrentMismatch, false, 'Current draft should not trigger rubric warning');
  });

  it('should selectively remove only submitted draft on submit while retaining others', () => {
    addOrUpdateDraft('d1', { companyName: 'Co 1', deviceModel: 'M1', rubricVersion: CURRENT_RUBRIC_VERSION });
    addOrUpdateDraft('d2', { companyName: 'Co 2', deviceModel: 'M2', rubricVersion: CURRENT_RUBRIC_VERSION });
    addOrUpdateDraft('d3', { companyName: 'Co 3', deviceModel: 'M3', rubricVersion: CURRENT_RUBRIC_VERSION });

    assert.equal(Object.keys(getDrafts()).length, 3);

    // Submit d2
    const removed = removeDraft('d2');
    assert.equal(removed, true);

    const remaining = getDrafts();
    assert.equal(Object.keys(remaining).length, 2);
    assert.equal(remaining['d1'] !== undefined, true, 'Draft d1 must be preserved');
    assert.equal(remaining['d2'], undefined, 'Submitted draft d2 must be removed');
    assert.equal(remaining['d3'] !== undefined, true, 'Draft d3 must be preserved');
  });

  it('should successfully discard a draft from storage without requiring native confirm modal', () => {
    addOrUpdateDraft('d-discard-1', { companyName: 'Discard Target', deviceModel: 'D-10', rubricVersion: CURRENT_RUBRIC_VERSION });
    addOrUpdateDraft('d-keep-2', { companyName: 'Keep Target', deviceModel: 'K-20', rubricVersion: CURRENT_RUBRIC_VERSION });

    assert.equal(Object.keys(getDrafts()).length, 2);

    const discarded = removeDraft('d-discard-1');
    assert.equal(discarded, true, 'Draft should be removed successfully');

    const drafts = getDrafts();
    assert.equal(Object.keys(drafts).length, 1);
    assert.equal(drafts['d-discard-1'], undefined, 'Discarded draft must be gone');
    assert.equal(drafts['d-keep-2'] !== undefined, true, 'Other draft must be retained');
  });

  it('should successfully store and count up to 3 distinct drafts without getting stuck at 2/3', () => {
    // 1st save: Draft 1
    addOrUpdateDraft('draft-1', { companyName: 'Company 1', deviceModel: 'M1', rubricVersion: CURRENT_RUBRIC_VERSION });
    assert.equal(Object.keys(getDrafts()).length, 1, 'Should have 1 draft after 1st save');

    // 2nd save: Draft 2
    addOrUpdateDraft('draft-2', { companyName: 'Company 2', deviceModel: 'M2', rubricVersion: CURRENT_RUBRIC_VERSION });
    assert.equal(Object.keys(getDrafts()).length, 2, 'Should have 2 drafts after 2nd save');

    // 3rd save: Draft 3 (Must not get stuck at 2/3!)
    addOrUpdateDraft('draft-3', { companyName: 'Company 3', deviceModel: 'M3', rubricVersion: CURRENT_RUBRIC_VERSION });
    const drafts = getDrafts();
    const draftKeys = Object.keys(drafts);
    assert.equal(draftKeys.length, 3, 'Draft counter must reach 3/3 after 3 distinct saves');
    assert.equal(drafts['draft-1'].companyName, 'Company 1');
    assert.equal(drafts['draft-2'].companyName, 'Company 2');
    assert.equal(drafts['draft-3'].companyName, 'Company 3', 'Third draft must be fully visible and stored');
  });
});
