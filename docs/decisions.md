# Decisions

One short entry per decision, newest last. "Checked" means verified against the source named on that date.

## 2026-11-19: Stack versions

Astro 7.4.13 (latest on npm, checked 19 Nov 2026). The plan was written against older docs; the Astro 7
content-collection API was checked on docs.astro.build: `src/content.config.ts`, `defineCollection` from
`astro:content`, `glob` from `astro/loaders`, `z` from `astro/zod` (Zod 4). All dependencies pinned to exact versions.

## 2026-11-19: TypeScript pinned to 6.0.3, not 7.0

TypeScript 7.0.2 is the latest release, but `@astrojs/check` 0.9.12 declares `typescript ^5 || ^6` and
`typescript-eslint` 8.73.0 declares `<6.1.0` (npm peer dependencies, checked 19 Nov 2026). Revisit when both support 7.

## 2026-11-19: The page itself scrolls (changes plan section 3B, rule 1). Decided by Leo.

Tested in Chrome: with the slides inside an inner scroll container, PageDown, arrows, Space, Home and End did
nothing after page load until the visitor clicked inside it. With snapping on the root element, every key
worked immediately. So `scroll-snap-type` is set on `<html>`, and only when `deck.ts` sets `data-scroll="deck"`.

## 2026-11-19: Snapping is off until the script confirms every slide fits

Without JavaScript, or when any slide is taller than one screen, the page scrolls normally. A slide's
height is compared with an invisible element that is exactly `100svh` tall. The visitor's manual choice is
stored in `localStorage` (try/catch). When a slide overflows, the switch is `aria-disabled` and says why.

## 2026-11-19: Node.js pinned in `.node-version` (22.23.5)

Astro 7.4 requires Node >= 22.23.4. Cloudflare Pages reads `.node-version` and does not read
`package.json` "engines"; its documented default (22.16.0) is too old (Cloudflare build-image docs, checked
19 Nov 2026). The same file drives the CI Node version.

## 2026-11-19: Content checks read the files themselves, with the same schemas

`scripts/check-content.ts` parses front matter with `yaml` and validates with the schemas in
`src/lib/schemas.ts`, which `src/content.config.ts` also uses, so there is one definition of each shape.
Shape lives in the schemas; rules across fields or entries live in `src/lib/checks.ts`. Data files that do
not exist yet are skipped by the check, because the pages that use them import them directly, so a missing
file already fails `astro build`.

## 2026-11-19: Browser tests use the installed Google Chrome

Playwright runs with `channel: 'chrome'`. Chrome is present locally and on GitHub's ubuntu-24.04 runners
(runner-image release notes list Google Chrome), so CI needs no browser download.

## 2026-11-19: `astro preview --ignore-lock` in the Playwright web server

Astro 7 moves `astro preview` to the background when it detects an AI agent, so Playwright saw the command
exit and failed. `--ignore-lock` keeps a one-off foreground server (comment in Astro's
`dist/cli/preview/index.js`, citing withastro/astro#17903).

## 2026-11-19: Placeholder favicon

Chrome requests `/favicon.ico` on every page and logged a 404 console error. A neutral `favicon.svg` is
linked now; Phase 3 replaces it with an icon drawn from the mascot.

## 2026-11-19: Phase 2 content choices

- DeepWeeds period Jan to Apr 2026 (Leo, 19 Nov 2026). The follow-up investigation stays undated on the page.
- Hero line uses the draft "Data science and AI student at NUS. I build ML systems and find out why they fail." (Leo accepted it as a placeholder; easy to change in `src/data/profile.json`).
- GPA 4.64/5.00 shown "as of Dec 2025": the CV lists it and has nothing dated later. **Leo to confirm** the current figure and month.
- The internship is listed as "Singapore public-sector agency", without the employer's name, until Leo confirms what may be published (plan section 10, open item 1).
- The Fitness and Drill Instructor role (SPF, Jan 2022 to Nov 2023) is shown: Leo confirmed on 19 Nov 2026 that the SPF name may appear. Per plan section 10, open item 12, it is the first timeline row on the About slide and the IBM row moved off the timeline (the certificate is still on the Skills slide). The acronym is kept as written on the CV.
- No stub files for UN Voting, Airline Tweets, POLLUX or the Hugging Face capstone yet: the schema requires facts (period, role, kind) the sources do not give. The plan's section 8.4 remains the backlog.

## 2026-11-19: The deck is off on phones with the current content

The About slide renders about 1,130 to 1,220 px tall on 360x640 and 390x844 phones, so the safety valve turns the deck off and phones scroll normally; desktop and laptop screens snap slide by slide. Options for Leo in Phase 3: accept it, or split About into two slides (the plan allows up to seven).

## 2026-11-19: Contrast is a test, not a claim

`src/lib/contrast.ts` computes WCAG contrast ratios; `tests/unit/contrast.test.ts` fails if any text pair in `tokens.css` drops below 4.5:1 or the focus colour below 3:1 (WCAG 2.x SC 1.4.3 and 1.4.11 thresholds).
