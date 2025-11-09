/**
 * Environment Configuration
 */

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  appName: import.meta.env.VITE_APP_NAME || 'Password Manager',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

function validateEnv() {
  if (!config.apiUrl) {
    throw new Error('VITE_API_URL is required');
  }
}

validateEnv();