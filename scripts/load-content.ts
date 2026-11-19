/**
 * Reads the site's content from disk and validates each file against its schema.
 * Used by scripts/check-content.ts and by the unit tests (with fixture roots).
 *
 * Data files that do not exist are skipped: the pages that use them import them
 * directly, so a missing file already fails `astro build`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { z } from 'astro/zod';
import type { ContentSet, Entry } from '../src/lib/checks.ts';
import {
  educationSchema,
  experienceSchema,
  learningSchema,
  profileSchema,
  projectSchema,
  replaySchema,
} from '../src/lib/schemas.ts';

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;

export interface Loaded {
  content: ContentSet;
  /** Schema and parse errors. Non-empty means the content set is incomplete. */
  errors: string[];
}

export function loadContent(root: string): Loaded {
  const errors: string[] = [];
  const rel = (p: string) => relative(root, p);

  function validate<T>(schema: z.ZodType<T>, raw: unknown, file: string): T | undefined {
    const r = schema.safeParse(raw);
    if (r.success) return r.data;
    for (const issue of r.error.issues) {
      const where = issue.path.length ? issue.path.join('.') : '(root)';
      errors.push(`${file}: ${where}: ${issue.message}`);
    }
    return undefined;
  }

  function listFiles(dir: string, ext: string): string[] {
    const abs = join(root, dir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs)
      .filter((f) => f.endsWith(ext))
      .sort()
      .map((f) => join(abs, f));
  }

  function markdownCollection<T>(dir: string, schema: z.ZodType<T>): Entry<T>[] {
    const out: Entry<T>[] = [];
    for (const path of listFiles(dir, '.md')) {
      const file = rel(path);
      const match = FRONT_MATTER.exec(readFileSync(path, 'utf8'));
      if (!match) {
        errors.push(`${file}: missing front matter`);
        continue;
      }
      let raw: unknown;
      try {
        raw = parseYaml(match[1] ?? '');
      } catch (e) {
        errors.push(`${file}: front matter is not valid YAML (${(e as Error).message})`);
        continue;
      }
      const data = validate(schema, raw, file);
      if (data !== undefined)
        out.push({ id: basename(path, '.md'), file, data, body: match[2] ?? '' });
    }
    return out;
  }

  function jsonFile<T>(path: string, schema: z.ZodType<T>, id: string): Entry<T> | undefined {
    const file = rel(path);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path, 'utf8'));
    } catch (e) {
      errors.push(`${file}: not valid JSON (${(e as Error).message})`);
      return undefined;
    }
    const data = validate(schema, raw, file);
    return data === undefined ? undefined : { id, file, data };
  }

  function optionalJson<T>(name: string, schema: z.ZodType<T>): Entry<T> | undefined {
    const path = join(root, 'src/data', name);
    return existsSync(path) ? jsonFile(path, schema, name) : undefined;
  }

  const projects = markdownCollection('src/content/projects', projectSchema);
  const learning = markdownCollection('src/content/learning', learningSchema);
  const replays = listFiles('src/data/demos', '.json')
    .map((p) => jsonFile(p, replaySchema, basename(p)))
    .filter((e) => e !== undefined);

  const content: ContentSet = {
    projects,
    learning,
    replays,
    publicFileExists: (p) => existsSync(join(root, 'public', p)),
  };
  const profile = optionalJson('profile.json', profileSchema);
  const education = optionalJson('education.json', educationSchema);
  const experience = optionalJson('experience.json', experienceSchema);
  if (profile) content.profile = profile;
  if (education) content.education = education;
  if (experience) content.experience = experience;

  return { content, errors };
}
