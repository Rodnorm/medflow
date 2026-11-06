import { CommandItem, searchCommands } from './command-search';

const items: readonly CommandItem[] = [
  { id: 'page-overview', label: 'Overview', description: 'Operations dashboard', icon: 'dashboard', group: 'Pages', url: '/overview' },
  { id: 'page-schedule', label: 'Schedule', description: 'Operating room timeline', icon: 'calendar_month', group: 'Pages', url: '/schedule' },
  { id: 'action-theme', label: 'Toggle theme', description: 'Switch light and dark mode', icon: 'contrast', group: 'Actions', keywords: 'dark light' },
  { id: 'proc-1', label: 'PRC-2026-001 Diagnostic Laparoscopy', description: 'OR-1 planned', icon: 'local_hospital', group: 'Procedures', url: '/procedures/prc-001' },
  { id: 'proc-2', label: 'PRC-2026-002 Knee Arthroscopy', description: 'OR-2 in-progress', icon: 'local_hospital', group: 'Procedures', url: '/procedures/prc-002' },
  { id: 'ins-1', label: 'INS-LAP-01 Laparoscopy Set', description: 'Sterilization Room 1', icon: 'inventory_2', group: 'Instruments', url: '/instruments/ins-001' },
];

describe('searchCommands', () => {
  it('shows pages and actions when the query is empty', () => {
    const result = searchCommands(items, '   ');
    expect(result.map((item) => item.id)).toEqual(['page-overview', 'page-schedule', 'action-theme']);
  });

  it('prefers label prefixes over looser matches', () => {
    const result = searchCommands(items, 'sched');
    expect(result[0].id).toBe('page-schedule');
  });

  it('requires every token to match', () => {
    expect(searchCommands(items, 'lap diagnostic').map((item) => item.id)).toEqual(['proc-1']);
    expect(searchCommands(items, 'lap nonsense')).toEqual([]);
  });

  it('matches against descriptions and keywords', () => {
    expect(searchCommands(items, 'OR-2').map((item) => item.id)).toEqual(['proc-2']);
    expect(searchCommands(items, 'dark').map((item) => item.id)).toEqual(['action-theme']);
  });

  it('is case insensitive and honours the limit', () => {
    expect(searchCommands(items, 'PRC', 1)).toHaveLength(1);
    expect(searchCommands(items, 'prc-2026-002')[0].id).toBe('proc-2');
  });

  it('keeps original order for equal scores', () => {
    const result = searchCommands(items, 'prc');
    expect(result.map((item) => item.id)).toEqual(['proc-1', 'proc-2']);
  });
});

