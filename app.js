/**
 * TrackScore - Digital Assessor Evaluation System
 * Frontend Logic, Real-Time Scoring Matrix, and PDF Report Generator
 */

// ==========================================================================
// 1. Scoring Matrix Data Structures
// ==========================================================================

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

// ==========================================================================
// Authoritative Rubric Version & Dynamic Weight Computation (Item 2 & 5)
// Section A max, Section B max, and Total max are calculated at runtime
// by summing the top-tier value of every item in the scoring data arrays.
// ==========================================================================
const RUBRIC_VERSION = "1.0";

function computeSectionMax(criteriaList) {
  return criteriaList.reduce((sum, item) => {
    const itemMax = Math.max(...item.options.map(opt => Number(opt.points) || 0), 0);
    return sum + itemMax;
  }, 0);
}

const MAX_SCORE_A = computeSectionMax(SECTION_A_CRITERIA); // Dynamically 33.00
const MAX_SCORE_B = computeSectionMax(SECTION_B_CRITERIA); // Dynamically 10.00
const MAX_TOTAL_SCORE = MAX_SCORE_A + MAX_SCORE_B;         // Dynamically 43.00

// API Shared Secret & Role-Based Access (Hardening Pass 2)
// Frontend sends x-api-key header with every API request (save, get, update, delete)
function getAssessorApiKey() {
  return window.ASSESSOR_API_KEY || window.TRACKSCORE_API_KEY || "trackscore-assessor-key-2026";
}
const ASSESSOR_API_KEY = getAssessorApiKey();
const TRACKSCORE_API_KEY = ASSESSOR_API_KEY;

// Application State
const assessmentState = {
  activeDraftId: null,
  rubricVersion: RUBRIC_VERSION,
  resubmitRecordId: null,
  selectedItems: {}, // Keyed by criterion id: { section, id, name, selectedOption, points }
  metadata: {
    companyName: "",
    deviceModel: "",
    packageName: "",
    assessorName: "",
    assessorId: "", // Added Assessor ID
    assessmentDate: new Date().toISOString().split("T")[0]
  },
  scores: {
    sectionA: 0.0,
    sectionB: 0.0,
    total: 0.0,
    starRating: 0.0,
    starsCount: 1,
    ratingLabel: "1 Star"
  }
};

// ==========================================================================
// 2. DOM Rendering Functions (Accessibility Pass - Item 9)
// Every radio group is rendered as a proper <fieldset> with a semantic <legend>
// All radio inputs have explicit associated <label for="...">
// ==========================================================================

function renderCriteriaSection(criteriaList, containerId, sectionPrefix) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  criteriaList.forEach((criterion, index) => {
    // Render accessible card row with role="group"
    const rowEl = document.createElement("div");
    rowEl.className = "criterion-row";
    rowEl.id = `row-${criterion.id}`;
    rowEl.setAttribute("role", "group");
    rowEl.setAttribute("aria-labelledby", `label-${criterion.id}`);

    // Max score for this item
    const maxPoints = Math.max(...criterion.options.map(o => o.points));

    const metaHtml = `
      <div class="criterion-meta" id="label-${criterion.id}">
        <div class="criterion-title-wrap">
          <span class="criterion-number">${sectionPrefix}${index + 1}.</span>
          <span class="criterion-title">${criterion.name}</span>
        </div>
        <div class="criterion-badge" id="badge-${criterion.id}">Max ${maxPoints.toFixed(2)} pts</div>
      </div>
    `;

    let optionsHtml = '<div class="options-group" role="radiogroup" aria-labelledby="label-' + criterion.id + '">';
    criterion.options.forEach((opt, optIdx) => {
      const inputId = `radio_${criterion.id}_${optIdx}`;
      const isNone = opt.points === 0;
      const isDefault = isNone;

      optionsHtml += `
        <label class="option-label ${isNone ? 'is-none' : ''}" for="${inputId}">
          <input
            type="radio"
            id="${inputId}"
            name="crit_${criterion.id}"
            value="${opt.points}"
            data-label="${opt.label}"
            data-section="${sectionPrefix}"
            data-crit-id="${criterion.id}"
            data-crit-name="${criterion.name}"
            ${isDefault ? 'checked' : ''}
          />
          <span class="option-card">
            <span>${opt.label}</span>
            <span class="point-pill">${opt.points > 0 ? '+' + opt.points.toFixed(2) : '0'}</span>
          </span>
        </label>
      `;
    });
    optionsHtml += '</div>';

    rowEl.innerHTML = metaHtml + optionsHtml;
    container.appendChild(rowEl);

    // Initial state capture (starts at None 0)
    assessmentState.selectedItems[criterion.id] = {
      section: sectionPrefix,
      id: criterion.id,
      name: criterion.name,
      selectedOption: "None (0)",
      points: 0.0
    };
  });
}

// ==========================================================================
// 3. Calculation & Real-Time State Capture
// ==========================================================================

function calculateScores() {
  let scoreA = 0.0;
  let scoreB = 0.0;

  Object.values(assessmentState.selectedItems).forEach(item => {
    if (item.section === "A") {
      scoreA += item.points;
    } else if (item.section === "B") {
      scoreB += item.points;
    }
  });

  const total = scoreA + scoreB;
  const rawStarRating = (total / MAX_TOTAL_SCORE) * 5.0;

  // Star Rating Conversion Rules as specified:
  // If >= 4.5 (5 Stars), >= 3.75 (4 Stars), >= 3.0 (3 Stars), >= 2.0 (2 Stars), else 1 Star.
  let starsCount = 1;
  let ratingLabel = "1 Star - Non-Compliant";

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

  assessmentState.scores = {
    sectionA: parseFloat(scoreA.toFixed(2)),
    sectionB: parseFloat(scoreB.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    starRating: parseFloat(rawStarRating.toFixed(2)),
    starsCount,
    ratingLabel
  };

  updateScoreUI();
}

function updateScoreUI() {
  const { sectionA, sectionB, total, starRating, starsCount, ratingLabel } = assessmentState.scores;

  const scoreAEl = document.getElementById("summary-score-a");
  const scoreBEl = document.getElementById("summary-score-b");
  const scoreTotalEl = document.getElementById("summary-score-total");
  const ratingTextEl = document.getElementById("summary-rating-text");
  const starsContainerEl = document.getElementById("summary-stars");

  if (scoreAEl) scoreAEl.textContent = `${sectionA.toFixed(2)} / ${MAX_SCORE_A.toFixed(2)}`;
  if (scoreBEl) scoreBEl.textContent = `${sectionB.toFixed(2)} / ${MAX_SCORE_B.toFixed(2)}`;
  if (scoreTotalEl) scoreTotalEl.textContent = `${total.toFixed(2)} / ${MAX_TOTAL_SCORE.toFixed(2)}`;
  if (ratingTextEl) ratingTextEl.textContent = `${starRating.toFixed(2)} / 5.0 (${starsCount} ★)`;

  if (starsContainerEl) {
    let starIcons = "";
    for (let i = 1; i <= 5; i++) {
      starIcons += i <= starsCount ? "★" : "☆";
    }
    starsContainerEl.innerHTML = starIcons;
    starsContainerEl.title = ratingLabel;
  }
}

function handleOptionChange(event) {
  const radio = event.target;
  if (radio.tagName !== "INPUT" || radio.type !== "radio") return;

  const critId = radio.getAttribute("data-crit-id");
  const critName = radio.getAttribute("data-crit-name");
  const section = radio.getAttribute("data-section");
  const selectedOption = radio.getAttribute("data-label");
  const points = parseFloat(radio.value);

  // Update selected state record
  assessmentState.selectedItems[critId] = {
    section,
    id: critId,
    name: critName,
    selectedOption,
    points
  };

  // Update visual indicators for this row
  const rowEl = document.getElementById(`row-${critId}`);
  const badgeEl = document.getElementById(`badge-${critId}`);

  if (rowEl) {
    if (points > 0) {
      rowEl.classList.add("has-score");
    } else {
      rowEl.classList.remove("has-score");
    }
  }

  if (badgeEl) {
    if (points > 0) {
      badgeEl.classList.add("scored");
      badgeEl.textContent = `Awarded: ${points.toFixed(2)} pts`;
    } else {
      badgeEl.classList.remove("scored");
      badgeEl.textContent = "0.00 pts";
    }
  }

  calculateScores();
  debouncedAutosave();
}

function captureMetadata() {
  assessmentState.metadata.companyName = (document.getElementById("companyName")?.value || "").trim();
  assessmentState.metadata.deviceModel = (document.getElementById("deviceModel")?.value || "").trim();
  assessmentState.metadata.packageName = (document.getElementById("packageName")?.value || "").trim();
  assessmentState.metadata.assessorName = (document.getElementById("assessorName")?.value || "").trim();
  assessmentState.metadata.assessorId = (document.getElementById("assessorId")?.value || "").trim();
  assessmentState.metadata.assessmentDate = document.getElementById("assessmentDate")?.value || new Date().toISOString().split("T")[0];
}

// ==========================================================================
// 3b. Multi-Draft Autosave Subsystem (Requirements 1, 2, 3, 4)
// Debounced autosave (500ms) to localStorage under 'trackscore-drafts'
// Supports up to 3 concurrent in-progress evaluations, rubric version tracking,
// draft picker modal, and automatic cleanup of submitted draft.
// ==========================================================================

const DRAFTS_STORAGE_KEY = "trackscore-drafts";
const OLD_DRAFT_STORAGE_KEY = "trackscore-draft";
const MAX_DRAFTS = 3;
let autosaveTimer = null;

// Backward compatibility migration from legacy single-draft storage
function migrateOldDraftIfNeeded() {
  try {
    const oldRaw = localStorage.getItem(OLD_DRAFT_STORAGE_KEY);
    if (!oldRaw) return;
    const oldDraft = JSON.parse(oldRaw);
    if (oldDraft && (oldDraft.metadata || oldDraft.selections)) {
      const drafts = getDrafts();
      const draftId = generateDraftId();
      drafts[draftId] = {
        draftId,
        companyName: oldDraft.metadata?.companyName || "Untitled Company",
        deviceModel: oldDraft.metadata?.deviceModel || "Unspecified Model",
        packageName: oldDraft.metadata?.packageName || "",
        assessorName: oldDraft.metadata?.assessorName || "",
        assessorId: oldDraft.metadata?.assessorId || "",
        lastSavedAt: oldDraft.timestamp || new Date().toISOString(),
        formattedTime: oldDraft.formattedTime || new Date().toLocaleString(),
        rubricVersion: oldDraft.metadata?.rubricVersion || "1.0",
        formState: {
          metadata: oldDraft.metadata || {},
          selections: oldDraft.selections || {},
          scores: oldDraft.scores || {}
        }
      };
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    }
    localStorage.removeItem(OLD_DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn("Draft migration note:", err);
  }
}

function getDrafts() {
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    console.warn("Could not parse drafts from localStorage:", e);
    return {};
  }
}

function saveDrafts(drafts) {
  try {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    updateDraftsCountUI();
  } catch (e) {
    console.warn("Could not save drafts to localStorage:", e);
  }
}

function generateDraftId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "draft-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
}

