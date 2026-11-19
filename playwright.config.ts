import { defineConfig } from '@playwright/test';

// Uses the installed Google Chrome (channel 'chrome'): present locally and on GitHub's
// ubuntu-24.04 runners, so no browser download is needed. Tests run against the built site.
export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    // The smallest screen the slides are designed for (plan section 3B, rule 2).
    {
      name: 'phone',
      use: { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    // --ignore-lock keeps the server in the foreground. Astro 7 otherwise moves `astro preview`
    // to the background when it detects an AI agent, and Playwright then sees the command exit.
    // (Behaviour read in node_modules/astro/dist/cli/preview/index.js; withastro/astro#17903.)
    command: 'npx astro preview --port 4321 --ignore-lock',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
