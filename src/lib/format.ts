/** Pure display helpers. No Astro imports, so they are unit-tested directly. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(ym: string): { year: string; month: string } {
  const [year, m] = ym.split('-');
  const month = MONTHS[Number(m) - 1];
  if (!year || !month) throw new Error(`not a YYYY-MM value: ${ym}`);
  return { year, month };
}

/** '2027-08' -> 'Aug 2027' */
export function formatMonth(ym: string): string {
  const { year, month } = parts(ym);
  return `${month} ${year}`;
}

/** 'Aug to Dec 2027', 'Nov 2023 to Feb 2024', 'Nov 2023 to present', or 'May 2027' for one month. */
export function formatRange(start: string, end?: string): string {
  if (!end) return `${formatMonth(start)} to present`;
  if (start === end) return formatMonth(start);
  const a = parts(start);
  const b = parts(end);
  return a.year === b.year
    ? `${a.month} to ${b.month} ${b.year}`
    : `${formatMonth(start)} to ${formatMonth(end)}`;
}

/** Calendar months a period touches, counting both ends: '2026-05' to '2026-08' is 4. */
export function monthsInclusive(start: string, end: string): number {
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  if (!sy || !sm || !ey || !em) throw new Error(`bad period ${start} to ${end}`);
  return (ey - sy) * 12 + (em - sm) + 1;
}

/** An internship shows its length after the dates: 'May to Aug 2026 (4 months)'. */
export function formatPeriod(kind: string, start: string, end?: string): string {
  const range = formatRange(start, end);
  if (kind !== 'internship' || !end) return range;
  const n = monthsInclusive(start, end);
  return `${range} (${n} ${n === 1 ? 'month' : 'months'})`;
}

/** 'Semester-long internship (6 months), Aug to Dec 2027' (plan section 5). */
export function formatAvailability(a: {
  label: string;
  start: string;
  end: string;
  months: number;
}): string {
  return `${a.label} (${a.months} months), ${formatRange(a.start, a.end)}`;
}

export const STATUS_LABEL = {
  complete: 'Complete',
  'in-progress': 'In progress',
  'being-improved': 'Being improved',
  planned: 'Planned',
} as const;

export const KIND_LABEL = {
  team: 'Team project',
  solo: 'Solo project',
  internship: 'Internship',
} as const;

/** The short name before a colon: 'DeepWeeds: why ...' -> 'DeepWeeds'. */
export function shortTitle(title: string): string {
  return title.split(':')[0]?.trim() || title;
}

/** Projects first by `order`, then newest start month first. */
export function compareProjects(
  a: { order: number; period: { start: string } },
  b: { order: number; period: { start: string } },
): number {
  return a.order - b.order || b.period.start.localeCompare(a.period.start);
}

/** 'May to Jul 2027 (3 months)': the compact form used on the ID card. */
export function formatAvailabilityShort(a: { start: string; end: string; months: number }): string {
  return `${formatRange(a.start, a.end)} (${a.months} months)`;
}

/** ['a', 'b', 'c'] -> 'a, b and c'. */
export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/** ['a', 'b', 'c'] -> 'a, b or c'. */
export function joinOr(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`;
}

/** 'test macro-F1' -> 'Test macro-F1': for text that starts a sentence or a caption. */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const LINK_LABELS = {
  code: 'Source code',
  report: 'Report',
  video: 'Video',
  certificate: 'Certificate',
} as const;

/** A project's links in display order, each with the text its button shows. */
export function projectLinks(
  links: Partial<Record<keyof typeof LINK_LABELS, string>> | undefined,
): { href: string; label: string }[] {
  return (Object.keys(LINK_LABELS) as (keyof typeof LINK_LABELS)[]).flatMap((key) => {
    const href = links?.[key];
    return href ? [{ href, label: LINK_LABELS[key] }] : [];
  });
}
