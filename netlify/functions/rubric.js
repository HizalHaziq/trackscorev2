/**
 * TrackScore Authoritative Scoring Rubric (v1.0)
 * Single source of truth for Section A (24 items) and Section B (9 items).
 * Used by server-side functions for score verification and integrity checks.
 */

const RUBRIC_VERSION = "1.0";

const SECTION_A_CRITERIA = [
  {
    id: "trip_history",
    name: "Trip History Data",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "<=3 months", points: 1.0 },
      { label: ">3m-1y", points: 1.25 },
      { label: ">1 year", points: 1.5 }
    ]
  },
  {
    id: "realtime_tracking",
    name: "Real-time Tracking",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 }
    ]
  },
  {
    id: "map_source",
    name: "Map Source",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Closed", points: 1.0 },
      { label: "Open", points: 1.25 },
      { label: "Open updated", points: 1.5 }
    ]
  },
  {
    id: "geofence",
    name: "Geofence",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Radius", points: 1.0 },
      { label: "Polygon", points: 1.25 }
    ]
  },
  {
    id: "geofence_alert",
    name: "Geofence Alert",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "System", points: 1.0 },
      { label: "SMS/Call", points: 1.25 },
      { label: "Push", points: 1.5 }
    ]
  },
  {
    id: "vehicle_status",
    name: "Vehicle Status",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 }
    ]
  },
  {
    id: "engine_status",
    name: "Engine ON/OFF",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "System", points: 1.0 },
      { label: "Report", points: 1.25 }
    ]
  },
  {
    id: "overspeed_detection",
    name: "Overspeed Detection",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 },
      { label: "Report", points: 1.25 },
      { label: "Configurable", points: 1.5 }
    ]
  },
  {
    id: "overspeed_alert",
    name: "Overspeed Alert",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "System", points: 1.0 },
      { label: "SMS/Call", points: 1.25 },
      { label: "Push", points: 1.5 }
    ]
  },
  {
    id: "offline_memory",
    name: "Offline Memory",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "15m", points: 1.0 },
      { label: "15-60m", points: 1.25 },
      { label: ">60m", points: 1.5 }
    ]
  },
  {
    id: "backup_battery",
    name: "Backup Battery",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "1h", points: 1.0 },
      { label: "1-24h", points: 1.25 },
      { label: ">24h", points: 1.5 }
    ]
  },
  {
    id: "sim_network",
    name: "SIM Network",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "2G", points: 1.0 },
      { label: "4G fallback", points: 1.25 },
      { label: "Roaming", points: 1.5 }
    ]
  },
  {
    id: "connectivity",
    name: "Connectivity",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "4G", points: 1.0 }
    ]
  },
  {
    id: "multilingual",
    name: "Multilingual",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "English", points: 1.0 },
      { label: "Other", points: 1.25 }
    ]
  },
  {
    id: "user_manual",
    name: "User Manual",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "English", points: 1.0 },
      { label: "Other", points: 1.25 }
    ]
  },
  {
    id: "warranty",
    name: "Warranty",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "12m", points: 1.0 },
      { label: ">12m", points: 1.25 }
    ]
  },
  {
    id: "customer_service",
    name: "Customer Service",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "09-19", points: 1.0 },
      { label: "24/7", points: 1.25 },
      { label: "Control Centre", points: 1.5 }
    ]
  },
  {
    id: "os_compatibility",
    name: "OS Compatibility",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Web", points: 1.0 },
      { label: "Apps", points: 1.25 },
      { label: "Mobile", points: 1.5 }
    ]
  },
  {
    id: "trip_report",
    name: "Trip Report",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Coords", points: 1.0 },
      { label: "Duration", points: 1.25 }
    ]
  },
  {
    id: "data_interval",
    name: "Data Interval",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "1m", points: 1.0 },
      { label: "30s-1m", points: 1.25 },
      { label: "<30s", points: 1.5 }
    ]
  },
  {
    id: "harsh_accel",
    name: "Harsh Acceleration",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 },
      { label: "Report", points: 1.25 },
      { label: "Config", points: 1.5 }
    ]
  },
  {
    id: "harsh_accel_alert",
    name: "Harsh Accel Alert",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "System", points: 1.0 },
      { label: "SMS", points: 1.25 },
      { label: "Push", points: 1.5 }
    ]
  },
  {
    id: "harsh_braking",
    name: "Harsh Braking",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 },
      { label: "Report", points: 1.25 },
      { label: "Config", points: 1.5 }
    ]
  },
  {
    id: "harsh_braking_alert",
    name: "Harsh Braking Alert",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "System", points: 1.0 },
      { label: "SMS", points: 1.25 },
      { label: "Push", points: 1.5 }
    ]
  }
];

