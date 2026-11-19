// Content collections (plan section 5). API checked against the Astro 7 docs on 19 Nov 2026:
// defineCollection from 'astro:content', loaders from 'astro/loaders', z from 'astro/zod'.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { learningSchema, projectSchema } from './lib/schemas.ts';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

const learning = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/learning' }),
  schema: learningSchema,
});

export const collections = { projects, learning };
