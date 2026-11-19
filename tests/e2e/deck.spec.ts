/**
 * Phase 1 acceptance (plan section 9): routes, keyboard and taskbar navigation, both safety
 * valves, reduced motion, no-JavaScript baseline, and an automated accessibility scan.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// One page per project, internship and achievement, in deck order (src/lib/pages.ts).
const SLIDE_IDS = [
  'hero',
  'about',
  'deepweeds',
  'logiclens',
  'hf-agentic-ai-course',
  'orbital-gemini',
  'ibm-data-science',
  'contact',
];

async function openDeck(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scroll', 'deck');
}

/** The slide whose top edge sits at the top of the screen, if any. */
async function slideAtTop(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const el = Array.from(document.querySelectorAll<HTMLElement>('[data-slide]')).find(
      (s) => Math.abs(s.getBoundingClientRect().top) < 2,
    );
    return el?.id ?? null;
  });
}

test('home serves one page per item and one taskbar key per group', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  expect(await page.locator('[data-slide]').evaluateAll((els) => els.map((e) => e.id))).toEqual(
    SLIDE_IDS,
  );
  const tabs = page.getByRole('navigation', { name: 'Pages' }).locator('[data-group-link]');
  expect(await tabs.allInnerTexts()).toEqual([
    'Home',
    'About',
    'Projects',
    'Internship',
    'Achievements',
    'Contact',
  ]);
});

test('unknown routes return the 404 page', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('no console errors on the home page or the 404 page', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    // The 404 page's own document is meant to return 404; anything else is a real error.
    if (m.type() === 'error' && !m.location().url.endsWith('/no-such-page')) {
      errors.push(`${m.text()} (${m.location().url})`);
    }
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scroll', /deck|plain/);
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('deck behaviour on screens where every slide fits', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'The About slide is taller than a 360x640 screen, so the deck is off there by design.',
  );

  test('keyboard moves one slide at a time, without clicking first', async ({ page }) => {
    await openDeck(page);
    const historyLength = await page.evaluate(() => history.length);

    await page.keyboard.press('PageDown');
    await expect(page).toHaveURL(/#about$/);
    await expect.poll(() => slideAtTop(page)).toBe('about');

    await page.keyboard.press('ArrowDown');
    await expect.poll(() => slideAtTop(page)).toBe('deepweeds');

    await page.keyboard.press('End');
    await expect(page).toHaveURL(/#contact$/);
    await expect.poll(() => slideAtTop(page)).toBe('contact');

    await page.keyboard.press('Home');
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => slideAtTop(page)).toBe('hero');

    // replaceState, not pushState: moving between slides adds no history entries.
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
  });

  test("a taskbar key jumps to its group's first page and is marked current", async ({ page }) => {
    await openDeck(page);
    const nav = page.getByRole('navigation', { name: 'Pages' });
    await nav.getByRole('link', { name: 'Achievements' }).click();
    await expect(page).toHaveURL(/#hf-agentic-ai-course$/);
    await expect.poll(() => slideAtTop(page)).toBe('hf-agentic-ai-course');
    await expect(nav.getByRole('link', { name: 'Achievements' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(nav.locator('[aria-current]')).toHaveCount(1);
  });

  test('the key stays current on every page of its group', async ({ page }) => {
    await page.goto('/#orbital-gemini');
    const nav = page.getByRole('navigation', { name: 'Pages' });
    await expect(nav.getByRole('link', { name: 'Achievements' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.locator('#orbital-gemini')).toContainText('Achievements 2 of 3');
  });

  test('the step keys move one page down and up', async ({ page }) => {
    await openDeck(page);
    const nav = page.getByRole('navigation', { name: 'Pages' });
    await expect(nav.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await nav.getByRole('button', { name: 'Next page' }).click();
    await expect.poll(() => slideAtTop(page)).toBe('about');
    await nav.getByRole('button', { name: 'Next page' }).click();
    await expect.poll(() => slideAtTop(page)).toBe('deepweeds');
    await nav.getByRole('button', { name: 'Previous page' }).click();
    await expect.poll(() => slideAtTop(page)).toBe('about');
  });

  test('opening a slide link directly lands on that slide', async ({ page }) => {
    await page.goto('/#ibm-data-science');
    await expect.poll(() => slideAtTop(page)).toBe('ibm-data-science');
  });

  test('manual switch turns the deck off and the choice persists', async ({ page }) => {
    await openDeck(page);
    const toggle = page.getByRole('button', { name: 'Deck' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'plain');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'plain');

    await page.getByRole('button', { name: 'Deck' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'deck');
  });

  test('automatic safety valve: a slide taller than the screen forces plain scrolling', async ({
    page,
  }) => {
    await openDeck(page);
    await page.evaluate(() => {
      const filler = document.createElement('div');
      filler.id = 'test-filler';
      filler.style.height = '3000px';
      document.querySelector('#about .slide__inner')?.append(filler);
    });
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'plain');
    const toggle = page.getByRole('button', { name: 'Deck' });
    await expect(toggle).toBeDisabled(); // aria-disabled: still focusable, so its title can be read

    // Even a raw click event cannot turn the deck back on while a slide overflows.
    await toggle.dispatchEvent('click');
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'plain');

    await page.evaluate(() => document.getElementById('test-filler')?.remove());
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'deck');
    await expect(toggle).toBeEnabled();
  });

  test('reduced motion turns off smooth scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openDeck(page);
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    ).toBe('auto');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the page is a readable, normally scrolling page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll', /.*/);
    for (const id of SLIDE_IDS) {
      await expect(page.locator(`#${id} :is(h1, h2)`)).toHaveCount(1);
    }
    await expect(page.getByRole('button', { name: 'Deck' })).toBeHidden();
  });
});

test('no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('on a 360x640 phone the tall About slide switches the page to plain scrolling', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Phone only');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scroll', 'plain');
  await expect(page.getByRole('button', { name: 'Deck' })).toBeDisabled();
});

test('no page scrolls sideways', async ({ page }) => {
  for (const path of ['/', '/projects/', '/projects/deepweeds/', '/projects/logiclens/']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('every taskbar key is fully on screen and none overlap', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scroll', /deck|plain/);
  const viewport = page.viewportSize()!;
  const boxes = await page.locator('nav[aria-label="Pages"] .key').evaluateAll((keys) =>
    keys.map((k) => {
      const r = k.getBoundingClientRect();
      return {
        name: k.getAttribute('aria-label') ?? k.textContent?.trim() ?? '',
        left: r.left,
        right: r.right,
      };
    }),
  );
  expect(boxes).toHaveLength(9); // six tabs, two step keys, the Deck switch
  for (const b of boxes) {
    expect(b.left, b.name).toBeGreaterThanOrEqual(0);
    expect(b.right, b.name).toBeLessThanOrEqual(viewport.width);
  }
  for (let n = 1; n < boxes.length; n++) {
    expect(
      boxes[n]!.left,
      `${boxes[n]!.name} overlaps ${boxes[n - 1]!.name}`,
    ).toBeGreaterThanOrEqual(boxes[n - 1]!.right);
  }
});

test('every in-page link points at an element on the page', async ({ page }) => {
  await page.goto('/');
  const missing = await page
    .locator('a[href^="#"]')
    .evaluateAll((as) =>
      as
        .map((a) => a.getAttribute('href')!.slice(1))
        .filter((id) => id && !document.getElementById(id)),
    );
  expect(missing).toEqual([]);
});