function formatRelativeTime(isoString) {
  if (!isoString) return "just now";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (isNaN(diffSec)) return "recently";
    if (diffSec < 45) return "just now";
    if (diffSec < 90) return "1 min ago";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  } catch {
    return "recently";
  }
}

function updateDraftsCountUI() {
  const drafts = getDrafts();
  const count = Object.keys(drafts).length;
  const headerCountEl = document.getElementById("header-drafts-count");
  const modalCountEl = document.getElementById("modal-drafts-count");
  if (headerCountEl) headerCountEl.textContent = count;
  if (modalCountEl) modalCountEl.textContent = count;
}

function serializeDraft(draftId) {
  captureMetadata();
  const selections = {};
  Object.entries(assessmentState.selectedItems).forEach(([critId, item]) => {
    selections[critId] = {
      section: item.section,
      id: item.id,
      name: item.name,
      selectedOption: item.selectedOption,
      points: item.points
    };
  });

  const company = assessmentState.metadata.companyName || "Untitled Company";
  const device = assessmentState.metadata.deviceModel || "Unspecified Model";
  const assessor = assessmentState.metadata.assessorName || "Unassigned Assessor";
  const assessorId = assessmentState.metadata.assessorId || "";

  return {
    draftId,
    companyName: company,
    deviceModel: device,
    packageName: assessmentState.metadata.packageName || "",
    assessorName: assessor,
    assessorId: assessorId,
    lastSavedAt: new Date().toISOString(),
    formattedTime: new Date().toLocaleString(),
    rubricVersion: assessmentState.rubricVersion || RUBRIC_VERSION,
    formState: {
      metadata: { ...assessmentState.metadata },
      selections,
      scores: { ...assessmentState.scores }
    }
  };
}

function saveDraftToStorage(isManual = false, forceNew = false) {
  try {
    const drafts = getDrafts();
    const draftKeys = Object.keys(drafts);

    const companyInput = document.getElementById("companyName");
    const currentCompany = (companyInput?.value || assessmentState.metadata?.companyName || "").trim();

    // 1. Force New Draft mode (e.g. user clicked "Save as New Draft")
    if (forceNew) {
      if (draftKeys.length >= MAX_DRAFTS) {
        const warning = "You have reached the maximum of 3 saved drafts. Please submit or discard an existing draft before saving a new one.";
        showToast(warning, true);
        openDraftsModal(warning);
        return false;
      }
      assessmentState.activeDraftId = generateDraftId();
    }
    // 2. An active draft is loaded in the form
    else if (assessmentState.activeDraftId && drafts[assessmentState.activeDraftId]) {
      const existing = drafts[assessmentState.activeDraftId];
      const existingCompany = (existing.companyName || "").trim();

      const isExistingUntitled = !existingCompany || existingCompany.toLowerCase() === "untitled company";
      const isCurrentNamed = currentCompany && currentCompany.toLowerCase() !== "untitled company";
      const isDifferentCompany = !isExistingUntitled && isCurrentNamed && currentCompany.toLowerCase() !== existingCompany.toLowerCase();

      // If the user has typed in a distinctly different company evaluation
      if (isDifferentCompany) {
        if (draftKeys.length < MAX_DRAFTS) {
          // Branch into a separate new draft so the existing draft is preserved
          assessmentState.activeDraftId = generateDraftId();
        } else {
          // Already have 3 saved drafts in storage
          if (isManual) {
            const warning = `You have reached the maximum of 3 saved drafts. Discard or submit an existing draft to save a new one for "${currentCompany}".`;
            showToast(warning, true);
            openDraftsModal(warning);
          }
          return false;
        }
      }
    }
    // 3. No active draft currently bound to the form
    else if (!assessmentState.activeDraftId) {
      if (draftKeys.length >= MAX_DRAFTS) {
        if (isManual) {
          const warning = "You have reached the maximum of 3 saved drafts. Please submit or discard an existing draft before starting a new one.";
          showToast(warning, true);
          openDraftsModal(warning);
        }
        return false;
      }
      assessmentState.activeDraftId = generateDraftId();
    }

    const draftId = assessmentState.activeDraftId;
    const draft = serializeDraft(draftId);
    drafts[draftId] = draft;
    saveDrafts(drafts);
    updateDraftsCountUI();

    const indicator = document.getElementById("autosave-indicator");
    const timeStr = new Date().toLocaleTimeString();
    const countNow = Object.keys(drafts).length;
    const displayName = draft.companyName && draft.companyName !== "Untitled Company" ? draft.companyName : "Evaluation";

    if (indicator) {
      indicator.textContent = isManual
        ? `Draft "${displayName}" manually saved at ${timeStr} (${countNow}/${MAX_DRAFTS})`
        : `Autosaved draft "${displayName}" at ${timeStr} (${countNow}/${MAX_DRAFTS})`;
    }

    if (isManual) {
      showToast(`Draft "${displayName}" saved successfully (${countNow}/${MAX_DRAFTS})`);
      const buttons = [
        document.getElementById("btn-save-draft"),
        document.getElementById("btn-save-draft-top"),
        document.getElementById("btn-save-as-new"),
        document.getElementById("btn-save-as-new-top")
      ];
      buttons.forEach(btn => {
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = `✓ Saved!`;
          setTimeout(() => { if (btn) btn.innerHTML = orig; }, 1800);
        }
      });
    }
    return true;
  } catch (err) {
    console.warn("Could not save evaluation draft to localStorage:", err);
    return false;
  }
}

function saveDraftAsNew() {
  saveDraftToStorage(true, true);
}

function debouncedAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    saveDraftToStorage(false);
  }, 500);
}

function clearDraftFromStorage(draftIdToClear = null) {
  try {
    clearTimeout(autosaveTimer);
    const targetId = draftIdToClear || assessmentState.activeDraftId;
    if (targetId) {
      const drafts = getDrafts();
      if (drafts[targetId]) {
        delete drafts[targetId];
        saveDrafts(drafts);
      }
    }
    if (!draftIdToClear || draftIdToClear === assessmentState.activeDraftId) {
      assessmentState.activeDraftId = null;
      hideRubricWarning();
      const indicator = document.getElementById("autosave-indicator");
      if (indicator) indicator.textContent = "";
    }
    updateDraftsCountUI();
    checkExistingDraft();
  } catch (err) {
    console.warn("Error clearing draft from localStorage:", err);
  }
}

