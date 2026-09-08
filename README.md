# TrackScore Digital Assessor Evaluation System

The **TrackScore Digital Assessor Evaluation System** is a telematics standardization and certification framework developed in alignment with the Malaysian Institute of Road Safety Research (MIROS). It enables authorized assessors to evaluate vehicle telematics systems across 33 strict criteria (Section A: 24 criteria, Section B: 9 criteria), with dynamic score computation, server-side recomputation, cryptographic-grade tamper guards, audit trails, and managerial review dashboards.

---

## Setup & Deployment

### 1. Environment Variables

Create a `.env` file in the root directory (or use `.env.example` as a template):

```env
# MongoDB Atlas connection string (e.g. mongodb+srv://<username>:<password>@cluster.mongodb.net/trackscore?retryWrites=true&w=majority)
MONGODB_URI=""

# Assessor Role Key (used by assessors to submit new evaluations to /save-evaluation)
ASSESSOR_API_KEY="trackscore-assessor-key-2026"

# Manager Role Key (used by managers for dashboard review, editing, soft-deletion, and CSV export)
MANAGER_API_KEY="trackscore-manager-key-2026"

# Host URL
APP_URL="http://localhost:3000"
```

#### MongoDB Atlas Connection String Format
- Ensure your MongoDB Atlas connection string follows the standard SRV format:
  ```
  mongodb+srv://<username>:<password>@<cluster-subdomain>.mongodb.net/trackscore?retryWrites=true&w=majority
  ```
- **IP Access Whitelist**: In [cloud.mongodb.com](https://cloud.mongodb.com) -> **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) or whitelist your specific hosting container IP.
- **Resilient Fallback Storage**: If `MONGODB_URI` is omitted or network access is firewalled, TrackScore seamlessly falls back to persistent local storage (`.data/evaluations.json`), ensuring zero downtime or data loss.

---

### 2. Local Development

You can run TrackScore locally via either `netlify dev` or the Express development server:

#### Option A: Using Netlify CLI
```bash
# Install Netlify CLI globally if needed
npm install -g netlify-cli

# Start Netlify local development server
netlify dev
```
This reads `netlify.toml`, starts local serverless functions at `/.netlify/functions/*`, and maps `/api/*` routes automatically.

#### Option B: Using Full-Stack Development Server
```bash
# Start development server on port 3000
npm run dev
```
Navigate to:
- **Evaluation Form (Assessor)**: `http://localhost:3000/`
- **Managerial Dashboard**: `http://localhost:3000/dashboard`

---

### 3. Automated Testing Suite

Run the unit and integration test suites:
```bash
npm test
```
The test suite utilizes `node:test` (lightweight, zero-setup) and includes:
- **Unit Tests (`tests/scoring-engine.unit.test.js`)**:
  - Section A maximum calculation (33.00 pts)
  - Section B maximum calculation (10.00 pts)
  - Total maximum calculation (43.00 pts)
  - 1-to-5 Star rating thresholds and MIROS grade classifications (A, B, C, D, E)
- **Integration Tests (`tests/save-evaluation.integration.test.js`)**:
  - Valid submission payloads (200 OK)
  - Client-side tampered total score rejection (400 Bad Request)
  - Missing or invalid API key rejection (401 Unauthorized)
  - Duplicate Company + Device + Assessor + Date guard (409 Conflict)
- **Role-Based Access Control Tests (`tests/role-access.unit.test.js`)**:
  - Enforces `ASSESSOR_API_KEY` (403 when calling manager endpoints)
  - Enforces `MANAGER_API_KEY` (403 when calling assessor endpoints)

---

### 4. Role-Based Access Control (RBAC)

The system enforces granular role separation via the `x-api-key` HTTP header:

| Role | Environment Variable | Allowed Endpoints | Unauthorized Response |
| :--- | :--- | :--- | :--- |
| **Assessor** | `ASSESSOR_API_KEY` | `POST /save-evaluation` | 403 Forbidden on management endpoints |
| **Manager** | `MANAGER_API_KEY` | `GET /get-evaluations`, `PUT /update-evaluation`, `DELETE /delete-evaluation`, `GET /export-evaluations` | 403 Forbidden on submission endpoint |

---

### 5. Audit Trail & Soft-Delete

- **Document History**: Every record update via `update-evaluation.js` pushes an audit snapshot `{ editedAt, editedBy, previousScores, previousBreakdown }` to the `evaluationHistory` array on the document.
- **Auditable Soft-Delete**: Deletions via `delete-evaluation.js` mark `deletedAt` and `deletedBy` without dropping the document, preserving full managerial accountability.
- **Filter Support**: `get-evaluations.js` automatically excludes soft-deleted records by default; admins can pass `?includeDeleted=true` to view historical archived records.

---

### 6. Production Build & Deployment

To bundle the application for production:
```bash
npm run build
npm start
```
`npm run build` compiles Vite frontend assets into `dist/` and bundles `server.ts` into `dist/server.cjs` via `esbuild`.
