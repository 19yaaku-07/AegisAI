import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Upload, ScanLine, Cpu, BarChart2, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import MockBlock from '../components/MockBlock';
import FadeIn from '../components/FadeIn';
import { useReducedMotion } from '../lib/motion';
import { DURATION, EASE_OUT_EXPO } from '../lib/motion.config';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Step {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  body: React.ReactNode;
}

/* ─── Step data ──────────────────────────────────────────────────────────── */
const STEPS: Step[] = [
  {
    icon: <Upload size={28} />,
    title: 'File Upload & Preprocessing',
    subtitle: '// step_01 — intake',
    accent: '#3b82f6',
    body: (
      <>
        <p>Drop a file — a screenshot, PDF, photo of a letter, or any image containing text.</p>
        <p>The frontend validates format and size client-side before transmission over HTTPS.</p>
        <MockBlock lines={[
          { text: 'POST /api/scan  multipart/form-data' },
          { text: '├─ file: screenshot.png  (1.2 MB)', indent: 1, color: '#3b82f6' },
          { text: '└─ Content-Type: image/png', indent: 1 },
        ]} />
      </>
    ),
  },
  {
    icon: <ScanLine size={28} />,
    title: 'OCR Text Extraction',
    subtitle: '// step_02 — perception',
    accent: '#8b5cf6',
    body: (
      <>
        <p>The backend applies Optical Character Recognition to extract every readable character — even from low-resolution or tilted images.</p>
        <p>Raw text is then normalised: encoding fixed, whitespace collapsed, non-printables stripped.</p>
        <MockBlock lines={[
          { text: 'extracted_text:', color: '#8b5cf6' },
          { text: '"URGENT: Your account will be suspended.', indent: 1 },
          { text: ' Click here to verify: http://…"', indent: 1 },
        ]} />
      </>
    ),
  },
  {
    icon: <Cpu size={28} />,
    title: 'IBM Bob LLM Analysis',
    subtitle: '// step_03 — intelligence',
    accent: '#a855f7',
    body: (
      <>
        <p>The extracted text is passed to <strong style={{ color: 'var(--color-text)' }}>IBM Bob</strong> — an enterprise-grade language model.</p>
        <p>Bob understands intent, tone, urgency, and contextual red flags at the semantic level — not just keyword matching.</p>
        <MockBlock lines={[
          { text: 'ibm_bob.analyze({', color: '#a855f7' },
          { text: 'text: extracted_text,', indent: 1 },
          { text: 'task: "cybersecurity_threat_classification"', indent: 1 },
          { text: '}) → { category, risk_level, explanation }', color: '#a855f7' },
        ]} />
      </>
    ),
  },
  {
    icon: <BarChart2 size={28} />,
    title: 'Risk Scoring & Report',
    subtitle: '// step_04 — output',
    accent: '#f59e0b',
    body: (
      <>
        <p>IBM Bob's classification maps to one of five risk levels: <strong style={{ color: '#22c55e' }}>Safe</strong>, <strong style={{ color: '#84cc16' }}>Low</strong>, <strong style={{ color: '#f59e0b' }}>Medium</strong>, <strong style={{ color: '#ef4444' }}>High</strong>, or <strong style={{ color: '#f87171' }}>Critical</strong>.</p>
        <p>The result includes the threat category, a plain-language explanation, and concrete safety recommendations.</p>
        <MockBlock lines={[
          { text: '{', color: '#f59e0b' },
          { text: 'risk_level: "high",', indent: 1, color: '#ef4444' },
          { text: 'threat_category: "Phishing",', indent: 1 },
          { text: 'explanation: "…",', indent: 1 },
          { text: 'recommendations: […]', indent: 1 },
          { text: '}', color: '#f59e0b' },
        ]} />
      </>
    ),
  },
];

