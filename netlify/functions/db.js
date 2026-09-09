/**
 * MongoDB Atlas connection helper for Netlify Serverless Functions
 * Provides connection pooling/caching across warm serverless invocations.
 * Includes local fallback storage when MONGODB_URI is not yet configured.
 */

import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

let cachedClient = null;
let cachedDb = null;
let lastAtlasAttemptTime = 0;
let lastAtlasErrorMessage = null;
let isIpWhitelistBlocked = false;
let hasLoggedNotice = false;
const ATLAS_RETRY_COOLDOWN_MS = 60000; // 60s cooldown before retrying Atlas

export const DB_NAME = 'trackscore';
export const COLLECTION_NAME = 'evaluations';
const FALLBACK_DIR = path.join(process.cwd(), '.data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'evaluations.json');

// Ensure fallback directory exists
function ensureFallbackStore() {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    // Seed with two sample realistic evaluations for immediate dashboard review
    const sampleData = [
      {
        _id: 'seed-eval-001',
        rubricVersion: '1.0',
        companyName: 'Apex Telematics Sdn Bhd',
        deviceModel: 'FleetGuard Pro 400',
        packageName: 'Enterprise Fleet Tracker',
        assessorName: 'Ts. Mohd Farhan (AS-8812)',
        assessmentDate: '2026-09-06',
        sectionAScore: 30.5,
        sectionBScore: 8.75,
        totalScore: 39.25,
        starRating: 4.56,
        starsCount: 5,
        ratingLabel: '5 Stars - Outstanding (MIROS Grade A)',
        breakdown: [
          { section: 'A', id: 'trip_history', name: 'Trip History Data', selectedOption: '>1 year', points: 1.5 },
          { section: 'A', id: 'realtime_tracking', name: 'Real-time Tracking', selectedOption: 'Available', points: 1.0 },
          { section: 'A', id: 'map_source', name: 'Map Source', selectedOption: 'Open updated', points: 1.5 },
          { section: 'A', id: 'geofence', name: 'Geofence', selectedOption: 'Polygon', points: 1.25 },
          { section: 'A', id: 'geofence_alert', name: 'Geofence Alert', selectedOption: 'Push', points: 1.5 },
          { section: 'A', id: 'vehicle_status', name: 'Vehicle Status', selectedOption: 'Available', points: 1.0 },
          { section: 'A', id: 'engine_status', name: 'Engine ON/OFF', selectedOption: 'Report', points: 1.25 },
          { section: 'A', id: 'overspeed_detection', name: 'Overspeed Detection', selectedOption: 'Configurable', points: 1.5 },
          { section: 'A', id: 'overspeed_alert', name: 'Overspeed Alert', selectedOption: 'Push', points: 1.5 },
          { section: 'A', id: 'offline_memory', name: 'Offline Memory', selectedOption: '>60m', points: 1.5 },
          { section: 'A', id: 'backup_battery', name: 'Backup Battery', selectedOption: '>24h', points: 1.5 },
          { section: 'A', id: 'sim_network', name: 'SIM Network', selectedOption: 'Roaming', points: 1.5 },
          { section: 'A', id: 'connectivity', name: 'Connectivity', selectedOption: '4G', points: 1.0 },
          { section: 'A', id: 'multilingual', name: 'Multilingual', selectedOption: 'Other', points: 1.25 },
          { section: 'A', id: 'user_manual', name: 'User Manual', selectedOption: 'Other', points: 1.25 },
          { section: 'A', id: 'warranty', name: 'Warranty', selectedOption: '>12m', points: 1.25 },
          { section: 'A', id: 'customer_service', name: 'Customer Service', selectedOption: 'Control Centre', points: 1.5 },
          { section: 'A', id: 'os_compatibility', name: 'OS Compatibility', selectedOption: 'Mobile', points: 1.5 },
          { section: 'A', id: 'trip_report', name: 'Trip Report', selectedOption: 'Duration', points: 1.25 },
          { section: 'A', id: 'data_interval', name: 'Data Interval', selectedOption: '<30s', points: 1.5 },
          { section: 'A', id: 'harsh_accel', name: 'Harsh Acceleration', selectedOption: 'Config', points: 1.5 },
          { section: 'A', id: 'harsh_accel_alert', name: 'Harsh Accel Alert', selectedOption: 'Push', points: 1.5 },
          { section: 'A', id: 'harsh_braking', name: 'Harsh Braking', selectedOption: 'Config', points: 1.5 },
          { section: 'A', id: 'harsh_braking_alert', name: 'Harsh Braking Alert', selectedOption: 'Push', points: 1.5 },
          { section: 'B', id: 'tow_detection', name: 'Tow Detection', selectedOption: 'Available', points: 1.0 },
          { section: 'B', id: 'panic_button', name: 'Panic Button', selectedOption: 'SMS', points: 1.25 },
          { section: 'B', id: 'mfa', name: 'MFA', selectedOption: 'OTP', points: 1.0 },
          { section: 'B', id: 'sop_tech_problems', name: 'SOP Tech Problems', selectedOption: '3 days', points: 1.0 },
          { section: 'B', id: 'service_records', name: 'Service Records', selectedOption: 'Available', points: 1.0 },
          { section: 'B', id: 'driver_id', name: 'Driver ID', selectedOption: 'Report', points: 1.25 },
          { section: 'B', id: 'certification', name: 'Certification', selectedOption: 'SIRIM/CE', points: 1.0 },
          { section: 'B', id: 'immobilizer', name: 'Immobilizer', selectedOption: 'Available', points: 1.0 },
          { section: 'B', id: 'tampered_alert', name: 'Tamper Detection & Power Disconnect Alert', selectedOption: 'SMS', points: 1.25 }
        ],
        status: 'approved',
        approvedBy: 'Lead Manager',
        approvedAt: '2026-09-06T06:00:00.000Z',
        statusChangedAt: '2026-09-06T06:00:00.000Z',
        evaluationHistory: [
          {
            action: 'approved',
            timestamp: '2026-09-06T06:00:00.000Z',
            changedBy: 'Lead Manager',
            note: 'Evaluation approved and certified.'
          }
        ],
        createdAt: '2026-09-06T04:56:17.982Z'
      },
      {
        _id: 'seed-eval-002',
        rubricVersion: '1.0',
        companyName: 'OmniTrack Mobility Solutions',
        deviceModel: 'OT-Lite 200 GPS',
        packageName: 'Basic Commercial Standard',
        assessorName: 'Engr. Sarah Wong (AS-7741)',
        assessmentDate: '2026-09-03',
        sectionAScore: 24.25,
        sectionBScore: 5.25,
        totalScore: 29.5,
        starRating: 3.43,
        starsCount: 3,
        ratingLabel: '3 Stars - Satisfactory (MIROS Grade C)',
        breakdown: [
          { section: 'A', id: 'trip_history', name: 'Trip History Data', selectedOption: '>3m-1y', points: 1.25 },
          { section: 'A', id: 'realtime_tracking', name: 'Real-time Tracking', selectedOption: 'Available', points: 1.0 },
          { section: 'A', id: 'map_source', name: 'Map Source', selectedOption: 'Open', points: 1.25 },
          { section: 'A', id: 'geofence', name: 'Geofence', selectedOption: 'Radius', points: 1.0 },
          { section: 'A', id: 'geofence_alert', name: 'Geofence Alert', selectedOption: 'System', points: 1.0 },
          { section: 'A', id: 'vehicle_status', name: 'Vehicle Status', selectedOption: 'Available', points: 1.0 },
          { section: 'A', id: 'engine_status', name: 'Engine ON/OFF', selectedOption: 'System', points: 1.0 },
          { section: 'A', id: 'overspeed_detection', name: 'Overspeed Detection', selectedOption: 'Available', points: 1.0 },
          { section: 'A', id: 'overspeed_alert', name: 'Overspeed Alert', selectedOption: 'System', points: 1.0 },
          { section: 'A', id: 'offline_memory', name: 'Offline Memory', selectedOption: '15-60m', points: 1.25 },
          { section: 'A', id: 'backup_battery', name: 'Backup Battery', selectedOption: '1-24h', points: 1.25 },
          { section: 'A', id: 'sim_network', name: 'SIM Network', selectedOption: '4G fallback', points: 1.25 },
          { section: 'A', id: 'connectivity', name: 'Connectivity', selectedOption: '4G', points: 1.0 },
          { section: 'A', id: 'multilingual', name: 'Multilingual', selectedOption: 'English', points: 1.0 },
          { section: 'A', id: 'user_manual', name: 'User Manual', selectedOption: 'English', points: 1.0 },
          { section: 'A', id: 'warranty', name: 'Warranty', selectedOption: '12m', points: 1.0 },
          { section: 'A', id: 'customer_service', name: 'Customer Service', selectedOption: '09-19', points: 1.0 },
          { section: 'A', id: 'os_compatibility', name: 'OS Compatibility', selectedOption: 'Web', points: 1.0 },
          { section: 'A', id: 'trip_report', name: 'Trip Report', selectedOption: 'Coords', points: 1.0 },
          { section: 'A', id: 'data_interval', name: 'Data Interval', selectedOption: '1m', points: 1.0 },
          { section: 'A', id: 'harsh_accel', name: 'Harsh Acceleration', selectedOption: 'Available', points: 1.0 },
          { section: 'A', id: 'harsh_accel_alert', name: 'Harsh Accel Alert', selectedOption: 'System', points: 1.0 },
          { section: 'A', id: 'harsh_braking', name: 'Harsh Braking', selectedOption: 'Available', points: 1.0 },
          { section: 'A', id: 'harsh_braking_alert', name: 'Harsh Braking Alert', selectedOption: 'System', points: 1.0 },
          { section: 'B', id: 'tow_detection', name: 'Tow Detection', selectedOption: 'None (0)', points: 0.0 },
          { section: 'B', id: 'panic_button', name: 'Panic Button', selectedOption: 'Available', points: 1.0 },
          { section: 'B', id: 'mfa', name: 'MFA', selectedOption: 'OTP', points: 1.0 },
          { section: 'B', id: 'sop_tech_problems', name: 'SOP Tech Problems', selectedOption: '3 days', points: 1.0 },
          { section: 'B', id: 'service_records', name: 'Service Records', selectedOption: 'Available', points: 1.0 },
          { section: 'B', id: 'driver_id', name: 'Driver ID', selectedOption: 'None (0)', points: 0.0 },
          { section: 'B', id: 'certification', name: 'Certification', selectedOption: 'SIRIM/CE', points: 1.0 },
          { section: 'B', id: 'immobilizer', name: 'Immobilizer', selectedOption: 'None (0)', points: 0.0 },
          { section: 'B', id: 'tampered_alert', name: 'Tamper Detection & Power Disconnect Alert', selectedOption: 'None (0)', points: 0.0 }
        ],
        status: 'pending_review',
        statusChangedAt: '2026-09-03T04:56:17.982Z',
        evaluationHistory: [],
        createdAt: '2026-09-03T04:56:17.982Z'
      }
    ];
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(sampleData, null, 2), 'utf-8');
  }
}

