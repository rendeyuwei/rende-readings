import { defineConfig } from 'astro/config';
import { copyMarkdown } from './scripts/copy-markdown.mjs';

export default defineConfig({
  site: 'https://rendeyuwei.github.io',
  base: '/rende-readings',
  trailingSlash: 'always',
  markdown: {
    syntaxHighlight: false,
  },
  integrations: [copyMarkdown()],
});