/* ─── Single pipeline step with scroll-linked animation ─────────────────── */
function PipelineStep({ step, index, total }: { step: Step; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Fix: gate scroll listener to desktop only.
  // On mobile, iOS viewport resize during scroll causes ResizeObserver to fire
  // getBoundingClientRect() in the scroll handler → forced layout → stutter.
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const { scrollYProgress } = useScroll({
    // On mobile, pass no target → scrollYProgress will be a no-op MotionValue
    target: (reduced || isMobile) ? undefined : ref,
    offset: ['start 0.85', 'end 0.15'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 1]);
  const x       = useTransform(scrollYProgress, [0, 0.25], [(reduced || isMobile) ? 0 : -28, 0]);

  return (
    <div
      ref={ref}
      className="flex items-center py-16 px-4 sm:px-6"
      // Fix: use svh (small viewport height) — stable under iOS address-bar resize
      style={{ minHeight: '65svh' }}
    >
      <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-10 items-center">
        {/* Visual card — animated; will-change promotes to compositor thread */}
        <motion.div
          style={{ opacity, x, willChange: 'opacity, transform' }}
          className="order-2 md:order-1"
        >
          <div
            className="rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
            style={{
              background: 'var(--color-surface)',
              border: `1px solid ${step.accent}30`,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `${step.accent}15`, color: step.accent }}
            >
              {step.icon}
            </div>
            <span
              className="text-xs font-mono px-2.5 py-1 rounded"
              style={{ background: `${step.accent}12`, color: step.accent }}
            >
              Step {index + 1} / {total}
            </span>
          </div>
        </motion.div>

        {/* Text — fade only */}
        <motion.div style={{ opacity }} className="order-1 md:order-2">
          <p className="text-xs font-mono mb-3" style={{ color: step.accent }}>
            {step.subtitle}
          </p>
          <h2
            className="text-xl sm:text-2xl font-bold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            {step.title}
          </h2>
          <div
            className="text-sm leading-relaxed space-y-3"
            style={{ color: 'var(--color-muted)' }}
          >
            {step.body}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Animated connector between steps ──────────────────────────────────── */
function FlowConnector({ accent }: { accent: string }) {
  return (
    <div className="flex justify-center py-2" aria-hidden="true">
      <motion.div
        className="w-px rounded-full"
        style={{ background: accent, height: 40, opacity: 0.35 }}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: DURATION.normal, ease: EASE_OUT_EXPO }}
      />
    </div>
  );
}

/* ─── Progress tracker bar at top ───────────────────────────────────────── */
function StepTracker() {
  return (
    <FadeIn>
      <section className="py-10 px-4" aria-label="Pipeline steps overview">
        <div className="max-w-4xl mx-auto flex items-start">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex-1 flex flex-col items-center gap-2 relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center
                           text-xs font-bold shrink-0 z-10"
                style={{
                  background: `${s.accent}20`,
                  color: s.accent,
                  border: `1px solid ${s.accent}50`,
                }}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="absolute top-4 left-1/2 w-full h-px"
                  style={{ background: 'var(--color-border)' }}
                  aria-hidden="true"
                />
              )}
              <p
                className="text-xs text-center px-1 hidden sm:block"
                style={{ color: 'var(--color-muted)' }}
              >
                {s.title.split(' ').slice(0, 2).join(' ')}
              </p>
            </div>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function HowItWorks() {
  return (
    <div>
      {/* Header */}
      <section
        className="px-4 py-20 text-center"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <FadeIn>
          <PageHeader
            eyebrow="// pipeline overview"
            title="From pixel to threat intelligence"
            subtitle="Every scan follows a four-step pipeline. Scroll through to understand exactly what AEGIS-AI does with your file — and why you can trust the result."
          />
        </FadeIn>
      </section>

      <StepTracker />

      {/* Scroll-animated pipeline steps */}
      <div>
        {STEPS.map((step, i) => (
          <div key={step.title}>
            <PipelineStep step={step} index={i} total={STEPS.length} />
            {i < STEPS.length - 1 && (
              <FlowConnector accent={step.accent} />
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <FadeIn>
        <section
          className="py-20 px-4 text-center"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            See it in action
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
            Upload a suspicious screenshot or message — get a result in seconds.
          </p>
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                       text-sm transition-colors duration-150"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
          >
            Open Live Scanner <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </FadeIn>
    </div>
  );
}
