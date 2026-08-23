import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { to: '/',             label: 'Home'           },
  { to: '/how-it-works', label: 'How It Works'   },
  { to: '/scanner',      label: 'Live Scanner'   },
  { to: '/threats',      label: 'Threat Library' },
  { to: '/about',        label: 'About'          },
];

export default function Nav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Close mobile menu on any route change (back/forward, programmatic nav)
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: 'rgba(10,12,16,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <nav
        className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-sm tracking-wide"
          style={{ color: 'var(--color-text)' }}
          aria-label="AEGIS-AI — go to home"
        >
          <Shield size={20} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
          AEGIS<span style={{ color: 'var(--color-accent)' }}>-AI</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className="px-3 py-1.5 rounded text-sm transition-colors duration-150"
                  style={{
                    color:      active ? 'var(--color-accent)' : 'var(--color-muted)',
                    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                    fontWeight: active ? 500 : 400,
                  }}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-text)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-muted)'; }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Scan CTA */}
        <Link
          to="/scanner"
          className="hidden md:inline-flex items-center px-4 py-1.5 rounded text-sm font-medium
                     transition-colors duration-150"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
        >
          Scan Now
        </Link>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          style={{ color: 'var(--color-muted)' }}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded text-sm min-h-[44px] flex items-center"
                style={{
                  color:      active ? 'var(--color-accent)' : 'var(--color-muted)',
                  background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                }}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
