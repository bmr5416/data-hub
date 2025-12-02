import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import clientsRouter from './routes/clients.js';
import sourcesRouter from './routes/sources.js';
import etlRouter from './routes/etl.js';
import kpisRouter from './routes/kpis.js';
import reportsRouter from './routes/reports.js';
import lineageRouter from './routes/lineage.js';
import notesRouter from './routes/notes.js';
import authRouter from './routes/auth.js';
import platformsRouter from './routes/platforms.js';
import warehousesRouter from './routes/warehouses.js';
import uploadsRouter from './routes/uploads.js';
import smtpRouter from './routes/smtp.js';
import mappingsRouter from './routes/mappings.js';
import alertsRouter from './routes/alerts.js';
import adminRouter from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { requestIdMiddleware, requestLoggingMiddleware } from './middleware/requestId.js';
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { standardTimeout } from './middleware/timeout.js';
import { sanitize } from './middleware/sanitize.js';
import { schedulerService } from './services/schedulerService.js';
import logger from './utils/logger.js';

dotenv.config({ path: '../.env' });

// Validate required environment variables at startup
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  logger.error('Server cannot start without Supabase authentication configured.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Security headers via helmet
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false, // Disable CSP in development for easier debugging
  crossOriginEmbedderPolicy: false, // Disable for compatibility with external resources
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin requests from frontend
}));

app.use(express.json());

// Request ID and logging middleware
app.use(requestIdMiddleware);
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLoggingMiddleware);
}

// Protection middleware (applied to all /api routes)
// Rate limiting - applied per-route below for granular control
// Timeout - standard 30s for most routes
app.use('/api', standardTimeout);

// Input sanitization - XSS protection on API inputs
app.use('/api', sanitize);

// Health check (no rate limiting or auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes - Public (auth-specific rate limiting)
app.use('/api/auth', authLimiter, authRouter);

// Routes - Admin only (requires auth + admin, standard rate limiting)
app.use('/api/admin', apiLimiter, adminRouter);

// Routes - Protected (requires auth, standard rate limiting)
app.use('/api/clients', apiLimiter, requireAuth, clientsRouter);
app.use('/api/sources', apiLimiter, requireAuth, sourcesRouter);
app.use('/api/etl', apiLimiter, requireAuth, etlRouter);
app.use('/api/kpis', apiLimiter, requireAuth, kpisRouter);
app.use('/api/reports', apiLimiter, requireAuth, reportsRouter);
app.use('/api/lineage', apiLimiter, requireAuth, lineageRouter);
app.use('/api/notes', apiLimiter, requireAuth, notesRouter);
app.use('/api/smtp', apiLimiter, requireAuth, smtpRouter);

// Routes - Protected (mounted at /api, routes define their own paths)
app.use('/api', apiLimiter, requireAuth, platformsRouter);
app.use('/api', apiLimiter, requireAuth, warehousesRouter);
app.use('/api', uploadLimiter, requireAuth, uploadsRouter); // Stricter limit for uploads
app.use('/api', apiLimiter, requireAuth, mappingsRouter);
app.use('/api', apiLimiter, requireAuth, alertsRouter);

// Error handling
app.use(errorHandler);

// Server instance (set in startServer)
let server;

/**
 * Start server with proper initialization order
 * Scheduler is initialized BEFORE server starts accepting requests
 */
async function startServer() {
  // Initialize scheduler first (if enabled)
  if (process.env.SCHEDULER_ENABLED !== 'false') {
    try {
      await schedulerService.init();
      logger.info('Scheduler service initialized', { component: 'Server' });
    } catch (error) {
      logger.error('Failed to initialize scheduler', { component: 'Server', error: error.message });
      // Continue starting server even if scheduler fails
    }
  }

  // Now start the HTTP server
  server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`, { component: 'Server', port: PORT });
  });
}

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start', { component: 'Server', error: error.message });
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`, { component: 'Server' });

  // Shutdown scheduler
  try {
    await schedulerService.shutdown();
  } catch (error) {
    logger.error('Error shutting down scheduler', { component: 'Server', error: error.message });
  }

  server.close(() => {
    logger.info('HTTP server closed', { component: 'Server' });
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout', { component: 'Server' });
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
