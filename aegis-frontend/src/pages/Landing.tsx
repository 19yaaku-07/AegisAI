import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Eye, Brain, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import EyebrowTag from '../components/EyebrowTag';
import FadeIn from '../components/FadeIn';
import RiskGauge from '../components/RiskGauge';
import { useReducedMotion } from '../lib/motion';
import { RISK_LEVELS_ASC, getRisk } from '../lib/risk';
import type { RiskLevel } from '../types';

/* ─── Static SVG grid background ────────────────────────────────────────── */
function GridBg() {
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg width="100%" height="100%" className="absolute inset-0" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="aegis-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#aegis-grid)" />
      </svg>
      <div
        className="absolute"
        style={{
          width: 700, height: 700,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -65%)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

/* ─── Floating threat pills (CSS-only animation) ─────────────────────────  */
const PILL_LABELS = ['AI Threat Scan', 'Risk Intelligence', 'Threat Analysis', 'URL Intelligence', 'OCR Detection'];

function FloatingPills({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <div aria-hidden="true" className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden">
      {PILL_LABELS.map((label, i) => (
        <span
          key={label}
          className="absolute text-xs px-3 py-1.5 rounded-full font-mono animate-float-pill"
          style={{
            left: `${8 + (i % 3) * 29}%`,
            top:  `${18 + Math.floor(i / 3) * 38}%`,
            background: 'rgba(30,35,48,0.9)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
            animationDelay: `${i * 0.9}s`,
            animationDuration: `${4.5 + i * 0.3}s`,
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/* ─── Scroll-hint bar (CSS-only bounce) ─────────────────────────────────── */
function ScrollHint({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-y"
    >
      <div
        className="w-px h-8 mx-auto rounded-full"
        style={{ background: 'var(--color-border)' }}
      />
    </div>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */
function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, reduced ? 1 : 0]);
  const heroY       = useTransform(scrollYProgress, [0, 0.5], [0, reduced ? 0 : -50]);

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      style={{ minHeight: 'calc(100svh - 56px)' }}
      aria-label="Hero"
    >
      <GridBg />
      <FloatingPills reduced={reduced} />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto"
        style={{ opacity: heroOpacity, y: heroY, willChange: 'opacity, transform' }}
      >
        <FadeIn>
          <EyebrowTag label="Powered by IBM Bob AI" className="mb-6" />
        </FadeIn>

        <FadeIn delay={0.07}>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight
                       leading-tight mb-4 text-balance"
            style={{ color: 'var(--color-text)' }}
          >
            Detect{' '}
            <span style={{ color: 'var(--color-accent)' }}>Cyber Threats</span>
            <br className="hidden sm:block" />
            Before They Reach You
          </h1>
        </FadeIn>

        <FadeIn delay={0.13}>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10"
            style={{ color: 'var(--color-muted)' }}
          >
            Drop any file, screenshot, or image. AEGIS-AI extracts text with OCR,
            runs it through IBM Bob's language model, and returns an instant risk
            level — plain English, zero jargon.
          </p>
        </FadeIn>

        <FadeIn delay={0.19}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/scanner"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                         text-sm transition-colors duration-150 min-h-[44px]"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
            >
              Scan a File Free <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                         text-sm transition-colors duration-150 min-h-[44px]"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.color = 'var(--color-accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-muted)';
              }}
            >
              See how it works
            </Link>
          </div>
        </FadeIn>
      </motion.div>

      <ScrollHint reduced={reduced} />
    </section>
  );
}

/* ─── Stats strip ────────────────────────────────────────────────────────── */
const STATS = [
  { value: '< 3s',  label: 'Average scan time'         },
  { value: '5',     label: 'Risk levels detected'       },
  { value: '100%',  label: 'Private — no data stored'   },
  { value: 'IBM',   label: 'Bob-powered intelligence'   },
];

function StatsStrip() {
  return (
    <FadeIn>
      <section
        className="py-10 px-4"
        style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
        aria-label="Key statistics"
      >
        <dl className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <dt className="text-2xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
                {value}
              </dt>
              <dd className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </FadeIn>
  );
}

/* ─── Pipeline teaser ────────────────────────────────────────────────────── */
const PIPELINE_STEPS = [
  { icon: Eye,           title: 'OCR Extraction',  desc: 'Tesseract extracts every character from your file — even low-res images.', color: '#3b82f6', step: '01' },
  { icon: Brain,         title: 'IBM Bob Analysis', desc: "Bob's LLM classifies threat category and intent at the semantic level.",     color: '#8b5cf6', step: '02' },
  { icon: AlertTriangle, title: 'Risk Scoring',     desc: 'A 5-tier risk level is assigned with a plain-language explanation.',         color: '#f59e0b', step: '03' },
];

function PipelineTeaser() {
  return (
    <section className="py-20 px-4" aria-label="How it works overview">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
              Three steps to clarity
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              From raw image to actionable threat intelligence in seconds.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-5">
          <FadeIn stagger={0.05}>
            {PIPELINE_STEPS.map(({ icon: Icon, title, desc, color, step }) => (
              <div
                key={title}
                className="relative rounded-xl p-6"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <span
                  className="absolute top-4 right-4 text-xs font-mono"
                  style={{ color: 'var(--color-muted)', opacity: 0.25 }}
                  aria-hidden="true"
                >{step}</span>
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                  style={{ background: `${color}1a`, color }}
                >
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text)' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>
              </div>
            ))}
          </FadeIn>
        </div>

        <FadeIn delay={0.18}>
          <div className="text-center mt-10">
            <Link
              to="/how-it-works"
              className="text-sm inline-flex items-center gap-1.5 transition-opacity duration-150"
              style={{ color: 'var(--color-accent)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Deep dive into the pipeline <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Risk tier showcase ─────────────────────────────────────────────────── */
function RiskShowcase() {
  return (
    <section
      className="py-20 px-4"
      style={{ background: 'var(--color-surface)' }}
      aria-label="Risk levels explained"
    >
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
              Five-tier risk intelligence
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Every result maps to a clearly defined risk level with colour-coded guidance.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <FadeIn stagger={0.04}>
            {RISK_LEVELS_ASC.map(level => {
              const risk = getRisk(level);
              const descs: Record<RiskLevel, string> = {
                safe:     'No threat indicators.',
                low:      'Minor concerns — verify sender.',
                medium:   'Suspicious signals present.',
                high:     'Clear threat — do not click.',
                critical: 'Active attack — report now.',
              };
              return (
                <div
                  key={level}
                  className="rounded-xl p-5 flex flex-col items-center text-center gap-3"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: `1px solid ${risk.decorativeHex}30`,
                  }}
                >
                  <RiskGauge level={level} size={100} />
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{descs[level]}</p>
                </div>
              );
            })}
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust signals ──────────────────────────────────────────────────────── */
const TRUST = [
  { icon: CheckCircle, title: 'No data retention',      desc: 'Files are processed in-memory and immediately discarded.', color: '#22c55e' },
  { icon: Shield,      title: 'IBM Bob-powered',         desc: "Enterprise language model — not a toy classifier.", color: '#3b82f6' },
  { icon: Eye,         title: 'Explainable results',     desc: 'Every verdict includes a plain-language explanation.', color: '#8b5cf6' },
  { icon: Brain,       title: 'Broad threat coverage',   desc: 'Phishing, BEC, malware links, QR phishing, credential harvesting.', color: '#f59e0b' },
];

function TrustSection() {
  return (
    <section className="py-20 px-4" aria-label="Why trust AEGIS-AI">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12"
              style={{ color: 'var(--color-text)' }}>
            Built to be trusted
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-5">
          <FadeIn stagger={0.06}>
            {TRUST.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="flex gap-4 p-5 rounded-xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}1a`, color }}
                >
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA banner ─────────────────────────────────────────────────────────── */
function CtaBanner() {
  return (
    <FadeIn>
      <section
        className="mx-4 sm:mx-auto max-w-5xl mb-8 rounded-2xl px-8 py-14 text-center
                   relative overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        aria-label="Call to action"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.09) 0%, transparent 70%)' }}
        />
        <h2
          className="text-2xl sm:text-3xl font-bold mb-3 relative z-10"
          style={{ color: 'var(--color-text)' }}
        >
          Ready to scan your first file?
        </h2>
        <p className="text-sm mb-7 relative z-10" style={{ color: 'var(--color-muted)' }}>
          Free, instant, and private. No account required.
        </p>
        <Link
          to="/scanner"
          className="relative z-10 inline-flex items-center gap-2 px-8 py-3 rounded-lg
                     font-semibold text-sm transition-colors duration-150 min-h-[44px]"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
        >
          Launch Scanner <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </FadeIn>
  );
}

/* ─── Page assembly ──────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div>
      <Hero />
      <StatsStrip />
      <PipelineTeaser />
      <RiskShowcase />
      <TrustSection />
      <CtaBanner />
    </div>
  );
}
