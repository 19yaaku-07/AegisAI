import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, AlertCircle, Loader2, Clock, WifiOff } from 'lucide-react';
import { scanFile, scanText } from '../lib/api';
import { MIN_PROGRESS_MS } from '../lib/api.config';
import { useScanResult } from '../context/ScanResultContext';
import UploadCard from '../components/UploadCard';
import PageHeader from '../components/PageHeader';
import { useReducedMotion } from '../lib/motion';
import { DURATION } from '../lib/motion.config';

type Mode  = 'file' | 'url';
type Phase = 'idle' | 'loading';
type UrlSubMode = 'url' | 'text';

/* ─── Animated scan-progress indicator ─────────────────────────────────── */
const STAGES = [
  'Uploading file',
  'Running OCR extraction',
  'Analysing with IBM Bob',
  'Scoring risk level',
];

function ScanProgress({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-6 py-10"
      role="status"
      aria-label="Scan in progress"
      aria-live="polite"
    >
      {/* Spinner — CSS pulse under reduced-motion */}
      {reduced ? (
        <Loader2
          size={32}
          style={{ color: 'var(--color-accent)' }}
          className="animate-pulse-opacity"
          aria-hidden="true"
        />
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          aria-hidden="true"
        >
          <Loader2 size={32} style={{ color: 'var(--color-accent)' }} />
        </motion.div>
      )}

      {/* Stage list */}
      <div className="space-y-2 w-full max-w-xs" aria-hidden="true">
        {STAGES.map((stage, i) => (
          reduced ? (
            <div key={stage} className="flex items-center gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--color-accent)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{stage}</span>
            </div>
          ) : (
            <motion.div
              key={stage}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.35 + 0.1, duration: DURATION.fast }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--color-accent)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.35 + 0.2 }}
                aria-hidden="true"
              />
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{stage}</span>
            </motion.div>
          )
        ))}
      </div>
    </div>
  );
}

