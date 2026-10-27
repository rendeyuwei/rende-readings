# 灯下札记

专题精读的中文阅读笔记。Markdown 是唯一正文来源，[Astro](https://astro.build) 构建静态 HTML，发布在 GitHub Pages。

线上地址：<https://rendeyuwei.github.io/rende-readings/>

一期没有评论、搜索，也不接服务器。

## 本地

需要 Node.js ≥ 22.23.4。

```bash
npm ci
npm run dev
npm run check
npm run build
```

`npm run dev` 在本地预览。`npm run check` 跑 `astro check`。`npm run build` 生成 `dist/`，把每篇源 Markdown 拷到 `dist/md/`（页面上的「复制 Markdown」和「下载 Markdown」读的就是它），并核对五篇都在。

## 新增一篇

1. 在 `src/content/posts/` 放一个 `.md` 文件。文件名就是网址：`2026-11-01-my-note.md` 对应 `/rende-readings/posts/2026-11-01-my-note/`。
2. 文件开头写 frontmatter。分类只能是下面五个之一：

```yaml
---
title: "中文标题"
date: 2026-11-01
category: "Grok Bot" # Grok Bot | Agent 工作流 | 代码评审 | 个人成长 | 设计系统
tags: []
source: "https://example.com/original"
sourceTitle: "Original title"
author: "作者"
description: "一句话摘要，出现在首页。"
---
```

3. 正文用普通 Markdown（标题、列表、引用、代码块）。不要改已经生成的 HTML。
4. 提交并推送到 `main`。GitHub Actions 会执行 `npm ci`、`astro check`、构建，再用 GitHub Pages 发布。

分类页是固定的：

| 分类 | 路径 |
| --- | --- |
| Grok Bot | `/rende-readings/categories/grok-bot/` |
| Agent 工作流 | `/rende-readings/categories/agent-workflow/` |
| 代码评审 | `/rende-readings/categories/code-review/` |
| 个人成长 | `/rende-readings/categories/personal-growth/` |
| 设计系统 | `/rende-readings/categories/design-system/` |

`设计系统` 可以先空着。要加新分类，改 `src/lib/categories.ts` 里的名单（内容 schema 用的是同一份）。

## 启用 GitHub Pages

仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。推送到 `main` 后，Actions 里的 “Deploy GitHub Pages” 会把站点发到上面的地址。
