/**
 * motion.ts — React hooks for motion control.
 * Only import from React components/hooks (not from lib/ data files).
 */
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Returns true when the user has requested reduced motion via their OS or
 * browser setting (prefers-reduced-motion: reduce).
 *
 * Use this to:
 *  - Skip y/x translate animations (keep opacity only)
 *  - Hard-stop all perpetual/looping animations
 *  - Degrade pinned scroll sections to normal document flow
 *  - Render RiskGauge at final value with no draw animation
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
