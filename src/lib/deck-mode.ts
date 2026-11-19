/**
 * Scroll-mode logic for the deck (plan section 3B, rules 3 and 4). Pure, so it is unit-tested.
 *
 * - 'deck': the page snaps one slide at a time.
 * - 'plain': ordinary scrolling.
 * The visitor's preference is honoured unless a slide does not fit the screen, in which case
 * the deck is unsafe (content could be unreachable) and plain scrolling is forced.
 */
export type ScrollMode = 'deck' | 'plain';

export const STORAGE_KEY = 'scroll-mode';

export function parsePreference(stored: string | null): ScrollMode {
  return stored === 'plain' ? 'plain' : 'deck';
}

export function effectiveMode(preference: ScrollMode, anySlideOverflows: boolean): ScrollMode {
  return preference === 'deck' && !anySlideOverflows ? 'deck' : 'plain';
}

/** A slide overflows when its rendered height exceeds one screen (with 1px for rounding). */
export function overflows(slideHeights: readonly number[], screenHeight: number): boolean {
  return slideHeights.some((h) => h > screenHeight + 1);
}
