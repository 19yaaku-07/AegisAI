interface Props {
  label: string;
  className?: string;
}

/** The monospace pill label used as a section eyebrow on every page. */
export default function EyebrowTag({ label, className = '' }: Props) {
  return (
    <span
      className={`inline-block text-xs font-mono px-3 py-1.5 rounded-full ${className}`}
      style={{
        background: 'rgba(59,130,246,0.1)',
        border: '1px solid rgba(59,130,246,0.25)',
        color: 'var(--color-accent)',
      }}
    >
      {label}
    </span>
  );
}