const SECTION_B_CRITERIA = [
  {
    id: "tow_detection",
    name: "Tow Detection",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 }
    ]
  },
  {
    id: "panic_button",
    name: "Panic Button",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 },
      { label: "SMS", points: 1.25 }
    ]
  },
  {
    id: "mfa",
    name: "MFA",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "OTP", points: 1.0 }
    ]
  },
  {
    id: "sop_tech_problems",
    name: "SOP Tech Problems",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "3 days", points: 1.0 }
    ]
  },
  {
    id: "service_records",
    name: "Service Records",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 }
    ]
  },
  {
    id: "driver_id",
    name: "Driver ID",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "GPS ID", points: 1.0 },
      { label: "Report", points: 1.25 }
    ]
  },
  {
    id: "certification",
    name: "Certification",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "SIRIM/CE", points: 1.0 }
    ]
  },
  {
    id: "immobilizer",
    name: "Immobilizer",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "Available", points: 1.0 }
    ]
  },
  {
    id: "tampered_alert",
    name: "Tamper Detection & Power Disconnect Alert",
    options: [
      { label: "None (0)", points: 0.0 },
      { label: "System Log", points: 1.0 },
      { label: "SMS", points: 1.25 },
      { label: "Push", points: 1.5 }
    ]
  }
];

// Dynamically compute maximum weights
function computeSectionMax(criteriaList) {
  return criteriaList.reduce((sum, item) => {
    const itemMax = Math.max(...item.options.map(opt => Number(opt.points) || 0), 0);
    return sum + itemMax;
  }, 0);
}

const MAX_SCORE_A = computeSectionMax(SECTION_A_CRITERIA);
const MAX_SCORE_B = computeSectionMax(SECTION_B_CRITERIA);
const MAX_TOTAL_SCORE = MAX_SCORE_A + MAX_SCORE_B;

// Fast lookup map by ID
const CRITERIA_MAP = {};
SECTION_A_CRITERIA.forEach(c => { CRITERIA_MAP[c.id] = { ...c, section: 'A' }; });
SECTION_B_CRITERIA.forEach(c => { CRITERIA_MAP[c.id] = { ...c, section: 'B' }; });

// Common label alias mappings to ensure cross-version compatibility
const OPTION_ALIASES = {
  "3m": "<=3 months",
  "<=3m": "<=3 months",
  "<3m": "<=3 months",
  "<=3 months": "<=3 months",
  "internal": "closed",
  "closed": "closed",
  "sms": "sms/call",
  "sms/call": "sms/call",
  "<15m": "15m",
  "15m": "15m",
  "<1h": "1h",
  "1h": "1h",
  "single 4g": "2g",
  "2g": "2g",
  "config": "configurable",
  "configurable": "configurable"
};

function normalizeLabel(str) {
  return String(str || "").trim().toLowerCase();
}

/**
 * Recompute and validate scores server-side against authoritative rubric
 */
