import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const postsDir = join(root, 'src/content/posts');

function sourceFiles() {
  return readdirSync(postsDir).filter((name) => name.endsWith('.md'));
}

function copyInto(directory) {
  mkdirSync(directory, { recursive: true });
  for (const name of sourceFiles()) {
    cpSync(join(postsDir, name), join(directory, name));
  }
}

export function copyMarkdown() {
  return {
    name: 'copy-source-markdown',
    hooks: {
      'astro:config:setup'() {
        const target = join(root, 'public/md');
        rmSync(target, { recursive: true, force: true });
        copyInto(target);
      },
      'astro:build:done'({ dir }) {
        copyInto(join(fileURLToPath(dir), 'md'));
      },
    },
  };
}
