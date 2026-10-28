---
title: "重构工作流：Agent 能合并时人该站在哪（Martin Gratzer）"
date: 2026-10-22
category: "Agent 工作流"
tags: ["Agent", "Forge", "代码评审", "工作流"]
source: "https://mgratzer.com/posts/reforging-the-workflow/"
sourceTitle: "Reforging the Workflow: Where the Human Goes When Agents Ship"
author: "Martin Gratzer"
description: "Agent 可自合并后，人应站两端：开工前塑好问题，以及塑造仓库与 Forge 护栏系统。"
---

> 来源：Martin Gratzer · 《Reforging the Workflow: Where the Human Goes When Agents Ship》
> 
> 原文：[mgratzer.com](https://mgratzer.com/posts/reforging-the-workflow/) · 日期：2026-10-22
> 
> 本页为完整中文译文（可保留必要英文专名/命令），供专题精读；待办只链到本页，不复制正文。

## 要点摘要

- 作者曾主张「PR 是人做最终裁决的最后阵地」，但当 Agent 已能自行合并 PR，人的注意力应移到两端：开工前把问题塑好，以及塑造 Agent 所处的系统。
- 审查投入急剧下降：Colorburst 从 1 月 25 个 PR 留 126 条行内评论，到 9–10 月 159 个 PR 零评论；失误改由护栏与独立审阅抓住。
- 与土木工程师朋友 Andreas 的实验说明：领域专家可不看代码，靠结构与 Forge 技能，在五周开出约 85 个 PR。
- 「结构让信任成为可能」：可证明的变更（测试矩阵、截图、合同测试）比人逐行读 diff 更可靠；证据也可能错，于是再补护栏。
- 行业在汇聚：把人从默认路径上拿开，把注意力放在风险所在；Forge 的 ship / guard / land 正是这一方向。
- 人站两端：好塑形的 Issue 进、能把 Agent 导向正确方向的系统出；发现漂移就修在塑形、仓库规则或 Forge 里。

---

年初我写过：当 Agent 承担写码工作时，PR 仍是维持对代码库共同理解的最后一道防线。最终裁决在人，这也是我围绕 Forge 建设的理念。时间过去，如今我的 Agent 已被允许自行合并 pull request。我改主意了，因为我越来越少抓到那些 Agent 及其周围系统还没先抓到的问题。别误会，我仍在环路里，也仍在掌控。只是花更少时间读 diff，把更多时间花在两端：在 Agent 开工前把问题定义清楚，以及塑造它工作所处的系统。这并不意味着 Agent 一次就把整块功能做完。我仍把工作拆成 Issues，每一条都是可独立上生产（或藏在 feature flag 后）的垂直切片。

Agent 周围的系统在约束它。我喜欢把护栏想成一条边界，把 Agent 漏斗式导向正确方向。这套系统有两部分：Agent 工作所在的仓库，以及 Forge——告诉它如何工作的 skills。我一直在所有项目里同时塑造这两者。

## 我的审查不再划算

一月，我在 Colorburst 的 25 个 PR 上留了 126 条行内审查评论。那是我二月描述过的协作环路。九、十月，在 159 个 PR 上，我一条都没留。我最新的项目 Tandler，总共只有三条手写审查评论，且都在它最早的一个 PR 上。

（Colorburst 一月：25 个 PR 上 126 条；九–十月：159 个 PR 上 0 条；Tandler：早期一个 PR 上共 3 条）

Agent 仍会犯错，但现在在合并之前，抓住它们的往往已不是我。一次 Colorburst 配额变更里，两位全新上下文的审阅者发现：测试夹具用了一个不存在的定价档，于是测试从未真正测到免费档却照样通过。一次依赖更新里，对抗式审查用 30 个精心构造的 payload 攻击 SVG sanitizer，找出三种绕过方式。两处都在同一 PR 里修好了——在我还没看之前。

## 和一个朋友的实验

拿自己的项目当证据有一个弱点：我知道怎么引导 Agent。于是我和共用办公空间的朋友 Andreas 做了实验。他是土木工程师，领域里有一个酝酿很久的想法。我给他看 Claude 之后，探索第一次变得可行，他用 Claude Cowork 做出了原型。

原型功能可用、视觉也很惊艳，他给潜在客户看时对方很兴奋。骨子里却是典型的 vibe coding 灾难——来自一个对软件工程一无所知的人：起初没有 git，没有 CI，一个塞满内联 JavaScript 的大 index.html，每次查找几乎读入一 GB 数据，因为没人告诉他地理数据该用 PostGIS。

对我来说，看到他能走这么远本身就很兴奋。我想帮他落地，也想看看：一个只描述功能的领域专家，在「给 Agent 扎实工程指引」的布置下能走多远。双赢：我拿到洞察，他则有机会把领域知识做成可规模化成生意的软件。我们从原型重启，套上我自己项目的结构：lint、死代码与重复代码检测、import 边界、迁移检查、高覆盖率要求，以及每个提交到 main 都会部署到 VPS 的流水线。然后连同 Forge skills 一起交给他。我教他如何塑形问题，让 Agent 去实现并替他跑应用，好当场试用并 refinement。他不看代码，因为他甚至看不懂那是什么意思。

前五周他开了 85 个 PR，每个大约一千行。我在实验里的职责是发现布置上的问题，所以审查焦点很窄：Agent 是否把零件正确拼在一起？领域逻辑对不对，我判断不了——我对他的领域不够深，而且理解一千行 PR 里的一切本身认知负荷也太大。九月我批准了他 48 个 PR 中的 45 个。细节上我常依赖 Claude 的 /code-review，以我的名义贴出发现，并自己开修复 PR。Simon Willison 会把这叫 meat proxy review。它修好了眼前的 PR，布置本身却没变。真正有用的，是跨他的 PR 与 Agent 会话找模式，再把它们变成护栏。

## 结构让信任成为可能

二月我写过：结构放大能力。现在我愿意更进一步：结构是让信任成为可能的东西。一个能证明自己的变更可行的 Agent，给了你除「自己读 diff」之外可依赖的东西。Thorsten Ball 要求 Agent「给我无可辩驳的证据，证明现在可用」，并且只审查他所谓的「承重代码」（load-bearing code）。他说，当 PR 带着测试矩阵和截图过来，你进入审查的心态完全不同。

有时证据是错的。一次图像模型替换之后，所有新的 Colorburst 模板大约五周都没有 title 或 tags 就上线了，CI 全绿——因为测试把模型的响应写死了。读那些 PR 也抓不到，所以修复是另一条护栏：对真实模型的 live contract test。

## 大家都在汇聚

最终让我改动 Forge 的，是看到别人在几周内抵达同一地点。Anthropic 的 Claude Code 团队优化目标是「不抬高 revert 或事故的前提下，人类审查时间的最小值」。低风险变更在检查变绿后无需人类批准，因为「设定档位的是变更本身，不是作者」。在 Imprint，Will Larson 的团队做了 small-change：CI 决定 PR 是否够格，审查 skill 只能批准或忽略，它放行的每一个错误都算系统失败。Gergely Orosz 把别处还剩的许多东西称为「僵尸代码审查」（zombie code reviews），Amp 团队则干脆丢掉了 PR。

风险画像不同，方向相同：把人从默认路径上拿开，把人类注意力花在风险所在之处。

## Forge，重铸

我任一项目里的每一条发现，最终落进两处之一。有些只在该仓库有意义。另一些关乎 Agent 在任何地方该如何工作，那些进 Forge。在 Colorburst 与 Tandler，Agent 已经端到端跑应用一阵子，并写进 PR。那变成了 Forge 的 exercise（试跑）步骤。把 Andreas 堆叠的 PR 与 main 对齐的一天，变成了保持分支可合并的 guard。而他的审查负荷，连同 Anthropic 那篇文章，变成了 land。

命令：

```javascript
/forge-setup-project       # once per repo: AGENTS.md and the docs agents work from
/forge-ship 42             # implement Issue #42, exercise it, review it in fresh context, open the PR
/forge-ship --guard 42     # and keep going: CI, review feedback, then a risk verdict
```

Ship 实现 Issue，然后 exercise：跑应用、走一遍改动路径、把所见写入 PR 的 ## Exercised 一节。全新上下文的审阅者（不是写代码的那次会话）审查 diff。

Guard 在无人盯着的情况下把 PR 推到可审查状态，穿过 CI、审查反馈与可合并分支。它从不合并——因为一个修自己 PR 的环路，不该同时批准它。

Land 是最新的。它在全新上下文、在 head commit 上判断一个已绿 PR 的风险。先做机械检查（体量、迁移、CI 变更、安全敏感路径、被削弱的测试）。若无一命中，只有当审阅者能说出检查会漏掉什么时，裁决才是低风险；否则给出简短的「该看哪里」列表。若 `AGENTS.md` 里有 `Auto-merge: low-risk`，land 会自行合并低风险 PR，且只合并它刚裁决过的那个 commit。

安装：

```javascript
/plugin install forge --marketplace mgratzer/forge
npx skills add mgratzer/forge
```

## 尚未迁移的部分

Forge 仍以 PR 为基础，不像 Amp。PR 是证据所在。审查没有消失；它移动了：每个 PR 仍有独立的全新上下文审查，land 把有风险的交给人。问责仍在：谁提示了变更，谁就挂钩。这些是个人/接近生产的项目，没有团队合规；在工作里则有合规与知识共享。那正是他们现在为 SDLC 在摸索的。

## 人该站在哪里

Andreas 想跑得快。作者曾是晚上审查的瓶颈。停下审查并非信仰之跃——审查只是诸多控制之一；风险仍低（尚无用户；land 仍会升级迁移/风险路径）。抽查并改进系统，而不阻塞。用户到来时，一边保持节奏一边让系统更安全（feature flags、盯生产的 Agent）。领域专家 + 系统塑形者。

作者最在意的：找到 Agent 漂移之处，问「本可在哪里避免」，并在那里修好——在 Issue 塑形、仓库规则，或 Forge 里。在 Agent 开工前塑形：是陪练（sparring），不是口述。中间没有人；人在两端：塑好的 Issue 进，把 Agent 漏斗导向周围的系统出。

这套能否站得住，或许几个月后再写一篇更新会值得。

—— Martin Gratzer
