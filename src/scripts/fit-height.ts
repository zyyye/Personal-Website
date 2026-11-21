/**
 * Keeps a picture as tall as the text block beside it (Leo, 21 Nov 2026): an employer's logo next
 * to a project's title block, and a certificate next to an achievement's text. The block's height
 * depends on how its text wraps, which depends on the picture's width, so CSS alone cannot size it.
 * A larger picture can only make the text taller, so repeated fitting settles after a step or two.
 * Markup: `data-fit-height` on the container, `data-fit-height-text` on the text block. The script
 * sets `--fit-height` on the container; without JavaScript the CSS default applies.
 */
for (const container of document.querySelectorAll<HTMLElement>('[data-fit-height]')) {
  const text = container.querySelector<HTMLElement>('[data-fit-height-text]');
  if (!text) continue;
  let frame = 0;
  const fit = (): void => {
    // Next frame, not inside the observer callback: avoids a ResizeObserver loop error.
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const height = Math.round(text.getBoundingClientRect().height);
      if (height > 0) container.style.setProperty('--fit-height', `${height}px`);
    });
  };
  new ResizeObserver(fit).observe(text);
}
