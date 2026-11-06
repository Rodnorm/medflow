import { formatRelativeTime } from './relative-time';

describe('formatRelativeTime', () => {
  const now = new Date('2026-11-09T12:00:00.000Z');
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();
  const ahead = (seconds: number) => new Date(now.getTime() + seconds * 1000).toISOString();

  it('collapses very recent events to "just now"', () => {
    expect(formatRelativeTime(ago(10), now)).toBe('just now');
    expect(formatRelativeTime(ahead(30), now)).toBe('just now');
  });

  it('formats minutes, hours and days in the past', () => {
    expect(formatRelativeTime(ago(5 * 60), now)).toBe('5 minutes ago');
    expect(formatRelativeTime(ago(3 * 3600), now)).toBe('3 hours ago');
    expect(formatRelativeTime(ago(2 * 86_400), now)).toBe('2 days ago');
  });

  it('formats future timestamps', () => {
    expect(formatRelativeTime(ahead(2 * 3600), now)).toBe('in 2 hours');
  });

  it('uses a natural phrase for yesterday', () => {
    expect(formatRelativeTime(ago(86_400), now)).toBe('yesterday');
  });

  it('returns an empty string for invalid input', () => {
    expect(formatRelativeTime('nope', now)).toBe('');
  });
});

