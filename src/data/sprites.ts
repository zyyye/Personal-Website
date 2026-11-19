/**
 * Original pixel art (plan section 3A). Icons are 8 by 8 with one ink ('#'); the mascot is
 * 16 by 16 with a small palette whose colours come from CSS variables in Sprite.astro.
 * The mascot, Sprout-bot, was the default kept by Leo from the design lab (19 Nov 2026).
 */
import type { GroupId } from '../lib/pages.ts';
import type { PixelGrid } from '../lib/pixels.ts';

export const GROUP_ICONS: Record<GroupId, PixelGrid> = {
  home: [
    '...##...',
    '..####..',
    '.######.',
    '########',
    '.#....#.',
    '.#.##.#.',
    '.#.##.#.',
    '.######.',
  ],
  about: [
    '...##...',
    '..####..',
    '..####..',
    '...##...',
    '.######.',
    '########',
    '########',
    '.##..##.',
  ],
  projects: [
    '........',
    '###.....',
    '####....',
    '########',
    '#......#',
    '#......#',
    '#......#',
    '########',
  ],
  internship: [
    '..####..',
    '..#..#..',
    '########',
    '#......#',
    '########',
    '#......#',
    '#......#',
    '########',
  ],
  achievements: [
    '.#....#.',
    '..#..#..',
    '...##...',
    '..####..',
    '.##..##.',
    '.#.##.#.',
    '.##..##.',
    '..####..',
  ],
  contact: [
    '........',
    '########',
    '##....##',
    '#.#..#.#',
    '#..##..#',
    '#......#',
    '########',
    '........',
  ],
};

export const CONTROL_ICONS = {
  up: [
    '...##...',
    '..####..',
    '.######.',
    '########',
    '...##...',
    '...##...',
    '...##...',
    '...##...',
  ],
  down: [
    '...##...',
    '...##...',
    '...##...',
    '...##...',
    '########',
    '.######.',
    '..####..',
    '...##...',
  ],
  slides: [
    '########',
    '#......#',
    '########',
    '........',
    '########',
    '#......#',
    '########',
    '........',
  ],
} satisfies Record<string, PixelGrid>;

/**
 * Sprout-bot. Inks: k outline, b body, d body shade, w screen, e eyes and mouth, g leaves, s stem.
 */
export const MASCOT: PixelGrid = [
  '......gg.gg.....',
  '.......ggg......',
  '........s.......',
  '........s.......',
  '....kkkkkkkk....',
  '...kbbbbbbbbk...',
  '..kbwwwwwwwwbk..',
  '..kbweewweewbk..',
  '..kbweewweewbk..',
  '..kbwwwwwwwwbk..',
  '..kbwwweewwwbk..',
  '..kdbbbbbbbbdk..',
  '...kddddddddk...',
  '....kk....kk....',
  '....kk....kk....',
  '................',
];

export const MASCOT_INKS = 'kbdwegs';
