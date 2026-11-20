import { describe, expect, it } from 'vitest';
import { buildDeck, leadingNumber } from '../../src/lib/pages.ts';

const input = {
  projects: [
    { id: 'deepweeds', title: 'DeepWeeds', kind: 'team' as const },
    { id: 'logiclens', title: 'LogicLens', kind: 'internship' as const },
    { id: 'un-voting', title: 'UN Voting', kind: 'solo' as const },
  ],
  achievements: [
    { id: 'ibm', title: 'IBM' },
    { id: 'orbital', title: 'Orbital' },
  ],
};

describe('buildDeck', () => {
  it('orders pages by group, one page per item', () => {
    const { pages } = buildDeck(input);
    expect(pages.map((p) => p.id)).toEqual([
      'hero',
      'about',
      'logiclens',
      'deepweeds',
      'un-voting',
      'ibm',
      'orbital',
      'contact',
    ]);
    expect(pages.map((p) => p.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('puts internships in their own group', () => {
    const { pages } = buildDeck(input);
    expect(pages.find((p) => p.id === 'logiclens')?.group).toBe('internship');
    expect(pages.find((p) => p.id === 'un-voting')?.group).toBe('projects');
  });

  it('numbers pages within their group, for "2 of 3"', () => {
    const { pages } = buildDeck(input);
    const orbital = pages.find((p) => p.id === 'orbital');
    expect([orbital?.position, orbital?.groupSize]).toEqual([2, 2]);
  });

  it('gives each non-empty group one tab that points at its first page', () => {
    const { groups } = buildDeck(input);
    expect(groups.map((g) => [g.id, g.firstPageId, g.size])).toEqual([
      ['home', 'hero', 1],
      ['about', 'about', 1],
      ['internship', 'logiclens', 1],
      ['projects', 'deepweeds', 2],
      ['achievements', 'ibm', 2],
      ['contact', 'contact', 1],
    ]);
  });

  it('drops a group with no items', () => {
    const { groups } = buildDeck({ projects: [], achievements: [] });
    expect(groups.map((g) => g.id)).toEqual(['home', 'about', 'contact']);
  });

  it('rejects duplicate ids', () => {
    expect(() =>
      buildDeck({ ...input, achievements: [{ id: 'deepweeds', title: 'Clash' }] }),
    ).toThrow(/duplicate/);
  });

  it('rejects content ids that collide with fixed pages', () => {
    expect(() =>
      buildDeck({ projects: [{ id: 'contact', title: 'Clash', kind: 'solo' }], achievements: [] }),
    ).toThrow(/reserved/);
  });
});

describe('leadingNumber', () => {
  it('reads the number a value starts with', () => {
    expect(leadingNumber('0.834 ± 0.003')).toBe(0.834);
    expect(leadingNumber('0.508')).toBe(0.508);
    expect(leadingNumber('−0.167')).toBeNull(); // typographic minus is not parsed: values must be plain
    expect(leadingNumber('n/a')).toBeNull();
  });
});
