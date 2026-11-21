/**
 * Cross-field and cross-entry content rules (plan section 7 and section 8.7).
 * Pure functions: they take already-parsed content and return error messages.
 * Build-time only; never imported by client code.
 */
import { createHash } from 'node:crypto';
import { leadingNumber } from './pages.ts';
import type { Education, Experience, Learning, Profile, Project, ReplayFile } from './schemas.ts';

export interface Entry<T> {
  /** Entry ID: the file name without extension (projects, learning) or the file name (replays). */
  id: string;
  /** Path shown in error messages. */
  file: string;
  data: T;
  /** Markdown body, for collection entries. */
  body?: string;
}

export interface ContentSet {
  projects: Entry<Project>[];
  learning: Entry<Learning>[];
  replays: Entry<ReplayFile>[];
  profile?: Entry<Profile>;
  education?: Entry<Education>;
  experience?: Entry<Experience>;
  /** True if `public/<path>` exists. `path` starts with '/'. */
  publicFileExists: (path: string) => boolean;
}

export const LIMITS = {
  maxFeatured: 3,
  maxHighlightedResults: 6,
  /** Each metric gets its own bar chart on the deck page; more than two would not fit. */
  maxHighlightedMetrics: 2,
  talentMin: 3,
  talentMax: 4,
  talentWords: 16,
  storyMin: 4,
  storyMax: 5,
  storyWords: 10,
  ambitionWhyWords: 25,
  noteWords: 50,
  /** Grouped chart: at most this many level-and-metric groups, and series (bars per group). */
  groupedMaxGroups: 6,
  groupedMaxSeries: 3,
} as const;

/**
 * A grouped chart compares the same series (row labels) on several metrics, so every group
 * (level and metric) must have exactly one highlighted row per series.
 */
export function groupedChartErrors(
  file: string,
  rows: readonly { label: string; metric: string; level?: string | undefined }[],
): string[] {
  const errors: string[] = [];
  const series = [...new Set(rows.map((r) => r.label))];
  const groups = [...new Set(rows.map((r) => `${r.level ?? ''}|${r.metric}`))];
  if (series.length < 2 || series.length > LIMITS.groupedMaxSeries) {
    errors.push(
      `${file}: a grouped chart needs 2 to ${LIMITS.groupedMaxSeries} series, found ${series.length}`,
    );
  }
  if (groups.length > LIMITS.groupedMaxGroups) {
    errors.push(
      `${file}: a grouped chart has ${groups.length} groups (max ${LIMITS.groupedMaxGroups})`,
    );
  }
  for (const g of groups) {
    const labels = rows.filter((r) => `${r.level ?? ''}|${r.metric}` === g).map((r) => r.label);
    if (labels.length !== series.length || new Set(labels).size !== series.length) {
      errors.push(`${file}: grouped chart group "${g}" needs exactly one row per series`);
    }
  }
  return errors;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER = /\bTODO\b|\bTBD\b|\blorem\b/i;
const MD_LINK = /\]\((https?:[^)\s]*)\)/g;

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

/** Every string inside a value, with a dotted path for error messages. */
function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function placeholderErrors(file: string, data: unknown, body?: string): string[] {
  const errs = strings(data)
    .filter(([, s]) => PLACEHOLDER.test(s))
    .map(([p]) => `${file}: placeholder text (TODO, TBD or lorem) in ${p}`);
  if (body !== undefined && PLACEHOLDER.test(body)) {
    errs.push(`${file}: placeholder text (TODO, TBD or lorem) in the body`);
  }
  return errs;
}

