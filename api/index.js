/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for serverless deployment
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Route imports - all 15 routes
import clientsRouter from '../server/routes/clients.js';
import sourcesRouter from '../server/routes/sources.js';
import etlRouter from '../server/routes/etl.js';
import kpisRouter from '../server/routes/kpis.js';
import reportsRouter from '../server/routes/reports.js';
import lineageRouter from '../server/routes/lineage.js';
import notesRouter from '../server/routes/notes.js';
import authRouter from '../server/routes/auth.js';
import platformsRouter from '../server/routes/platforms.js';
import warehousesRouter from '../server/routes/warehouses.js';
import uploadsRouter from '../server/routes/uploads.js';
import smtpRouter from '../server/routes/smtp.js';
import mappingsRouter from '../server/routes/mappings.js';
import alertsRouter from '../server/routes/alerts.js';
import adminRouter from '../server/routes/admin.js';

// Middleware imports
import { errorHandler } from '../server/middleware/errorHandler.js';
import { requireAuth } from '../server/middleware/auth.js';
import { requestIdMiddleware } from '../server/middleware/requestId.js';
import { sanitize } from '../server/middleware/sanitize.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : true,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Security headers via helmet (relaxed for serverless)
app.use(helmet({
  contentSecurityPolicy: false, // Vercel handles this at edge
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json());

// Request ID middleware for tracing
app.use(requestIdMiddleware);

// Input sanitization - XSS protection
app.use('/api', sanitize);

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless'
  });
});

// Routes - Public (no auth required)
app.use('/api/auth', authRouter);

// Routes - Admin only (requires auth + admin role)
app.use('/api/admin', adminRouter);

// Routes - Protected (requires auth)
app.use('/api/clients', requireAuth, clientsRouter);
app.use('/api/sources', requireAuth, sourcesRouter);
app.use('/api/etl', requireAuth, etlRouter);
app.use('/api/kpis', requireAuth, kpisRouter);
app.use('/api/reports', requireAuth, reportsRouter);
app.use('/api/lineage', requireAuth, lineageRouter);
app.use('/api/notes', requireAuth, notesRouter);
app.use('/api/smtp', requireAuth, smtpRouter);

// Routes - Protected (mounted at /api, routes define their own paths)
app.use('/api', requireAuth, platformsRouter);
app.use('/api', requireAuth, warehousesRouter);
app.use('/api', requireAuth, uploadsRouter);
app.use('/api', requireAuth, mappingsRouter);
app.use('/api', requireAuth, alertsRouter);

// Error handling
app.use(errorHandler);

// Export for Vercel serverless
export default app;
