import { describe, expect, it } from 'vitest';
import { effectiveMode, overflows, parsePreference } from '../../src/lib/deck-mode.ts';

describe('parsePreference', () => {
  it('defaults to deck for missing or unknown values', () => {
    expect(parsePreference(null)).toBe('deck');
    expect(parsePreference('something-else')).toBe('deck');
  });
  it('reads a stored plain preference', () => {
    expect(parsePreference('plain')).toBe('plain');
  });
});

describe('effectiveMode', () => {
  it('honours the preference when every slide fits', () => {
    expect(effectiveMode('deck', false)).toBe('deck');
    expect(effectiveMode('plain', false)).toBe('plain');
  });
  it('forces plain scrolling when any slide overflows', () => {
    expect(effectiveMode('deck', true)).toBe('plain');
    expect(effectiveMode('plain', true)).toBe('plain');
  });
});

describe('overflows', () => {
  it('allows 1px of rounding', () => {
    expect(overflows([640, 641], 640)).toBe(false);
  });
  it('detects a slide taller than the screen', () => {
    expect(overflows([640, 642], 640)).toBe(true);
  });
});