function discardDraft(draftId) {
  if (!draftId) return;
  clearTimeout(autosaveTimer);
  const wasActive = assessmentState.activeDraftId === draftId;
  clearDraftFromStorage(draftId);
  if (wasActive) {
    assessmentState.activeDraftId = null;
    hideRubricWarning();
    const indicator = document.getElementById("autosave-indicator");
    if (indicator) indicator.textContent = "Draft discarded.";
  }
  renderDraftsModal();
  updateDraftsCountUI();
  showToast("Draft discarded successfully.");
}

function showRubricWarning(version) {
  const banner = document.getElementById("rubric-mismatch-banner");
  const textEl = document.getElementById("rubric-mismatch-text");
  if (banner && textEl) {
    textEl.textContent = `This draft was started under an older scoring version (v${escapeHtml(version || '1.0')} vs current v${escapeHtml(RUBRIC_VERSION)}) — please review your answers before submitting.`;
    banner.style.display = "flex";
  }
}

function hideRubricWarning() {
  const banner = document.getElementById("rubric-mismatch-banner");
  if (banner) banner.style.display = "none";
}

function restoreDraft(draft) {
  if (!draft) return;
  assessmentState.activeDraftId = draft.draftId;

  // Check for rubric version mismatch (Requirement 1)
  const draftVersion = draft.rubricVersion || (draft.formState?.metadata?.rubricVersion) || "1.0";
  if (draftVersion !== RUBRIC_VERSION) {
    showRubricWarning(draftVersion);
  } else {
    hideRubricWarning();
  }

  const state = draft.formState || draft;

  // 1. Populate metadata inputs
  if (state.metadata) {
    if (state.metadata.companyName !== undefined) {
      const el = document.getElementById("companyName");
      if (el) el.value = state.metadata.companyName;
    }
    if (state.metadata.deviceModel !== undefined) {
      const el = document.getElementById("deviceModel");
      if (el) el.value = state.metadata.deviceModel;
    }
    if (state.metadata.packageName !== undefined) {
      const el = document.getElementById("packageName");
      if (el) el.value = state.metadata.packageName;
    }
    if (state.metadata.assessorName !== undefined) {
      const el = document.getElementById("assessorName");
      if (el) el.value = state.metadata.assessorName;
    }
    if (state.metadata.assessorId !== undefined) {
      const el = document.getElementById("assessorId");
      if (el) el.value = state.metadata.assessorId;
    }
    if (state.metadata.assessmentDate !== undefined) {
      const el = document.getElementById("assessmentDate");
      if (el) el.value = state.metadata.assessmentDate;
    }
    captureMetadata();
  }

  // 2. Clear current selections and restore saved ones
  assessmentState.selectedItems = {};
  document.querySelectorAll('input[type="radio"][data-crit-id]').forEach(r => { r.checked = false; });
  document.querySelectorAll('.criteria-item').forEach(el => el.classList.remove('has-score'));
  document.querySelectorAll('.points-awarded').forEach(el => {
    el.classList.remove('scored');
    el.textContent = '0.00 pts';
  });

  if (state.selections) {
    Object.entries(state.selections).forEach(([critId, sel]) => {
      let radio = document.querySelector(`input[data-crit-id="${critId}"][data-label="${sel.selectedOption}"]`);
      if (!radio && typeof sel.points === 'number') {
        radio = document.querySelector(`input[data-crit-id="${critId}"][value="${sel.points}"]`);
      }
      if (radio) {
        radio.checked = true;
        const points = parseFloat(radio.value);
        const section = radio.getAttribute("data-section");
        const critName = radio.getAttribute("data-crit-name");
        assessmentState.selectedItems[critId] = {
          section,
          id: critId,
          name: critName,
          selectedOption: sel.selectedOption,
          points
        };

        const rowEl = document.getElementById(`row-${critId}`);
        const badgeEl = document.getElementById(`badge-${critId}`);
        if (rowEl) {
          if (points > 0) rowEl.classList.add("has-score");
          else rowEl.classList.remove("has-score");
        }
        if (badgeEl) {
          if (points > 0) {
            badgeEl.classList.add("scored");
            badgeEl.textContent = `Awarded: ${points.toFixed(2)} pts`;
          } else {
            badgeEl.classList.remove("scored");
            badgeEl.textContent = "0.00 pts";
          }
        }
      }
    });
  }

  calculateScores();

  const banner = document.getElementById("draft-banner");
  if (banner) banner.style.display = "none";

  const indicator = document.getElementById("autosave-indicator");
  if (indicator) {
    indicator.textContent = `Resumed draft: ${draft.companyName || 'Evaluation'} (saved ${formatRelativeTime(draft.lastSavedAt)})`;
  }
}

function startNewEvaluation() {
  const drafts = getDrafts();
  const count = Object.keys(drafts).length;

  if (count >= MAX_DRAFTS) {
    const warning = "You have reached the maximum of 3 saved drafts. Please submit or discard an existing draft before starting a new one.";
    openDraftsModal(warning);
    showToast("Maximum of 3 drafts reached. Discard or submit one first.", true);
    return false;
  }

  clearTimeout(autosaveTimer);
  assessmentState.activeDraftId = null;
  assessmentState.resubmitRecordId = null;
  hideRubricWarning();

  // Reset inputs
  const companyEl = document.getElementById("companyName");
  const deviceEl = document.getElementById("deviceModel");
  const packageEl = document.getElementById("packageName");
  const assessorEl = document.getElementById("assessorName");
  const assessorIdEl = document.getElementById("assessorId");
  const dateEl = document.getElementById("assessmentDate");

  if (companyEl) companyEl.value = "";
  if (deviceEl) deviceEl.value = "";
  if (packageEl) packageEl.value = "";
  if (assessorEl) assessorEl.value = "";
  if (assessorIdEl) assessorIdEl.value = "";
  if (dateEl) dateEl.value = new Date().toISOString().split("T")[0];

  assessmentState.selectedItems = {};
  captureMetadata();

  renderCriteriaSection(SECTION_A_CRITERIA, "sectionA-container", "A");
  renderCriteriaSection(SECTION_B_CRITERIA, "sectionB-container", "B");
  calculateScores();

  closeDraftsModal();
  const banner = document.getElementById("draft-banner");
  if (banner) banner.style.display = "none";

  const indicator = document.getElementById("autosave-indicator");
  if (indicator) {
    indicator.textContent = `New evaluation ready (Drafts in storage: ${count}/${MAX_DRAFTS})`;
  }

  updateDraftsCountUI();
  showToast("Started fresh evaluation form. Enter company details to save as new draft.");
  return true;
}