function recomputeScores(breakdown) {
  let scoreA = 0.0;
  let scoreB = 0.0;
  const verifiedBreakdown = [];

  if (Array.isArray(breakdown)) {
    breakdown.forEach(item => {
      if (!item || !item.id) return;
      const crit = CRITERIA_MAP[item.id];
      if (!crit) return;

      const normSelected = normalizeLabel(item.selectedOption);
      const aliasTarget = OPTION_ALIASES[normSelected] || normSelected;

      // 1. Direct label match (exact or case-insensitive)
      let matchedOpt = crit.options.find(
        o => o.label === item.selectedOption || normalizeLabel(o.label) === normSelected
      );

      // 2. Alias match
      if (!matchedOpt && aliasTarget) {
        matchedOpt = crit.options.find(
          o => normalizeLabel(o.label) === aliasTarget ||
               OPTION_ALIASES[normalizeLabel(o.label)] === aliasTarget
        );
      }

      // 3. Point-based match (if points are explicitly provided and > 0)
      if (!matchedOpt && typeof item.points === "number" && !isNaN(item.points) && item.points > 0) {
        matchedOpt = crit.options.find(o => Math.abs(o.points - item.points) < 0.001);
      }

      // 4. Default fallback to first option (None 0.0)
      if (!matchedOpt) {
        matchedOpt = crit.options[0];
      }

      const verifiedPoints = Number(matchedOpt.points) || 0.0;

      if (crit.section === 'A') {
        scoreA += verifiedPoints;
      } else if (crit.section === 'B') {
        scoreB += verifiedPoints;
      }

      verifiedBreakdown.push({
        section: crit.section,
        id: crit.id,
        name: crit.name,
        selectedOption: matchedOpt.label,
        points: verifiedPoints
      });
    });
  }

  scoreA = parseFloat(scoreA.toFixed(2));
  scoreB = parseFloat(scoreB.toFixed(2));
  const total = parseFloat((scoreA + scoreB).toFixed(2));
  const rawStarRating = MAX_TOTAL_SCORE > 0 ? (total / MAX_TOTAL_SCORE) * 5.0 : 0;

  let starsCount = 1;
  let ratingLabel = "1 Star - Non-Compliant (MIROS Grade E)";

  if (rawStarRating >= 4.5) {
    starsCount = 5;
    ratingLabel = "5 Stars - Outstanding (MIROS Certified Grade A)";
  } else if (rawStarRating >= 3.75) {
    starsCount = 4;
    ratingLabel = "4 Stars - Very Good (MIROS Grade B)";
  } else if (rawStarRating >= 3.0) {
    starsCount = 3;
    ratingLabel = "3 Stars - Satisfactory (MIROS Grade C)";
  } else if (rawStarRating >= 2.0) {
    starsCount = 2;
    ratingLabel = "2 Stars - Marginal (MIROS Grade D)";
  } else {
    starsCount = 1;
    ratingLabel = "1 Star - Non-Compliant (MIROS Grade E)";
  }

  return {
    sectionAScore: scoreA,
    sectionBScore: scoreB,
    totalScore: total,
    starRating: parseFloat(rawStarRating.toFixed(2)),
    starsCount,
    ratingLabel,
    breakdown: verifiedBreakdown,
    rubricVersion: RUBRIC_VERSION,
    maxScoreA: MAX_SCORE_A,
    maxScoreB: MAX_SCORE_B,
    maxTotalScore: MAX_TOTAL_SCORE
  };
}

export {
  RUBRIC_VERSION,
  SECTION_A_CRITERIA,
  SECTION_B_CRITERIA,
  computeSectionMax,
  MAX_SCORE_A,
  MAX_SCORE_B,
  MAX_TOTAL_SCORE,
  recomputeScores
};

export default {
  RUBRIC_VERSION,
  SECTION_A_CRITERIA,
  SECTION_B_CRITERIA,
  computeSectionMax,
  MAX_SCORE_A,
  MAX_SCORE_B,
  MAX_TOTAL_SCORE,
  recomputeScores
};
