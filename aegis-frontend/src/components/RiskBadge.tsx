import type { RiskLevel } from '../types';
import { getRisk } from '../lib/risk';

interface Props {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZE_STYLES: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base font-semibold',
};

const DOT_SIZE: Record<string, number> = { sm: 6, md: 8, lg: 9 };

export default function RiskBadge({ level, size = 'md', showLabel = true }: Props) {
  const risk = getRisk(level);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium ${SIZE_STYLES[size]}`}
      style={{
        color: risk.hex,
        background: risk.bg,
        border: `1px solid ${risk.border}`,
      }}
      aria-label={`Risk level: ${risk.label}`}
      role="status"
    >
      <span
        className="block rounded-full shrink-0"
        style={{ width: DOT_SIZE[size], height: DOT_SIZE[size], background: risk.hex }}
        aria-hidden="true"
      />
      {showLabel && risk.label}
    </span>
  );
}
