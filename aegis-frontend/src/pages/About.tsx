import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Cpu, Users, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FadeIn from '../components/FadeIn';

const PRINCIPLES = [
  { icon: Lock,   title: 'Privacy by default',      desc: 'Files are processed in-memory and immediately discarded. Nothing is stored, logged, or shared.', color: '#22c55e' },
  { icon: Shield, title: 'IBM Bob-powered',          desc: "Backed by IBM's enterprise language model — not a toy classifier.", color: '#3b82f6' },
  { icon: Cpu,    title: 'Explainable results',      desc: 'Every verdict includes a plain-language explanation. No black-box outputs.', color: '#8b5cf6' },
  { icon: Users,  title: 'Built for everyone',       desc: 'No security knowledge required. Results are plain English with clear next steps.', color: '#f59e0b' },
];

const STACK = [
  { label: 'LLM Engine', value: 'IBM Bob',         desc: 'Enterprise language model for threat classification' },
  { label: 'OCR',        value: 'Tesseract / PIL', desc: 'Pixel-to-text extraction from any image format' },
  { label: 'Backend',    value: 'Python / Flask',  desc: 'Lightweight REST API, no data persistence' },
  { label: 'Frontend',   value: 'React + Vite',    desc: 'Fast, accessibility-first UI' },
  { label: 'Animations', value: 'Framer Motion',   desc: 'Smooth, motion-safe scroll animations' },
];

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <FadeIn>
        <PageHeader
          eyebrow="// about"
          title="Cybersecurity awareness, powered by AI"
          subtitle="AEGIS-AI bridges the gap between sophisticated cyber threats and everyday users who lack tools to identify them. Powered by IBM Bob's enterprise language model."
        />
      </FadeIn>

      {/* Mission quote */}
      <FadeIn delay={0.05}>
        <div
          className="rounded-xl p-8 mb-12 text-center relative overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(59,130,246,0.07) 0%, transparent 60%)' }}
          />
          <blockquote
            className="relative text-base sm:text-lg font-medium leading-relaxed"
            style={{ color: 'var(--color-text)' }}
          >
            "Cyber threats don't discriminate by technical knowledge.{' '}
            <span style={{ color: 'var(--color-accent)' }}>
              AEGIS-AI gives everyone the same defensive edge.
            </span>"
          </blockquote>
        </div>
      </FadeIn>

      {/* Principles */}
      <FadeIn delay={0.08}>
        <section className="mb-12" aria-label="Design principles">
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--color-text)' }}>
            Principles
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PRINCIPLES.map(({ icon: Icon, title, desc, color }, i) => (
              <FadeIn key={title} delay={0.04 + i * 0.04}>
                <div
                  className="flex gap-4 p-5 rounded-xl h-full"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}20`, color }}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Tech stack */}
      <FadeIn delay={0.1}>
        <section className="mb-12" aria-label="Technology stack">
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--color-text)' }}>
            Technology stack
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            {STACK.map(({ label, value, desc }, i) => (
              <div
                key={label}
                className="flex items-start sm:items-center justify-between gap-4 px-6 py-4"
                style={{
                  borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                  background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)',
                }}
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-0.5"
                     style={{ color: 'var(--color-text)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                </div>
                <span
                  className="text-xs font-mono px-2.5 py-1 rounded shrink-0"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    color: 'var(--color-accent)',
                    border: '1px solid rgba(59,130,246,0.2)',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Disclaimer */}
      <FadeIn delay={0.12}>
        <div
          className="rounded-xl px-6 py-5 mb-10 text-xs leading-relaxed"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
          role="note"
        >
          <strong style={{ color: 'var(--color-text)' }}>Disclaimer: </strong>
          AEGIS-AI is an educational and awareness tool. Results are AI-generated and should be
          treated as guidance, not definitive legal or forensic analysis. For confirmed security
          incidents, contact your organisation's security team or a qualified professional.
        </div>
      </FadeIn>

      <FadeIn delay={0.14}>
        <div className="text-center">
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm
                       transition-colors duration-150"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
          >
            Try AEGIS-AI <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
