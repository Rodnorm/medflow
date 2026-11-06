export type CommandGroup = 'Pages' | 'Procedures' | 'Instruments' | 'Actions';

export interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly group: CommandGroup;
  readonly url?: string;
  readonly keywords?: string;
}

function scoreCommand(item: CommandItem, tokens: readonly string[]): number {
  const label = item.label.toLowerCase();
  const haystack = `${label} ${item.description} ${item.keywords ?? ''}`.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    if (label.startsWith(token)) score += 3;
    else if (label.includes(token)) score += 2;
    else score += 1;
  }

  return score;
}

export function searchCommands(
  items: readonly CommandItem[],
  query: string,
  limit = 8,
): readonly CommandItem[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return items.filter((item) => item.group === 'Pages' || item.group === 'Actions').slice(0, limit);
  }

  return items
    .map((item, index) => ({ item, index, score: scoreCommand(item, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item);
}

