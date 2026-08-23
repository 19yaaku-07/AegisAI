import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertTriangle, Copy, RotateCcw, FileText } from 'lucide-react';
import { useScanResult } from '../context/ScanResultContext';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import FadeIn from '../components/FadeIn';
import { getRisk } from '../lib/risk';
import { DURATION, EASE_OUT_EXPO } from '../lib/motion.config';

/* ─── Copy-to-clipboard button ──────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  async function copy() {
    try { await navigator.clipboard.writeText(text); } catch { /* silent */ }
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded
                 transition-colors duration-150"
      style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
      aria-label="Copy extracted text to clipboard"
    >
      <Copy size={12} aria-hidden="true" /> Copy
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function Results() {
  const { result, setResult } = useScanResult();
  const navigate = useNavigate();

  // Guard: no result means user landed here directly
  useEffect(() => {
    if (!result) navigate('/scanner', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const risk = getRisk(result.risk_level);

  function handleRescan() {
    setResult(null);
    navigate('/scanner');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Back */}
      <FadeIn>
        <button
          onClick={handleRescan}
          className="inline-flex items-center gap-2 text-xs mb-8 transition-colors duration-150"
          style={{ color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          <ArrowLeft size={14} aria-hidden="true" /> Scan another file
        </button>
      </FadeIn>

      {/* ── Risk header card ──────────────────────────────────────────── */}
      <FadeIn delay={0.04}>
        <motion.div
          className="rounded-2xl p-8 mb-6 text-center relative overflow-hidden"
          style={{ border: `1px solid ${risk.border}` }}
          initial={{ background: 'var(--color-surface)' }}
          animate={{ background: risk.bg }}
          transition={{ duration: DURATION.fast, delay: 0.15, ease: EASE_OUT_EXPO }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${risk.decorativeHex}15 0%, transparent 60%)`,
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-5">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: DURATION.fast, ease: EASE_OUT_EXPO }}
            >
              <RiskGauge level={result.risk_level} size={130} />
            </motion.div>
            <div>
              <RiskBadge level={result.risk_level} size="lg" />
              <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {result.threat_category}
              </p>
            </div>
          </div>
        </motion.div>
      </FadeIn>

      {/* ── Explanation ──────────────────────────────────────────────── */}
      <FadeIn delay={0.1}>
        <section
          className="rounded-xl p-6 mb-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          aria-label="Analysis explanation"
        >
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text)' }}
          >
            <AlertTriangle size={16} style={{ color: risk.hex }} aria-hidden="true" />
            What AEGIS-AI found
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {result.explanation}
          </p>
        </section>
      </FadeIn>

      {/* ── Recommendations ──────────────────────────────────────────── */}
      {result.recommendations?.length > 0 && (
        <FadeIn delay={0.14}>
          <section
            className="rounded-xl p-6 mb-5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            aria-label="Safety recommendations"
          >
            <h2
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}
            >
              <CheckCircle size={16} style={{ color: '#22c55e' }} aria-hidden="true" />
              Recommendations
            </h2>
            <ol className="space-y-3" role="list">
              {result.recommendations.map((rec, i) => (
                <motion.li
                  key={i}
                  className="flex gap-3 text-sm"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + i * 0.05, duration: DURATION.fast, ease: EASE_OUT_EXPO }}
                >
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                               text-xs font-bold mt-0.5"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--color-muted)' }}>{rec}</span>
                </motion.li>
              ))}
            </ol>
          </section>
        </FadeIn>
      )}

      {/* ── Extracted text (collapsible) ─────────────────────────────── */}
      {result.extracted_text && (
        <FadeIn delay={0.18}>
          <details
            className="rounded-xl overflow-hidden mb-6"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <summary
              className="px-6 py-4 text-sm font-medium flex items-center gap-2
                         cursor-pointer select-none list-none min-h-[44px]"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              <FileText size={14} aria-hidden="true" />
              Extracted text
              <span className="ml-auto text-xs" style={{ color: 'var(--color-muted)' }}>
                {result.extracted_text.length.toLocaleString()} chars
              </span>
            </summary>
            <div
              className="px-6 py-5"
              style={{
                background: 'var(--color-surface-2)',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <div className="flex justify-end mb-3">
                <CopyButton text={result.extracted_text} />
              </div>
              <pre
                className="text-xs leading-relaxed whitespace-pre-wrap break-words
                           max-h-60 overflow-y-auto"
                style={{ color: 'var(--color-muted)' }}
              >
                {result.extracted_text}
              </pre>
            </div>
          </details>
        </FadeIn>
      )}

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <FadeIn delay={0.22}>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRescan}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg
                       text-sm font-medium transition-colors duration-150 min-h-[44px]"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.color = 'var(--color-accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-muted)';
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Scan Another File
          </button>
          <Link
            to="/threats"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg
                       text-sm font-medium transition-colors duration-150 min-h-[44px]"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
          >
            Browse Threat Library
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
