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
  await expect(points).toHaveCount(3);
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
  ).toHaveCount(10);
  await expect(page.getByRole('heading', { name: 'Limitations' })).toBeVisible();
});

test('LogicLens case study: no scores, placeholder card instead', async ({ page }) => {
  await page.goto('/projects/logiclens/');
  await expect(
    page.getByRole('heading', { name: 'Results withheld while the evaluation is redone' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Results', exact: true })).toHaveCount(0);
});

// Terms from plan section 8.2 that must not appear anywhere in the built site.
const OFF_SITE =
  /\b(interrogat\w*|suspects?|narcotics?|drugs?|deception|declassified|redact\w*|dealers?|mules?|singlish|cnb|htx)\b/i;

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
    const m = OFF_SITE.exec(readFileSync(f, 'utf8'));
    return m ? [`${f}: "${m[0]}"`] : [];
  });
  expect(hits).toEqual([]);
});
