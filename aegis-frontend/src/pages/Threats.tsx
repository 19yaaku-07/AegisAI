import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { THREATS } from '../lib/threats';
import type { ThreatEntry } from '../types';
import RiskBadge from '../components/RiskBadge';
import PageHeader from '../components/PageHeader';
import FadeIn from '../components/FadeIn';
import { RISK_LEVELS_DESC } from '../lib/risk';
import { DURATION, EASE_IN_OUT } from '../lib/motion.config';

const ALL_CATEGORIES = ['All', ...Array.from(new Set(THREATS.map(t => t.category)))];

function ThreatCard({ threat }: { threat: ThreatEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <button
        className="w-full px-6 py-5 flex items-start sm:items-center gap-4 text-left
                   min-h-[44px]"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls={`threat-body-${threat.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {threat.name}
            </span>
            <RiskBadge level={threat.risk_level} size="sm" />
          </div>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{threat.category}</p>
        </div>
        <span style={{ color: 'var(--color-muted)', flexShrink: 0 }} aria-hidden="true">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`threat-body-${threat.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_IN_OUT }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-6 pb-6 space-y-5 text-sm"
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}
            >
              <p className="leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {threat.description}
              </p>

              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Key Indicators
                </h3>
                <ul className="space-y-1.5" role="list">
                  {threat.indicators.map(ind => (
                    <li key={ind} className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--color-muted)' }}>
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ background: 'var(--color-accent)' }}
                        aria-hidden="true"
                      />
                      {ind}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Real-world Examples
                </h3>
                <ul className="space-y-1.5" role="list">
                  {threat.examples.map(ex => (
                    <li
                      key={ex}
                      className="text-xs px-3 py-2 rounded italic"
                      style={{
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-muted)',
                      }}
                    >
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export default function Threats() {
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return THREATS
      .filter(t => category === 'All' || t.category === category)
      .filter(t => !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
      .sort((a, b) =>
        RISK_LEVELS_DESC.indexOf(a.risk_level) -
        RISK_LEVELS_DESC.indexOf(b.risk_level)
      );
  }, [query, category]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <FadeIn>
        <PageHeader
          eyebrow="// threat library"
          title="Know What to Look For"
          subtitle="A reference guide to the threat types AEGIS-AI detects. Expand any entry for indicators and real-world examples."
        />
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.05}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6" role="search" aria-label="Filter threats">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted)' }}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search threats…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg transition-colors duration-150"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
              aria-label="Search threats by name or description"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 text-sm rounded-lg"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              outline: 'none',
              minHeight: '44px',
            }}
            aria-label="Filter by threat category"
          >
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </FadeIn>

      <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}
         aria-live="polite" aria-atomic="true">
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        {query && ` matching "${query}"`}
      </p>

      {/* Cards */}
      <div className="space-y-3" role="list" aria-label="Threat entries">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-center py-12"
              style={{ color: 'var(--color-muted)' }}
            >
              No threats match your search.
            </motion.p>
          ) : (
            filtered.map((threat, i) => (
              <motion.div
                key={threat.id}
                role="listitem"
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.03, duration: DURATION.fast }}
              >
                <ThreatCard threat={threat} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
