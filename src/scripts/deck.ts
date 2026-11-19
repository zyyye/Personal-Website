/**
 * Deck behaviour (plan section 3B). The page itself is the scroll container (decided by Leo,
 * 19 Nov 2026), so scrolling, swiping, keyboard, Back and Find all work natively. This script only:
 *  1. turns snapping on (`data-scroll="deck"` on <html>) when every page fits the screen and the
 *     visitor has not chosen plain scrolling;
 *  2. marks the current tab and keeps the URL hash on the current page;
 *  3. makes the taskbar's step keys move one page up or down.
 * It never intercepts wheel, touch or key events. Without it the page is a normal scrolling page.
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

let currentIndex = 0;

function setCurrent(index: number): void {
  const slide = slides[index];
  if (!slide) return;
  currentIndex = index;
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

// ---- 3. Step keys ---------------------------------------------------------------------------

for (const key of stepKeys) {
  key.addEventListener('click', () => {
    const target = slides[currentIndex + Number(key.dataset.step)];
    target?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });
}
