import { Router } from "express";
import * as authController from '@controllers/auth.controller.js';
import { authenticate } from "@middleware/auth.middleware.js";
import { authLimiter } from "@middleware/rateLimit.middleware.js";

/**
 * Authentication Routes
 * 
 * Prefix: /api/auth
*/
const router: Router= Router();

/**
 * POST /api/auth/register
 * Register new user account
*/
router.post('/register', authLimiter, authController.register);

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post('/login', authLimiter, authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token
*/
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Logout user (clear refresh token)
*/
router.post('/logout', authController.logout);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Protected route - requires authentication
 */
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
