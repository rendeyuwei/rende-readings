import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categoryNames } from './lib/categories';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.md$/i, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(categoryNames),
    tags: z.array(z.string()).default([]),
    source: z.url(),
    sourceTitle: z.string(),
    author: z.string(),
    description: z.string(),
  }),
});

export const collections = { posts };
