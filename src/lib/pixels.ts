/**
 * Pixel art as data (plan section 3A): a sprite is a list of equal-length strings, one character
 * per pixel, '.' for transparent. These helpers turn a grid into SVG path data at build time, so
 * the site ships no image files for icons or the mascot.
 */
export type PixelGrid = readonly string[];

/** Fails fast on a ragged or empty grid, or on a character outside `allowed`. */
export function validateGrid(grid: PixelGrid, allowed: string): { width: number; height: number } {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (height === 0 || width === 0) throw new Error('empty pixel grid');
  grid.forEach((row, y) => {
    if (row.length !== width)
      throw new Error(`row ${y} has ${row.length} pixels, expected ${width}`);
    for (const ch of row) {
      if (ch !== '.' && !allowed.includes(ch)) throw new Error(`row ${y}: unknown pixel "${ch}"`);
    }
  });
  return { width, height };
}

/** SVG path data covering every pixel equal to `ch`, one unit square each, merged per row run. */
export function pathFor(grid: PixelGrid, ch: string): string {
  const parts: string[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== ch) {
        x++;
        continue;
      }
      let run = 1;
      while (row[x + run] === ch) run++;
      parts.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  });
  return parts.join('');
}

/** The distinct non-transparent characters in a grid, in first-seen order. */
export function inks(grid: PixelGrid): string[] {
  return [...new Set(grid.join('').replaceAll('.', ''))];
}
