import { describe, expect, it } from 'vitest';
import {
  capitalise,
  compareProjects,
  formatAvailability,
  formatAvailabilityShort,
  joinOr,
  formatMonth,
  formatRange,
  shortTitle,
} from '../../src/lib/format.ts';

describe('formatMonth', () => {
  it('formats YYYY-MM', () => {
    expect(formatMonth('2027-08')).toBe('Aug 2027');
    expect(formatMonth('2023-11')).toBe('Nov 2023');
  });
  it('rejects malformed input', () => {
    expect(() => formatMonth('2027-13')).toThrow();
  });
});

describe('formatRange', () => {
  it('shares the year when both ends are in the same year', () => {
    expect(formatRange('2027-08', '2027-12')).toBe('Aug to Dec 2027');
  });
  it('shows both years when they differ', () => {
    expect(formatRange('2026-09', '2027-01')).toBe('Sep 2026 to Jan 2027');
  });
  it('says "present" with no end', () => {
    expect(formatRange('2023-11')).toBe('Nov 2023 to present');
  });
  it('shows a single month once', () => {
    expect(formatRange('2027-05', '2027-05')).toBe('May 2027');
  });
});

describe('formatAvailability', () => {
  it("renders Leo's wording exactly (plan section 5)", () => {
    expect(
      formatAvailability({
        label: 'Semester-long internship',
        start: '2027-08',
        end: '2027-12',
        months: 6,
      }),
    ).toBe('Semester-long internship (6 months), Aug to Dec 2027');
  });
});

describe('shortTitle', () => {
  it('takes the part before a colon', () => {
    expect(shortTitle('DeepWeeds: why a CNN scored below baseline')).toBe('DeepWeeds');
    expect(shortTitle('No colon here')).toBe('No colon here');
  });
});

describe('compareProjects', () => {
  it('sorts by order, then newest first', () => {
    const list = [
      { id: 'b', order: 2, period: { start: '2026-05' } },
      { id: 'c', order: 2, period: { start: '2026-09' } },
      { id: 'a', order: 1, period: { start: '2026-01' } },
    ];
    expect(list.sort(compareProjects).map((p) => p.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('formatAvailabilityShort', () => {
  it('gives the range and the month count', () => {
    expect(formatAvailabilityShort({ start: '2027-05', end: '2027-07', months: 3 })).toBe(
      'May to Jul 2027 (3 months)',
    );
  });
});

describe('joinOr', () => {
  it('joins with commas and a final "or"', () => {
    expect(joinOr(['AI engineer', 'data scientist', 'data analyst'])).toBe(
      'AI engineer, data scientist or data analyst',
    );
    expect(joinOr(['one', 'two'])).toBe('one or two');
    expect(joinOr(['one'])).toBe('one');
    expect(joinOr([])).toBe('');
  });
});

describe('capitalise', () => {
  it('upper-cases only the first character', () => {
    expect(capitalise('test macro-F1')).toBe('Test macro-F1');
    expect(capitalise('')).toBe('');
  });
});
