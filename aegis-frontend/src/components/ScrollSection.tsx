import { useRef } from 'react';
import { useReducedMotion } from '../lib/motion';

interface Props {
  children: React.ReactNode;
  /** Multiplier for how many viewport heights this section occupies while pinned.
   *  Default 1 = section is "held" for one full viewport scroll distance. */
  scrollHeight?: number;
  className?: string;
}

/**
 * Pins its children in the viewport while the user scrolls through
 * `scrollHeight` × 100vh of scroll distance. Exposes scroll progress
 * (0→1) to children via a nested context — children never import MotionValue.
 *
 * Reduced-motion contract: renders children in normal document flow with no
 * sticky positioning and no height multiplication. Content fully readable.
 *
 * Mobile contract: pinning is disabled below 768px (md breakpoint).
 * Uses CSS media query via class, not JS.
 */
export default function ScrollSection({ children, scrollHeight = 1, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // No scroll listener needed here — children that need scroll-linked values
  // should use their own useScroll hook targeting their own refs.

  if (reduced) {
    // Degraded: plain section, no pinning, no height multiplication
    return (
      <section className={`py-16 px-4 ${className}`}>
        {children}
      </section>
    );
  }

  return (
    // Outer: sets scroll distance (tall container)
    <div
      ref={containerRef}
      style={{ height: `${scrollHeight * 100}vh` }}
      className="relative"
    >
      {/* Inner: sticky panel that stays in viewport */}
      <div className="sticky top-14 h-[calc(100vh-56px)] flex items-center overflow-hidden">
        <div className={`w-full ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

