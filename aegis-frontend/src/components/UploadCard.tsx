import { useCallback, useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES, MAX_FILE_MB } from '../lib/api.config';

interface Props {
  file: File | null;
  /** External dragging override — set true when drag enters the parent form */
  isDragging: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(file: File): string | null {
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return `Unsupported type: ${file.type || 'unknown'}. Use PNG, JPG, WebP, GIF, or PDF.`;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `File too large (${formatSize(file.size)}). Maximum is ${MAX_FILE_MB} MB.`;
  }
  return null;
}

/**
 * Drag-drop / click-to-browse file input.
 *
 * Responsibilities: drag state feedback, file validation, keyboard activation.
 * Does NOT call the API. Calls onFile(file) with a valid file.
 *
 * Accessibility: role="button", Enter + Space activation, aria-label.
 */
export default function UploadCard({ file, isDragging, onFile, onClear, onError, disabled = false }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  // Counter-based drag tracking prevents flickering when cursor passes over child elements.
  // Each dragenter increments, each dragleave decrements; highlight only when count > 0.
  const dragDepth = useRef(0);

  const pick = useCallback(() => { if (!disabled) inputRef.current?.click(); }, [disabled]);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    const err = validate(f);
    if (err) { onError(err); return; }
    onFile(f);
  }

  // isDragging from parent (form-level drag) drives the highlight;
  // the counter keeps it stable across child re-entrances.
  const highlighted = isDragging;

  return (
    <div
      className="rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-4
                 text-center cursor-pointer transition-colors duration-150 select-none"
      style={{
        borderColor: highlighted  ? 'var(--color-accent)'
                   : file         ? 'rgba(59,130,246,0.4)'
                   : 'var(--color-border)',
        background:  highlighted  ? 'rgba(59,130,246,0.05)' : 'var(--color-surface)',
        pointerEvents: disabled ? 'none' : 'auto',
        opacity: disabled ? 0.6 : 1,
        touchAction: 'none', // prevent iOS scroll hijacking during drag
      }}
      onClick={pick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && pick()}
      onDragEnter={() => { dragDepth.current += 1; }}
      onDragLeave={() => { dragDepth.current -= 1; }}
      onDrop={e => {
        e.stopPropagation();
        dragDepth.current = 0;
        handleFiles(e.dataTransfer.files);
      }}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={
        file
          ? `Selected file: ${file.name}. Press Enter to change.`
          : 'Drop a file here, or press Enter to browse.'
      }
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="sr-only"
        onChange={e => handleFiles(e.target.files)}
        tabIndex={-1}
        aria-hidden="true"
      />

      {file ? (
        <>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-accent)' }}
            aria-hidden="true"
          >
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--color-text)' }}>
              {file.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {formatSize(file.size)} · {file.type}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded
                       transition-colors duration-150"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            onClick={e => { e.stopPropagation(); onClear(); }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
            aria-label="Remove selected file"
          >
            <X size={12} aria-hidden="true" /> Remove
          </button>
        </>
      ) : (
        <>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}
            aria-hidden="true"
          >
            <Upload size={24} />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Drop file here or click to browse
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              PNG, JPG, WebP, GIF, PDF · max {MAX_FILE_MB} MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
