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
- GPA 4.64/5.00 shown "as of Nov 2026": Leo confirmed on 19 Nov 2026 that it is current. Update `gpa` and `gpaAsOf` together in `src/data/education.json` when results change.
- The internship is listed as "Singapore public-sector agency", without the employer's name, until Leo confirms what may be published (plan section 10, open item 1).
- The Fitness and Drill Instructor role (SPF, Jan 2022 to Nov 2023) is shown: Leo confirmed on 19 Nov 2026 that the SPF name may appear. Per plan section 10, open item 12, it is the first timeline row on the About slide and the IBM row moved off the timeline (the certificate is still on the Skills slide). The acronym is kept as written on the CV.
- No stub files for UN Voting, Airline Tweets, POLLUX or the Hugging Face capstone yet: the schema requires facts (period, role, kind) the sources do not give. The plan's section 8.4 remains the backlog.

## 2026-11-19: The deck is off on phones with the current content

The About slide renders about 1,130 to 1,220 px tall on 360x640 and 390x844 phones, so the safety valve turns the deck off and phones scroll normally; desktop and laptop screens snap slide by slide. Decided by Leo (19 Nov 2026): accept it. Phones scroll normally; the About slide stays one slide.

## 2026-11-19: Contrast is a test, not a claim

`src/lib/contrast.ts` computes WCAG contrast ratios; `tests/unit/contrast.test.ts` fails if any text pair in `tokens.css` drops below 4.5:1 or the focus colour below 3:1 (WCAG 2.x SC 1.4.3 and 1.4.11 thresholds).

## 2026-11-19: Phase 3 design system (palette A chosen by Leo)

- Palette A, "Night Shift". Roles: amber for anything clickable, cyan for structure (window title bars, section headings). Dark text on cyan and amber is also contrast-tested.
- Type: Silkscreen (pixel face) for the name, window titles, project names and buttons only; Atkinson Hyperlegible Next for everything else, including section headings and the email address, because Silkscreen draws every letter as a capital. Both self-hosted from `@fontsource` (SIL Open Font License 1.1), Latin subset only.
- Windows: a cyan title bar carrying the section's real heading, notched pixel corners and a hard offset shadow, drawn with `box-shadow` (no images). The name in the hero is the one bold element, with a two-step block shadow.
- The desk's dot grid is static and never sits behind body text.

## 2026-11-19: Redesign from the design lab (decided by Leo)

- Theme "Black and mint"; ID-card home page; taskbar design 2, "pixel keys"; Sprout-bot mascot in the taskbar; the name's block shadow steps in a loop. Leo did not answer the defaults question, so the lab's defaults were kept for mascot, name motion, transition, accent and label style; each is a one-line change.
- **Navigation:** one page per project, internship and achievement. Scrolling, swiping and keys move one page; the taskbar jumps to a group's first page or one page up or down (Leo: "both scroll and click"). The order comes from one pure function, `src/lib/pages.ts`, read by the pages, the taskbar and the script. This replaces the plan's five fixed slides and its cap of seven: the deck grows by one page per item.
- **Achievements** are learning entries of kind certificate or course; exchange courses stay on the About page. An achievement page shows only real content (no placeholder is ever published): Leo adds `summary` and `credentialUrl`.
- **Charts:** a project's bar chart is its results marked `highlight: true`; the content check requires one shared metric on a 0 to 1 scale and at most six bars.
- **Position in a group** ("Achievements 2 of 3") is rendered on the page at build time rather than in the taskbar: always correct, no JavaScript, and it keeps the taskbar within 360 px.
- **Motion exception to plan section 3A, rule 5 (no loops by default):** Leo chose a moving name. It runs only while the script shows a Pause motion button (WCAG 2.2.2), never without JavaScript or with reduced motion, and only at 64rem and wider.
- **Narrow screens:** taskbar keys show icons only below 56rem (names kept for assistive technology); the mascot is hidden below 30rem.

## 2026-11-20: Content update after LogicLens v2 (decided by Leo)

