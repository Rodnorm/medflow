export function formatRelativeTime(iso: string, now: Date = new Date(), locale = 'en'): string {
  const diffSeconds = Math.round((Date.parse(iso) - now.getTime()) / 1000);

  if (Number.isNaN(diffSeconds)) return '';
  if (Math.abs(diffSeconds) < 45) return 'just now';

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return formatter.format(Math.round(diffSeconds / 60), 'minute');
}

