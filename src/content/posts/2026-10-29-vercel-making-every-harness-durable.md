---
title: "让每套 Harness 都能持久运行（Vercel）"
date: 2026-10-29
category: "Agent 工作流"
tags: ["durable-harness", "Agent", "Vercel", "Workflow SDK"]
source: "https://vercel.com/blog/making-every-harness-durable"
sourceTitle: "Making every harness durable"
author: "Pranay Prakash, Eric Dodds"
description: "用 durable-harness 让 Pi/OpenCode/Codex/Claude Code 等 harness 在云端崩溃后从日志续跑，不重复已完成的模型与工具调用。"
---

> 来源：[Pranay Prakash](https://twitter.com/pranaygp)、[Eric Dodds](https://twitter.com/ericdodds) · 《Making every harness durable》
>
> 原文：[vercel.com/blog](https://vercel.com/blog/making-every-harness-durable) · 日期：2026-10-19 · 贡献者：[Ben Sabic](https://twitter.com/bensabic)、[Esteban Suárez](https://twitter.com/estebansuarez)、[Pranit Sharma](https://github.com/fazxes)
>
> 本页为完整中文译文（可保留必要英文专名/代码），供专题精读。配图为静态复刻；交互演示请打开原文。

## 要点摘要

- 本地 harness（[Pi](https://github.com/earendil-works/pi)、[Claude Code](https://docs.claude.com/en/docs/claude-code/overview) 等）靠本机磁盘续跑；云端若只用 VM，崩溃后不会自动记录已完成的模型/工具调用，失败即丢进度。
- [`durable-harness`](https://github.com/vercel-labs/durable-harness) 把 [Workflow SDK](https://workflow-sdk.dev/) 的耐久能力外挂到任意 harness：每步写 durable log，回合用队列兜底，崩溃后新函数从日志续跑。
- 已完成调用从不重跑（避免二次计费）；`replay: 'safe'` 的工具可重放，其余标为「可能已跑过」交由模型判断。
- 同一 [World](https://workflow-sdk.dev/worlds) 接口可换后端：[Vercel World](https://workflow-sdk.dev/worlds/vercel)、[本地文件](https://workflow-sdk.dev/worlds/local)、[Postgres](https://workflow-sdk.dev/worlds/postgres)/MongoDB/Redis/Turso；[Agent Runs](https://vercel.com/docs/agent-harnesses/observability) 可看到崩溃后续跑的同一条 trace。
- 文件侧提供 `virtual()` / 内存 scratch / `sandbox()`；会话外状态可用 typed document 存在日志里，与工具结果一起提交。

---

开发者对通过 [Pi](https://github.com/earendil-works/pi)、[Claude Code](https://docs.claude.com/en/docs/claude-code/overview) 等 harness 在本地跑 coding agent 已经很熟悉。它们是生成代码的可靠日常工具，但要让 agent 全天候跑，就要求电脑一直开机、保持唤醒——于是出现了「合上盖子」的梗，以及 Mac mini 需求暴涨。

![Harnesses run in the cloud now, so you can close the lid.（左：合盖前 / 右：合盖后）](/rende-readings/posts/harness/cormac-1.jpg)

![software engineers before vs after agents — Cormac](/rende-readings/posts/harness/cormac-2.jpg)

*图注：Harnesses run in the cloud now, so you can close the lid. — [Cormac](https://x.com/cormachayden_/status/2050773588521992642) ([@cormachayden_](https://x.com/cormachayden_/status/2050773588521992642))*

#### 在云端运行 harness

Harness 工作负载正在迁往云端。个人开发者在部署常开的 coding agent 工作流；OpenWork、HanaAgent 这类项目把开源 harness 当作应用背后的引擎；工程师也在自建 harness 产品。

这些 harness 面向长生命周期进程，会话常驻内存；agent 任务常常跑数分钟甚至数小时。在本地，harness 对本机磁盘上的工作区与会话历史有直接、持续的访问，中断后恢复工作往往只需简单再提示一句。

在云端，你可以用 VM 加持久存储复刻这套布置，但 VM 不会自动记录哪些模型调用和工具调用已经完成，也不会在崩溃后自动续上被打断的回合。一次失败的回合或网络错误，就意味着工作丢失。

另外，并非所有经 harness 执行的 agent 任务都需要沙箱。数据库查询和 API 调用可以安全地在函数里跑——这也意味着所需凭证不必进入沙箱。

### 让每套 Harness 都能持久运行

我们构建了 [eve](https://eve.dev) 和 [fx](https://fx.sh/)，开箱即可在云端耐久运行；今天我们推出 [`durable-harness`](https://github.com/vercel-labs/durable-harness)，把这套耐久能力扩展到任意 harness，包括 [Pi](https://github.com/earendil-works/pi)、[OpenCode](https://opencode.ai/)、[Codex](https://github.com/openai/codex) 和 [Claude Code](https://docs.claude.com/en/docs/claude-code/overview)。它使用与 [Workflow SDK](https://workflow-sdk.dev/) 相同的机制，以在崩溃和函数超时后存活。

有了 `durable-harness`，你可以：

- 在 Vercel 上耐久地运行上述任意 harness
- 用自己的 Postgres 实例自托管 harness
- 让本地 harness 工作流变得耐久
- 构建自己的 durable harness

![Creates a durable agent with each harness’s own API.](/rende-readings/posts/harness/harness-api-demo.png)

*图注：Creates a durable agent with each harness’s own API. 原文为可切换 harness 的交互面板（[fx](https://vercel.com/docs/agent-harnesses/fx) / [Pi](https://vercel.com/docs/agent-harnesses/pi) / [OpenCode](https://vercel.com/docs/agent-harnesses/opencode) / [Claude Code](https://vercel.com/docs/agent-harnesses/claude-code) / [Codex](https://vercel.com/docs/agent-harnesses/codex) 配置指南），此处为静态截图；完整交互见[原文](https://vercel.com/blog/making-every-harness-durable)。*

## 中途崩溃也能活下来的会话

以 coding agent 给现有应用加定价页为例。Agent 读已有页面、写出新页、开 pull request，然后等 CI 跑完再汇报。

如果 CI 还在跑时函数超时了，会怎样？

#### 没有耐久性时

没有耐久性时，agent 会停工，直到有人手动重启；已完成的工作还会被不必要地重做。

#### 有了 durable-harness

有了 `durable-harness`，新函数会从日志读出已完成的结果并续上该回合。即便浏览器断开，agent 仍继续跑；重连后从日志追赶进度。

## 日志与队列

`durable-harness` 是我们开源组合里最新的包。它是一组适配器与工具，让你已在用的 harness 把会话保存在 [World](https://workflow-sdk.dev/worlds)——[Workflow SDK](https://workflow-sdk.dev/) 的耐久后端——之中。

它把回合中的每一步写入 durable log。在模型调用或工具调用运行前记录意图，调用结束后记录结果。回合本身用队列消息兜底：若函数挂掉，队列把该回合交给新函数；新函数读日志，从中断处继续。

崩溃后，日志会说明什么已完成、什么在跑、什么从未开始：

- 已完成的调用不会再跑，因为结果从日志读出，因此不会为一次已完成的模型调用的 token 二次计费。
- 模型记得先前的调用，而不是重复它们。
- 标为 `replay: 'safe'` 的被打断工具会再跑一遍。其他工具则以「可能已跑过」的形式回到模型，由模型决定是否要核对。

像 Claude Code 的 transcript、Codex 的 rollout、OpenCode 的 event store 这类自带会话文件的 harness，每条记录都会镜像进日志，因此新函数或 Sandbox 可以从日志重建它们。

## 选你的 harness

[fx](https://fx.sh/) 和 [eve](https://eve.dev) 自身就是耐久的。对其余 harness，`durable-harness` 从外部加上耐久性，无需改动 harness 本身。

各 harness 的完整配置指南见[文档](https://vercel.com/docs/agent-harnesses/harnesses)。

## 处处可跑

Durable agent 需要：每步的日志、进程死后续跑回合的方式，以及给旁观者的流。

[Workflow SDK](https://workflow-sdk.dev/) 在同一接口背后提供这三者——一个 [World](https://workflow-sdk.dev/worlds)。

```typescript
import type { Queue, Storage, Streamer } from '@workflow/world'
interface World extends Storage, Queue, Streamer {}
```

`durable-harness` 写入该接口，因此你可以把同一 agent 从一种 World 迁到另一种，而无需改代码：

- 在 Vercel 上，它使用 [Vercel World](https://workflow-sdk.dev/worlds/vercel)。
- 在开发环境中，它使用[本机文件](https://workflow-sdk.dev/worlds/local)。
- 在自有服务器上，它使用 [Postgres](https://workflow-sdk.dev/worlds/postgres)、MongoDB、Redis 或 Turso。

两个变量就能把所有使用 `durable-harness` 的 agent 迁到 Postgres。

```bash
WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
WORKFLOW_POSTGRES_URL="postgres://user:password@host:5432/database"
```

若要更多控制——例如设置 namespace，或在服务器启动时恢复会话——可在代码里创建 World，并传给你的 agent。

更多细节见[自托管文档](https://vercel.com/docs/agent-harnesses/self-hosting)。

![Creates a Postgres World in code and passes it to each harness.](/rende-readings/posts/harness/postgres-world-code.png)

*图注：Creates a Postgres World in code and passes it to each harness. 原文为交互面板，此处为静态截图；完整交互见[原文](https://vercel.com/blog/making-every-harness-durable)。*

## 在 Agent Runs 里看清每一次会话

Vercel 上的 [Agent Runs](https://vercel.com/docs/agent-harnesses/observability) 展示每个会话的 trace，包括每一次模型调用与工具调用。崩溃后续跑的回合会出现在同一条 trace 里，因此你能精确看到回合在哪里停下、又从哪里接上。

![A Pi session in the Agent Runs tab with an interrupted and retried model call.](/rende-readings/posts/harness/agent-runs.png)

*图注：A Pi session in the Agent Runs tab with an interrupted and retried model call. 原文为交互面板，此处为静态截图；完整交互见[原文](https://vercel.com/blog/making-every-harness-durable)。*

## 工具

Agent 只有你给它的工具，且它们在你的函数里运行。每个工具声明崩溃打断时应如何处理。像查找这类 `'safe'` 工具可以再跑；像退款这类 `'never'` 工具绝不会跑两次：模型会被告知该调用可能已发生，以便在重试前先核对。

上文演示里的 coding agent，工具定义大概会是这样：

- 读文件或查 CI 状态的工具标为 `'safe'`，以便崩溃后自动再跑。
- 发 PR 评论的工具标为 `'never'`，以免评论发两次。

示例（lib/agent.ts）：

```typescript
import { pi } from 'durable-harness/pi';
import type { HostTool } from 'durable-harness';
import { getOrder, refundOrder } from './orders'; // your own code

const tools: HostTool[] = [
  {
    name: 'get_order',
    description: 'Looks up an order',
    replay: 'safe', // safe to run again after a crash
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    execute: async ({ id }) => JSON.stringify(await getOrder(id)),
  },
  {
    name: 'refund_order',
    description: 'Refunds an order',
    replay: 'never', // never runs twice
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    execute: async ({ id }) => JSON.stringify(await refundOrder(id)),
  },
];

export const agent = pi({ model: 'anthropic/claude-sonnet-5.5', tools });
```

## 文件

当 harness 需要 shell 和文件时，直接在共享的 serverless 函数主机上跑并不安全。许多会话可能共用同一函数，且其文件系统不保证跨调用持久。

为此，`durable-harness` 提供几种选项：

- `virtual()` 把文件保存在会话的日志里，并提供兼容 bash、但无法触及函数文件或网络的 shell。适合短任务与小工作区，不必启动完整沙箱。
- `virtual({ durable: false })` 把文件放在内存里做临时工作，每个回合结束时清空。
- `sandbox()` 给会话自有的 [Vercel Sandbox](https://vercel.com/docs/sandbox)，`/workspace` 在 [Drive](https://vercel.com/kb/guide/vercel-drives) 上，能活过每一次沙箱与每一次函数。适合真实项目与长时工作。

每个 harness 的内置工具都跑在你选定的工作区上。对 Pi，`CodingTools` 安装 Pi 自带的 `read`、`write`、`edit` 和 `bash`，再用 `virtualEnv()` 或 `sandboxEnv()` 给它们工作区。

示例（lib/pi.ts）：

```typescript
import { BACKGROUND_CONTEXT as ctx } from '@earendil-works/chord/context';
import { createRegistry, Harness, type Storage } from '@earendil-works/pi-durable';
import { CodingTools, gatewayModels, resumeWith, virtualEnv } from 'durable-harness/pi-durable';

const models = gatewayModels();
const registry = createRegistry();
registry.install(CodingTools); // Pi's read, write, edit, and bash

// Files kept in the session's log, or sandboxEnv() for the session's own Vercel Sandbox
const env = virtualEnv();

export const open = resumeWith((storage: Storage) => Harness.open(storage, { models, registry, env }, ctx));
```

对 OpenCode，把工作区作为 `workspace` 传入；对 fx，传给 `fxTools()`。Claude Code 和 Codex 始终跑在 Vercel Sandbox 里，因为它们期望真实的 shell 与文件系统，且不适合多租户使用。打开 `builtins: true` 后，其内置工具就作用在会话的 Drive 上。各 [harness 指南](https://vercel.com/docs/agent-harnesses/harnesses)会列出其内置工具；文件相关说明见[文档](https://vercel.com/docs/agent-harnesses/tools#files)。

## 文档

有些状态属于会话，却不是对话的一部分——例如待办列表、计划，或 agent 填写的表单。Document 是类型化的 JSON，存在会话的日志里，因此能在崩溃后存活，并随会话迁移。

工具可通过 `io.docs` 编辑 document；每次编辑与工具结果一起提交到日志，因此 document 的耐久状态与工具调用本身保持一致。

示例（lib/todos.ts）：

```typescript
import { defineDoc, type HostTool } from 'durable-harness';

export const Todos = defineDoc<{ items: string[] }>({
  kind: 'app.todos',
  version: 1,
  initial: () => ({ items: [] }),
});

export const addTodo: HostTool<{ item: string }> = {
  name: 'add_todo',
  description: 'Adds a todo',
  replay: 'safe',
  inputSchema: { type: 'object', properties: { item: { type: 'string' } }, required: ['item'] },
  async execute({ item }, io) {
    const todos = io.docs!.update(Todos, (draft) => {
      draft.items.push(item);
    });
    return `${todos.items.length} todos`;
  },
};
```

你的应用可以读写同一份 document，而无需自建数据库；聊天路由甚至可以把每一次变更流式推到 UI：

```typescript
import { agent } from '@/lib/agent';
import { Todos } from '@/lib/todos';

// In a route or webhook: read the list without a database of your own
const { value } = await agent.sessions.doc(sessionId, Todos);

// In the chat route: stream every change to the browser
export const { GET, POST } = agent.chatRoute({ authorize, docs: [Todos] }); // your auth check
```

事实上，前面的 `virtual()` 工作区就是建在 document 上的：其文件树是会话日志里的一份 document，每次工具调用的变更都与结果一起提交。

更多关于 [tools、files 与 documents](https://vercel.com/docs/agent-harnesses/tools) 的说明见文档；安全实践见 [keep your agent secure](https://vercel.com/docs/agent-harnesses/security)。

## 总结

开发者选择某套 harness，看重的是它对提示、工具与上下文所做的取舍。它如何在崩溃后存活，不该再成为其中一项取舍。有了 `durable-harness`，中途丢掉函数的回合会在新函数上从日志继续，无需手动重试，也不会重复已经完成的部分。自托管与可移植性开箱即用——它们建立在 Workflow SDK 的 World 接口之上。

[`durable-harness` 在 GitHub 上开源](https://github.com/vercel-labs/durable-harness)。
