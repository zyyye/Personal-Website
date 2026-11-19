# Yeo Zhi Yuan: portfolio site

Static site built with Astro 7 and TypeScript. The full design and rules are in the architecture plan
(`claude/website-architecture-plan.md` in the Claude Project); decisions taken while building are in
[`docs/decisions.md`](docs/decisions.md).

## Add a project or a certificate

1. Copy an existing file in `src/content/projects/` or `src/content/learning/` to a new kebab-case name, e.g. `my-project.md`.
2. Fill in every required field in the front matter. Quote dates: `start: '2026-05'`.
3. Run `npm run build`. It fails with a list of problems if anything is missing or inconsistent.
4. Fix what it reports, then commit and push.
5. Nothing else needs changing: cards, lists and links are generated.

## Commands

| Command            | What it does                                                                         |
| ------------------ | ------------------------------------------------------------------------------------ |
| `npm run dev`      | Local dev server                                                                     |
| `npm run build`    | Content checks, then the static build into `dist/`                                   |
| `npm run ci`       | Everything CI runs: format check, lint, type check, unit tests, build, browser tests |
| `npm test`         | Unit tests (Vitest)                                                                  |
| `npm run test:e2e` | Browser tests (Playwright, uses the installed Google Chrome)                         |

Requires Node.js 22.23.4 or later (pinned in `.node-version`).

## Dependencies

| Package                                                            | Why                                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `astro`                                                            | Static site generator, content collections with schema validation |
| `typescript`, `@astrojs/check`                                     | Type checking (TypeScript pinned to 6.0; see decisions)           |
| `yaml`                                                             | Lets the content check read Markdown front matter                 |
| `vitest`                                                           | Unit tests for content rules and deck logic                       |
| `@playwright/test`, `@axe-core/playwright`                         | Browser tests and accessibility scan                              |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro` | Linting                                                           |
| `prettier`, `prettier-plugin-astro`                                | Formatting                                                        |
| `@types/node`                                                      | Node types for scripts and tests                                  |
