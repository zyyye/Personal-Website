import { describe, expect, it } from 'vitest';
import { CONTROL_ICONS, GROUP_ICONS, MASCOT, MASCOT_INKS } from '../../src/data/sprites.ts';
import { inks, pathFor, validateGrid } from '../../src/lib/pixels.ts';

describe('validateGrid', () => {
  it('returns the size of a well-formed grid', () => {
    expect(validateGrid(['#.', '.#'], '#')).toEqual({ width: 2, height: 2 });
  });
  it('rejects ragged rows', () => {
    expect(() => validateGrid(['##', '#'], '#')).toThrow(/row 1/);
  });
  it('rejects unknown characters', () => {
    expect(() => validateGrid(['#x'], '#')).toThrow(/unknown pixel/);
  });
  it('rejects an empty grid', () => {
    expect(() => validateGrid([], '#')).toThrow(/empty/);
  });
});

describe('pathFor', () => {
  it('merges each horizontal run into one rectangle', () => {
    expect(pathFor(['##.#'], '#')).toBe('M0 0h2v1h-2zM3 0h1v1h-1z');
  });
  it('covers exactly the pixels of one ink', () => {
    const grid = ['ab', 'ba'];
    expect(pathFor(grid, 'a')).toBe('M0 0h1v1h-1zM1 1h1v1h-1z');
    expect(pathFor(grid, 'b')).toBe('M1 0h1v1h-1zM0 1h1v1h-1z');
  });
});

describe('the site sprites', () => {
  it('icons are 8 by 8 with one ink', () => {
    for (const grid of [...Object.values(GROUP_ICONS), ...Object.values(CONTROL_ICONS)]) {
      expect(validateGrid(grid, '#')).toEqual({ width: 8, height: 8 });
    }
  });
  it('the mascot is 16 by 16 and uses only its palette', () => {
    expect(validateGrid(MASCOT, MASCOT_INKS)).toEqual({ width: 16, height: 16 });
    expect(inks(MASCOT).every((c) => MASCOT_INKS.includes(c))).toBe(true);
  });
});
