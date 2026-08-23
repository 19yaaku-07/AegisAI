/**
 * motion.config.ts — plain animation constants (no React imports).
 * Import from any file — hooks, components, lib — safely.
 */

/** Spring-like ease used for entrances */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Standard ease-in-out for interactive transitions */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const DURATION = {
  /** Micro interactions: hover, focus rings */
  micro:    0.15,
  /** Tab switches, error banners */
  fast:     0.20,
  /** FadeIn entrance, accordion expand */
  normal:   0.45,
  /** Risk gauge draw, hero entrance */
  slow:     1.20,
} as const;

export const STAGGER = {
  /** Tight stagger — cards in a row (≤ 5 items) */
  tight:  0.04,
  /** Normal stagger — 3-step pipeline teaser */
  normal: 0.08,
} as const;

/** y-offset (px) for entrance animations */
export const ENTER_Y = 20;