export function buildMongoIdFilter(id) {
  if (ObjectId.isValid(id)) {
    try {
      return { $or: [{ _id: new ObjectId(id) }, { _id: String(id) }] };
    } catch {
      return { _id: String(id) };
    }
  }
  return { _id: String(id) };
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim().length > 0) {
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb, isMongoAtlas: true };
    }

    const now = Date.now();
    // Circuit breaker: If Atlas failed recently, bypass the 2.5s connection wait
    // and immediately serve via local fallback store with zero latency
    if (now - lastAtlasAttemptTime < ATLAS_RETRY_COOLDOWN_MS) {
      return createFallbackStoreInterface(true);
    }

    lastAtlasAttemptTime = now;

    try {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 3000,
        tls: true
      });
      await client.connect();
      const db = client.db(DB_NAME);
      cachedClient = client;
      cachedDb = db;
      lastAtlasErrorMessage = null;
      isIpWhitelistBlocked = false;
      console.log('Successfully established connection to MongoDB Atlas cluster.');
      return { client, db, isMongoAtlas: true };
    } catch (err) {
      lastAtlasErrorMessage = err.message || String(err);
      const isSslAlert = lastAtlasErrorMessage.includes('SSL alert number 80') ||
                         lastAtlasErrorMessage.includes('tlsv1 alert internal error') ||
                         err.cause?.message?.includes('SSL alert number 80');

      if (isSslAlert) {
        isIpWhitelistBlocked = true;
        if (!hasLoggedNotice) {
          hasLoggedNotice = true;
          console.info(
            '[MongoDB Atlas Notice] Atlas connection rejected during TLS handshake (SSL alert 80). ' +
            'This occurs when the current cloud IP address is not on the Atlas IP Access List. ' +
            'To resolve: In cloud.mongodb.com -> Network Access -> Add IP Address: 0.0.0.0/0 (Allow Access from Anywhere). ' +
            'TrackScore is operating normally using persistent local storage.'
          );
        }
      } else if (!hasLoggedNotice) {
        hasLoggedNotice = true;
        console.warn('MongoDB Atlas connection failed, falling back to local store:', err.message);
      }
    }
  }

  return createFallbackStoreInterface(!!uri);
}

