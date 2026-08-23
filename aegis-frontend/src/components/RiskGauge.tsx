import { motion } from 'framer-motion';
import type { RiskLevel } from '../types';
import { getRisk } from '../lib/risk';
import { useReducedMotion } from '../lib/motion';
import { DURATION, EASE_OUT_EXPO } from '../lib/motion.config';

interface Props {
  level: RiskLevel;
  /** SVG diameter in pixels */
  size?: number;
}

/**
 * Unified risk gauge — SVG circle that draws from 0 to the level's score.
 * Replaces both the old RiskGauge (circle, Results) and RiskMeter (arc, Landing).
 * Single visual metaphor, single component, consistent across all pages.
 *
 * Reduced-motion contract: renders at final value immediately, no draw animation.
 */
export default function RiskGauge({ level, size = 128 }: Props) {
  const risk = getRisk(level);
  const reducedMotion = useReducedMotion();

  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.42;                        // 42% of diameter
  const circumference = 2 * Math.PI * r;
  const finalOffset   = circumference - (risk.score / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`Risk score: ${risk.score} out of 100 — ${risk.label}`}
      style={{ width: size, height: size, color: risk.hex }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Track ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={size * 0.0625}
        />
        {/* Progress arc */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={size * 0.0625}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reducedMotion ? finalOffset : circumference }}
          animate={{ strokeDashoffset: finalOffset }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: DURATION.slow, ease: EASE_OUT_EXPO }
          }
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>
      {/* Score label */}
      <span
        className="absolute font-bold"
        style={{ fontSize: size * 0.18, color: risk.hex }}
        aria-hidden="true"
      >
        {risk.score}
      </span>
    </div>
  );
}
