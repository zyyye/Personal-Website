/**
 * Each test starts from the valid fixture set, breaks one thing, and expects the matching
 * message from scripts/check-content.ts (plan section 7). The valid set itself must pass.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runChecks } from '../../src/lib/checks.ts';
import { loadContent } from '../../scripts/load-content.ts';
import { copyFixture, editFile, editJson, VALID_ROOT } from './helpers.ts';

const PROJECT = 'src/content/projects/sample-project.md';
const PROFILE = 'src/data/profile.json';
const REPLAY = 'src/data/demos/sample-replay.json';

function problems(root: string): string[] {
  const { content, errors } = loadContent(root);
  return [...errors, ...runChecks(content)];
}

function expectProblem(root: string, pattern: RegExp): void {
  const found = problems(root);
  expect(
    found.some((p) => pattern.test(p)),
    `expected ${pattern} in:\n${found.join('\n')}`,
  ).toBe(true);
}

describe('valid fixture', () => {
  it('passes every schema and check', () => {
    expect(problems(VALID_ROOT)).toEqual([]);
  });
});

describe('schema errors (required fields and formats)', () => {
  it('a missing required field fails', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'role: Wrote every part of this example.\n', '');
    expectProblem(root, /sample-project\.md: role: /);
  });
  it('a Result without metric fails', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'metric: test accuracy, ', '');
    expectProblem(root, /results\.0\.metric/);
  });
  it('a Result without n fails', () => {
    const root = copyFixture();
    editFile(root, PROJECT, ', n: 100 test items', '');
    expectProblem(root, /results\.0\.n/);
  });
  it('a summary over 160 characters fails', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'summary: An example', `summary: ${'x'.repeat(160)} An example`);
    expectProblem(root, /summary/);
  });
  it('a malformed external link in a field fails', () => {
    const root = copyFixture();
    editJson(root, PROFILE, (p) => (p.linkedin = 'linkedin.com/in/example'));
    expectProblem(root, /profile\.json: linkedin/);
  });
});

describe('section 7 rules', () => {
  it('complete project with empty limitations', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'limitations: [It is an example.]', 'limitations: []');
    expectProblem(root, /requires at least one limitation/);
  });
  it('placeholder text in a published entry', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'Body text', 'TODO body text');
    expectProblem(root, /placeholder text/);
  });
  it('placeholder text in a hidden entry is allowed', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'hidden: false', 'hidden: true');
    editFile(root, PROJECT, 'Body text', 'TBD body text');
    editJson(root, PROFILE, (p) => {
      // The hidden project can no longer be cited as evidence; point at other entries.
      p.about.talent[0].evidence = 'sample-course';
      p.about.story[2].ref = undefined;
    });
    editFile(root, 'src/content/learning/sample-course.md', 'relatedProject: sample-project\n', '');
    expect(problems(root).filter((p) => /placeholder/.test(p))).toEqual([]);
  });
  it('results without evidence', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'evidence: [tests/fixtures/README.md]', 'evidence: []');
    expectProblem(root, /has results but no evidence/);
  });
  it('malformed link in the body', () => {
    const root = copyFixture();
    editFile(root, PROJECT, '(https://example.com/page)', '(https://)');
    expectProblem(root, /malformed link/);
  });
  it('more than three featured projects', () => {
    const root = copyFixture();
    for (const n of [2, 3, 4]) {
      copyFileSync(join(root, PROJECT), join(root, `src/content/projects/sample-project-${n}.md`));
    }
    expectProblem(root, /4 featured projects/);
  });
});

describe('highlighted results (the bar chart)', () => {
  it('a highlighted result on the shared metric passes', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'n: 100 test items }', 'n: 100 test items, highlight: true }');
    expect(problems(root)).toEqual([]);
  });
  it('a highlighted value outside 0 to 1 fails', () => {
    const root = copyFixture();
    editFile(
      root,
      PROJECT,
      "value: '0.90', metric: test accuracy, n: 100 test items }",
      "value: '90%', metric: test accuracy, n: 100 test items, highlight: true }",
    );
    expect(problems(root).some((p) => /needs a value between 0 and 1/.test(p))).toBe(true);
  });
  it('highlighted results on two metrics pass (one chart each)', () => {
    const root = copyFixture();
    editFile(
      root,
      PROJECT,
      "  - { label: Example accuracy, value: '0.90', metric: test accuracy, n: 100 test items }",
      "  - { label: Example accuracy, value: '0.90', metric: test accuracy, n: 100 test items, highlight: true }\n  - { label: Example F1, value: '0.80', metric: test macro-F1, n: 100 test items, highlight: true }",
    );
    expect(problems(root)).toEqual([]);
  });
  it('highlighted results on three metrics fail', () => {
    const root = copyFixture();
    editFile(
      root,
      PROJECT,
      "  - { label: Example accuracy, value: '0.90', metric: test accuracy, n: 100 test items }",
      "  - { label: Example accuracy, value: '0.90', metric: test accuracy, n: 100 test items, highlight: true }\n  - { label: Example F1, value: '0.80', metric: test macro-F1, n: 100 test items, highlight: true }\n  - { label: Example recall, value: '0.70', metric: test recall, n: 100 test items, highlight: true }",
    );
    expect(problems(root).some((p) => /use 3 metrics \(max 2/.test(p))).toBe(true);
  });
});

describe('replay integrity', () => {
  it('a changed character in rawText fails (hash and join)', () => {
    const root = copyFixture();
    editJson(
      root,
      REPLAY,
      (r) => (r.cases[0].output.rawText = r.cases[0].output.rawText.replace('3', '4')),
    );
    expectProblem(root, /SHA-256 does not match/);
    expectProblem(root, /joined events differ/);
  });
  it('totalMs smaller than the last event fails', () => {
    const root = copyFixture();
    editJson(root, REPLAY, (r) => (r.cases[0].timing.totalMs = 10));
    expectProblem(root, /totalMs is smaller/);
  });
  it('zero cases fails', () => {
    const root = copyFixture();
    editJson(root, REPLAY, (r) => (r.cases = []));
    expectProblem(root, /zero cases/);
  });
  it('cases not fixed before the run fails', () => {
    const root = copyFixture();
    editJson(root, REPLAY, (r) => (r.run.casesFixedBeforeRun = false));
    expectProblem(root, /casesFixedBeforeRun must be true/);
  });
  it('a case without plantedFlaws fails', () => {
    const root = copyFixture();
    editJson(root, REPLAY, (r) => delete r.cases[0].plantedFlaws);
    expectProblem(root, /plantedFlaws/);
  });
  it('fixture data used by a published entry fails', () => {
    const root = copyFixture();
    editJson(root, REPLAY, (r) => (r.run.fixture = true));
    expectProblem(root, /published entry uses fixture replay data/);
  });
  it('a missing replay file fails', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'dataFile: sample-replay.json', 'dataFile: missing.json');
    expectProblem(root, /not found in src\/data\/demos/);
  });
  it('an organisation logo that is not in public/ fails', () => {
    const root = copyFixture();
    editFile(
      root,
      PROJECT,
      'tags: [testing]\n',
      'tags: [testing]\norganisation:\n  name: Example employer\n  logo: { src: /images/missing-logo.png, alt: Example logo, width: 100, height: 40 }\n',
    );
    expectProblem(root, /organisation\.logo\.src "\/images\/missing-logo\.png" does not exist/);
  });
  it('a deck skill that is not in skills fails', () => {
    const root = copyFixture();
    editFile(
      root,
      PROJECT,
      'tags: [testing]\n',
      'tags: [testing]\nskills: [Testing]\ndeckSkills: [Debugging]\n',
    );
    expectProblem(root, /deckSkills "Debugging" is not in skills/);
  });
});

describe('profile and About slide (section 8.7)', () => {
  it('cv.ready without public/cv.pdf fails', () => {
    const root = copyFixture();
    editJson(root, PROFILE, (p) => (p.cv.ready = true));
    expectProblem(root, /cv\.ready is true but public\/cv\.pdf does not exist/);
  });
  it('talent evidence must resolve to a visible entry', () => {
    const root = copyFixture();
    editJson(root, PROFILE, (p) => (p.about.talent[2].evidence = 'hidden-job'));
    expectProblem(root, /evidence "hidden-job" is not a visible entry/);
  });
  it('talent needs 3 to 4 points', () => {
    const root = copyFixture();
    editJson(root, PROFILE, (p) => p.about.talent.pop());
    expectProblem(root, /about\.talent has 2 points/);
  });
  it('a talent point over 16 words fails', () => {
    const root = copyFixture();
    editJson(root, PROFILE, (p) => (p.about.talent[0].text = 'word '.repeat(17)));
    expectProblem(root, /talent\[0\] is over 16 words/);
  });
  it('story needs 4 to 5 rows', () => {
    const root = copyFixture();
    editJson(root, PROFILE, (p) => p.about.story.pop());
    expectProblem(root, /about\.story has 3 rows/);
  });
  it('ambitionWhy over 25 words fails', () => {
    const root = copyFixture();
    editJson(root, PROFILE, (p) => (p.about.ambitionWhy = 'word '.repeat(26)));
    expectProblem(root, /ambitionWhy is over 25 words/);
  });
  it('gpa without gpaAsOf fails', () => {
    const root = copyFixture();
    editJson(root, 'src/data/education.json', (e) => delete e[0].gpaAsOf);
    expectProblem(root, /gpa and gpaAsOf together/);
  });
});

describe('command line', () => {
  it('exits 1 and names the problem when a required field is missing', () => {
    const root = copyFixture();
    editFile(root, PROJECT, 'role: Wrote every part of this example.\n', '');
    const script = resolve(import.meta.dirname, '../../scripts/check-content.ts');
    const r = spawnSync(process.execPath, [script, root], { encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/role/);
  });
  it('exits 0 on the valid fixture', () => {
    const script = resolve(import.meta.dirname, '../../scripts/check-content.ts');
    const r = spawnSync(process.execPath, [script, VALID_ROOT], { encoding: 'utf8' });
    expect(r.status, r.stderr).toBe(0);
  });
});
