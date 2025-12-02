import nodemailer from 'nodemailer';
import { supabaseService } from './supabase.js';
import { decrypt, isEncrypted } from '../utils/crypto.js';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'EmailService' });

/**
 * EmailService - Handles SMTP email sending via Nodemailer
 *
 * Supports:
 * - SMTP configuration from database or environment
 * - Report delivery emails with attachments
 * - Alert notification emails
 * - Connection verification
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.defaultConfig = null;
  }

  /**
   * Initialize transporter from database config or environment
   */
  async initTransporter(smtpConfigId = null) {
    try {
      let config;

      if (smtpConfigId) {
        // Load specific config from database
        config = await supabaseService.getSmtpConfig(smtpConfigId);
      } else {
        // Try to get default config from database
        config = await supabaseService.getDefaultSmtpConfig();
      }

      if (config) {
        this.transporter = this.createTransporter(config);
        this.defaultConfig = config;
      } else if (process.env.SMTP_HOST) {
        // Fall back to environment variables
        this.transporter = this.createTransporterFromEnv();
        this.defaultConfig = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          fromEmail: process.env.SMTP_FROM_EMAIL,
          fromName: process.env.SMTP_FROM_NAME || 'Data Hub Reports',
        };
      }

      return Boolean(this.transporter);
    } catch (error) {
      log.error('Failed to initialize email transporter', { error: error.message });
      return false;
    }
  }

  /**
   * Create transporter from SMTP config object
   */
  createTransporter(smtpConfig) {
    // Decrypt password if it's encrypted (stored in database)
    let authPass = smtpConfig.authPass;
    if (authPass && isEncrypted(authPass)) {
      try {
        authPass = decrypt(authPass);
      } catch (error) {
        log.error('Failed to decrypt SMTP password', { error: error.message });
        throw new Error('Failed to decrypt SMTP password. Check ENCRYPTION_KEY configuration.');
      }
    }

    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port || 587,
      secure: smtpConfig.secure || false,
      auth: smtpConfig.authUser ? {
        user: smtpConfig.authUser,
        pass: authPass,
      } : undefined,
    });
  }

  /**
   * Create transporter from environment variables
   */
  createTransporterFromEnv() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }

  /**
   * Ensure transporter is ready
   */
  async ensureTransporter() {
    if (!this.transporter) {
      const initialized = await this.initTransporter();
      if (!initialized) {
        throw new Error('Email service not configured. Please configure SMTP settings.');
      }
    }
    return this.transporter;
  }

  /**
   * Send generic email
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    await this.ensureTransporter();

    const mailOptions = {
      from: this.defaultConfig?.fromName
        ? `"${this.defaultConfig.fromName}" <${this.defaultConfig.fromEmail}>`
        : this.defaultConfig?.fromEmail || process.env.SMTP_FROM_EMAIL,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      log.error('Failed to send email', { error: error.message });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send report delivery email
   */
  async sendReportEmail({ report, recipients, attachmentPath, attachmentBuffer, format }) {
    const subject = `${report.name} - Data Hub Report`;

    const html = this.generateReportEmailHtml({
      reportName: report.name,
      clientName: report.clientName || 'Your Client',
      generatedAt: new Date().toISOString(),
      format,
      hasAttachment: Boolean(attachmentPath || attachmentBuffer),
    });

    const text = this.generateReportEmailText({
      reportName: report.name,
      generatedAt: new Date().toISOString(),
      format,
    });

    const attachments = [];

    if (attachmentPath || attachmentBuffer) {
      const filename = format === 'csv'
        ? `${report.name.replace(/\s+/g, '_')}.csv`
        : `${report.name.replace(/\s+/g, '_')}.pdf`;

      attachments.push({
        filename,
        ...(attachmentPath ? { path: attachmentPath } : { content: attachmentBuffer }),
        contentType: format === 'csv' ? 'text/csv' : 'application/pdf',
      });
    }

    return this.sendEmail({
      to: recipients,
      subject,
      html,
      text,
      attachments,
    });
  }

  /**
   * Send alert notification email
   */
  async sendAlertEmail({ alert, alertData, recipients }) {
    const subject = `Alert: ${alert.name} - Data Hub`;

    const html = this.generateAlertEmailHtml({
      alertName: alert.name,
      alertType: alert.alertType,
      actualValue: alertData.actualValue,
      thresholdValue: alertData.thresholdValue,
      message: alertData.message,
      triggeredAt: new Date().toISOString(),
    });

    const text = this.generateAlertEmailText({
      alertName: alert.name,
      message: alertData.message,
      triggeredAt: new Date().toISOString(),
    });

    return this.sendEmail({
      to: recipients,
      subject,
      html,
      text,
    });
  }

  /**
   * Generate HTML email for report delivery
   */
  generateReportEmailHtml({ reportName, clientName, generatedAt, format, hasAttachment }) {
    const formattedDate = new Date(generatedAt).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #1a1a2e;
      color: #ffecd6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #3a3a5c;
      border: 2px solid #5a5a7c;
      padding: 0;
    }
    .header {
      background-color: #2d1b4e;
      padding: 20px;
      border-bottom: 2px solid #5a5a7c;
    }
    .header h1 {
      margin: 0;
      color: #ffd700;
      font-size: 18px;
      text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
    }
    .content {
      padding: 20px;
    }
    .content p {
      margin: 0 0 15px;
      line-height: 1.6;
    }
    .info-box {
      background-color: #2d1b4e;
      border: 2px solid #5a5a7c;
      padding: 15px;
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .info-label {
      color: #c4b4a8;
    }
    .info-value {
      color: #ffd700;
    }
    .footer {
      background-color: #2d1b4e;
      padding: 15px 20px;
      border-top: 2px solid #5a5a7c;
      font-size: 12px;
      color: #8b8b8b;
    }
    .attachment-note {
      background-color: #30a46c33;
      border: 2px solid #30a46c;
      padding: 10px 15px;
      margin-top: 15px;
      color: #30a46c;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Data Hub Report</h1>
    </div>
    <div class="content">
      <p>Your scheduled report is ready.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Report:</span>
          <span class="info-value">${reportName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Client:</span>
          <span class="info-value">${clientName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Generated:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Format:</span>
          <span class="info-value">${format.toUpperCase()}</span>
        </div>
      </div>

      ${hasAttachment ? `
      <div class="attachment-note">
        Your ${format.toUpperCase()} report is attached to this email.
      </div>
      ` : ''}
    </div>
    <div class="footer">
      This email was sent automatically by Data Hub.
      To manage your report settings, please log in to Data Hub.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email for report delivery
   */
  generateReportEmailText({ reportName, generatedAt, format }) {
    const formattedDate = new Date(generatedAt).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return `
Data Hub Report

Your scheduled report is ready.

Report: ${reportName}
Generated: ${formattedDate}
Format: ${format.toUpperCase()}

${format !== 'view_only' ? `Your ${format.toUpperCase()} report is attached to this email.` : ''}

---
This email was sent automatically by Data Hub.
To manage your report settings, please log in to Data Hub.
    `.trim();
  }

  /**
   * Generate HTML email for alert notification
   */
  generateAlertEmailHtml({ alertName, alertType, actualValue, thresholdValue, message, triggeredAt }) {
    const formattedDate = new Date(triggeredAt).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const alertTypeLabels = {
      metric_threshold: 'Metric Threshold',
      trend_detection: 'Trend Detection',
      data_freshness: 'Data Freshness',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert: ${alertName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #1a1a2e;
      color: #ffecd6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #3a3a5c;
      border: 2px solid #e23d28;
      padding: 0;
    }
    .header {
      background-color: #e23d2833;
      padding: 20px;
      border-bottom: 2px solid #e23d28;
    }
    .header h1 {
      margin: 0;
      color: #e23d28;
      font-size: 18px;
    }
    .content {
      padding: 20px;
    }
    .content p {
      margin: 0 0 15px;
      line-height: 1.6;
    }
    .alert-box {
      background-color: #2d1b4e;
      border: 2px solid #5a5a7c;
      padding: 15px;
      margin: 15px 0;
    }
    .alert-message {
      font-size: 16px;
      color: #ffd700;
      margin-bottom: 15px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .info-label {
      color: #c4b4a8;
    }
    .info-value {
      color: #ffecd6;
    }
    .footer {
      background-color: #2d1b4e;
      padding: 15px 20px;
      border-top: 2px solid #5a5a7c;
      font-size: 12px;
      color: #8b8b8b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Alert Triggered</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <div class="alert-message">${message}</div>
        <div class="info-row">
          <span class="info-label">Alert:</span>
          <span class="info-value">${alertName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">${alertTypeLabels[alertType] || alertType}</span>
        </div>
        ${actualValue !== undefined ? `
        <div class="info-row">
          <span class="info-label">Actual Value:</span>
          <span class="info-value">${actualValue}</span>
        </div>
        ` : ''}
        ${thresholdValue !== undefined ? `
        <div class="info-row">
          <span class="info-label">Threshold:</span>
          <span class="info-value">${thresholdValue}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Triggered:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      This alert was sent automatically by Data Hub.
      To manage your alert settings, please log in to Data Hub.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email for alert notification
   */
  generateAlertEmailText({ alertName, message, triggeredAt }) {
    const formattedDate = new Date(triggeredAt).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return `
Data Hub Alert

${message}

Alert: ${alertName}
Triggered: ${formattedDate}

---
This alert was sent automatically by Data Hub.
To manage your alert settings, please log in to Data Hub.
    `.trim();
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(smtpConfig = null) {
    try {
      const transporter = smtpConfig
        ? this.createTransporter(smtpConfig)
        : await this.ensureTransporter();

      await transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(testEmail, smtpConfig = null) {
    const transporter = smtpConfig
      ? this.createTransporter(smtpConfig)
      : await this.ensureTransporter();

    const fromEmail = smtpConfig?.fromEmail || this.defaultConfig?.fromEmail || process.env.SMTP_FROM_EMAIL;
    const fromName = smtpConfig?.fromName || this.defaultConfig?.fromName || 'Data Hub';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: testEmail,
      subject: 'Data Hub - Test Email',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #1a1a2e; color: #ffecd6; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background-color: #3a3a5c; border: 2px solid #30a46c; padding: 20px; }
    h1 { color: #30a46c; margin-top: 0; }
    .check { color: #30a46c; font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h1><span class="check">&#10004;</span> Test Email Successful</h1>
    <p>Your SMTP configuration is working correctly.</p>
    <p>Sent at: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`,
      text: `Data Hub - Test Email\n\nYour SMTP configuration is working correctly.\nSent at: ${new Date().toLocaleString()}`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        message: 'Test email sent successfully',
      };
    } catch (error) {
      throw new Error(`Failed to send test email: ${error.message}`);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
