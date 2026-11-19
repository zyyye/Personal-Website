import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, readColorTokens, REQUIRED_PAIRS } from '../../src/lib/contrast.ts';

describe('contrastRatio', () => {
  it('matches known reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // #767676 on white is the usual "just passes 4.5:1" grey.
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBeCloseTo(
      contrastRatio('#abcdef', '#123456'),
      10,
    );
  });
});

describe('site palette (src/styles/tokens.css)', () => {
  const css = readFileSync(resolve(import.meta.dirname, '../../src/styles/tokens.css'), 'utf8');
  const tokens = readColorTokens(css);
  for (const [fg, bg, min] of REQUIRED_PAIRS) {
    it(`${fg} on ${bg} is at least ${min}:1`, () => {
      const a = tokens[fg];
      const b = tokens[bg];
      expect(a, `${fg} missing`).toBeDefined();
      expect(b, `${bg} missing`).toBeDefined();
      expect(contrastRatio(a!, b!)).toBeGreaterThanOrEqual(min);
    });
  }
});
