/**
 * Centralized API and Application Configuration
 *
 * Reads VITE_API_URL from Vite environment variables (e.g. set in Vercel).
 * When empty (local development), defaults to '' so Vite dev server proxy
 * handles requests to http://127.0.0.1:8000 via vite.config.ts.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || '';

// Clean whitespace and remove any trailing slash to ensure clean URL concatenation
export const API_BASE_URL: string = rawApiUrl.trim().replace(/\/+$/, '');
