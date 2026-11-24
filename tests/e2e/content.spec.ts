/**
 * Phase 2 acceptance: rendered content, working evidence links, the case-study template, and
 * the terms that must never appear on the site (plan section 8.2).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('every link on the home page to an internal page resolves', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).pathname))]);
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test('About: each talent point links to its evidence', async ({ page }) => {
  await page.goto('/');
  const points = page.locator('#about-good + ul > li');
  await expect(points).toHaveCount(4);
  for (const li of await points.all()) {
    await expect(li.locator('a')).toHaveCount(1);
  }
});

test('the photo has alt text and its size reserved', async ({ page }) => {
  await page.goto('/');
  const img = page.getByRole('img', { name: 'Portrait of Yeo Zhi Yuan' });
  await expect(img).toHaveAttribute('width', '400');
  await expect(img).toHaveAttribute('height', '500');
});

test('the CV link is hidden while the CV is not ready', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
});

test('DeepWeeds case study: results table, follow-up label and limitations', async ({ page }) => {
  await page.goto('/projects/deepweeds/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('DeepWeeds');
  await expect(page.getByRole('heading', { name: 'Follow-up investigation' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Results', exact: true }).locator('tbody tr'),
  ).toHaveCount(11);
  await expect(page.getByRole('heading', { name: 'Limitations' })).toBeVisible();
});

test('LogicLens case study: v2 results with their reference rules, and limitations', async ({
  page,
}) => {
  await page.goto('/projects/logiclens/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('LogicLens');
  await expect(page.getByRole('heading', { name: 'How it evolved' })).toBeVisible();
  const rows = page.getByRole('region', { name: 'Results', exact: true }).locator('tbody tr');
  await expect(rows).toHaveCount(12);
  await expect(rows.filter({ hasText: 'Reference: rule that reads no text' })).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Limitations' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Results withheld while the evaluation is redone' }),
  ).toHaveCount(0);
});

test('Tweet Sentiment case study: baseline row, results table and limitations', async ({
  page,
}) => {
  await page.goto('/projects/airline-tweets/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tweet Sentiment');
  const rows = page.getByRole('region', { name: 'Results', exact: true }).locator('tbody tr');
  await expect(rows).toHaveCount(7);
  await expect(rows.filter({ hasText: 'Majority-class baseline' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Limitations' })).toBeVisible();
});

test('POLLUX: pipeline on the deck page, code and certificate links, teammate unnamed', async ({
  page,
}) => {
  await page.goto('/');
  const slide = page.locator('#pollux');
  await expect(slide.locator('.flow li')).toHaveCount(6);
  await expect(slide.getByRole('link', { name: 'Certificate' })).toHaveAttribute(
    'href',
    /^https:\/\/credentials\.nus\.edu\.sg\//,
  );

  await page.goto('/projects/pollux/');
  await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute(
    'href',
    'https://github.com/zyyye/POLLUX',
  );
  const html = await page.content();
  // Teammates stay unnamed (plan), and the live app is not linked (Leo, 21 Nov 2026).
  expect(html).not.toMatch(/tian\s*feng|huang/i);
  expect(html).not.toContain('streamlit.app');
});

test('GAIA agent: pipeline on the deck page and a link to the capstone code', async ({ page }) => {
  await page.goto('/');
  const slide = page.locator('#gaia-agent');
  await expect(slide.locator('.flow li')).toHaveCount(6);
  await expect(slide.getByRole('link', { name: 'Source code' })).toHaveAttribute(
    'href',
    'https://huggingface.co/spaces/cloudykite/Final_Assignment_Template/tree/main',
  );
  await expect(
    page.locator('#hf-agentic-ai-course').getByRole('link', { name: 'See the project' }),
  ).toHaveAttribute('href', '#gaia-agent');
});

for (const id of ['orbital-gemini', 'hf-agentic-ai-course']) {
  test(`${id}: certificate sits beside the text, from the title letters to the buttons`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'side by side on wide screens only');
    await page.goto(`/#${id}`);
    const slide = page.locator(`#${id}`);
    await expect(slide.locator('.achievement__image img')).toBeVisible();
    const m = await slide.evaluate((s) => {
      const title = s.querySelector('.page-title')!;
      const t = title.getBoundingClientRect();
      const inset = 0.31 * parseFloat(getComputedStyle(title).fontSize);
      const button = s.querySelector('.achievement__links a')!.getBoundingClientRect();
      const img = s.querySelector('.achievement__image img')!.getBoundingClientRect();
      return {
        top: img.top - (t.top + inset),
        bottom: img.bottom - button.bottom,
        side: img.left - t.right,
      };
    });
    expect(Math.abs(m.top)).toBeLessThanOrEqual(2);
    expect(Math.abs(m.bottom)).toBeLessThanOrEqual(2);
    expect(m.side).toBeGreaterThan(0);
  });
}

// Terms from plan section 8.2 that must not appear anywhere in the built site.
const OFF_SITE =
  /\b(interrogat\w*|suspects?|narcotics?|drugs?|deception|declassified|redact\w*|dealers?|mules?|singlish|cnb|htx)\b/i;
// The employer's name may appear (Leo, 20 Nov 2026), so it is removed before the check; the
// words inside it are still caught anywhere else.
const EMPLOYER = /Central Narcotics Bureau|\bCNB\b/g;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

test('the built site contains none of the off-site terms', () => {
  const dist = resolve(import.meta.dirname, '../../dist');
  const files = htmlFiles(dist);
  expect(files.length).toBeGreaterThan(0);
  const hits = files.flatMap((f) => {
    const m = OFF_SITE.exec(readFileSync(f, 'utf8').replace(EMPLOYER, ''));
    return m ? [`${f}: "${m[0]}"`] : [];
  });
  expect(hits).toEqual([]);
});
