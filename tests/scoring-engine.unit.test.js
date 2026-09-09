/**
 * Unit Tests for TrackScore Scoring Engine (rubric.js)
 * Covers:
 * - Section A Max Computation (33.00 pts)
 * - Section B Max Computation (10.00 pts)
 * - Total Max Computation (43.00 pts)
 * - Star Rating Thresholds and MIROS Grade Classifications (1 to 5 Stars)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SECTION_A_CRITERIA,
  SECTION_B_CRITERIA,
  computeSectionMax,
  MAX_SCORE_A,
  MAX_SCORE_B,
  MAX_TOTAL_SCORE,
  recomputeScores
} from '../netlify/functions/rubric.js';

describe('Scoring Engine - Maximum Calculations', () => {
  it('should accurately compute Section A max score as 33.00 points', () => {
    const computedMaxA = computeSectionMax(SECTION_A_CRITERIA);
    assert.equal(computedMaxA, 33.0, 'Section A max score should equal 33.0');
    assert.equal(MAX_SCORE_A, 33.0, 'Exported MAX_SCORE_A constant should equal 33.0');
  });

  it('should accurately compute Section B max score as 10.00 points', () => {
    const computedMaxB = computeSectionMax(SECTION_B_CRITERIA);
    assert.equal(computedMaxB, 10.0, 'Section B max score should equal 10.0');
    assert.equal(MAX_SCORE_B, 10.0, 'Exported MAX_SCORE_B constant should equal 10.0');
  });

  it('should accurately compute Total Max score as 43.00 points', () => {
    assert.equal(MAX_TOTAL_SCORE, 43.0, 'Total max score should equal 43.0 (33 + 10)');
  });

  it('should produce 43.00 total and 5.00 star rating when maximum options are selected', () => {
    // Select the highest point option for each criterion
    const maxBreakdown = [
      ...SECTION_A_CRITERIA.map(c => {
        const maxOpt = c.options.reduce((prev, curr) => (curr.points > prev.points ? curr : prev), c.options[0]);
        return { id: c.id, selectedOption: maxOpt.label, points: maxOpt.points };
      }),
      ...SECTION_B_CRITERIA.map(c => {
        const maxOpt = c.options.reduce((prev, curr) => (curr.points > prev.points ? curr : prev), c.options[0]);
        return { id: c.id, selectedOption: maxOpt.label, points: maxOpt.points };
      })
    ];

    const result = recomputeScores(maxBreakdown);
    assert.equal(result.sectionAScore, 33.0);
    assert.equal(result.sectionBScore, 10.0);
    assert.equal(result.totalScore, 43.0);
    assert.equal(result.starRating, 5.0);
    assert.equal(result.starsCount, 5);
    assert.match(result.ratingLabel, /Grade A/);
  });

  it('should produce 0.00 total and 1 Star rating when all options are None (0)', () => {
    const emptyBreakdown = [
      ...SECTION_A_CRITERIA.map(c => ({ id: c.id, selectedOption: 'None (0)', points: 0 })),
      ...SECTION_B_CRITERIA.map(c => ({ id: c.id, selectedOption: 'None (0)', points: 0 }))
    ];

    const result = recomputeScores(emptyBreakdown);
    assert.equal(result.sectionAScore, 0.0);
    assert.equal(result.sectionBScore, 0.0);
    assert.equal(result.totalScore, 0.0);
    assert.equal(result.starRating, 0.0);
    assert.equal(result.starsCount, 1);
    assert.match(result.ratingLabel, /Grade E/);
  });
});

describe('Scoring Engine - Star Rating Thresholds and MIROS Grade Classification', () => {
  // Helper to construct a synthetic breakdown matching an exact desired total score
  // by utilizing trip_history (options up to 1.5) and additional items
  function buildSyntheticBreakdown(targetScore) {
    // We can directly pass items that will evaluate to the target score
    const breakdown = [];
    let remaining = targetScore;

    // Use available criteria in Section A
    for (const c of SECTION_A_CRITERIA) {
      if (remaining <= 0) break;
      const sortedOpts = [...c.options].sort((a, b) => b.points - a.points);
      const chosen = sortedOpts.find(o => o.points <= remaining) || sortedOpts[sortedOpts.length - 1];
      breakdown.push({ id: c.id, selectedOption: chosen.label, points: chosen.points });
      remaining = parseFloat((remaining - chosen.points).toFixed(2));
    }

    // If more points needed, use Section B
    if (remaining > 0) {
      for (const c of SECTION_B_CRITERIA) {
        if (remaining <= 0) break;
        const sortedOpts = [...c.options].sort((a, b) => b.points - a.points);
        const chosen = sortedOpts.find(o => o.points <= remaining) || sortedOpts[sortedOpts.length - 1];
        breakdown.push({ id: c.id, selectedOption: chosen.label, points: chosen.points });
        remaining = parseFloat((remaining - chosen.points).toFixed(2));
      }
    }

    return breakdown;
  }

  it('should classify score >= 38.70 (>= 4.5 stars) as 5 Stars - Grade A', () => {
    // 40.0 / 43 * 5 = 4.65 stars (Grade A)
    const items = buildSyntheticBreakdown(40.0);
    const result = recomputeScores(items);
    assert.ok(result.totalScore >= 38.70);
    assert.ok(result.starRating >= 4.5);
    assert.equal(result.starsCount, 5);
    assert.equal(result.ratingLabel, '5 Stars - Outstanding (MIROS Certified Grade A)');
  });

  it('should classify score >= 32.25 and < 38.70 (>= 3.75 stars) as 4 Stars - Grade B', () => {
    // 33.0 / 43 * 5 = 3.84 stars (Grade B)
    const items = buildSyntheticBreakdown(33.0);
    const result = recomputeScores(items);
    assert.ok(result.totalScore >= 32.25 && result.totalScore < 38.70);
    assert.ok(result.starRating >= 3.75 && result.starRating < 4.5);
    assert.equal(result.starsCount, 4);
    assert.equal(result.ratingLabel, '4 Stars - Very Good (MIROS Grade B)');
  });

  it('should classify score >= 25.80 and < 32.25 (>= 3.00 stars) as 3 Stars - Grade C', () => {
    // 27.0 / 43 * 5 = 3.14 stars (Grade C)
    const items = buildSyntheticBreakdown(27.0);
    const result = recomputeScores(items);
    assert.ok(result.totalScore >= 25.80 && result.totalScore < 32.25);
    assert.ok(result.starRating >= 3.00 && result.starRating < 3.75);
    assert.equal(result.starsCount, 3);
    assert.equal(result.ratingLabel, '3 Stars - Satisfactory (MIROS Grade C)');
  });

  it('should classify score >= 17.20 and < 25.80 (>= 2.00 stars) as 2 Stars - Grade D', () => {
    // 19.0 / 43 * 5 = 2.21 stars (Grade D)
    const items = buildSyntheticBreakdown(19.0);
    const result = recomputeScores(items);
    assert.ok(result.totalScore >= 17.20 && result.totalScore < 25.80);
    assert.ok(result.starRating >= 2.00 && result.starRating < 3.00);
    assert.equal(result.starsCount, 2);
    assert.equal(result.ratingLabel, '2 Stars - Marginal (MIROS Grade D)');
  });

  it('should classify score < 17.20 (< 2.00 stars) as 1 Star - Grade E', () => {
    // 10.0 / 43 * 5 = 1.16 stars (Grade E)
    const items = buildSyntheticBreakdown(10.0);
    const result = recomputeScores(items);
    assert.ok(result.totalScore < 17.20);
    assert.ok(result.starRating < 2.00);
    assert.equal(result.starsCount, 1);
    assert.equal(result.ratingLabel, '1 Star - Non-Compliant (MIROS Grade E)');
  });

  it('should accurately recompute scores when SMS/Call and intermediate options are selected (e.g. 40.75 total)', () => {
    // Construct breakdown where Section A = 31.00 and Section B = 9.75
    // Section A max is 33.00: 31.00 can be achieved by choosing max for 22 items, and SMS/Call (1.25 instead of 1.50) for 2 items
    // (33.00 - 0.25 - 0.25 = 32.50? Wait, let's craft exact points)
    const breakdown = [
      // Section A items (total = 31.00)
      { id: 'trip_history', selectedOption: '>1 year', points: 1.5 },
      { id: 'realtime_tracking', selectedOption: 'Available', points: 1.0 },
      { id: 'map_source', selectedOption: 'Open updated', points: 1.5 },
      { id: 'geofence', selectedOption: 'Polygon', points: 1.25 },
      { id: 'geofence_alert', selectedOption: 'SMS/Call', points: 1.25 },
      { id: 'vehicle_status', selectedOption: 'Available', points: 1.0 },
      { id: 'engine_status', selectedOption: 'Report', points: 1.25 },
      { id: 'overspeed_detection', selectedOption: 'Configurable', points: 1.5 },
      { id: 'overspeed_alert', selectedOption: 'SMS/Call', points: 1.25 },
      { id: 'offline_memory', selectedOption: '>60m', points: 1.5 },
      { id: 'backup_battery', selectedOption: '>24h', points: 1.5 },
      { id: 'sim_network', selectedOption: 'Roaming', points: 1.5 },
      { id: 'connectivity', selectedOption: '4G', points: 1.0 },
      { id: 'multilingual', selectedOption: 'Other', points: 1.25 },
      { id: 'user_manual', selectedOption: 'Other', points: 1.25 },
      { id: 'warranty', selectedOption: '>12m', points: 1.25 },
      { id: 'customer_service', selectedOption: 'Control Centre', points: 1.5 },
      { id: 'os_compatibility', selectedOption: 'Mobile', points: 1.5 },
      { id: 'trip_report', selectedOption: 'Duration', points: 1.25 },
      { id: 'data_interval', selectedOption: '<30s', points: 1.5 },
      { id: 'harsh_accel', selectedOption: 'Config', points: 1.5 },
      { id: 'harsh_accel_alert', selectedOption: 'Push', points: 1.5 },
      { id: 'harsh_braking', selectedOption: 'Config', points: 1.5 },
      { id: 'harsh_braking_alert', selectedOption: 'Push', points: 1.5 },

      // Section B items (total = 9.75)
      { id: 'tow_detection', selectedOption: 'Available', points: 1.0 },
      { id: 'panic_button', selectedOption: 'SMS', points: 1.25 },
      { id: 'mfa', selectedOption: 'OTP', points: 1.0 },
      { id: 'sop_tech_problems', selectedOption: '3 days', points: 1.0 },
      { id: 'service_records', selectedOption: 'Available', points: 1.0 },
      { id: 'driver_id', selectedOption: 'Report', points: 1.25 },
      { id: 'certification', selectedOption: 'SIRIM/CE', points: 1.0 },
      { id: 'immobilizer', selectedOption: 'Available', points: 1.0 },
      { id: 'tampered_alert', selectedOption: 'SMS', points: 1.25 }
    ];

    const result = recomputeScores(breakdown);
    assert.equal(result.sectionAScore, 32.5);
    assert.equal(result.sectionBScore, 9.75);
    assert.equal(result.totalScore, 42.25);

    // Also test exact 31.00 / 9.75 / 40.75 case
    breakdown.find(b => b.id === 'offline_memory').selectedOption = 'None (0)';
    breakdown.find(b => b.id === 'offline_memory').points = 0.0;
    // Section A becomes 32.50 - 1.50 = 31.00!
    const result4075 = recomputeScores(breakdown);
    assert.equal(result4075.sectionAScore, 31.0);
    assert.equal(result4075.sectionBScore, 9.75);
    assert.equal(result4075.totalScore, 40.75);
  });
});