function openDraftsModal(warningMsg = null) {
  const modal = document.getElementById("drafts-modal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  renderDraftsModal(warningMsg);
}

function closeDraftsModal() {
  const modal = document.getElementById("drafts-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function renderDraftsModal(warningMsg = null) {
  const container = document.getElementById("drafts-list-container");
  const warningEl = document.getElementById("drafts-modal-warning");
  if (!container) return;

  const drafts = getDrafts();
  const draftList = Object.values(drafts).sort((a, b) => new Date(b.lastSavedAt || 0) - new Date(a.lastSavedAt || 0));
  const count = draftList.length;

  updateDraftsCountUI();

  if (warningEl) {
    if (warningMsg) {
      warningEl.textContent = warningMsg;
      warningEl.style.display = "block";
    } else if (count >= MAX_DRAFTS) {
      warningEl.textContent = "You have reached the maximum of 3 saved drafts. Please submit or discard an existing draft before starting a new one.";
      warningEl.style.display = "block";
    } else {
      warningEl.style.display = "none";
    }
  }

  if (count === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 32px 16px; margin: 8px 0;">
        <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 10px;">📋</div>
        <div class="empty-state-title" style="font-size: 15px;">No In-Progress Drafts</div>
        <div class="empty-state-subtitle" style="font-size: 13px; margin-bottom: 12px;">You do not have any evaluations saved in draft state. Click "Start New Evaluation" to begin.</div>
      </div>
    `;
    return;
  }

  let html = "";
  draftList.forEach((draft) => {
    const isActive = assessmentState.activeDraftId === draft.draftId;
    const isRubricMismatch = draft.rubricVersion && draft.rubricVersion !== RUBRIC_VERSION;
    const relativeTime = formatRelativeTime(draft.lastSavedAt);

    html += `
      <div class="draft-card ${isActive ? 'active-draft' : ''}" id="draft-card-${draft.draftId}">
        <div class="draft-card-info">
          <div class="draft-card-title">
            ${escapeHtml(draft.companyName || "Untitled Company")} — ${escapeHtml(draft.deviceModel || "Unspecified Model")}
            ${isActive ? '<span style="font-size: 11px; background: #FEF3C7; color: #B45309; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 6px;">CURRENT</span>' : ''}
          </div>
          <div class="draft-card-meta">
            <span>👤 Assessor: <strong>${escapeHtml(draft.assessorName || "Unassigned")}</strong></span>
            <span>&bull;</span>
            <span>🕒 Saved: <strong>${escapeHtml(relativeTime)}</strong></span>
            ${isRubricMismatch ? `<span class="rubric-badge-warning" title="Started under rubric v${escapeHtml(draft.rubricVersion)}">⚠️ Old Rubric (v${escapeHtml(draft.rubricVersion)})</span>` : ''}
          </div>
        </div>
        <div class="draft-card-actions" id="actions-${draft.draftId}">
          <button type="button" class="btn btn-primary btn-sm" data-action="resume" data-draft-id="${draft.draftId}" onclick="handleResumeDraftClick('${draft.draftId}')">
            ${isActive ? 'Active' : 'Resume'}
          </button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="discard" data-draft-id="${draft.draftId}" style="color: #DC2626; border-color: #FECACA;" onclick="handleDiscardDraftClick('${draft.draftId}')">
            Discard
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.handleResumeDraftClick = function(draftId) {
  const drafts = getDrafts();
  const draft = drafts[draftId];
  if (draft) {
    restoreDraft(draft);
    closeDraftsModal();
    showToast(`Restored draft for ${draft.companyName || 'Evaluation'}.`);
  }
};

window.handleDiscardDraftClick = function(draftId) {
  const actionsContainer = document.getElementById(`actions-${draftId}`);
  if (actionsContainer) {
    actionsContainer.innerHTML = `
      <div style="display: inline-flex; align-items: center; gap: 6px;">
        <button type="button" class="btn btn-sm" data-action="confirm-discard" data-draft-id="${draftId}" style="background: #DC2626; color: #FFFFFF; border: 1px solid #DC2626; font-weight: 600; padding: 4px 8px; font-size: 12px;" onclick="discardDraft('${draftId}')">
          ⚠️ Confirm Discard
        </button>
        <button type="button" class="btn btn-secondary btn-sm" data-action="cancel-discard" data-draft-id="${draftId}" style="padding: 4px 8px; font-size: 12px;" onclick="renderDraftsModal()">
          Cancel
        </button>
      </div>
    `;
    return;
  }
  discardDraft(draftId);
};

function checkExistingDraft() {
  migrateOldDraftIfNeeded();
  updateDraftsCountUI();
  const drafts = getDrafts();
  const draftList = Object.values(drafts).sort((a, b) => new Date(b.lastSavedAt || 0) - new Date(a.lastSavedAt || 0));
  const banner = document.getElementById("draft-banner");
  const timeEl = document.getElementById("draft-banner-time");

  if (draftList.length === 1 && !assessmentState.activeDraftId) {
    const single = draftList[0];
    if (banner && timeEl) {
      timeEl.innerHTML = `<strong>${escapeHtml(single.companyName || 'Evaluation')}</strong> (${escapeHtml(formatRelativeTime(single.lastSavedAt))})`;
      banner.style.display = "flex";
      const btnResume = document.getElementById("btn-resume-draft");
      const btnDiscard = document.getElementById("btn-discard-draft");
      if (btnResume) {
        btnResume.textContent = "Resume";
        btnResume.onclick = () => {
          restoreDraft(single);
          banner.style.display = "none";
          showToast("Evaluation draft restored successfully.");
        };
      }
      if (btnDiscard) {
        btnDiscard.textContent = "Discard";
        btnDiscard.onclick = () => {
          discardDraft(single.draftId);
          banner.style.display = "none";
        };
      }
    }
  } else if (draftList.length > 1 && !assessmentState.activeDraftId) {
    if (banner && timeEl) {
      timeEl.innerHTML = `<strong>${draftList.length} saved drafts</strong> in progress`;
      banner.style.display = "flex";
      const btnResume = document.getElementById("btn-resume-draft");
      const btnDiscard = document.getElementById("btn-discard-draft");
      if (btnResume) {
        btnResume.textContent = "Choose Draft";
        btnResume.onclick = () => openDraftsModal();
      }
      if (btnDiscard) {
        btnDiscard.textContent = "View All";
        btnDiscard.onclick = () => openDraftsModal();
      }
    }
  } else {
    if (banner) banner.style.display = "none";
  }
}

// ==========================================================================
// 3c. Assessor Rejection Notice & Status Lookup Subsystem (Requirement 4)
// Allows assessors to review their submissions and prominently view rejection reasons
// ==========================================================================

function openLookupModal() {
  const modal = document.getElementById("lookup-modal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");

  // Pre-fill with current Assessor ID if present
  const currentAssessorId = (document.getElementById("assessorId")?.value || "").trim();
  const input = document.getElementById("lookup-assessor-input");
  if (input && currentAssessorId && !input.value) {
    input.value = currentAssessorId;
    lookupAssessorSubmissions(currentAssessorId);
  } else if (input && input.value) {
    lookupAssessorSubmissions(input.value);
  }
}

function closeLookupModal() {
  const modal = document.getElementById("lookup-modal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

async function lookupAssessorSubmissions(queryStr) {
  const query = (queryStr || document.getElementById("lookup-assessor-input")?.value || "").trim();
  const container = document.getElementById("lookup-results-container");
  if (!container) return;

  if (!query) {
    container.innerHTML = `<div style="padding: 12px; font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px;">Please enter an Assessor ID, Name, or Company Name to search.</div>`;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 24px; color: #64748B;">
      <span class="spinner-inline" style="width: 14px; height: 14px; border-width: 2px;"></span> Searching records...
    </div>
  `;

  try {
    const res = await fetch(`/.netlify/functions/lookup-evaluation?query=${encodeURIComponent(query)}`, {
      headers: {
        "x-api-key": getAssessorApiKey()
      }
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      container.innerHTML = `<div style="padding: 12px; font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px;">Lookup Error: ${escapeHtml(result.error || 'Failed to search records')}</div>`;
      return;
    }

    if (!result.data || result.data.length === 0) {
      container.innerHTML = `
        <div style="padding: 18px; text-align: center; color: #64748B; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; font-size: 13px;">
          No evaluations found matching "<strong>${escapeHtml(query)}</strong>".
        </div>
      `;
      return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 4px;">`;
    result.data.forEach(sub => {
      const normStatus = (sub.status || "pending_review").toLowerCase();
      const isRejected = normStatus === "rejected";
      const isApproved = normStatus === "approved";
      const recordDate = sub.assessmentDate || (sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "N/A");

      html += `
        <div style="border: 1px solid ${isRejected ? '#FCA5A5' : isApproved ? '#A7F3D0' : '#E2E8F0'}; background: ${isRejected ? '#FFF5F5' : '#FFFFFF'}; border-radius: 6px; padding: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
            <div>
              <div style="font-weight: 700; color: #1E293B; font-size: 14px;">${escapeHtml(sub.companyName)} — ${escapeHtml(sub.deviceModel)}</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 2px;">
                Assessor: <strong>${escapeHtml(sub.assessorName)}</strong> &bull; Date: ${escapeHtml(recordDate)}
              </div>
            </div>
            <div>
              ${isApproved ? `
                <span style="background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px;">● Approved</span>
              ` : isRejected ? `
                <span style="background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px;">● Rejected</span>
              ` : `
                <span style="background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px;">● Pending Review</span>
              `}
            </div>
          </div>

          <div style="font-size: 12.5px; color: #475569; margin-top: 8px;">
            <strong>Score:</strong> ${Number(sub.totalScore || 0).toFixed(2)}/43.00 (${Number(sub.starRating || 0).toFixed(2)}★) &bull; <em>${escapeHtml(sub.ratingLabel || '')}</em>
          </div>

          ${isApproved ? `
            <div style="margin-top: 8px; font-size: 12px; color: #065F46; background: #F0FDF4; border: 1px solid #BBF7D0; padding: 6px 10px; border-radius: 4px;">
              ✓ Approved by <strong>${escapeHtml(sub.approvedBy || 'Manager')}</strong> on ${sub.approvedAt ? new Date(sub.approvedAt).toLocaleString() : 'N/A'}. Record is locked.
            </div>
          ` : ''}

          ${isRejected ? `
            <div style="margin-top: 10px; background: #FFFFFF; border: 2px solid #EF4444; border-radius: 6px; padding: 12px;">
              <div style="color: #991B1B; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                ⚠️ Regulatory Rejection Notice (by ${escapeHtml(sub.rejectedBy || 'Manager')}${sub.rejectedAt ? ' on ' + new Date(sub.rejectedAt).toLocaleString() : ''})
              </div>
              <div style="margin-top: 6px; background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 4px; padding: 8px 12px; color: #7F1D1D; font-size: 13px; font-weight: 600; line-height: 1.4;">
                Reason: "${escapeHtml(sub.rejectionReason || 'No specific reason provided.')}"
              </div>
              <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-primary btn-sm" onclick="loadEvaluationForCorrection('${sub._id}')">
                  ✏️ Load into Form to Correct &amp; Resubmit
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div style="padding: 12px; font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px;">Network Error: ${escapeHtml(error.message)}</div>`;
  }
}

async function loadEvaluationForCorrection(recordId) {
  try {
    showToast("Loading evaluation into form for correction...");
    const res = await fetch(`/.netlify/functions/lookup-evaluation?id=${encodeURIComponent(recordId)}`, {
      headers: {
        "x-api-key": getAssessorApiKey()
      }
    });
    const result = await res.json();
    if (!res.ok || !result.success || !result.data || !result.data[0]) {
      showToast("Failed to fetch evaluation record details", true);
      return;
    }

    const doc = result.data[0];
    assessmentState.resubmitRecordId = doc._id || recordId;

    // Populate metadata
    if (document.getElementById("companyName")) document.getElementById("companyName").value = doc.companyName || "";
    if (document.getElementById("deviceModel")) document.getElementById("deviceModel").value = doc.deviceModel || "";
    if (document.getElementById("packageName")) document.getElementById("packageName").value = doc.packageName || "";
    if (document.getElementById("assessorName")) document.getElementById("assessorName").value = doc.assessorName || "";
    if (document.getElementById("assessorId")) document.getElementById("assessorId").value = doc.assessorId || "";
    if (document.getElementById("assessmentDate") && doc.assessmentDate) document.getElementById("assessmentDate").value = doc.assessmentDate;
    captureMetadata();

    // Populate radio buttons
    if (Array.isArray(doc.breakdown)) {
      doc.breakdown.forEach(item => {
        let radio = document.querySelector(`input[data-crit-id="${item.id}"][data-label="${item.selectedOption}"]`);
        if (!radio && typeof item.points === "number") {
          radio = document.querySelector(`input[data-crit-id="${item.id}"][value="${item.points}"]`);
        }
        if (radio) {
          radio.checked = true;
          const points = parseFloat(radio.value);
          const section = radio.getAttribute("data-section");
          const critName = radio.getAttribute("data-crit-name");
          assessmentState.selectedItems[item.id] = {
            section,
            id: item.id,
            name: critName,
            selectedOption: item.selectedOption,
            points
          };
          const rowEl = document.getElementById(`row-${item.id}`);
          const badgeEl = document.getElementById(`badge-${item.id}`);
          if (rowEl) {
            if (points > 0) rowEl.classList.add("has-score");
            else rowEl.classList.remove("has-score");
          }
          if (badgeEl) {
            if (points > 0) {
              badgeEl.classList.add("scored");
              badgeEl.textContent = `Awarded: ${points.toFixed(2)} pts`;
            } else {
              badgeEl.classList.remove("scored");
              badgeEl.textContent = "0.00 pts";
            }
          }
        }
      });
    }

    calculateScores();
    debouncedAutosave();
    closeLookupModal();

    if (doc.rejectionReason) {
      showFormAlert(`Loaded rejected evaluation. Reason from Manager: "${doc.rejectionReason}". Please adjust the criteria and resubmit.`, "warning");
    } else {
      showToast("Evaluation loaded into form successfully.");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    showToast(`Error loading evaluation: ${err.message}`, true);
  }
}

// Make globally available
window.loadEvaluationForCorrection = loadEvaluationForCorrection;

// ==========================================================================
// 4. HTML2PDF Full Breakdown Report Generation & On-Page Viewer
// ==========================================================================

let currentReportHtml = "";
let currentReportFilename = "";

function generatePdfReport() {
  captureMetadata();

  const { companyName, deviceModel, packageName, assessorName, assessmentDate } = assessmentState.metadata;
  const { sectionA, sectionB, total, starRating, starsCount, ratingLabel } = assessmentState.scores;

  if (!companyName || !deviceModel || !assessorName) {
    showToast("Please fill in Company Name, Device Model, and Assessor Name before generating report.", true);
    document.getElementById("companyName")?.focus();
    return;
  }

  showToast("Compiling official TrackScore Assessment report...");

  // Build sorted items list for dual-column 1-page layout
  const allCriteriaItems = [];
  SECTION_A_CRITERIA.forEach((crit, idx) => {
    const selected = assessmentState.selectedItems[crit.id] || { selectedOption: "None (0)", points: 0.0 };
    allCriteriaItems.push({
      sec: "A",
      num: idx + 1,
      name: crit.name,
      selectedOption: selected.selectedOption,
      points: selected.points
    });
  });
  SECTION_B_CRITERIA.forEach((crit, idx) => {
    const selected = assessmentState.selectedItems[crit.id] || { selectedOption: "None (0)", points: 0.0 };
    allCriteriaItems.push({
      sec: "B",
      num: idx + 1,
      name: crit.name,
      selectedOption: selected.selectedOption,
      points: selected.points
    });
  });

  let starDisplay = "";
  for (let s = 1; s <= 5; s++) {
    starDisplay += s <= starsCount ? "★" : "☆";
  }

  // Split into two balanced columns: 17 items on left, 16 items on right
  const leftColumnItems = allCriteriaItems.slice(0, 17);
  const rightColumnItems = allCriteriaItems.slice(17);

  const renderColumnRows = (itemsList) => itemsList.map((item, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
      <td style="padding: 2.5px 4px; border-bottom: 1px solid #E2E8F0; font-size: 8px; text-align: center; color: #64748B; font-weight: 700;">
        ${item.sec}${item.num}
      </td>
      <td style="padding: 2.5px 5px; border-bottom: 1px solid #E2E8F0; font-size: 8px; font-weight: 600; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">
        ${escapeHtml(item.name)}
      </td>
      <td style="padding: 2.5px 5px; border-bottom: 1px solid #E2E8F0; font-size: 7.5px; color: ${item.points > 0 ? (item.sec === 'A' ? '#C2410C' : '#1D4ED8') : '#64748B'}; font-weight: ${item.points > 0 ? '700' : '400'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">
        ${escapeHtml(item.selectedOption)}
      </td>
      <td style="padding: 2.5px 5px; border-bottom: 1px solid #E2E8F0; font-size: 8px; font-weight: 700; text-align: right; color: ${item.points > 0 ? '#0F172A' : '#94A3B8'}; white-space: nowrap;">
        ${Number(item.points || 0).toFixed(2)} pts
      </td>
    </tr>
  `).join("");

  const reportId = `TS-${Date.now().toString().slice(-6)}`;
  const dateFormatted = assessmentDate || new Date().toISOString().split("T")[0];

  // Pristine single-page A4 format designed to fit 100% without overflowing or splitting
  const rawHtmlTemplate = `
    <div id="trackscore-pdf-document" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; background-color: #FFFFFF; padding: 12px 14px; width: 100%; max-width: 780px; margin: 0 auto; box-sizing: border-box;">
      
      <!-- Report Header -->
      <div style="background-color: #1A1A1A; border-bottom: 3px solid #F58220; padding: 10px 14px; color: #FFFFFF; border-radius: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 8.5px; text-transform: uppercase; letter-spacing: 1.2px; color: #F58220; font-weight: 800; margin-bottom: 2px;">MALAYSIAN INSTITUTE OF ROAD SAFETY RESEARCH (MIROS)</div>
          <h1 style="margin: 0; font-size: 17px; font-weight: 800; letter-spacing: 0.5px; color: #FFFFFF;">TRACKSCORE ASSESSMENT REPORT</h1>
          <div style="font-size: 9.5px; color: #CBD5E1; margin-top: 1px;">Official Telematics Hardware & Software Compliance Matrix</div>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; background: #F58220; color: #FFFFFF; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 3px;">
            OFFICIAL EVALUATION
          </div>
          <div style="font-size: 9.5px; color: #CBD5E1; margin-top: 3px;">Ref ID: ${reportId}</div>
        </div>
      </div>

      <!-- Metadata Grid -->
      <div style="border: 1px solid #E2E8F0; border-radius: 4px; padding: 6px 10px; margin-bottom: 10px; background-color: #F8FAFC;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 18%; padding: 2.5px 5px; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Company:</td>
            <td style="width: 32%; padding: 2.5px 5px; font-size: 10.5px; font-weight: 700; color: #0F172A;">${escapeHtml(companyName)}</td>
            <td style="width: 18%; padding: 2.5px 5px; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Date:</td>
            <td style="width: 32%; padding: 2.5px 5px; font-size: 10.5px; font-weight: 700; color: #0F172A;">${escapeHtml(dateFormatted)}</td>
          </tr>
          <tr>
            <td style="padding: 2.5px 5px; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Device Model:</td>
            <td style="padding: 2.5px 5px; font-size: 10.5px; font-weight: 700; color: #0F172A;">${escapeHtml(deviceModel)}</td>
            <td style="padding: 2.5px 5px; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Assessor Name:</td>
            <td style="padding: 2.5px 5px; font-size: 10.5px; font-weight: 700; color: #0F172A;">${escapeHtml(assessorName)}</td>
          </tr>
          <tr>
            <td style="padding: 2.5px 5px; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Package:</td>
            <td style="padding: 2.5px 5px; font-size: 10.5px; font-weight: 700; color: #0F172A;">${escapeHtml(packageName || "Standard Evaluation Package")}</td>
            <td style="padding: 2.5px 5px; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Rubric Version:</td>
            <td style="padding: 2.5px 5px; font-size: 10.5px; font-weight: 700; color: #0F172A;">v1.0 (33 Criteria / 43 Pts)</td>
          </tr>
        </table>
      </div>

      <!-- Score Summary Table -->
      <div style="margin-bottom: 10px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #1A1A1A; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #1A1A1A; color: #FFFFFF;">
              <th style="padding: 5px 8px; text-align: left; font-size: 9px; font-weight: 700; width: 25%;">Section A Score (Basic)</th>
              <th style="padding: 5px 8px; text-align: left; font-size: 9px; font-weight: 700; width: 25%;">Section B Score (Additional)</th>
              <th style="padding: 5px 8px; text-align: left; font-size: 9px; font-weight: 700; width: 25%; color: #F58220;">Total Score</th>
              <th style="padding: 5px 8px; text-align: left; font-size: 9px; font-weight: 700; width: 25%;">Certification Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #FFFFFF;">
              <td style="padding: 6px 8px; font-size: 13px; font-weight: 800; border-right: 1px solid #E2E8F0;">
                ${sectionA.toFixed(2)} <span style="font-size: 9.5px; font-weight: 500; color: #64748B;">/ 33.00</span>
              </td>
              <td style="padding: 6px 8px; font-size: 13px; font-weight: 800; border-right: 1px solid #E2E8F0;">
                ${sectionB.toFixed(2)} <span style="font-size: 9.5px; font-weight: 500; color: #64748B;">/ 10.00</span>
              </td>
              <td style="padding: 6px 8px; font-size: 15px; font-weight: 900; color: #F58220; border-right: 1px solid #E2E8F0;">
                ${total.toFixed(2)} <span style="font-size: 10px; font-weight: 600; color: #64748B;">/ 43.00</span>
              </td>
              <td style="padding: 6px 8px;">
                <div style="font-size: 13px; font-weight: 800; color: #B45309;">
                  ${starDisplay} <span style="font-size: 10px;">(${starRating.toFixed(2)}/5.0)</span>
                </div>
                <div style="font-size: 9px; font-weight: 700; color: #475569; margin-top: 1px;">
                  ${escapeHtml(ratingLabel)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Itemized Criteria Matrix Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; border-bottom: 2px solid #F58220; padding-bottom: 3px;">
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #1A1A1A;">
          Itemized Evaluation Breakdown (All 33 Criteria)
        </span>
        <span style="font-size: 8.5px; color: #64748B; font-weight: 600;">
          24 Core Requirements + 9 Security Items
        </span>
      </div>

      <!-- Dual-Column Itemized Matrix: Fits perfectly on 1 Single A4 Page -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <tr>
          <!-- Column 1: Items 1 to 17 -->
          <td style="width: 49.5%; vertical-align: top; padding-right: 4px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #CBD5E1;">
              <thead>
                <tr style="background-color: #1A1A1A; color: #FFFFFF;">
                  <th style="padding: 3px 4px; font-size: 7.5px; font-weight: 700; width: 10%; text-align: center;">#</th>
                  <th style="padding: 3px 5px; font-size: 7.5px; font-weight: 700; width: 48%; text-align: left;">Criterion (Sec A)</th>
                  <th style="padding: 3px 5px; font-size: 7.5px; font-weight: 700; width: 26%; text-align: left;">Selected Option</th>
                  <th style="padding: 3px 5px; font-size: 7.5px; font-weight: 700; width: 16%; text-align: right;">Pts</th>
                </tr>
              </thead>
              <tbody>
                ${renderColumnRows(leftColumnItems)}
              </tbody>
            </table>
          </td>

          <!-- Column 2: Items 18 to 33 -->
          <td style="width: 49.5%; vertical-align: top; padding-left: 4px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #CBD5E1;">
              <thead>
                <tr style="background-color: #1A1A1A; color: #FFFFFF;">
                  <th style="padding: 3px 4px; font-size: 7.5px; font-weight: 700; width: 10%; text-align: center;">#</th>
                  <th style="padding: 3px 5px; font-size: 7.5px; font-weight: 700; width: 48%; text-align: left;">Criterion (Sec A/B)</th>
                  <th style="padding: 3px 5px; font-size: 7.5px; font-weight: 700; width: 26%; text-align: left;">Selected Option</th>
                  <th style="padding: 3px 5px; font-size: 7.5px; font-weight: 700; width: 16%; text-align: right;">Pts</th>
                </tr>
              </thead>
              <tbody>
                ${renderColumnRows(rightColumnItems)}
              </tbody>
            </table>
          </td>
        </tr>
      </table>

      <!-- Sign-Off & Verification Footer -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; font-size: 8px; color: #64748B;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 55%; vertical-align: top;">
              <div style="font-weight: 700; color: #1A1A1A; margin-bottom: 1px;">TrackScore Digital Assessor Matrix</div>
              <div>Certified by Malaysian Institute of Road Safety Research (MIROS)</div>
              <div style="margin-top: 1px;">Generated on ${new Date().toLocaleString()}</div>
            </td>
            <td style="width: 45%; vertical-align: top; text-align: right;">
              <div style="display: inline-block; text-align: center; border-top: 1px solid #94A3B8; padding-top: 2px; min-width: 150px;">
                <div style="font-weight: 700; color: #1A1A1A; font-size: 8.5px;">${escapeHtml(assessorName)}</div>
                <div style="font-size: 7.5px; color: #64748B;">Authorized Assessor Sign-Off</div>
              </div>
            </td>
          </tr>
        </table>
      </div>

    </div>
  `;

  // Cache template and filename
  currentReportHtml = rawHtmlTemplate;
  currentReportFilename = `TrackScore_Evaluation_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${deviceModel.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  // 1. RENDER AND SHOW REPORT DIRECTLY ON THE EVALUATION PAGE
  const reportWrapper = document.getElementById("report-document-wrapper");
  const reportModal = document.getElementById("report-modal");
  const reportModalTitle = document.getElementById("report-modal-title");
  const reportStatusBadge = document.getElementById("report-status-badge");

  if (reportWrapper && reportModal) {
    reportWrapper.innerHTML = rawHtmlTemplate;

    if (reportModalTitle) {
      reportModalTitle.textContent = `Generated Assessment Report: ${companyName} (${deviceModel})`;
    }
    if (reportStatusBadge) {
      reportStatusBadge.textContent = "Report generated and displayed on evaluation page";
    }

    // Open modal on evaluation page
    reportModal.classList.add("active");
    reportModal.setAttribute("aria-hidden", "false");

    // Scroll to top of modal container
    const modalBody = document.getElementById("report-modal-body");
    if (modalBody) modalBody.scrollTop = 0;

    showToast("Assessment Report is now displayed on the page!");
  }
}

// Download the currently generated report as a PDF file
function downloadReportPdf(showMessage = true) {
  if (!currentReportHtml) {
    showToast("Please generate the report first before downloading.", true);
    return;
  }

  const downloadBtn = document.getElementById("btn-download-pdf-modal");
  const downloadText = document.getElementById("btn-download-modal-text");
  const statusBadge = document.getElementById("report-status-badge");

  if (downloadBtn) downloadBtn.disabled = true;
  if (downloadText) downloadText.textContent = "Generating PDF...";
  if (statusBadge) statusBadge.textContent = "Compiling 1-page PDF document...";

  const element = document.getElementById('report-document-wrapper'); 

  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: currentReportFilename || "TrackScore_Evaluation_Report.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      scrollY: 0,
      windowHeight: element.scrollHeight
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  if (window.html2pdf) {
    window.html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        if (downloadText) downloadText.textContent = "Download PDF File";
        if (downloadBtn) downloadBtn.disabled = false;
        if (statusBadge) statusBadge.textContent = "Report displayed • 1-page PDF file downloaded successfully";
        if (showMessage) {
          showToast("PDF report successfully downloaded!");
        }
      })
      .catch(err => {
        console.error("PDF generation failed:", err);
        if (downloadText) downloadText.textContent = "Download PDF File";
        if (downloadBtn) downloadBtn.disabled = false;
        if (statusBadge) statusBadge.textContent = "Report displayed on page (PDF download issue)";
        showToast("PDF file download error: " + err.message, true);
      });
  } else {
    if (downloadText) downloadText.textContent = "Download PDF File";
    if (downloadBtn) downloadBtn.disabled = false;
    showToast("html2pdf library is loading. Please try again shortly.", true);
  }
}

// Print the currently displayed report
function printCurrentReport() {
  if (!currentReportHtml) {
    showToast("No report is currently displayed to print.", true);
    return;
  }
  window.print();
}

// Close the on-page report modal
function closeReportModal() {
  const reportModal = document.getElementById("report-modal");
  if (reportModal) {
    reportModal.classList.remove("active");
    reportModal.setAttribute("aria-hidden", "true");
  }
}

// ==========================================================================
// 5. Database Save Operation (Netlify Function)
// ==========================================================================

// Form Alert Management (Hardening Pass 2)
function showFormAlert(message, type = "danger") {
  const container = document.getElementById("form-alert-container");
  const msgEl = document.getElementById("form-alert-message");
  if (!container || !msgEl) {
    showToast(message, type !== "success");
    return;
  }
  container.className = `form-alert-container alert-${type}`;
  container.style.display = "flex";
  msgEl.innerHTML = `<strong>${escapeHtml(type.toUpperCase())}:</strong> ${escapeHtml(message)}`;
  container.scrollIntoView({ behavior: "smooth", block: "center" });
}

function dismissFormAlert() {
  const container = document.getElementById("form-alert-container");
  if (container) container.style.display = "none";
}

// Make globally accessible for close button
window.dismissFormAlert = dismissFormAlert;

async function saveEvaluationToDatabase() {
  dismissFormAlert();
  captureMetadata();

  const { companyName, deviceModel, packageName, assessorName, assessorId } = assessmentState.metadata;
  const { sectionA, sectionB, total, starRating, starsCount, ratingLabel } = assessmentState.scores;

  if (!companyName || !deviceModel || !assessorName || !assessorId) {
    const errorMsg = "Please fill in Company Name, Device Model, Assessor Name, and Assessor ID before saving.";
    showFormAlert(errorMsg, "warning");
    showToast(errorMsg, true);
    document.getElementById("companyName")?.focus();
    return;
  }

  const saveBtn = document.getElementById("btn-save-evaluation");
  const originalHtml = saveBtn ? saveBtn.innerHTML : "Save Evaluation";
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-inline spinner-white"></span> Saving Evaluation...`;
  }

  // Build full breakdown list
  const breakdown = [];
  SECTION_A_CRITERIA.forEach(crit => {
    const item = assessmentState.selectedItems[crit.id] || { selectedOption: "None (0)", points: 0.0 };
    breakdown.push({
      section: "A",
      id: crit.id,
      name: crit.name,
      selectedOption: item.selectedOption,
      points: item.points
    });
  });

  SECTION_B_CRITERIA.forEach(crit => {
    const item = assessmentState.selectedItems[crit.id] || { selectedOption: "None (0)", points: 0.0 };
    breakdown.push({
      section: "B",
      id: crit.id,
      name: crit.name,
      selectedOption: item.selectedOption,
      points: item.points
    });
  });

  const payload = {
    companyName,
    deviceModel,
    packageName: packageName || "Standard Package",
    assessorName,
    assessorId,
    assessmentDate: assessmentState.metadata.assessmentDate,
    rubricVersion: assessmentState.rubricVersion || RUBRIC_VERSION,
    sectionAScore: sectionA,
    sectionBScore: sectionB,
    totalScore: total,
    starRating,
    starsCount,
    ratingLabel,
    breakdown,
    createdAt: new Date().toISOString()
  };

  if (assessmentState.resubmitRecordId) {
    payload.resubmitRecordId = assessmentState.resubmitRecordId;
  }

  try {
    const response = await fetch("/.netlify/functions/save-evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAssessorApiKey()
      },
      body: JSON.stringify(payload)
    });

    let result = {};
    try {
      result = await response.json();
    } catch (parseErr) {
      result = { error: "Server returned non-JSON response" };
    }

    if (response.ok && result.success) {
      const msg = result.message || "Evaluation record securely saved to database!";
      showFormAlert(msg, "success");
      showToast(msg);
      // Requirement 4: On successful submission, remove only the submitted draft from trackscore-drafts
      if (assessmentState.activeDraftId) {
        clearDraftFromStorage(assessmentState.activeDraftId);
        assessmentState.activeDraftId = null;
      }
      hideRubricWarning();
      updateDraftsCountUI();
      assessmentState.resubmitRecordId = null;
      checkExistingDraft();
    } else if (response.status === 409) {
      // Duplicate submission guard (Item 8)
      const err = result.error || "A record for this Company, Device, Assessor, and Date already exists.";
      showFormAlert(`Duplicate Error: ${err}`, "warning");
      showToast(`Duplicate: ${err}`, true);
    } else if (response.status === 400) {
      // Score integrity verification failure or validation error (Item 3)
      const err = result.error || "Server detected score discrepancy or invalid parameters.";
      showFormAlert(`Validation Integrity Error: ${err}`, "danger");
      showToast(`Validation Error: ${err}`, true);
    } else if (response.status === 401) {
      // Authentication error (Item 4)
      const err = result.error || "Invalid or missing Assessor API key.";
      showFormAlert(`Authentication Error (401): ${err}`, "danger");
      showToast(`Auth Error: ${err}`, true);
    } else if (response.status === 403) {
      // Role permission error
      const err = result.error || "Forbidden: Endpoint requires Assessor role privileges.";
      showFormAlert(`Permission Error (403): ${err}`, "danger");
      showToast(`Forbidden: ${err}`, true);
    } else {
      const err = result.error || `Server responded with HTTP status ${response.status}`;
      showFormAlert(`Submission Failure: ${err}`, "danger");
      showToast(`Error: ${err}`, true);
    }
  } catch (error) {
    console.error("Save evaluation network error:", error);
    const err = error.message || "Network connection failure. Please check server connectivity.";
    showFormAlert(`Network Error: ${err}`, "danger");
    showToast(`Network Error: ${err}`, true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHtml;
    }
  }
}

// ==========================================================================
// 6. Utility Functions & Notifications
// ==========================================================================

function escapeHtml(string) {
  if (!string) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return String(string).replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, isError = false) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${isError ? 'toast-error' : ''}`;
  toast.innerHTML = `
    <span>${isError ? '⚠️' : '✓'}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Reset form to defaults
function resetEvaluationForm() {
  const btn = document.getElementById("btn-reset-form");
  if (btn && btn.getAttribute("data-confirming") !== "true") {
    btn.setAttribute("data-confirming", "true");
    const origHtml = btn.innerHTML;
    btn.innerHTML = "⚠️ Confirm Reset?";
    btn.style.color = "#DC2626";
    btn.style.borderColor = "#DC2626";
    btn.style.fontWeight = "600";
    showToast("Click 'Confirm Reset?' again to reset form.");
    setTimeout(() => {
      if (btn && btn.getAttribute("data-confirming") === "true") {
        btn.setAttribute("data-confirming", "false");
        btn.innerHTML = origHtml;
        btn.style.color = "";
        btn.style.borderColor = "";
        btn.style.fontWeight = "";
      }
    }, 3500);
    return;
  }

  if (btn) {
    btn.setAttribute("data-confirming", "false");
    btn.innerHTML = "Reset Form";
    btn.style.color = "";
    btn.style.borderColor = "";
    btn.style.fontWeight = "";
  }

  clearTimeout(autosaveTimer);
  assessmentState.activeDraftId = null;
  assessmentState.resubmitRecordId = null;
  hideRubricWarning();

  // Reset metadata inputs
  const companyEl = document.getElementById("companyName");
  const deviceEl = document.getElementById("deviceModel");
  const packageEl = document.getElementById("packageName");
  const assessorEl = document.getElementById("assessorName");
  const assessorIdEl = document.getElementById("assessorId");
  const dateEl = document.getElementById("assessmentDate");

  if (companyEl) companyEl.value = "";
  if (deviceEl) deviceEl.value = "";
  if (packageEl) packageEl.value = "";
  if (assessorEl) assessorEl.value = "";
  if (assessorIdEl) assessorIdEl.value = "";
  if (dateEl) dateEl.value = new Date().toISOString().split("T")[0];

  assessmentState.selectedItems = {};
  captureMetadata();

  // Re-render and re-calculate
  renderCriteriaSection(SECTION_A_CRITERIA, "sectionA-container", "A");
  renderCriteriaSection(SECTION_B_CRITERIA, "sectionB-container", "B");
  calculateScores();

  const indicator = document.getElementById("autosave-indicator");
  if (indicator) indicator.textContent = "Evaluation form reset to blank state.";
  showToast("Evaluation form reset to initial state.");
}

// Auto-populate demo data for quick assessor inspection
function fillDemoData() {
  document.getElementById("companyName").value = "Vortex Telematics Malaysia Sdn Bhd";
  document.getElementById("deviceModel").value = "VT-900 GPS Telematics Hub";
  document.getElementById("packageName").value = "Commercial Fleet Gold Plus";
  document.getElementById("assessorName").value = "Ir. Khairul Azhar";
  document.getElementById("assessorId").value = "AS-9920";

  // Select some realistic high-score options
  const samplePicks = {
    trip_history: ">1 year",
    realtime_tracking: "Available",
    map_source: "Open updated",
    geofence: "Polygon",
    geofence_alert: "Push",
    vehicle_status: "Available",
    engine_status: "Report",
    overspeed_detection: "Configurable",
    overspeed_alert: "Push",
    offline_memory: ">60m",
    backup_battery: ">24h",
    sim_network: "Roaming",
    connectivity: "4G",
    multilingual: "Other",
    user_manual: "Other",
    warranty: ">12m",
    customer_service: "Control Centre",
    os_compatibility: "Mobile",
    trip_report: "Duration",
    data_interval: "<30s",
    harsh_accel: "Config",
    harsh_accel_alert: "Push",
    harsh_braking: "Config",
    harsh_braking_alert: "Push",
    tow_detection: "Available",
    panic_button: "SMS",
    mfa: "OTP",
    sop_tech_problems: "3 days",
    service_records: "Available",
    driver_id: "Report",
    certification: "SIRIM/CE",
    immobilizer: "Available",
    tampered_alert: "Push"
  };

  Object.entries(samplePicks).forEach(([critId, optionLabel]) => {
    const radio = document.querySelector(`input[data-crit-id="${critId}"][data-label="${optionLabel}"]`);
    if (radio) {
      radio.checked = true;
      const points = parseFloat(radio.value);
      const section = radio.getAttribute("data-section");
      const critName = radio.getAttribute("data-crit-name");
      assessmentState.selectedItems[critId] = {
        section,
        id: critId,
        name: critName,
        selectedOption: optionLabel,
        points
      };
      const rowEl = document.getElementById(`row-${critId}`);
      const badgeEl = document.getElementById(`badge-${critId}`);
      if (rowEl) rowEl.classList.add("has-score");
      if (badgeEl) {
        badgeEl.classList.add("scored");
        badgeEl.textContent = `Awarded: ${points.toFixed(2)} pts`;
      }
    }
  });

  calculateScores();
  showToast("Demo evaluation loaded with high-specification inputs.");
}

// ==========================================================================
// 7. Initialization on DOMContentLoaded
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Check if we are on index.html (the evaluation form)
  const sectionAContainer = document.getElementById("sectionA-container");
  if (sectionAContainer) {
    renderCriteriaSection(SECTION_A_CRITERIA, "sectionA-container", "A");
    renderCriteriaSection(SECTION_B_CRITERIA, "sectionB-container", "B");

    // Event delegation on containers
    document.getElementById("evaluation-form")?.addEventListener("change", handleOptionChange);

    // Debounced autosave on metadata field inputs and changes
    ["companyName", "deviceModel", "packageName", "assessorName", "assessorId", "assessmentDate"].forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.addEventListener("input", debouncedAutosave);
        el.addEventListener("change", debouncedAutosave);
      }
    });

    // Check for existing draft in localStorage on page load
    checkExistingDraft();

    // Initial score calculation
    calculateScores();

    // Attach button handlers
    document.getElementById("btn-save-draft")?.addEventListener("click", () => saveDraftToStorage(true, false));
    document.getElementById("btn-save-draft-top")?.addEventListener("click", () => saveDraftToStorage(true, false));
    document.getElementById("btn-save-as-new")?.addEventListener("click", saveDraftAsNew);
    document.getElementById("btn-save-as-new-top")?.addEventListener("click", saveDraftAsNew);
    document.getElementById("btn-my-drafts")?.addEventListener("click", () => openDraftsModal());
    document.getElementById("link-view-all-drafts")?.addEventListener("click", () => openDraftsModal());
    document.getElementById("btn-start-new-eval")?.addEventListener("click", startNewEvaluation);
    document.getElementById("btn-modal-new-eval")?.addEventListener("click", startNewEvaluation);
    document.getElementById("drafts-modal-close")?.addEventListener("click", closeDraftsModal);
    document.getElementById("btn-close-drafts")?.addEventListener("click", closeDraftsModal);
    document.getElementById("btn-dismiss-rubric-warning")?.addEventListener("click", hideRubricWarning);
    document.getElementById("btn-lookup-rejections")?.addEventListener("click", openLookupModal);
    document.getElementById("btn-pdf-report")?.addEventListener("click", generatePdfReport);
    document.getElementById("btn-save-evaluation")?.addEventListener("click", saveEvaluationToDatabase);
    document.getElementById("btn-reset-form")?.addEventListener("click", resetEvaluationForm);
    document.getElementById("btn-demo-data")?.addEventListener("click", fillDemoData);

    // Lookup modal handlers
    document.getElementById("lookup-modal-close")?.addEventListener("click", closeLookupModal);
    document.getElementById("btn-close-lookup")?.addEventListener("click", closeLookupModal);
    document.getElementById("btn-do-lookup")?.addEventListener("click", () => {
      lookupAssessorSubmissions();
    });
    document.getElementById("lookup-assessor-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        lookupAssessorSubmissions();
      }
    });

    // Delegated drafts list click listener for robust action handling
    const draftsListContainer = document.getElementById("drafts-list-container");
    if (draftsListContainer) {
      draftsListContainer.addEventListener("click", (e) => {
        const resumeBtn = e.target.closest("[data-action='resume']");
        if (resumeBtn) {
          const draftId = resumeBtn.getAttribute("data-draft-id");
          if (draftId) handleResumeDraftClick(draftId);
          return;
        }

        const discardBtn = e.target.closest("[data-action='discard']");
        if (discardBtn) {
          const draftId = discardBtn.getAttribute("data-draft-id");
          if (draftId) handleDiscardDraftClick(draftId);
          return;
        }

        const confirmBtn = e.target.closest("[data-action='confirm-discard']");
        if (confirmBtn) {
          const draftId = confirmBtn.getAttribute("data-draft-id");
          if (draftId) discardDraft(draftId);
          return;
        }

        const cancelBtn = e.target.closest("[data-action='cancel-discard']");
        if (cancelBtn) {
          renderDraftsModal();
          return;
        }
      });
    }

    // Modal report viewer handlers
    document.getElementById("report-modal-close")?.addEventListener("click", closeReportModal);
    document.getElementById("btn-close-report-modal")?.addEventListener("click", closeReportModal);
    document.getElementById("btn-download-pdf-modal")?.addEventListener("click", () => downloadReportPdf(true));
    document.getElementById("btn-print-report")?.addEventListener("click", printCurrentReport);

    // Close on overlay backdrop click
    const draftsModal = document.getElementById("drafts-modal");
    if (draftsModal) {
      draftsModal.addEventListener("click", (e) => {
        if (e.target === draftsModal) {
          closeDraftsModal();
        }
      });
    }

    const reportModal = document.getElementById("report-modal");
    if (reportModal) {
      reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) {
          closeReportModal();
        }
      });
    }

    const lookupModal = document.getElementById("lookup-modal");
    if (lookupModal) {
      lookupModal.addEventListener("click", (e) => {
        if (e.target === lookupModal) {
          closeLookupModal();
        }
      });
    }

    // Close on Escape key press
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDraftsModal();
        closeReportModal();
        closeLookupModal();
      }
    });
  }
});

// Export globally so dashboard or tests can reference if needed
window.TrackScore = {
  assessmentState,
  SECTION_A_CRITERIA,
  SECTION_B_CRITERIA,
  calculateScores,
  generatePdfReport,
  downloadReportPdf,
  printCurrentReport,
  closeReportModal,
  saveEvaluationToDatabase,
  getDrafts,
  openDraftsModal,
  closeDraftsModal,
  startNewEvaluation,
  restoreDraft,
  discardDraft,
  handleDiscardDraftClick,
  handleResumeDraftClick
};