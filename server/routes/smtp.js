import { Router } from 'express';
import { supabaseService } from '../services/supabase.js';
import { emailService } from '../services/emailService.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateUUID } from '../services/validators.js';

const router = Router();

/**
 * SMTP Configuration Routes
 *
 * Manages SMTP server configurations for email delivery.
 */

// GET /api/smtp - List all SMTP configurations
router.get('/', async (_req, res, next) => {
  try {
    const configs = await supabaseService.getSmtpConfigs();
    // Remove passwords from response
    const safeConfigs = configs.map((config) => ({
      ...config,
      authPass: config.authPass ? '********' : null,
    }));
    res.json({ configs: safeConfigs });
  } catch (error) {
    next(error);
  }
});

// GET /api/smtp/:id - Get single SMTP configuration
router.get('/:id', async (req, res, next) => {
  try {
    const smtpId = validateUUID(req.params.id, 'smtpId');
    const config = await supabaseService.getSmtpConfig(smtpId);
    if (!config) {
      throw new AppError('SMTP configuration not found', 404);
    }
    // Remove password from response
    res.json({
      config: {
        ...config,
        authPass: config.authPass ? '********' : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/smtp - Create SMTP configuration
router.post('/', async (req, res, next) => {
  try {
    const { name, host, port, secure, authUser, authPass, fromEmail, fromName, isDefault } = req.body;

    // Validation
    if (!host?.trim()) {
      throw new AppError('SMTP host is required', 400);
    }
    if (!fromEmail?.trim()) {
      throw new AppError('From email is required', 400);
    }

    const config = await supabaseService.createSmtpConfig({
      name: name || 'Default',
      host,
      port: port || 587,
      secure: secure || false,
      authUser: authUser || null,
      authPass: authPass || null,
      fromEmail,
      fromName: fromName || null,
      isDefault: isDefault || false,
    });

    res.status(201).json({
      config: {
        ...config,
        authPass: config.authPass ? '********' : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/smtp/:id - Update SMTP configuration
router.put('/:id', async (req, res, next) => {
  try {
    const smtpId = validateUUID(req.params.id, 'smtpId');
    const existing = await supabaseService.getSmtpConfig(smtpId);
    if (!existing) {
      throw new AppError('SMTP configuration not found', 404);
    }

    const { name, host, port, secure, authUser, authPass, fromEmail, fromName, isDefault } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (host !== undefined) updateData.host = host;
    if (port !== undefined) updateData.port = port;
    if (secure !== undefined) updateData.secure = secure;
    if (authUser !== undefined) updateData.authUser = authUser;
    if (authPass !== undefined && authPass !== '********') updateData.authPass = authPass;
    if (fromEmail !== undefined) updateData.fromEmail = fromEmail;
    if (fromName !== undefined) updateData.fromName = fromName;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const config = await supabaseService.updateSmtpConfig(smtpId, updateData);

    res.json({
      config: {
        ...config,
        authPass: config.authPass ? '********' : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/smtp/:id - Delete SMTP configuration
router.delete('/:id', async (req, res, next) => {
  try {
    const smtpId = validateUUID(req.params.id, 'smtpId');
    const existing = await supabaseService.getSmtpConfig(smtpId);
    if (!existing) {
      throw new AppError('SMTP configuration not found', 404);
    }

    await supabaseService.deleteSmtpConfig(smtpId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/smtp/:id/verify - Verify SMTP connection
router.post('/:id/verify', async (req, res, next) => {
  try {
    const smtpId = validateUUID(req.params.id, 'smtpId');
    const config = await supabaseService.getSmtpConfig(smtpId);
    if (!config) {
      throw new AppError('SMTP configuration not found', 404);
    }

    const result = await emailService.verifyConnection(config);

    if (result.success) {
      // Update verification status
      await supabaseService.updateSmtpConfig(smtpId, {
        isVerified: true,
        lastVerifiedAt: new Date().toISOString(),
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/smtp/:id/test - Send test email
router.post('/:id/test', async (req, res, next) => {
  try {
    const smtpId = validateUUID(req.params.id, 'smtpId');
    const { testEmail } = req.body;

    if (!testEmail?.trim()) {
      throw new AppError('Test email address is required', 400);
    }

    const config = await supabaseService.getSmtpConfig(smtpId);
    if (!config) {
      throw new AppError('SMTP configuration not found', 404);
    }

    const result = await emailService.sendTestEmail(testEmail, config);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/smtp/verify-env - Verify environment-based SMTP
router.post('/verify-env', async (_req, res, next) => {
  try {
    if (!process.env.SMTP_HOST) {
      throw new AppError('No environment SMTP configuration found', 400);
    }

    const result = await emailService.verifyConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/smtp/test-env - Send test email using environment config
router.post('/test-env', async (req, res, next) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail?.trim()) {
      throw new AppError('Test email address is required', 400);
    }

    if (!process.env.SMTP_HOST) {
      throw new AppError('No environment SMTP configuration found', 400);
    }

    const result = await emailService.sendTestEmail(testEmail);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
