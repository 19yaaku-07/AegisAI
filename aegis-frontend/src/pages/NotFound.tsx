import { Link, useLocation } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import FadeIn from '../components/FadeIn';

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <FadeIn>
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
          aria-hidden="true"
        >
          <ShieldOff size={36} />
        </div>

        <p
          className="text-xs font-mono mb-3"
          style={{ color: 'var(--color-muted)' }}
          aria-hidden="true"
        >
          // 404 — not_found
        </p>

        <h1
          className="text-3xl font-bold mb-3"
          style={{ color: 'var(--color-text)' }}
        >
          Page not found
        </h1>

        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: 'var(--color-muted)' }}
        >
          <code
            className="px-1.5 py-0.5 rounded text-xs font-mono"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
          >
            {pathname}
          </code>{' '}
          doesn't exist. Try the scanner or go back home.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                       transition-colors duration-150 min-h-[44px]"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted)'; }}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to Home
          </Link>
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                       transition-colors duration-150 min-h-[44px]"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
          >
            Open Scanner
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
