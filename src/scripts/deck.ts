/**
 * Deck behaviour (plan section 3B). The page itself is the scroll container (decided by Leo,
 * 19 Nov 2026), so keyboard, Back and Find work natively. This script only:
 *  1. turns snapping on (`data-scroll="deck"` on <html>) when every slide fits the screen and the
 *     visitor has not chosen plain scrolling;
 *  2. keeps the taskbar's current-slide marker and the URL hash in step with the scroll position.
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
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-slide-link]'));
const toggle = document.querySelector<HTMLButtonElement>('[data-mode-toggle]');
const toggleState = toggle?.querySelector<HTMLElement>('[data-mode-state]') ?? null;
const probe = document.querySelector<HTMLElement>('[data-screen-probe]');

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
    toggle.title = 'This screen is too small to show one slide at a time.';
  } else {
    toggle.removeAttribute('aria-disabled');
    toggle.title = 'Snap one slide at a time';
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

// Re-measure whenever the screen or any slide changes size (rotation, zoom, text size, fonts).
const resizeObserver = new ResizeObserver(update);
if (probe) resizeObserver.observe(probe);
for (const s of slides) resizeObserver.observe(s);
void document.fonts.ready.then(update);
update();

// Current slide = the one crossing the middle of the screen. Works in both scroll modes.
function setCurrent(id: string): void {
  for (const a of links) {
    if (a.hash === `#${id}`) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
  // replaceState, not pushState: the Back button should leave the page, not step through slides.
  // The first slide has no hash, so the plain URL stays clean.
  const isFirst = id === slides[0]?.id;
  const wanted = isFirst ? '' : `#${id}`;
  if (location.hash !== wanted) {
    history.replaceState(history.state, '', isFirst ? location.pathname + location.search : wanted);
  }
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) setCurrent((e.target as HTMLElement).id);
    }
  },
  { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
);
for (const s of slides) sectionObserver.observe(s);
