/**
 * Deck behaviour (plan section 3B). The page itself is the scroll container (decided by Leo,
 * 19 Nov 2026), so scrolling, swiping, keyboard, Back and Find all work natively. This script:
 *  1. turns snapping on (`data-scroll="deck"` on <html>) when every page fits the screen and the
 *     visitor has not chosen plain scrolling;
 *  2. marks the current tab and keeps the URL hash on the current page;
 *  3. turns pages with one animation (Leo, 21 Nov 2026): the step keys, and in deck mode the mouse
 *     wheel, the paging keys and links to a page, all glide one page at a time over PAGE_TURN_MS.
 *     This replaces plan 3B rule 5 ("no wheel or key hijacking") at Leo's request, within limits:
 *     only in deck mode, never for touch (phones and tablets keep native scrolling), never with a
 *     modifier key or while typing, and with reduced motion the jump is instant.
 * Without it the page is a normal scrolling page.
 */
import {
  effectiveMode,
  overflows,
  parsePreference,
  STORAGE_KEY,
  type ScrollMode,
} from '../lib/deck-mode.ts';

const root = document.documentElement;
const slides = Array.from(document.querySelectorAll<HTMLElement>('[data-slide]'));
const tabs = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-group-link]'));
const stepKeys = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-step]'));
const toggle = document.querySelector<HTMLButtonElement>('[data-mode-toggle]');
const toggleState = toggle?.querySelector<HTMLElement>('[data-mode-state]') ?? null;
const probe = document.querySelector<HTMLElement>('[data-screen-probe]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---- 1. Scroll mode -------------------------------------------------------------------------

function readPreference(): ScrollMode {
  try {
    return parsePreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'deck'; // Storage blocked: fall back to the default for this visit.
  }
}

function writePreference(mode: ScrollMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage blocked: the choice still applies until the page is closed.
  }
}

let preference = readPreference();
let anyOverflow = false;

function measure(): void {
  if (!probe) return;
  const screen = probe.getBoundingClientRect().height;
  anyOverflow = overflows(
    slides.map((s) => s.getBoundingClientRect().height),
    screen,
  );
}

function render(): void {
  const mode = effectiveMode(preference, anyOverflow);
  root.dataset.scroll = mode;
  if (!toggle || !toggleState) return;
  toggle.setAttribute('aria-pressed', String(mode === 'deck'));
  toggleState.textContent = mode === 'deck' ? 'On' : 'Off';
  if (anyOverflow) {
    toggle.setAttribute('aria-disabled', 'true');
    toggle.title = 'This screen is too small to show one page at a time.';
  } else {
    toggle.removeAttribute('aria-disabled');
    toggle.title = 'Snap one page at a time';
  }
}

function update(): void {
  measure();
  render();
}

toggle?.addEventListener('click', () => {
  if (anyOverflow) return;
  preference = preference === 'deck' ? 'plain' : 'deck';
  writePreference(preference);
  render();
});

// Re-measure whenever the screen or any page changes size (rotation, zoom, text size, fonts).
const resizeObserver = new ResizeObserver(update);
if (probe) resizeObserver.observe(probe);
for (const s of slides) resizeObserver.observe(s);
void document.fonts.ready.then(update);
update();

// ---- 2. Current page and tab ----------------------------------------------------------------

function setCurrent(index: number): void {
  const slide = slides[index];
  if (!slide) return;
  // A tab is current while any page of its group is on screen.
  for (const a of tabs) {
    if (a.dataset.groupLink === slide.dataset.group) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
  const [up, down] = [
    stepKeys.find((k) => k.dataset.step === '-1'),
    stepKeys.find((k) => k.dataset.step === '1'),
  ];
  if (up) up.disabled = index === 0;
  if (down) down.disabled = index === slides.length - 1;
  // replaceState, not pushState: the Back button should leave the page, not step through pages.
  // The first page has no hash, so the plain URL stays clean.
  const wanted = index === 0 ? '' : `#${slide.id}`;
  if (location.hash !== wanted) {
    history.replaceState(
      history.state,
      '',
      index === 0 ? location.pathname + location.search : wanted,
    );
  }
}

// Current page = the one crossing the middle of the screen. Works in both scroll modes.
const pageObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) setCurrent(slides.indexOf(e.target as HTMLElement));
    }
  },
  { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
);
for (const s of slides) pageObserver.observe(s);

