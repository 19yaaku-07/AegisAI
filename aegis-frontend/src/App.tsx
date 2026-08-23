import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Landing from './pages/Landing'; // eagerly loaded — first paint
import { ScanResultContext } from './context/ScanResultContext';
import type { ScanResult } from './types';

// Lazy-load all routes except Landing — save ~40–80ms parse time on first visit
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Scanner    = lazy(() => import('./pages/Scanner'));
const Results    = lazy(() => import('./pages/Results'));
const Threats    = lazy(() => import('./pages/Threats'));
const About      = lazy(() => import('./pages/About'));
const NotFound   = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      style={{ color: 'var(--color-muted)' }}
      aria-label="Loading page"
    >
      <span className="animate-pulse-opacity text-sm">Loading…</span>
    </div>
  );
}

export default function App() {
  const [result, setResult] = useState<ScanResult | null>(null);

  return (
    <ScanResultContext.Provider value={{ result, setResult }}>
      <BrowserRouter>
        <Nav />
        <main className="pt-14 min-h-screen">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/"             element={<Landing />}    />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/scanner"      element={<Scanner />}    />
              <Route path="/results"      element={<Results />}    />
              <Route path="/threats"      element={<Threats />}    />
              <Route path="/about"        element={<About />}      />
              <Route path="*"             element={<NotFound />}   />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </BrowserRouter>
    </ScanResultContext.Provider>
  );
}
