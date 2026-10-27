import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url);

function read(relativePath) {
  const file = join(fileURLToPath(dist), relativePath);
  if (!existsSync(file)) {
    throw new Error(`missing ${relativePath}`);
  }
  return readFileSync(file, 'utf8');
}

function fileURLToPath(url) {
  return decodeURIComponent(url.pathname);
}

const home = read('index.html');
const titles = [
  '一天重塑人生（Dan Koe）',
  '重构工作流：Agent 能合并时人该站在哪（Martin Gratzer）',
  'Claude Code 团队如何做代码评审',
  'Grok Bot 搜 X，12 步搭 AI 研究台（Ichigo）',
  'Grok Bot 记忆工程：团队 Bot 怎么学习（rari）',
];

for (const title of titles) {
  if (!home.includes(title)) throw new Error(`home missing ${title}`);
}

if (home.includes('任德')) throw new Error('home chrome must not use 任德');
if (!home.includes('dengxia-theme')) throw new Error('theme storage missing');
if (!home.includes('/rende-readings/')) throw new Error('base path missing');

const dates = ['2026-10-27', '2026-10-22', '2026-10-15', '2026-10-08', '2026-10-05'];
const datePos = dates.map((date) => home.indexOf(date));
for (let index = 0; index < datePos.length; index += 1) {
  if (datePos[index] < 0) throw new Error(`home missing date ${dates[index]}`);
  if (index > 0 && !(datePos[index] > datePos[index - 1])) {
    throw new Error(`dates out of order at ${dates[index]}`);
  }
}

const slugs = [
  '2026-10-08-ichigo-ai-research-desk',
  '2026-10-05-rari-memory-engineering',
  '2026-10-15-claude-code-review',
  '2026-10-27-dan-koe-fix-life-in-1-day',
  '2026-10-22-gratzer-reforging-workflow',
];

for (const slug of slugs) {
  const html = read(join('posts', slug, 'index.html'));
  const md = read(join('md', `${slug}.md`));
  const source = readFileSync(join('src/content/posts', `${slug}.md`), 'utf8');
  if (md !== source) throw new Error(`markdown drift ${slug}`);
  if (!html.includes('原文外链')) throw new Error(`missing source link ${slug}`);
  if (!html.includes('复制 Markdown')) throw new Error(`missing copy ${slug}`);
  if (!html.includes('下载 Markdown')) throw new Error(`missing download ${slug}`);
  if (!html.includes(`/rende-readings/md/${slug}.md`)) throw new Error(`md href ${slug}`);
  if (!html.includes('target="_blank"')) throw new Error(`source should open outward ${slug}`);
}

for (const slug of ['grok-bot', 'agent-workflow', 'code-review', 'personal-growth', 'design-system']) {
  const html = read(join('categories', slug, 'index.html'));
  if (!html.includes('/rende-readings/')) throw new Error(`category base ${slug}`);
}

const grok = read(join('categories', 'grok-bot', 'index.html'));
if (!grok.includes('Ichigo') || !grok.includes('rari')) throw new Error('grok category posts');

const empty = read(join('categories', 'design-system', 'index.html'));
if (!empty.includes('这一类还没有札记')) throw new Error('empty design-system copy');
if (empty.includes('任德')) throw new Error('empty category must not use 任德');

console.log('verify-build ok');
