/**
 * Extend Express Request type
 * 
 * Declaration merging allows us to add custom properties
 * to Express types without modifying the library
 */

import { UserPublicData } from "@password_manager/shared";

declare global {
    namespace Express {
        /**
         * Add custom properties to Request interface
        */
        interface Request {
            /**
             * Authenticated user (set by auth middleware)
            */
            user?: UserPublicData;

            /**
           * Rate limit info (set by rate limit middleware)
           */
            rateLimit?: {
                limit: number;
                remaining: number;
                reset: Date;
            };
        }
    }
}