/* ─── Error banner ──────────────────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isTimeout   = message.toLowerCase().includes('timed out');
  const isNetwork   = message.toLowerCase().includes('could not reach');
  const Icon        = isTimeout ? Clock : isNetwork ? WifiOff : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: DURATION.micro }}
      className="flex items-start gap-3 mt-4 px-4 py-3 rounded-lg text-sm"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.25)',
        color: '#ef4444',
      }}
      role="alert"
      aria-live="assertive"
    >
      <Icon size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p>{message}</p>
        <button
          className="mt-2 text-xs underline underline-offset-2"
          onClick={onRetry}
          style={{ color: '#ef4444' }}
        >
          Try again
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function Scanner() {
  const [mode,       setMode]       = useState<Mode>('file');
  const [phase,      setPhase]      = useState<Phase>('idle');
  const [file,       setFile]       = useState<File | null>(null);
  const [urlInput,   setUrlInput]   = useState('');
  const [textInput,  setTextInput]  = useState('');
  const [urlSubMode, setUrlSubMode] = useState<UrlSubMode>('url');
  const [error,      setError]      = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const { setResult } = useScanResult();
  const navigate      = useNavigate();
  const reduced       = useReducedMotion();
  // Tracks the start time of the scan to enforce MIN_PROGRESS_MS
  const scanStartRef  = useRef<number>(0);
  // Counter-based drag tracking: prevents false "drag left" when moving over child elements
  const formDragDepth = useRef(0);

  // Reset drag state on route change / unmount
  useEffect(() => () => { setIsDragging(false); formDragDepth.current = 0; }, []);

  /* ── Drag handlers (owned here; passed down to UploadCard as isDragging prop) ── */
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    formDragDepth.current += 1;
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    formDragDepth.current -= 1;
    if (formDragDepth.current <= 0) {
      formDragDepth.current = 0;
      setIsDragging(false);
    }
  }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    formDragDepth.current = 0;
    setIsDragging(false);
    // UploadCard's onDrop handles the actual file via stopPropagation interplay
  }, []);

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPhase('loading');
    scanStartRef.current = Date.now();

    try {
      let result;
      if (mode === 'file') {
        [result] = await Promise.all([
          scanFile(file!),
          new Promise<void>(res => setTimeout(res, MIN_PROGRESS_MS)),
        ]);
      } else {
        const input = urlSubMode === 'url' ? urlInput.trim() : textInput.trim();
        [result] = await Promise.all([
          scanText(input, urlSubMode),
          new Promise<void>(res => setTimeout(res, MIN_PROGRESS_MS)),
        ]);
      }

      setResult(result);
      navigate('/results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setPhase('idle');
    }
  }

  function handleRetry() {
    setError('');
    setPhase('idle');
    // File is intentionally retained so the user doesn't have to re-select
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
  }

  const isLoading  = phase === 'loading';
  const urlReady   = urlSubMode === 'url' ? urlInput.trim().length > 0 : textInput.trim().length > 3;
  const canSubmit  = !isLoading && (mode === 'file' ? !!file : urlReady);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <PageHeader
        eyebrow="// live scanner"
        title="Analyse a Suspicious File or URL"
        subtitle="Upload a screenshot, image, or PDF. AEGIS-AI extracts and analyses the content instantly."
      />

      {/* Mode tabs */}
      <div
        className="flex rounded-lg p-1 mb-8 gap-1"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        role="tablist"
        aria-label="Scan input mode"
      >
        {(['file', 'url'] as Mode[]).map(m => {
          const active = mode === m;
          return (
            <button
              key={m}
              role="tab"
              aria-selected={active}
              id={`tab-${m}`}
              aria-controls={`panel-${m}`}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm
                         rounded-md font-medium transition-all duration-150 min-h-[44px]"
              style={{
                background: active ? 'var(--color-surface-2)' : 'transparent',
                color:      active ? 'var(--color-text)'      : 'var(--color-muted)',
                border:     active ? '1px solid var(--color-border)' : '1px solid transparent',
              }}
              onClick={() => switchMode(m)}
              disabled={isLoading}
            >
              {m === 'file'
                ? <><span aria-hidden="true">📁</span> File Upload</>
                : <><LinkIcon size={14} aria-hidden="true" /> URL / Text</>
              }
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        aria-label="Scan submission form"
        noValidate
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
              className="rounded-xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <ScanProgress reduced={reduced} />
            </motion.div>

          ) : mode === 'file' ? (
            <motion.div
              key="file-panel"
              id="panel-file"
              role="tabpanel"
              aria-labelledby="tab-file"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DURATION.fast }}
            >
              <UploadCard
                file={file}
                isDragging={isDragging}
                onFile={f => { setFile(f); setError(''); }}
                onClear={() => setFile(null)}
                onError={msg => setError(msg)}
                disabled={isLoading}
              />
            </motion.div>

          ) : (
            <motion.div
              key="url-panel"
              id="panel-url"
              role="tabpanel"
              aria-labelledby="tab-url"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DURATION.fast }}
            >
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                {/* Sub-mode toggle: URL / Text */}
                <div
                  className="flex border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {(['url', 'text'] as UrlSubMode[]).map(sub => (
                    <button
                      key={sub}
                      type="button"
                      className="flex-1 py-2.5 text-xs font-medium transition-colors duration-150"
                      style={{
                        background: urlSubMode === sub ? 'var(--color-surface-2)' : 'transparent',
                        color: urlSubMode === sub ? 'var(--color-text)' : 'var(--color-muted)',
                        borderBottom: urlSubMode === sub ? '2px solid var(--color-accent)' : '2px solid transparent',
                      }}
                      onClick={() => { setUrlSubMode(sub); setError(''); }}
                      disabled={isLoading}
                    >
                      {sub === 'url' ? '🔗 Scan URL' : '📝 Analyse Text'}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {urlSubMode === 'url' ? (
                    <div className="flex flex-col gap-3">
                      <label
                        htmlFor="url-input"
                        className="text-xs font-medium"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        Enter a URL to scan for threats
                      </label>
                      <input
                        id="url-input"
                        type="url"
                        value={urlInput}
                        onChange={e => { setUrlInput(e.target.value); setError(''); }}
                        placeholder="https://suspicious-site.com/login"
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
                        style={{
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                        disabled={isLoading}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        AEGIS-AI will fetch the page content and analyse it for phishing, malware, and social engineering.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <label
                        htmlFor="text-input"
                        className="text-xs font-medium"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        Paste suspicious text, email body, or message
                      </label>
                      <textarea
                        id="text-input"
                        value={textInput}
                        onChange={e => { setTextInput(e.target.value); setError(''); }}
                        placeholder="Paste the suspicious content here…"
                        rows={6}
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors resize-none"
                        style={{
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                        disabled={isLoading}
                        spellCheck={false}
                      />
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Paste email bodies, chat messages, SMS, or any suspicious text for instant threat analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner — retains file selection on retry */}
        <AnimatePresence>
          {error && <ErrorBanner message={error} onRetry={handleRetry} />}
        </AnimatePresence>

        {/* Submit — shown for both file and URL modes */}
        {!isLoading && (
          <motion.button
            type="submit"
            className="w-full mt-5 py-3 rounded-lg font-semibold text-sm flex
                       items-center justify-center gap-2"
            style={{
              background: canSubmit ? 'var(--color-accent)' : 'var(--color-border)',
              color: '#fff',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background 150ms',
            }}
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            aria-disabled={!canSubmit}
          >
            {mode === 'url'
              ? (urlSubMode === 'url' ? 'Scan URL with AEGIS-AI' : 'Analyse Text with AEGIS-AI')
              : 'Analyse with AEGIS-AI'
            }
          </motion.button>
        )}
      </form>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--color-muted)' }}>
        Files are processed in-memory and immediately discarded. Nothing is stored.
      </p>
    </div>
  );
}
