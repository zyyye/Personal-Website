/**
 * Build-time content checks (plan section 7). Runs before `astro build`.
 * Usage: node scripts/check-content.ts [root]   (root defaults to the current directory)
 * Exit code 1 and a list of problems if anything fails.
 */
import { resolve } from 'node:path';
import { runChecks } from '../src/lib/checks.ts';
import { loadContent } from './load-content.ts';

const root = resolve(process.argv[2] ?? '.');
const { content, errors } = loadContent(root);
const problems = [...errors, ...runChecks(content)];

const counts =
  `${content.projects.length} projects, ${content.learning.length} learning entries, ` +
  `${content.replays.length} replay files`;

if (problems.length > 0) {
  console.error(`check-content: ${problems.length} problem(s) (${counts}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check-content: OK (${counts})`);
