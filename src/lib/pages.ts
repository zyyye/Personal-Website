/**
 * The page model for the home deck (decided by Leo, 19 Nov 2026): one page per project,
 * internship and achievement, grouped under the taskbar's tabs. Scrolling moves one page;
 * the taskbar jumps to a group's first page or one page up or down.
 *
 * Pure: the slides, the taskbar and the browser script all read this one ordering.
 */
export type GroupId = 'home' | 'about' | 'projects' | 'internship' | 'achievements' | 'contact';

export const GROUP_LABEL: Record<GroupId, string> = {
  home: 'Home',
  about: 'About',
  projects: 'Projects',
  internship: 'Internship',
  achievements: 'Achievements',
  contact: 'Contact',
};

const GROUP_ORDER: GroupId[] = [
  'home',
  'about',
  'projects',
  'internship',
  'achievements',
  'contact',
];

/** Page ids used by the fixed pages; content ids must not collide with them. */
export const RESERVED_IDS = ['hero', 'about', 'contact'] as const;

export interface DeckPage {
  /** Element id and URL hash, e.g. 'deepweeds'. */
  id: string;
  group: GroupId;
  title: string;
  /** Position in the whole deck, from 0. */
  index: number;
  /** Position within its group, from 1, and the group's size, for "2 of 3". */
  position: number;
  groupSize: number;
}

export interface DeckGroup {
  id: GroupId;
  label: string;
  firstPageId: string;
  size: number;
}

export interface DeckInput {
  /** Visible projects in display order. Internships go to their own group. */
  projects: { id: string; title: string; kind: 'team' | 'solo' | 'internship' }[];
  /** Achievements in display order. */
  achievements: { id: string; title: string }[];
}

export function buildDeck(input: DeckInput): { pages: DeckPage[]; groups: DeckGroup[] } {
  const byGroup: Record<GroupId, { id: string; title: string }[]> = {
    home: [{ id: 'hero', title: 'Home' }],
    about: [{ id: 'about', title: 'About' }],
    projects: input.projects.filter((p) => p.kind !== 'internship'),
    internship: input.projects.filter((p) => p.kind === 'internship'),
    achievements: input.achievements,
    contact: [{ id: 'contact', title: 'Contact' }],
  };

  const seen = new Set<string>();
  const pages: DeckPage[] = [];
  const groups: DeckGroup[] = [];
  for (const group of GROUP_ORDER) {
    const items = byGroup[group];
    if (items.length === 0) continue; // An empty group gets no tab.
    items.forEach((item, n) => {
      const isFixed = group === 'home' || group === 'about' || group === 'contact';
      if (!isFixed && (RESERVED_IDS as readonly string[]).includes(item.id)) {
        throw new Error(`content id "${item.id}" is reserved for a fixed page`);
      }
      if (seen.has(item.id)) throw new Error(`duplicate page id "${item.id}"`);
      seen.add(item.id);
      pages.push({
        id: item.id,
        group,
        title: item.title,
        index: pages.length,
        position: n + 1,
        groupSize: items.length,
      });
    });
    groups.push({
      id: group,
      label: GROUP_LABEL[group],
      firstPageId: items[0]!.id,
      size: items.length,
    });
  }
  return { pages, groups };
}

/**
 * The leading number of a result value as written: '0.834 ± 0.003' -> 0.834, '0.508' -> 0.508.
 * Returns null when the value does not start with a number.
 */
export function leadingNumber(value: string): number | null {
  const m = /^\s*(-?\d+(?:\.\d+)?)/.exec(value);
  return m?.[1] === undefined ? null : Number(m[1]);
}