// ---- 3. Page turns ---------------------------------------------------------------------------

/** About 1.4 times the browser's own smooth scroll for one page (450 ms in Chromium, measured). */
const PAGE_TURN_MS = 650;
/** Wheel travel, in pixels, that counts as one deliberate turn. */
const WHEEL_THRESHOLD = 40;
/** A wheel stream must pause this long after a turn before another turn starts (trackpad inertia). */
const WHEEL_QUIET_MS = 160;

const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

let turning: { target: number; frame: number } | null = null;

const inDeck = (): boolean => root.dataset.scroll === 'deck';
const clampIndex = (i: number): number => Math.max(0, Math.min(slides.length - 1, i));

/** The page the visitor is on, or the one a turn in progress is heading to. */
function baseIndex(): number {
  if (turning) return turning.target;
  let best = 0;
  for (let i = 1; i < slides.length; i++) {
    const s = slides[i];
    const b = slides[best];
    if (s && b && Math.abs(s.offsetTop - scrollY) < Math.abs(b.offsetTop - scrollY)) best = i;
  }
  return best;
}

function turnTo(index: number): void {
  const target = clampIndex(index);
  const slide = slides[target];
  if (!slide) return;
  if (turning) cancelAnimationFrame(turning.frame);
  const from = scrollY;
  const to = slide.offsetTop;
  if (reducedMotion.matches || from === to) {
    turning = null;
    delete root.dataset.turning;
    slide.scrollIntoView({ behavior: 'auto', block: 'start' });
    return;
  }
  // Snapping and CSS smooth scrolling would fight a frame-by-frame scroll, so both pause until the
  // turn ends exactly on the page's snap point.
  root.dataset.turning = '';
  const start = performance.now();
  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / PAGE_TURN_MS);
    window.scrollTo(0, from + (to - from) * easeInOutCubic(t));
    if (t < 1) {
      if (turning) turning.frame = requestAnimationFrame(step);
      return;
    }
    turning = null;
    delete root.dataset.turning;
  };
  turning = { target, frame: requestAnimationFrame(step) };
}

for (const key of stepKeys) {
  key.addEventListener('click', () => turnTo(baseIndex() + Number(key.dataset.step)));
}

// Mouse wheel and trackpad, deck mode only. One gesture turns one page; the events that follow
// (a fast flick, trackpad inertia) are absorbed until the stream goes quiet.
let wheelTravel = 0;
let lastWheel = 0;
let quietUntil = 0;
window.addEventListener(
  'wheel',
  (e) => {
    if (!inDeck() || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    const now = performance.now();
    if (now - lastWheel > WHEEL_QUIET_MS) wheelTravel = 0;
    lastWheel = now;
    if (turning || now < quietUntil) {
      quietUntil = Math.max(quietUntil, now + WHEEL_QUIET_MS);
      return;
    }
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    wheelTravel += e.deltaY * unit;
    if (Math.abs(wheelTravel) < WHEEL_THRESHOLD) return;
    const dir = Math.sign(wheelTravel);
    wheelTravel = 0;
    quietUntil = now + PAGE_TURN_MS + WHEEL_QUIET_MS;
    turnTo(baseIndex() + dir);
  },
  { passive: false },
);

// Paging keys, deck mode only, and not while typing or using a modifier. Space is left alone on
// buttons and links, where it activates them.
const KEY_STEPS: Record<string, number | 'first' | 'last'> = {
  ArrowDown: 1,
  PageDown: 1,
  ArrowUp: -1,
  PageUp: -1,
  Home: 'first',
  End: 'last',
};
window.addEventListener('keydown', (e) => {
  if (!inDeck() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const el = e.target as HTMLElement | null;
  if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
  let move = KEY_STEPS[e.key];
  if (e.key === ' ' && !el?.closest('button, a, summary')) move = e.shiftKey ? -1 : 1;
  if (move === undefined) return;
  e.preventDefault();
  if (move === 'first') turnTo(0);
  else if (move === 'last') turnTo(slides.length - 1);
  else turnTo(baseIndex() + move);
});

// Links to a page of the deck (taskbar keys, "See my work", About's evidence links) glide too.
document.addEventListener('click', (e) => {
  if (!inDeck() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
  const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  const id = link?.getAttribute('href')?.slice(1);
  const index = id ? slides.findIndex((s) => s.id === id) : -1;
  if (index < 0) return;
  e.preventDefault();
  turnTo(index);
});
