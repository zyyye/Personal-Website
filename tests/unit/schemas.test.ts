import { describe, expect, it } from 'vitest';
import { learningSchema, profileSchema, yearMonth } from '../../src/lib/schemas.ts';

describe('yearMonth', () => {
  it('accepts YYYY-MM with a real month', () => {
    expect(yearMonth.safeParse('2027-05').success).toBe(true);
  });
  it('rejects other shapes', () => {
    for (const bad of ['2027-13', '2027-5', '2027-05-01', 'May 2027']) {
      expect(yearMonth.safeParse(bad).success).toBe(false);
    }
  });
});

describe('learningSchema', () => {
  const base = { title: 'T', provider: 'P', kind: 'course', status: 'completed' };
  it('requires https for credential links', () => {
    expect(
      learningSchema.safeParse({ ...base, credentialUrl: 'https://example.com' }).success,
    ).toBe(true);
    expect(learningSchema.safeParse({ ...base, credentialUrl: 'http://example.com' }).success).toBe(
      false,
    );
    expect(learningSchema.safeParse({ ...base, credentialUrl: 'not a url' }).success).toBe(false);
  });
  it('rejects unknown fields, so typos fail loudly', () => {
    expect(learningSchema.safeParse({ ...base, tittle: 'typo' }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('requires an email address in the right format', () => {
    const r = profileSchema.shape.email.safeParse('not-an-email');
    expect(r.success).toBe(false);
  });
  it('allows github to be null (hidden)', () => {
    expect(profileSchema.shape.github.safeParse(null).success).toBe(true);
  });
});
