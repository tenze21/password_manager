import { Router } from "express";
import * as twoFactorController from '@controllers/twoFactor.controller.js';
import {authenticate} from '@middleware/auth.middleware.js';

/**
 * Two-Factor Authentication Routes
 * 
 * All routes require authentication
 * Prefix: /api/2fa
 */

const router: Router= Router();

router.use(authenticate);

/**
 * GET /api/2fa/status
 * Get 2FA status
 */
router.get('/status', twoFactorController.getStatus);

/**
 * POST /api/2fa/totp/setup
 * Setup TOTP (Google Authenticator)
 */
router.post('/totp/setup', twoFactorController.setupTOTP);

/**
 * POST /api/2fa/totp/verify
 * Verify and enable TOTP
 */
router.post('/totp/verify', twoFactorController.verifyTOTP);

/**
 * POST /api/2fa/email/enable
 * Enable email OTP
 */
router.post('/email/enable', twoFactorController.enableEmailOTP);

/**
 * POST /api/2fa/disable
 * Disable 2FA
 */
router.post('/disable', twoFactorController.disable);

/**
 * POST /api/2fa/backup-codes/regenerate
 * Regenerate backup codes
 */
router.post('/backup-codes/regenerate', twoFactorController.regenerateCodes);

export default router;