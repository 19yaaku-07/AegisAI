interface Line {
  text: string;
  indent?: number;
  color?: string;
}

interface Props {
  lines: Line[];
  label?: string;
}

/**
 * Monospace code-like display block used in pipeline step illustrations.
 */
export default function MockBlock({ lines, label }: Props) {
  return (
    <div
      className="rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      role="presentation"
      aria-label={label}
    >
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            paddingLeft: (l.indent ?? 0) * 16,
            color: l.color ?? 'var(--color-muted)',
          }}
        >
          {l.text}
        </div>
      ))}
    </div>
  );
}
