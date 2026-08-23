/**
 * api.config.ts — single source of truth for all backend configuration.
 * No page, component, or hook should hardcode endpoint paths or constraints.
 */

export const BASE_URL: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export const ENDPOINTS = {
  scan:    '/scan',
  scanUrl: '/scan-url',
} as const;

/** Milliseconds before a scan request times out */
export const TIMEOUT_MS = 30_000;

/** Minimum milliseconds the ScanProgress animation is shown
 *  (prevents flash when backend is very fast) */
export const MIN_PROGRESS_MS = 1_500;

/** File types accepted by the scanner */
export const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

/** Human-readable label for the file picker `accept` attribute */
export const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.webp,.gif,.pdf';

/** Maximum upload size in megabytes */
export const MAX_FILE_MB = 10;
