import type { BadgeKind } from '@/lib/content';

const LABEL: Record<BadgeKind, string> = {
  confirmado: 'Confirmado',
  projetado: 'Projetado',
  estimado: 'Estimado',
  demo: 'Demo',
};

export function Badge({ kind, children }: { kind: BadgeKind; children?: React.ReactNode }) {
  return <span className={`badge badge--${kind}`}>{children ?? LABEL[kind]}</span>;
}

/** Título com entrada palavra a palavra; o texto real fica no aria-label. */
export function Title({ as: Tag = 'h2', children, className = '' }: { as?: 'h1' | 'h2'; children: string; className?: string }) {
  const words = children.split(' ');
  return (
    <Tag className={`title rv ${className}`} aria-label={children}>
      {words.map((w, i) => (
        <span key={i} className="w" aria-hidden="true">
          <span style={{ transitionDelay: `${i * 55}ms` }}>{w}</span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}

/** Marca do DeSol redesenhada em SVG (o "O" é o sol). Usa currentColor. */
export function LogoMark({ size = 36, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2 0h62c20 0 36 20 36 50s-16 50-36 50H2zM50 19a31 31 0 1 0 0 62a31 31 0 1 0 0-62zM50 25a25 25 0 1 1 0 50a25 25 0 1 1 0-50z"
      />
    </svg>
  );
}

export function Kicker({ n, children }: { n: number; children: string }) {
  return (
    <p className="kicker rv">
      <span>{String(n).padStart(2, '0')}</span>
      {children}
    </p>
  );
}
