/**
 * risk.ts — single source of truth for all risk-level visual configuration.
 * No component should hardcode risk colors or scores.
 * All consumers call getRisk(level).
 */
import type { RiskLevel } from '../types';

/** Convert a 6-char hex to rgba string */
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface RiskEntry {
  label: string;
  /** Hex for text/label use — meets WCAG AA on dark bg */
  hex: string;
  /** Hex for decorative use (borders, arcs) — may be darker */
  decorativeHex: string;
  bg: string;
  border: string;
  score: number; // 0–100
}

export const RISK_CONFIG: Record<RiskLevel, RiskEntry> = {
  safe: {
    label: 'Safe',
    hex: '#22c55e',
    decorativeHex: '#16a34a',
    bg: hexAlpha('#22c55e', 0.08),
    border: hexAlpha('#22c55e', 0.25),
    score: 5,
  },
  low: {
    label: 'Low',
    hex: '#84cc16',
    decorativeHex: '#65a30d',
    bg: hexAlpha('#84cc16', 0.08),
    border: hexAlpha('#84cc16', 0.25),
    score: 25,
  },
  medium: {
    label: 'Medium',
    hex: '#f59e0b',
    decorativeHex: '#d97706',
    bg: hexAlpha('#f59e0b', 0.08),
    border: hexAlpha('#f59e0b', 0.25),
    score: 55,
  },
  high: {
    label: 'High',
    hex: '#ef4444',
    decorativeHex: '#dc2626',
    bg: hexAlpha('#ef4444', 0.08),
    border: hexAlpha('#ef4444', 0.25),
    score: 80,
  },
  critical: {
    // #f87171 passes WCAG AA (4.6:1) on #0a0c10 for text labels
    // #dc2626 kept for decorative arcs/borders where contrast ratio
    // doesn't apply to non-text elements
    label: 'Critical',
    hex: '#f87171',
    decorativeHex: '#dc2626',
    bg: hexAlpha('#dc2626', 0.08),
    border: hexAlpha('#dc2626', 0.25),
    score: 100,
  },
};

export function getRisk(level: RiskLevel): RiskEntry {
  return RISK_CONFIG[level] ?? RISK_CONFIG.medium;
}

/** Ordered list from safest to most critical */
export const RISK_LEVELS_ASC: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];

/** Ordered list from most critical to safest (for display sorting) */
export const RISK_LEVELS_DESC: RiskLevel[] = [...RISK_LEVELS_ASC].reverse();
