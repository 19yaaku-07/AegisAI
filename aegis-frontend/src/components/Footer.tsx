import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const LINKS = [
  { to: '/',             label: 'Home'           },
  { to: '/how-it-works', label: 'How It Works'   },
  { to: '/scanner',      label: 'Live Scanner'   },
  { to: '/threats',      label: 'Threat Library' },
  { to: '/about',        label: 'About'          },
];

export default function Footer() {
  return (
    <footer
      className="mt-24 py-12 px-4"
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Shield size={18} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
            <span className="text-sm font-semibold tracking-wide">
              AEGIS<span style={{ color: 'var(--color-accent)' }}>-AI</span>
            </span>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 list-none m-0 p-0">
              {LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-xs transition-colors duration-150"
                    style={{ color: 'var(--color-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          © {new Date().getFullYear()} AEGIS-AI — Powered by{' '}
          <span style={{ color: 'var(--color-accent)' }}>IBM Bob</span>.{' '}
          For cybersecurity education and awareness.
        </p>
      </div>
    </footer>
  );
}
