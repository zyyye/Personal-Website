/**
 * Keeps an employer's logo as tall as the title block beside it, so the logo starts level with the
 * page title and ends level with the meta line (Leo, 21 Nov 2026). The block's height depends on
 * how its text wraps, which depends on the logo's width, so CSS alone cannot size it. A larger logo
 * can only make the text taller, so repeated fitting settles after a step or two.
 * Without JavaScript the logo keeps the --logo-size default set in ProjectSlide.astro.
 */
for (const head of document.querySelectorAll<HTMLElement>('[data-logo-fit]')) {
  const text = head.querySelector<HTMLElement>('[data-logo-fit-text]');
  if (!text) continue;
  let frame = 0;
  const fit = (): void => {
    // Next frame, not inside the observer callback: avoids a ResizeObserver loop error.
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const height = Math.round(text.getBoundingClientRect().height);
      if (height > 0) head.style.setProperty('--logo-size', `${height}px`);
    });
  };
  new ResizeObserver(fit).observe(text);
}
