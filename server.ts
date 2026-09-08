/**
 * TrackScore Full-Stack Server
 * Binds to port 3000 and 0.0.0.0
 * Serves static frontend and mounts Netlify Serverless Functions
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Import Netlify function handlers (ESM)
import { handler as saveEvaluationHandler } from './netlify/functions/save-evaluation.js';
import { handler as getEvaluationsHandler } from './netlify/functions/get-evaluations.js';
import { handler as updateEvaluationHandler } from './netlify/functions/update-evaluation.js';
import { handler as deleteEvaluationHandler } from './netlify/functions/delete-evaluation.js';
import { handler as exportEvaluationsHandler } from './netlify/functions/export-evaluations.js';
import { handler as approveEvaluationHandler } from './netlify/functions/approve-evaluation.js';
import { handler as lookupEvaluationHandler } from './netlify/functions/lookup-evaluation.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper to bridge Express requests to Netlify serverless function handlers
async function invokeNetlifyHandler(handler: any, req: Request, res: Response) {
  try {
    const event = {
      httpMethod: req.method,
      path: req.path,
      headers: req.headers,
      queryStringParameters: req.query,
      body: typeof req.body === 'object' ? JSON.stringify(req.body) : req.body,
    };
    const context = {};
    const result = await handler(event, context);

    res.status(result.statusCode || 200);
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value as string);
      }
    }
    return res.send(result.body);
  } catch (error: any) {
    console.error('Serverless execution error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'TrackScore Digital Assessor Evaluation System',
    mongodbConfigured: !!(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0),
    timestamp: new Date().toISOString()
  });
});

// Client configuration endpoint providing active keys for frontend scripts
app.get(['/api/config.js', '/config.js'], (req: Request, res: Response) => {
  res.type('application/javascript');
  const managerKey = process.env.MANAGER_API_KEY || 'trackscore-manager-key-2026';
  const assessorKey = process.env.ASSESSOR_API_KEY || 'trackscore-assessor-key-2026';
  res.send(`window.MANAGER_API_KEY = ${JSON.stringify(managerKey)}; window.ASSESSOR_API_KEY = ${JSON.stringify(assessorKey)}; window.TRACKSCORE_API_KEY = ${JSON.stringify(managerKey)};`);
});

app.get(['/api/config', '/.netlify/functions/config'], (req: Request, res: Response) => {
  res.json({
    managerKey: process.env.MANAGER_API_KEY || 'trackscore-manager-key-2026',
    assessorKey: process.env.ASSESSOR_API_KEY || 'trackscore-assessor-key-2026'
  });
});

// Netlify Functions routing
app.all('/.netlify/functions/save-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(saveEvaluationHandler, req, res);
});

app.all('/.netlify/functions/get-evaluations', (req: Request, res: Response) => {
  return invokeNetlifyHandler(getEvaluationsHandler, req, res);
});

app.all('/.netlify/functions/update-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(updateEvaluationHandler, req, res);
});

app.all('/.netlify/functions/delete-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(deleteEvaluationHandler, req, res);
});

app.all('/.netlify/functions/export-evaluations', (req: Request, res: Response) => {
  return invokeNetlifyHandler(exportEvaluationsHandler, req, res);
});

app.all('/.netlify/functions/approve-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(approveEvaluationHandler, req, res);
});

app.all('/.netlify/functions/lookup-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(lookupEvaluationHandler, req, res);
});

// Aliases for standard API paths
app.all('/api/save-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(saveEvaluationHandler, req, res);
});

app.all('/api/get-evaluations', (req: Request, res: Response) => {
  return invokeNetlifyHandler(getEvaluationsHandler, req, res);
});

app.all('/api/update-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(updateEvaluationHandler, req, res);
});

app.all('/api/delete-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(deleteEvaluationHandler, req, res);
});

app.all('/api/export-evaluations', (req: Request, res: Response) => {
  return invokeNetlifyHandler(exportEvaluationsHandler, req, res);
});

app.all('/api/approve-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(approveEvaluationHandler, req, res);
});

app.all('/api/lookup-evaluation', (req: Request, res: Response) => {
  return invokeNetlifyHandler(lookupEvaluationHandler, req, res);
});

// Static files serving
const isProduction = process.env.NODE_ENV === 'production';
const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

// Specific HTML route shortcuts
app.get('/', (req: Request, res: Response) => {
  const target = isProduction && path.join(distDir, 'index.html');
  res.sendFile(target && path.resolve(target) ? target : path.join(rootDir, 'index.html'));
});

app.get('/dashboard', (req: Request, res: Response) => {
  const target = isProduction && path.join(distDir, 'dashboard.html');
  res.sendFile(target && path.resolve(target) ? target : path.join(rootDir, 'dashboard.html'));
});

app.get('/dashboard.html', (req: Request, res: Response) => {
  const target = isProduction && path.join(distDir, 'dashboard.html');
  res.sendFile(target && path.resolve(target) ? target : path.join(rootDir, 'dashboard.html'));
});

// Serve assets
app.use(express.static(rootDir));
if (isProduction) {
  app.use(express.static(distDir));
}

// Catch-all
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TrackScore server running on http://0.0.0.0:${PORT}`);
});
