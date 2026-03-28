import { formatRelativeTime } from '../../lib/format.js';

export interface TimestampProps {
  value: string | null;
}

export function Timestamp({ value }: TimestampProps) {
  if (!value) {
    return <span>—</span>;
  }

  return <time dateTime={value}>{formatRelativeTime(value)}</time>;
}
