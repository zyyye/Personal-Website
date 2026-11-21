/**
 * Content schemas: the single source of truth for content shapes (plan section 5).
 *
 * Used by `src/content.config.ts` (Astro's own build-time validation) and by
 * `scripts/check-content.ts` (cross-entry rules from plan section 7).
 * Schemas describe shape only. Rules that need more than one field or more than
 * one entry live in `src/lib/checks.ts`.
 */
import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const httpsUrl = z.url({ protocol: /^https$/ });

/** 'YYYY-MM' with a real month. Quote it in YAML front matter. */
export const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');

/** Lower-case kebab-case identifier; entry IDs and cross-references use it. */
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected kebab-case slug');

export const resultSchema = z
  .object({
    label: text,
    value: text,
    metric: text,
    level: text.optional(),
    n: text,
    seeds: z.number().int().positive().optional(),
    note: text.optional(),
    /** Shown as a bar on the project's page. All highlighted rows share one metric on a 0 to 1 scale. */
    highlight: z.boolean().optional(),
  })
  .strict();

export const demoSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('replay'), dataFile: text, note: text }).strict(),
  z.object({ kind: z.literal('video'), video: httpsUrl, note: text }).strict(),
  z
    .object({
      kind: z.literal('space'),
      space: httpsUrl,
      fallbackVideo: httpsUrl.optional(),
      note: text,
    })
    .strict(),
]);

export const projectSchema = z
  .object({
    title: text,
    summary: text.max(160),
    status: z.enum(['complete', 'in-progress', 'being-improved', 'planned']),
    featured: z.boolean(),
    order: z.number().int(),
    hidden: z.boolean(),
    period: z.object({ start: yearMonth, end: yearMonth.optional() }).strict(),
    kind: z.enum(['team', 'solo', 'internship']),
    role: text,
    team: z.array(text).optional(),
    tags: z.array(slug),
    stack: z.array(text),
    /** Skills the project shows (named as on LinkedIn where they appear there): case-study chips. */
    skills: z.array(text).min(1).optional(),
    /** The few skills also shown on the project's deck page, before the stack. Each must be in `skills`. */
    deckSkills: z.array(text).min(1).optional(),
    links: z
      .object({
        code: httpsUrl.optional(),
        report: httpsUrl.optional(),
        video: httpsUrl.optional(),
      })
      .strict()
      .optional(),
    demo: demoSchema.optional(),
    results: z.array(resultSchema).optional(),
    /**
     * How the deck page draws the highlighted results. 'bars' (default): one chart per metric.
     * 'grouped': one chart, a group per level and metric, a bar per series (row label) in each, so
     * two models can be compared on several metrics at once.
     */
    resultsChart: z.enum(['bars', 'grouped']).optional(),
    /** Who the work was done for, e.g. an internship's employer. The logo file lives in public/. */
    organisation: z
      .object({
        name: text,
        logo: z
          .object({
            src: z.string().regex(/^\/[\w./-]+\.(png|svg|webp|jpg)$/),
            alt: text,
            width: z.number().int().positive(),
            height: z.number().int().positive(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    /** Up to four short facts shown as tiles on the project's page, e.g. the stages of a pipeline. */
    highlights: z
      .array(z.object({ title: text, detail: text }).strict())
      .max(4)
      .optional(),
    limitations: z.array(text),
    nextSteps: z.array(text).optional(),
    evidence: z.array(text),
  })
  .strict();

export const learningSchema = z
  .object({
    title: text,
    provider: text,
    kind: z.enum(['certificate', 'course', 'exchange-course']),
    status: z.enum(['completed', 'in-progress']),
    date: yearMonth.optional(),
    credentialUrl: httpsUrl.optional(),
    relatedProject: slug.optional(),
    /** Two or three lines in Leo's own words on what it covered and what he built. */
    summary: text.optional(),
  })
  .strict();

export const availabilitySchema = z
  .object({
    label: text,
    start: yearMonth,
    end: yearMonth,
    months: z.number().int().positive(),
  })
  .strict();

export const aboutSchema = z
  .object({
    talent: z.array(z.object({ text: text, evidence: slug }).strict()),
    ambitionWhy: text.optional(),
    /** A footnote under the About columns, shown after an asterisk. */
    note: text.optional(),
    story: z.array(z.object({ when: text, text: text, ref: slug.optional() }).strict()),
  })
  .strict();

export const profileSchema = z
  .object({
    name: text,
    greeting: text,
    /** One sentence per line on the home page (Leo, 21 Nov 2026); joined with spaces elsewhere. */
    headline: z.array(text).min(1),
    /** Areas of work shown as chips under the headline on the home page. */
    focus: z.array(text).min(1).optional(),
    /** Programming and markup languages, shown on the home page's lab pass. */
    languages: z.array(text).min(1).optional(),
    /** Main tools and libraries, shown on the home page's lab pass. */
    tools: z.array(text).min(1).optional(),
    location: text,
    email: z.email(),
    linkedin: httpsUrl,
    github: httpsUrl.nullable(),
    cv: z.object({ path: z.string().regex(/^\/[\w./-]+\.pdf$/), ready: z.boolean() }).strict(),
    photo: z.object({ src: text, alt: text }).strict(),
    targetRoles: z.array(text).min(1),
    availability: z.array(availabilitySchema).min(1),
    about: aboutSchema,
  })
  .strict();

export const educationSchema = z.array(
  z
    .object({
      id: slug,
      institution: text,
      shortName: text.optional(),
      credential: text,
      start: yearMonth,
      end: yearMonth.optional(),
      minor: text.optional(),
      gpa: text.optional(),
      gpaAsOf: yearMonth.optional(),
      note: text.optional(),
    })
    .strict(),
);

export const experienceSchema = z.array(
  z
    .object({
      id: slug,
      title: text,
      organisation: text,
      start: yearMonth,
      end: yearMonth.optional(),
      summary: text.optional(),
      showOnSite: z.boolean(),
    })
    .strict(),
);

export const replaySchema = z
  .object({
    schemaVersion: z.literal(1),
    run: z
      .object({
        runDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
        baseModel: text,
        adapterLabel: text,
        decoding: z
          .object({ doSample: z.boolean(), maxNewTokens: z.number().int().positive() })
          .strict(),
        hardware: text,
        casesFixedBeforeRun: z.boolean(),
        fixture: z.boolean(),
      })
      .strict(),
    cases: z.array(
      z
        .object({
          id: slug,
          title: text,
          setting: text,
          turns: z.number().int().positive(),
          inputText: text,
          plantedFlaws: z.array(
            z.object({ turn: z.number().int().positive(), description: text }).strict(),
          ),
          output: z
            .object({
              rawText: z.string(),
              sha256: z.string().regex(/^[0-9a-f]{64}$/),
              tokenCount: z.number().int().nonnegative(),
              truncatedAtCap: z.boolean(),
            })
            .strict(),
          timing: z
            .object({
              totalMs: z.number().nonnegative(),
              events: z.array(
                z
                  .object({
                    type: z.literal('text'),
                    tMs: z.number().nonnegative(),
                    text: z.string(),
                  })
                  .strict(),
              ),
            })
            .strict(),
        })
        .strict(),
    ),
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
export type Learning = z.infer<typeof learningSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type ReplayFile = z.infer<typeof replaySchema>;
