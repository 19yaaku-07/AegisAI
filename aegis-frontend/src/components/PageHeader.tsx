import EyebrowTag from './EyebrowTag';

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}

/**
 * Consistent page / section header used across every page.
 * eyebrow tag → h1 → optional subtitle.
 */
export default function PageHeader({ eyebrow, title, subtitle, align = 'center' }: Props) {
  const textAlign = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`${textAlign} mb-10`}>
      <EyebrowTag label={eyebrow} className="mb-4" />
      <h1
        className="text-2xl sm:text-3xl font-bold mb-3 text-balance"
        style={{ color: 'var(--color-text)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-sm leading-relaxed max-w-xl mx-auto"
          style={{ color: 'var(--color-muted)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
