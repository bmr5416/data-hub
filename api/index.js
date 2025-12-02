/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for serverless deployment
 */
import express from 'express';
import cors from 'cors';
import clientsRouter from '../server/routes/clients.js';
import sourcesRouter from '../server/routes/sources.js';
import etlRouter from '../server/routes/etl.js';
import kpisRouter from '../server/routes/kpis.js';
import reportsRouter from '../server/routes/reports.js';
import lineageRouter from '../server/routes/lineage.js';
import notesRouter from '../server/routes/notes.js';
import authRouter from '../server/routes/auth.js';
import { errorHandler } from '../server/middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in serverless (Vercel handles domain restrictions)
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/etl', etlRouter);
app.use('/api/kpis', kpisRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/lineage', lineageRouter);
app.use('/api/notes', notesRouter);

// Error handling
app.use(errorHandler);

// Export for Vercel serverless
export default app;
