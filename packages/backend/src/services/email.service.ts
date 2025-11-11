import nodemailer from 'nodemailer';
import { config } from '@config/env.js';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.email.user,
        pass: config.email.password
    },
    tls: {
        // Don't fail on invalid certs (for development)
        rejectUnauthorized: false,
    }
});

export async function sendEmail(options: EmailOptions): Promise<void> {
    try {
        // In development without email config, log to console
        if (config.env === 'development' && (!config.email.user || !config.email.password)) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 EMAIL (Development Mode - No Config)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            // Extract code from HTML
            const codeMatch = options.html.match(/\d{6}/);
            if (codeMatch) {
                console.log('🔑 VERIFICATION CODE:', codeMatch[0]);
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            return;
        }

        const info = await transporter.sendMail({
            from: config.email.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        })

        console.log(`Email sent to ${options.to} (Message ID: ${info.messageId})`);
    } catch (error) {
        console.error("Failed to send email: ", error);

        // In production, you might want to use a fallback or alert admins
        if (config.env === 'production') {
            // Log to monitoring service (Sentry, etc.)
        }

        // Don't throw - email failures shouldn't break the app

    }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    // Skip verification if no email config in development
    if (config.env === 'development' && (!config.email.user || !config.email.password)) {
      console.log('Email: Development mode (console logging only)');
      return true;
    }

    await transporter.verify();
    console.log('Email configuration verified (Gmail)');
    return true;
  } catch (error) {
    console.error('Email configuration invalid:', error);
    console.log('\nEmail not configured. To enable email:');
    console.log('   1. Generate Gmail App Password: https://myaccount.google.com/apppasswords');
    console.log('   2. Update EMAIL_USER and EMAIL_PASSWORD in .env.development\n');
    return false;
  }
}

/**
 * Email templates
 */
export const emailTemplates = {
  /**
   * 2FA verification code email
   */
  twoFactorCode: (code: string) => ({
    subject: 'Your Login Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 40px 30px; }
          .code-box { background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #495057; font-family: 'Courier New', monospace; }
          .info { color: #6c757d; font-size: 14px; line-height: 1.6; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Login Verification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested a login verification code for your Password Manager account.</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p class="info">
              This code will expire in <strong>5 minutes</strong>.<br>
              Enter this code to complete your login.
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you didn't request this code, someone may be trying to access your account. Please secure your account immediately.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from Password Manager.</p>
            <p>© ${new Date().getFullYear()} Password Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your Password Manager verification code: ${code}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.
    `,
  }),

  /**
   * Welcome email
   */
  welcome: (email: string) => ({
    subject: 'Welcome to Password Manager! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .feature { padding: 15px; margin: 15px 0; border-left: 3px solid #667eea; }
          .feature-icon { font-size: 24px; margin-right: 10px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Password Manager!</h1>
          </div>
          <div class="content">
            <p>Hello ${email},</p>
            <p>Your account has been successfully created! You're now ready to start securing your passwords with military-grade encryption.</p>
            
            <h3 style="color: #495057; margin-top: 30px;">What you can do:</h3>
            
            <div class="feature">
              <span class="feature-icon">🔐</span>
              <strong>Store unlimited passwords</strong> with zero-knowledge encryption
            </div>
            
            <div class="feature">
              <span class="feature-icon">🎲</span>
              <strong>Generate strong passwords</strong> with our secure password generator
            </div>
            
            <div class="feature">
              <span class="feature-icon">⭐</span>
              <strong>Organize with folders</strong> and mark favorites for quick access
            </div>
            
            <div class="feature">
              <span class="feature-icon">🛡️</span>
              <strong>Enable 2FA</strong> for an extra layer of security
            </div>
            
            <p style="margin-top: 30px;">
              <strong>Remember:</strong> Your master password is the only key to your vault. We cannot recover it if lost, so keep it safe!
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Password Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Password Manager!

Your account ${email} has been successfully created.

Start securing your passwords today with zero-knowledge encryption.

Remember: Keep your master password safe - we cannot recover it if lost.
    `,
  }),
};