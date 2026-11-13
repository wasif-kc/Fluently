import type { ReactNode } from 'react';

interface Props {
  percent: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  label?: string;
  muted?: boolean;
}

/** Progress ring used on topic cards and the drill page. */
export function Ring({ percent, size = 64, stroke = 7, children, label, muted }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className={`ring${muted ? ' ring--muted' : ''}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        {pct > 0 && (
          <circle
            className="ring__fill"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <div className="ring__center">{children}</div>
    </div>
  );
}
