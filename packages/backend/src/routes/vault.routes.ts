import { Router } from 'express';
import * as vaultController from '@controllers/vault.controller.js';
import { authenticate } from '@middleware/auth.middleware.js';

/**
 * Vault Routes
 * 
 * All routes require authentication
 * Prefix: /api/vault
 */
const router: Router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/vault
 * Get all password entries
 */
router.get('/', vaultController.getPasswordEntries);

/**
 * POST /api/vault
 * Create new password entry
 */
router.post('/', vaultController.createPasswordEntry);

/**
 * GET /api/vault/:id
 * Get specific password entry
 */
router.get('/:id', vaultController.getPasswordEntry);

/**
 * PATCH /api/vault/:id
 * Update password entry
 */
router.patch('/:id', vaultController.updatePasswordEntry);

/**
 * DELETE /api/vault/:id
 * Delete password entry
 */
router.delete('/:id', vaultController.deletePasswordEntry);

/**
 * PATCH /api/vault/:id/favorite
 * Toggle favorite status
 */
router.patch('/:id/favorite', vaultController.toggleFavorite);

export default router;