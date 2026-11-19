/**
 * Site data, validated at build time. Importing a JSON file that is missing or invalid fails
 * `astro build`; the cross-entry rules run earlier in scripts/check-content.ts.
 */
import { getCollection } from 'astro:content';
import educationJson from '../data/education.json';
import experienceJson from '../data/experience.json';
import profileJson from '../data/profile.json';
import { compareProjects, shortTitle } from './format.ts';
import { educationSchema, experienceSchema, profileSchema } from './schemas.ts';

export const profile = profileSchema.parse(profileJson);
export const education = educationSchema.parse(educationJson);
export const experience = experienceSchema.parse(experienceJson).filter((x) => x.showOnSite);

export async function visibleProjects() {
  const all = await getCollection('projects', (p) => !p.data.hidden);
  return all.sort((a, b) => compareProjects(a.data, b.data));
}

/** Certificates and courses: in-progress first, then newest first. */
export async function learningEntries() {
  const all = await getCollection('learning');
  return all.sort((a, b) => {
    if (a.data.status !== b.data.status) return a.data.status === 'in-progress' ? -1 : 1;
    return (b.data.date ?? '').localeCompare(a.data.date ?? '');
  });
}

export interface Target {
  href: string;
  label: string;
}

/**
 * Where an evidence or story reference points. The content check has already confirmed every
 * reference resolves to a visible entry, so a miss here is a programming error.
 */
export async function resolveTargets(): Promise<(id: string) => Target> {
  const map = new Map<string, Target>();
  for (const p of await visibleProjects()) {
    map.set(p.id, { href: `/projects/${p.id}/`, label: shortTitle(p.data.title) });
  }
  for (const l of await learningEntries())
    map.set(l.id, { href: '/#learning', label: l.data.title });
  for (const x of experience) map.set(x.id, { href: '/#about', label: x.title });
  return (id) => {
    const t = map.get(id);
    if (!t) throw new Error(`unresolved reference "${id}"`);
    return t;
  };
}
