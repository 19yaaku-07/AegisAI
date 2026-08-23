/**
 * api.ts — ALL fetch calls live here. No page or component calls fetch directly.
 * Responsibilities: transport, timeout, error normalisation.
 * Does NOT touch DOM, state, or animation.
 */
import type { ScanResult } from '../types';
import { BASE_URL, ENDPOINTS, TIMEOUT_MS } from './api.config';

// Valid risk levels — mirrors backend and types.ts
const VALID_RISK_LEVELS = new Set(['safe', 'low', 'medium', 'high', 'critical']);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.error ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Creates an AbortController with an auto-abort timeout.
 * Returns both the controller AND a cancel function so the caller
 * can clear the timer as soon as the fetch completes — preventing
 * the 30-second timer from outliving the request.
 */
function withTimeout(ms: number): { ctrl: AbortController; cancel: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const cancel = () => clearTimeout(timer);
  return { ctrl, cancel };
}

/**
 * Validate the parsed JSON response has the correct shape before returning
 * it to the UI. Throws a user-readable Error on invalid/missing fields.
 */
function validateScanResult(data: unknown): ScanResult {
  if (!data || typeof data !== 'object') {
    throw new Error('The scanner returned an unexpected response. Please try again.');
  }
  const d = data as Record<string, unknown>;
  const risk = typeof d.risk_level === 'string' ? d.risk_level.toLowerCase() : '';
  if (!VALID_RISK_LEVELS.has(risk)) {
    throw new Error(
      `The scanner returned an unrecognised risk level ("${risk}"). Please try again.`
    );
  }
  if (!d.explanation || typeof d.explanation !== 'string') {
    throw new Error('The scanner returned an incomplete result. Please try again.');
  }
  return d as unknown as ScanResult;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Send an image / PDF file for scanning.
 * Throws a user-readable Error on any failure.
 */
export async function scanFile(file: File): Promise<ScanResult> {
  const { ctrl, cancel } = withTimeout(TIMEOUT_MS);
  const form = new FormData();
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch(buildUrl(ENDPOINTS.scan), {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    });
  } catch (err) {
    cancel(); // clear timer even on network error
    if ((err as Error).name === 'AbortError') {
      throw new Error('Scan timed out. Check your connection and try again.');
    }
    throw new Error('Could not reach the scanner. Check your connection.');
  }

  cancel(); // clear the 30-second timer — fetch is done

  if (!res.ok) {
    const msg = await parseError(res, `Server error ${res.status}`);
    throw new Error(msg);
  }

  const data = await res.json();
  return validateScanResult(data);
}

/**
 * Send a URL or pasted text for scanning.
 * Pass { url } for URL mode, or { text } for text/paste mode.
 * Throws a user-readable Error on any failure.
 */
export async function scanText(
  input: string,
  mode: 'url' | 'text' = 'url'
): Promise<ScanResult> {
  const { ctrl, cancel } = withTimeout(TIMEOUT_MS);
  const body = mode === 'url' ? { url: input } : { text: input };

  let res: Response;
  try {
    res = await fetch(buildUrl(ENDPOINTS.scanUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    cancel();
    if ((err as Error).name === 'AbortError') {
      throw new Error('Scan timed out. Check your connection and try again.');
    }
    throw new Error('Could not reach the scanner. Check your connection.');
  }

  cancel();

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('URL/text scanning is not available right now.');
    }
    const msg = await parseError(res, `Server error ${res.status}`);
    throw new Error(msg);
  }

  const data = await res.json();
  return validateScanResult(data);
}
