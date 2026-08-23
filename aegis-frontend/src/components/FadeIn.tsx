import { motion, useInView } from 'framer-motion';
import { useRef, Children } from 'react';
import { useReducedMotion } from '../lib/motion';
import { DURATION, EASE_OUT_EXPO, ENTER_Y } from '../lib/motion.config';

interface Props {
  children: React.ReactNode;
  delay?: number;
  /** When > 0, wraps direct children in staggered entrances */
  stagger?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Fade-in on viewport entry (once).
 * Reduced-motion contract: opacity 0→1 only — no y-translate.
 * stagger prop: when set, applies progressive delay to each direct child.
 */
export default function FadeIn({ children, delay = 0, stagger = 0, className, style }: Props) {
  const ref  = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  // Non-stagger path (most common)
  if (!stagger) {
    return (
      <motion.div
        ref={ref}
        className={className}
        style={style}
        initial={{ opacity: 0, y: reduced ? 0 : ENTER_Y }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : ENTER_Y }}
        transition={{ duration: DURATION.normal, delay, ease: EASE_OUT_EXPO }}
      >
        {children}
      </motion.div>
    );
  }

  // Stagger path — wrap each child in its own motion.div
  const childArray = Children.toArray(children);
  return (
    <div ref={ref} className={className} style={style}>
      {childArray.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: reduced ? 0 : ENTER_Y }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : ENTER_Y }}
          transition={{ duration: DURATION.normal, delay: delay + i * stagger, ease: EASE_OUT_EXPO }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