export async function closeDatabaseConnection() {
  if (cachedClient) {
    try {
      await cachedClient.close();
    } catch {
      // ignore
    }
    cachedClient = null;
    cachedDb = null;
  }
}

function createFallbackStoreInterface(hasAtlasUri = false) {
  ensureFallbackStore();
  return {
    isMongoAtlas: false,
    atlasDiagnostic: {
      configured: hasAtlasUri,
      isIpBlocked: isIpWhitelistBlocked,
      lastError: isIpWhitelistBlocked
        ? 'MongoDB Atlas rejected connection (SSL Alert 80: IP Access List). Whitelist 0.0.0.0/0 in Atlas Network Access to connect.'
        : lastAtlasErrorMessage
    },
    async insertEvaluation(doc) {
      ensureFallbackStore();
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      const newDoc = {
        _id: 'eval_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...doc,
        createdAt: doc.createdAt || new Date().toISOString()
      };
      data.unshift(newDoc);
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return { insertedId: newDoc._id };
    },
    async getEvaluationById(id) {
      ensureFallbackStore();
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      return data.find(d => String(d._id) === String(id)) || null;
    },
    async getEvaluations(includeDeleted = false) {
      ensureFallbackStore();
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      const records = includeDeleted ? data : data.filter(d => !d.deletedAt);
      return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async updateEvaluation(id, updateDoc, historyEntry = null) {
      ensureFallbackStore();
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      const idx = data.findIndex(d => String(d._id) === String(id));
      if (idx === -1) {
        return { matchedCount: 0, modifiedCount: 0 };
      }

      const history = Array.isArray(data[idx].evaluationHistory)
        ? [...data[idx].evaluationHistory]
        : [];

      if (historyEntry) {
        history.push(historyEntry);
      }

      data[idx] = {
        ...data[idx],
        ...updateDoc,
        evaluationHistory: history,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return { matchedCount: 1, modifiedCount: 1, updatedDoc: data[idx] };
    },
    async deleteEvaluation(id, deletedBy = 'Manager') {
      ensureFallbackStore();
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      const idx = data.findIndex(d => String(d._id) === String(id));
      if (idx === -1) {
        return { deletedCount: 0, modifiedCount: 0 };
      }
      // Soft-delete: mark deletedAt and deletedBy for full audit trail
      const nowIso = new Date().toISOString();
      data[idx].deletedAt = nowIso;
      data[idx].deletedBy = deletedBy;
      if (!Array.isArray(data[idx].evaluationHistory)) {
        data[idx].evaluationHistory = [];
      }
      data[idx].evaluationHistory.push({
        action: 'soft_deleted',
        timestamp: nowIso,
        deletedBy,
        note: 'Evaluation record archived / soft-deleted for compliance'
      });
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return { deletedCount: 1, modifiedCount: 1, updatedDoc: data[idx] };
    },
    async findDuplicate(companyName, deviceModel, assessorName, assessmentDate, excludeId = null) {
      ensureFallbackStore();
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      const comp = String(companyName || '').trim().toLowerCase();
      const model = String(deviceModel || '').trim().toLowerCase();
      const assessor = String(assessorName || '').trim().toLowerCase();
      const date = String(assessmentDate || '').trim().substring(0, 10);

      return data.find(d => {
        if (d.deletedAt) return false;
        if (excludeId && String(d._id) === String(excludeId)) return false;
        const dComp = String(d.companyName || '').trim().toLowerCase();
        const dModel = String(d.deviceModel || '').trim().toLowerCase();
        const dAssessor = String(d.assessorName || '').trim().toLowerCase();
        const dDate = String(d.assessmentDate || d.createdAt || '').trim().substring(0, 10);
        return dComp === comp && dModel === model && dAssessor === assessor && dDate === date;
      });
    }
  };
}

export default {
  connectToDatabase,
  buildMongoIdFilter,
  DB_NAME,
  COLLECTION_NAME
};
