/**
 * Motion (plan section 3A, motion budget), kept apart from the scrolling logic in deck.ts.
 *
 * 1. The name's block shadow steps deeper and back in a loop (chosen by Leo, 19 Nov 2026). A loop
 *    longer than five seconds needs a way to pause it (WCAG 2.2.2), so it runs only when this
 *    script can also show the Pause motion button: never without JavaScript, never with reduced
 *    motion, and only on wide screens, where the name is large. The choice is remembered.
 * 2. Each page's content rises in over 280 ms as it scrolls into view (budget: 200 to 300 ms).
 *    Content is visible by default; the class only ever adds an entrance, never hides anything.
 */
const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const wide = window.matchMedia('(min-width: 64rem)');
const STORAGE_KEY = 'name-motion';

function readPaused(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'paused';
  } catch {
    return false;
  }
}

function writePaused(paused: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, paused ? 'paused' : 'on');
  } catch {
    // Storage blocked: the choice still applies until the page is closed.
  }
}

let paused = readPaused();

function apply(): void {
  const allowed = !reduce.matches && wide.matches;
  if (!allowed) {
    delete root.dataset.motion;
    if (toggle) toggle.hidden = true;
    return;
  }
  root.dataset.motion = paused ? 'paused' : 'on';
  if (toggle) {
    toggle.hidden = false;
    toggle.setAttribute('aria-pressed', String(paused));
  }
}

toggle?.addEventListener('click', () => {
  paused = !paused;
  writePaused(paused);
  apply();
});
reduce.addEventListener('change', apply);
wide.addEventListener('change', apply);
apply();

// Page entrances. Pages already on screen when the page loads do not animate: text must be
// readable at first paint (plan section 3A, rule 7).
// A page whose edge only touches the screen's edge counts as intersecting at threshold 0, so the
// next page (whose top sits exactly at the bottom of the screen) would be reported as already in
// view and never animate. Shrinking the root by 1px and requiring real overlap avoids that.
let firstReport = true;
const entranceObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const inner = e.target.querySelector('.slide__inner');
      if (!inner) continue;
      const inView = e.isIntersecting && e.intersectionRatio > 0;
      if (!inView) inner.classList.remove('is-entering');
      else if (!firstReport) inner.classList.add('is-entering');
    }
    firstReport = false;
  },
  { rootMargin: '-1px 0px', threshold: [0, 0.01] },
);
for (const slide of document.querySelectorAll('[data-slide]')) entranceObserver.observe(slide);
