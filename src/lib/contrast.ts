/**
 * WCAG 2.x contrast ratio: (L1 + 0.05) / (L2 + 0.05), with L the relative luminance of sRGB colours.
 * Thresholds used on this site: 4.5:1 for body text (SC 1.4.3), 3:1 for large text and for
 * UI components such as focus outlines (SC 1.4.3, 1.4.11).
 */
function channel(c8: number): number {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`expected #rrggbb, got ${hex}`);
  const n = parseInt(m[1], 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text and UI pairs every palette must pass, as [foreground token, background token, minimum]. */
export const REQUIRED_PAIRS: readonly [string, string, number][] = [
  ['--color-text', '--color-bg', 4.5],
  ['--color-text', '--color-surface', 4.5],
  ['--color-text-muted', '--color-bg', 4.5],
  ['--color-text-muted', '--color-surface', 4.5],
  ['--color-accent', '--color-bg', 4.5],
  ['--color-accent', '--color-surface', 4.5],
  ['--color-accent-2', '--color-surface', 4.5],
  ['--color-success', '--color-bg', 4.5],
  ['--color-warning', '--color-bg', 4.5],
  // Dark text on the cyan title bars and on amber buttons.
  ['--color-bg', '--color-accent-2', 4.5],
  ['--color-bg', '--color-accent', 4.5],
  // Taskbar keys and window bars: labels and the current key on the key face.
  ['--color-text', '--color-key', 4.5],
  ['--color-accent', '--color-key', 4.5],
  ['--color-focus', '--color-bg', 3],
  ['--color-focus', '--color-surface', 3],
];

/** Reads `--name: #rrggbb;` declarations from a CSS file. */
export function readColorTokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    if (m[1] && m[2]) out[m[1]] = m[2].toLowerCase();
  }
  return out;
}
