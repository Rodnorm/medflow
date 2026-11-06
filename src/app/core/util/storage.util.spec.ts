import { describe, it, expect, beforeEach } from 'vitest';
import { loadStorage, saveStorage, removeStorage } from './storage.util';

describe('storage.util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns fallback when key does not exist', () => {
    const val = loadStorage('test_missing', { default: true });
    expect(val).toEqual({ default: true });
  });

  it('saves and loads JSON data', () => {
    saveStorage('test_key', [1, 2, 3]);
    expect(loadStorage<number[]>('test_key', [])).toEqual([1, 2, 3]);
  });

  it('removes storage key', () => {
    saveStorage('test_key', 'hello');
    removeStorage('test_key');
    expect(loadStorage<string>('test_key', 'fallback')).toBe('fallback');
  });

  it('handles corrupted JSON gracefully by returning fallback', () => {
    localStorage.setItem('corrupt', 'not a json {{{');
    expect(loadStorage('corrupt', 'safe')).toBe('safe');
  });
});