- **LogicLens results published (Option A of the project doc `claude/logiclens-v2-site-brief.md`).** The v2 scores are shown with their caveats, including two reference rows for rules that read no text. No LogicLens row is highlighted, so no bar chart draws the eye to a 1.00 that carries a large caveat. The "results withheld" card disappears on its own because `results` now exists.
- **Employer named.** Leo confirmed he may show the CNB name and logo, so plan section 8.2's employer exception now applies on the site. The project schema gained an optional `organisation` (name, plus a logo in `public/` that the content check requires to exist), shown on the internship page and the case study on a white plate so a logo drawn for white pages stays legible. The rest of the off-site terms list still applies; the e2e check removes only the employer's name before testing. The logo file is not in the repo yet: the build workspace could not download it. Name the file without the off-site words (for example `/images/internship-logo.png`).
- **Internship before Projects** in the deck and taskbar. "See my work" opens the first work page in deck order, now the internship.
- **Home page:** a new headline aimed at tech hiring (NLP, computer vision, LLM fine-tuning, agentic AI), focus chips under it, and a Languages row on the lab pass (`profile.focus`, `profile.languages`, both optional in the schema). The agentic AI wording is "now learning to build AI agents" until the Hugging Face capstone exists. The home page also carries schema.org `Person` data built from `profile.json`, so search engines and AI screening tools read the same facts as people.
- **About:** a fourth talent point (the evaluation audit, evidence LogicLens). The May 2026 timeline row names CNB.
- **New project page: Tweet Sentiment** (Airline Tweets NLP on LinkedIn and the CV). Facts come from Leo's LinkedIn entry and the IT1244 report attached to it. Macro-F1 is the headline metric because 63% of the tweets are negative; it is the mean of the report's rounded per-class F1 scores. The majority-class baseline uses the public dataset's class counts (9,178 negative of 14,640). Teammates stay unnamed (plan section 10, open item 3).
- **Writing style:** each case study now opens with outcome-first "At a glance" bullets, then "How it evolved", which explains each change and why it was made. Numbers are unchanged from the sources.
- The results table shows "± is the standard deviation across seeds" only when a value contains ±, and its header cells no longer wrap.

## 2026-11-21: Deck polish (decided by Leo)

- **Lab pass:** the label, name and status beside the photo sit lower (bottom-aligned with a small inset) and further from the photo (2.5rem gap from 30rem up).
- **Taskbar counts:** the Internship, Projects and Achievements keys show how many pages they hold, e.g. "Projects (2)". Home, About and Contact are single pages and show none. The count sits inside the label, so it hides with the label on narrow screens but stays in the key's accessible name.
- **LogicLens results on the deck page:** the zero-shot and fine-tuned rows are highlighted, so the internship page shows two bar charts: window accuracy (0.69 against 1.00) and F1 on contradiction turns (0.14 against 0.35). The reference rules stay in the case-study table. Highlighted results may now use up to two metrics, with one chart each (`LIMITS.maxHighlightedMetrics`). Every project page with charts links to its case study's Limitations section. The tile details were shortened so the page still fits 1280 by 800.
- **CNB logo:** Leo supplied the official logo (white background). It was cropped to its content, resized to 288 px and reduced to a 64-colour palette (22 KB) as `public/images/internship-logo.png`. It sits beside the page title on a white plate.

## 2026-11-21 (later): Third polish round (decided by Leo)

- **Home:** GPA shows without its "as of" month (`gpaAsOf` stays in the data). The text beside the photo is centred on it, with the same gap. The facts sit 1.75rem below the photo, matching the card's side padding. Languages are now Python, Java, C++, R, SQL and HTML (Leo states R and SQL; plan 8.6's "no SQL" note no longer applies). A Tools row lists LinkedIn tools (PyTorch, Hugging Face, pandas, NumPy, Plotly, Tableau, Git). New focus chip: AI-assisted engineering.
- **LogicLens:** status Complete. Internship dates show their length, e.g. "May to Aug 2026 (4 months)" (`formatPeriod`). The logo is a square as tall as the title block, from the top of the title's letters to the end of the meta line. `src/scripts/logo-fit.ts` measures the block, because its height depends on how the text wraps beside the logo; without JavaScript the logo keeps an 8rem default. The tiles run in one row along the bottom.
- **LogicLens results chart:** new `resultsChart: grouped` mode. It is one chart comparing series (zero-shot against fine-tuned) on several metrics, grouped by level: window-level accuracy, precision, recall and F1, plus turn-level F1. The window-level precision, recall and F1 rows were added from the v2 evaluation summaries (zero-shot 0.82, 0.47 and 0.60; fine-tuned 1.00 each). The content check requires one row per series in every group.
- **DeepWeeds:** the "Reproduction of that recipe" bar left the chart (the row stays in the table). The modern-recipe AlexNet is relabelled "AlexNet (Improved pipeline)" (0.870 macro-F1, 0.903 accuracy) and charted.
- **Skills:** projects gained an optional `skills` list (LinkedIn skill names where they apply), shown with the stack as chips in the case-study header. Stack chips on the deck pages are bolder, with a white frame.
- **Page turns:** the step keys, and in deck mode the mouse wheel, paging keys and links to a page, use one eased animation of 650 ms. The browser's own smooth scroll took about 450 ms in Chromium, measured. This replaces plan 3B rule 5 at Leo's request. It works only in deck mode, never on touch, never with modifier keys or while typing, and is instant with reduced motion. A wheel gesture turns one page; following events are absorbed until the stream goes quiet for 160 ms.
- **About:** an asterisked note under the columns says the site was built through agentic coding and that Leo reviewed the code (`about.note`, at most 50 words).

