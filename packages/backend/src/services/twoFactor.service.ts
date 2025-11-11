import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { TwoFactorSetting, User } from '@models/index.js';
import { TwoFactorMethod } from '@password_manager/shared';
import { generateRandomToken, timingSafeEqual } from '@utils/crypto.js';
import { emailTemplates, sendEmail } from '@services/email.service.js';

export class TwoFactorError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'TwoFactorError'
    }
}

/**
 * Generate TOTP secret and QR code for setup
 */
export async function generateTOTPSecret(userId: string, email: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = speakeasy.generateSecret({
        name: `Password Manager (${email})`,
        issuer: `Password Manager`,
        length: 32
    });

    if (!secret.otpauth_url) {
        throw new TwoFactorError('GENERATION_ERROR', 'Failed to generate TOTP secret');
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url); //otpauth://hotp/Tenzin:account@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TenzinApp&counter=1

    // Generate backup codes (8 codes)
    const backupCodes = Array.from({ length: 8 }, () => generateRandomToken(4));

    // Store in database (not enabled yet - user must verify first)
    const existingSetting = await TwoFactorSetting.findOne({ where: { userId } });

    if (existingSetting) {
        await existingSetting.update({
            method: TwoFactorMethod.TOTP,
            secret: secret.base32,
            backupCodes: JSON.stringify(backupCodes),
            enabled: false, //Not enabled until verified
        });
    } else {
        await TwoFactorSetting.create({
            userId,
            method: TwoFactorMethod.TOTP,
            secret: secret.base32,
            backupCodes: JSON.stringify(backupCodes),
            enabled: false,
        });
    }

    return {
        secret: secret.base32,
        qrCode,
        backupCodes,
    }
}

/**
 * Verify TOTP code and enable 2FA
*/
export async function verifyAndEnableTOTP(userId: string, code: string): Promise<boolean> {
    const setting = await TwoFactorSetting.findOne({
        where: { userId, method: TwoFactorMethod.TOTP },
    });

    if (!setting || !setting.secret) {
        throw new TwoFactorError('NOT_FOUND', '2FA not set up', 404);
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
        secret: setting.secret,
        encoding: 'base32',
        token: code,
        window: 2, //Allow 2 time steps before and after (60 seconds window)
    });

    if (!verified) {
        throw new TwoFactorError('INVALID_CODE', 'Invalid verification code');
    }

    // Enable 2FA
    await setting.update({ enabled: true });

    return true;
}

/**
 * Verify TOTP code during login
*/
export async function verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    const setting = await TwoFactorSetting.findOne({
        where: { userId, method: TwoFactorMethod.TOTP, enabled: true },
    });

    if (!setting || !setting.secret) {
        return false;
    }

    // Check if it's a backup code
    if (setting.backupCodes) {
        const backCodes = JSON.parse(setting.backupCodes) as string[];
        const backupCodeIndex = backCodes.findIndex((bc) => timingSafeEqual(bc, code));

        if (backupCodeIndex !== -1) {
            // Remove used backup code
            backCodes.splice(backupCodeIndex, 1);
            await setting.update({ backupCodes: JSON.stringify(backCodes) });
            return true;
        }
    }

    // verify TOTP code
    return speakeasy.totp.verify({
        secret: setting.secret,
        encoding: 'base32',
        token: code,
        window: 2,
    });
}

// EMAIL OTP METHODS

/**
 * Generate and send email OTP
 */
export async function generateAndSendEmailOTP(userId: string): Promise<void> {
    const user = await User.findByPk(userId);

    if (!user) {
        throw new TwoFactorError('NOT_FOUND', 'User not found', 404);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with expiry (5 mins)
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    const existingSetting = await TwoFactorSetting.findOne({ where: { userId } });

    if (existingSetting) {
        await existingSetting.update({
            method: TwoFactorMethod.EMAIL,
            secret: JSON.stringify({ code, expiry: expiry.toISOString() }),
            enabled: true,
        });
    } else {
        await TwoFactorSetting.create({
            userId,
            method: TwoFactorMethod.EMAIL,
            secret: JSON.stringify({ code, expiry: expiry.toISOString() }),
            enabled: true,
        });
    }

    // send email
    const emailContent= emailTemplates.twoFactorCode(code);
    await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
    });
}

/**
 * Verify email OTP code
*/
export async function verifyEmailOTP(userId: string, code: string): Promise<boolean>{
    const setting= await TwoFactorSetting.findOne({
        where: {userId, method: TwoFactorMethod.EMAIL, enabled: true},
    });

    if(!setting || !setting.secret){
        return false;
    }

    try {
        const {code: storedCode, expiry}= JSON.parse(setting.secret);

        // Check expiry
        if(new Date(expiry) < new Date()){
            throw new TwoFactorError('EXPIRED', 'Verification code expired');
        }

        // Verify code
        if(!timingSafeEqual(code, storedCode)){
            return false;
        }

        // clear the used code
        await setting.update({secret: null});
        return true;
    } catch (error) {
        return false;
    }
}

// GENERAL 2FA METHODS
/**
 * Get 2FA status for user
*/
export async function getTwoFactorStatus(userId: string){
    const setting= await TwoFactorSetting.findOne({where:{userId}});

    if(!setting){
        return{
            enabled: false,
            method: null,
        };
    }
                             
    return {
        enabled: setting.enabled,
        method: setting.method,
        hasBackupCodes: setting.method === TwoFactorMethod.TOTP && !!setting.backupCodes,
    }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactor(userId: string): Promise<void>{
    const setting= await TwoFactorSetting.findOne({where: {userId}});

    if(setting){
        await setting.destroy();
    }
}

/**
 * Regenerate backup codes
*/
export async function regenerateBackupCodes(userId: string): Promise<string[]>{
    const setting= await TwoFactorSetting.findOne({
        where: {userId, method: TwoFactorMethod.TOTP}
    });

    if(!setting){
        throw new TwoFactorError('NOT_FOUND', '2FA not setup', 404);
    }

    // Generate new backup codes
    const backupCodes= Array.from({length: 8}, ()=>generateRandomToken(4));

    await setting.update({
        backupCodes: JSON.stringify(backupCodes),
    });
    return backupCodes;
}