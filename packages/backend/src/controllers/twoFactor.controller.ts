import { Request, Response, NextFunction } from 'express';
import {
  generateTOTPSecret,
  verifyAndEnableTOTP,
  generateAndSendEmailOTP,
  getTwoFactorStatus,
  disableTwoFactor,
  regenerateBackupCodes,
  TwoFactorError,
} from '@services/twoFactor.service.js';
import { ERROR_CODES } from '@password_manager/shared';

/**
 * @desc Get 2FA status for current user
 * @route GET /api/2fa/status
 * @access Private
*/
export async function getStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' },
      });
      return;
    }

    const status = await getTwoFactorStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc Generate TOTP secret and QR code
 * @route POST /api/2fa/totp/setup
 * @access Private
 */
export async function setupTOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' },
      });
      return;
    }

    const result = await generateTOTPSecret(userId, email);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof TwoFactorError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

/**
 * @desc Verify TOTP code and enable 2FA
 * @route POST /api/2fa/totp/verify
 * @access Private
 */
export async function verifyTOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' },
      });
      return;
    }

    if (!code) {
      res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Code is required' },
      });
      return;
    }

    await verifyAndEnableTOTP(userId, code);

    res.json({
      success: true,
      data: { message: '2FA enabled successfully' },
    });
  } catch (error) {
    if (error instanceof TwoFactorError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

/**
 * @desc Enable email OTP 2FA
 * @route POST /api/2fa/email/enable
 * @access Private
 */
export async function enableEmailOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' },
      });
      return;
    }

    await generateAndSendEmailOTP(userId);

    res.json({
      success: true,
      data: { message: 'Email OTP enabled. Check your email for the code.' },
    });
  } catch (error) {
    if (error instanceof TwoFactorError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

/**
 * @desc Disable 2FA
 * @route POST /api/2fa/disable
 * @access Private
 */
export async function disable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' },
      });
      return;
    }

    await disableTwoFactor(userId);

    res.json({
      success: true,
      data: { message: '2FA disabled successfully' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc Regenerate backup codes
 * @route POST /api/2fa/backup-codes/regenerate
 * @access Private
 */
export async function regenerateCodes(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        const userID= req.user?.id;
        if(!userID){
            res.status(401).json({
                success: false,
                error: {code: ERROR_CODES.UNAUTHORIZED, message: 'Not Authenticated'}
            });
            return;
        }

        const backupCodes= await regenerateBackupCodes(userID);

        res.json({
            success: true,
            data: {backupCodes},
        });
    } catch (error) {
        if(error instanceof TwoFactorError){
            res.status(error.statusCode).json({
                success: false,
                error: {code: error.code, message: error.message},
            });
            return;
        }
        next(error);
    }
}