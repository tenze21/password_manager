import { Request, Response, NextFunction } from 'express';
import { PasswordEntry } from '@models/index.js';
import { CreatePasswordEntrySchema, UpdatePasswordEntrySchema } from '@password_manager/shared';
import { ERROR_CODES } from '@password_manager/shared';

/**
 * Vault Controller
 * 
 * Handles CRUD operations for password entries
 * Note: Server only stores ENCRYPTED data, never plain passwords
 */

// ==========================================
// GET ALL PASSWORD ENTRIES
// ==========================================

/**
 * @desc  Get all password entries for authenticated user  
 * @route GET /api/vault
 * @access Private
 */
export async function getPasswordEntries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not authenticated',
        },
      });
      return;
    }

    // Fetch all entries for user
    const entries = await PasswordEntry.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { entries },
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// GET SINGLE PASSWORD ENTRY
// ==========================================

/**
 * @desc Get a specific password entry
 * @route GET /api/vault/:id
 * @access Private
 */
export async function getPasswordEntry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not authenticated',
        },
      });
      return;
    }

    const entry = await PasswordEntry.findOne({
      where: { id, userId },
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Password entry not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// CREATE PASSWORD ENTRY
// ==========================================

/**
 * @desc Create a new password entry
 * @route POST /api/vault
 * @access Private
 */
export async function createPasswordEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not authenticated',
        },
      });
      return;
    }

    // Validate request body
    const validatedData = CreatePasswordEntrySchema.parse(req.body);

    // Create entry
    const entry = await PasswordEntry.create({userId, ...validatedData,});
    res.status(201).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: error,
        },
      });
      return;
    }
    next(error);
  }
}

// ==========================================
// UPDATE PASSWORD ENTRY
// ==========================================

/**
 * @desc Update a password entry
 * @route PATCH /api/vault/:id
 * @access Private
 */
export async function updatePasswordEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'User not authenticated',},
      });
      return;
    }
    // Validate request body
    const validatedData = UpdatePasswordEntrySchema.parse(req.body);
    // Find entry
    const entry = await PasswordEntry.findOne({where: { id, userId },});
    if (!entry) {
      res.status(404).json({
        success: false,
        error: {code: ERROR_CODES.NOT_FOUND, message: 'Password entry not found',},
      });
      return;
    }
    // Update entry
    await entry.update(validatedData);

    res.json({success: true, data: { entry },});
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {code: ERROR_CODES.VALIDATION_ERROR, message: 'Validation failed', details: error,},
      });
      return;
    }
    next(error);
  }
}

// ==========================================
// DELETE PASSWORD ENTRY
// ==========================================

/**
 * @desc Delete a password entry
 * @route DELETE /api/vault/:id
 * @access Private
 */
export async function deletePasswordEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not authenticated',
        },
      });
      return;
    }
    // Find and delete entry
    const entry = await PasswordEntry.findOne({
      where: { id, userId },
    });
    if (!entry) {
      res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Password entry not found',
        },
      });
      return;
    }

    await entry.destroy();

    res.json({
      success: true,
      data: { message: 'Password entry deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// TOGGLE FAVORITE
// ==========================================

/**
 * @desc Toggle favorite status
 * @route PATCH /api/vault/:id/favorite
 * @access Private
 */
export async function toggleFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not authenticated',
        },
      });
      return;
    }

    const entry = await PasswordEntry.findOne({
      where: { id, userId },
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Password entry not found',
        },
      });
      return;
    }

    // Toggle favorite
    await entry.update({ favorite: !entry.favorite });

    res.json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
}