## 2026-11-21 (evening): Skills on deck pages and a three-line headline (decided by Leo)

- **Deck skills:** a project may list `deckSkills`, a few of its `skills` shown on its deck page before the stack chips, in the same style. The content check requires each one to be in `skills`. Leo chose six for DeepWeeds (computer vision; transfer learning; CNNs and vision transformers; ablation studies; statistical analysis with bootstrap confidence intervals; data annotation) and two for LogicLens (synthetic data generation; prompt engineering).
- **Headline:** `headline` is now a list of sentences, each starting on its own line on the home page. The page description joins them with spaces.

## 2026-11-21 (night): POLLUX project page (decided by Leo)

- **New project:** POLLUX, the NUS Orbital team project (Apr to Aug 2025), is now a full project with a deck page and a case study. This replaces plan 8.4's "keep hidden until there is a demo, screenshot or result", at Leo's request. Sources: the LinkedIn project entry and poster, the NUS credential page, and the public repository `zyyye/POLLUX`.
- **What it claims, and why:**
  - Leo made 83 of the 122 commits.
  - Line authorship shows his parts: sign-in, storage, the data summary, cleaning and the what-if predictions.
  - Leo says the trend forecast was pair-programmed live with his teammate, who typed it, so the site credits the charts and the trend forecast to both.
  - The poster's "on-the-fly LLM pipelines" claim is left out, because the code makes no LLM calls.
  - The teammate stays unnamed.
- **Links:**
  - `links` gains `certificate`.
  - Project links now render as quiet buttons on the deck page (after "Read the case study") and in the case-study header.
  - POLLUX links its source code and its Orbital credential.
  - The live Streamlit app is not linked (Leo): it sleeps and needs a sign-in.
- **Flow:** a project without results may show `flow` (3 to 6 steps) in place of the chart. The content check rejects a project that has both a flow and highlighted results.
- **Not used:** the repository's chart thumbnails (Matplotlib's gallery images) and its GIF (a stock background).
- **Orbital certificate entry:** gains the credential link, a link to the project, and a summary taken from the credential page.

## 2026-11-21 (late night): Orbital certificate image (decided by Leo)

- The Orbital achievement page shows the certificate to the right of the text. It runs from the top of the title's letters to the bottom of the buttons. On narrow screens it sits below the text.
- **Image source:** captured from Leo's NUS credential page as the page draws it: a template image with text over it. There is no single image file to download. Cropped to the certificate (728 × 1003 px) and saved as `public/images/orbital-certificate.webp` (38 KB).
- **Code changes:**
  - Learning entries gain an optional `image`. It uses the same picture shape as the employer logo (`pictureSchema`), and the content check requires the file to exist.
  - `logo-fit.ts` became `fit-height.ts`, with `data-fit-height`, `data-fit-height-text` and `--fit-height`. It now sizes both the employer logo and the certificate.

## 2026-11-24: Hugging Face Agents Course and GAIA capstone (decided by Leo)

- **Course entry:**
  - `hf-agentic-ai-course` is now completed: "Hugging Face Agents Course", Certificate of Excellence, Nov 2026.
  - The certificate is rendered from Leo's PDF to `public/images/hf-agents-certificate.webp` (1200 × 839, 40 KB) and shown beside the text, like Orbital's.
  - Its summary lists the syllabus (agent fundamentals, smolagents, LlamaIndex, LangGraph, agentic RAG, GAIA final project) and links to the capstone.
- **New project `gaia-agent`:**
  - Leo's capstone: a LangGraph agent on Claude with three tools (DuckDuckGo search, Claude's server-side web fetch, an isolated Python runner), attachment handling and exact-match answer parsing.
  - Facts come from the Space's `agent.py`, `app.py` and `requirements.txt`, read 24 Nov 2026. Leo made 8 commits; the other 38 are the course template's. The course pages confirm 20 GAIA level-1 validation questions, exact-match scoring and a 30% pass mark.
  - "Source code" links to `huggingface.co/spaces/cloudykite/Final_Assignment_Template/tree/main`.
  - Leo's exact score isn't public (the leaderboard dataset viewer was unavailable), so the page says only that he passed the 30% bar.
  - It is placed first among projects (order 2); the others moved down one.
- **Home:** new focus chip "Agentic RAG".
- **Achievement images:** a landscape certificate could squeeze the text column, so the image width is capped at 35vw (`--image-ratio` set inline). With the cap, the certificate lines up exactly from 1280 px up. At 1024 px it ends a little above the buttons.
