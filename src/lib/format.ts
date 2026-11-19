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