export function runChecks(c: ContentSet): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(msg);

  // Entry IDs come from file names and are used in URLs and cross-references.
  for (const e of [...c.projects, ...c.learning]) {
    if (!SLUG.test(e.id)) err(`${e.file}: file name must be a kebab-case slug (got "${e.id}")`);
  }

  const visibleProjects = c.projects.filter((p) => !p.data.hidden);
  const visibleProjectIds = new Set(visibleProjects.map((p) => p.id));

  // --- Projects ---
  for (const p of c.projects) {
    const d = p.data;
    if ((d.status === 'complete' || d.status === 'being-improved') && d.limitations.length === 0) {
      err(`${p.file}: status "${d.status}" requires at least one limitation`);
    }
    if (d.results && d.results.length > 0 && d.evidence.length === 0) {
      err(`${p.file}: has results but no evidence`);
    }
    const highlighted = (d.results ?? []).filter((r) => r.highlight);
    if (d.flow && highlighted.length > 0) {
      err(`${p.file}: has both a flow and highlighted results; the deck page shows only one`);
    }
    if ((d.resultsChart ?? 'bars') === 'bars') {
      if (highlighted.length > LIMITS.maxHighlightedResults) {
        err(
          `${p.file}: ${highlighted.length} highlighted results (max ${LIMITS.maxHighlightedResults})`,
        );
      }
      const metrics = new Set(highlighted.map((r) => r.metric)).size;
      if (metrics > LIMITS.maxHighlightedMetrics) {
        err(
          `${p.file}: highlighted results use ${metrics} metrics (max ${LIMITS.maxHighlightedMetrics}, one bar chart each)`,
        );
      }
    } else {
      errors.push(...groupedChartErrors(p.file, highlighted));
    }
    for (const r of highlighted) {
      const n = leadingNumber(r.value);
      if (n === null || n < 0 || n > 1) {
        err(`${p.file}: highlighted result "${r.label}" needs a value between 0 and 1`);
      }
    }
    if (d.period.end && d.period.end < d.period.start) {
      err(`${p.file}: period.end is before period.start`);
    }
    const logo = d.organisation?.logo;
    if (logo && !c.publicFileExists(logo.src)) {
      err(`${p.file}: organisation.logo.src "${logo.src}" does not exist in public/`);
    }
    for (const s of d.deckSkills ?? []) {
      if (!d.skills?.includes(s)) err(`${p.file}: deckSkills "${s}" is not in skills`);
    }
    if (!d.hidden) errors.push(...placeholderErrors(p.file, d, p.body));
    for (const m of (p.body ?? '').matchAll(MD_LINK)) {
      const url = m[1] ?? '';
      if (!URL.canParse(url)) err(`${p.file}: malformed link "${url}" in the body`);
    }
  }

  const featured = visibleProjects.filter((p) => p.data.featured);
  if (featured.length > LIMITS.maxFeatured) {
    err(
      `projects: ${featured.length} featured projects (max ${LIMITS.maxFeatured}): ` +
        featured.map((p) => p.id).join(', '),
    );
  }

  // --- Learning ---
  for (const l of c.learning) {
    errors.push(...placeholderErrors(l.file, l.data, l.body));
    const rel = l.data.relatedProject;
    if (rel && !visibleProjectIds.has(rel)) {
      err(`${l.file}: relatedProject "${rel}" is not a visible project`);
    }
    const image = l.data.image;
    if (image && !c.publicFileExists(image.src)) {
      err(`${l.file}: image.src "${image.src}" does not exist in public/`);
    }
  }

  // --- Replays ---
  const replayById = new Map(c.replays.map((r) => [r.id, r]));
  for (const r of c.replays) {
    const d = r.data;
    if (d.cases.length === 0) err(`${r.file}: has zero cases`);
    if (!d.run.casesFixedBeforeRun) err(`${r.file}: run.casesFixedBeforeRun must be true`);
    for (const k of d.cases) {
      const where = `${r.file}: case "${k.id}"`;
      const joined = k.timing.events.map((e) => e.text).join('');
      if (joined !== k.output.rawText) err(`${where}: joined events differ from output.rawText`);
      if (sha256(k.output.rawText) !== k.output.sha256)
        err(`${where}: SHA-256 does not match rawText`);
      let prev = 0;
      for (const e of k.timing.events) {
        if (e.tMs < prev) err(`${where}: event times decrease (${e.tMs} after ${prev})`);
        prev = e.tMs;
      }
      if (k.timing.totalMs < prev) err(`${where}: totalMs is smaller than the last event's tMs`);
    }
  }
  for (const p of c.projects) {
    const demo = p.data.demo;
    if (demo?.kind !== 'replay') continue;
    const r = replayById.get(demo.dataFile);
    if (!r) {
      err(`${p.file}: demo.dataFile "${demo.dataFile}" not found in src/data/demos/`);
    } else if (!p.data.hidden && r.data.run.fixture) {
      err(`${p.file}: published entry uses fixture replay data (${r.file})`);
    }
  }

  // --- Profile, education, experience ---
  const visibleExperienceIds = new Set(
    (c.experience?.data ?? []).filter((x) => x.showOnSite).map((x) => x.id),
  );
  const visibleTargets = new Set([
    ...visibleProjectIds,
    ...c.learning.map((l) => l.id),
    ...visibleExperienceIds,
  ]);

  if (c.profile) {
    const { file, data } = c.profile;
    errors.push(...placeholderErrors(file, data));
    if (data.cv.ready && !c.publicFileExists(data.cv.path)) {
      err(`${file}: cv.ready is true but public${data.cv.path} does not exist`);
    }
    for (const a of data.availability) {
      if (a.end < a.start) err(`${file}: availability "${a.label}" ends before it starts`);
    }

    const { talent, story, ambitionWhy } = data.about;
    if (talent.length < LIMITS.talentMin || talent.length > LIMITS.talentMax) {
      err(
        `${file}: about.talent has ${talent.length} points (${LIMITS.talentMin} to ${LIMITS.talentMax} allowed)`,
      );
    }
    talent.forEach((t, i) => {
      if (wordCount(t.text) > LIMITS.talentWords) {
        err(`${file}: about.talent[${i}] is over ${LIMITS.talentWords} words`);
      }
      if (!visibleTargets.has(t.evidence)) {
        err(`${file}: about.talent[${i}].evidence "${t.evidence}" is not a visible entry`);
      }
    });
    if (story.length < LIMITS.storyMin || story.length > LIMITS.storyMax) {
      err(
        `${file}: about.story has ${story.length} rows (${LIMITS.storyMin} to ${LIMITS.storyMax} allowed)`,
      );
    }
    story.forEach((s, i) => {
      if (wordCount(s.text) > LIMITS.storyWords) {
        err(`${file}: about.story[${i}] is over ${LIMITS.storyWords} words`);
      }
      if (s.ref && !visibleTargets.has(s.ref)) {
        err(`${file}: about.story[${i}].ref "${s.ref}" is not a visible entry`);
      }
    });
    if (ambitionWhy && wordCount(ambitionWhy) > LIMITS.ambitionWhyWords) {
      err(`${file}: about.ambitionWhy is over ${LIMITS.ambitionWhyWords} words`);
    }
    const note = data.about.note;
    if (note && wordCount(note) > LIMITS.noteWords) {
      err(`${file}: about.note is over ${LIMITS.noteWords} words`);
    }
  }

  if (c.education) {
    const { file, data } = c.education;
    errors.push(...placeholderErrors(file, data));
    for (const e of data) {
      if ((e.gpa === undefined) !== (e.gpaAsOf === undefined)) {
        err(`${file}: "${e.id}" must set gpa and gpaAsOf together`);
      }
      if (e.end && e.end < e.start) err(`${file}: "${e.id}" ends before it starts`);
    }
  }

  if (c.experience) {
    const { file, data } = c.experience;
    errors.push(
      ...placeholderErrors(
        file,
        data.filter((x) => x.showOnSite),
      ),
    );
    for (const x of data) {
      if (x.end && x.end < x.start) err(`${file}: "${x.id}" ends before it starts`);
    }
  }

  return errors;
}
