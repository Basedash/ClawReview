import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

export type BadgeTone =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'muted'
  | 'neutral';

export interface BadgeProps extends PropsWithChildren {
  tone?: BadgeTone;
}

export function Badge({ children, tone = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx('badge', {
        'badge-success': tone === 'success',
        'badge-danger': tone === 'danger',
        'badge-warning': tone === 'warning',
        'badge-muted': tone === 'muted' || tone === 'neutral',
      })}
    >
      {children}
    </span>
  );
}
