# 软考高项复习工具

一个本地优先的软考高级项目管理复习工具，提供 ITTO 矩阵查询、过程反向搜索、项目文件清单、八大绩效域、考点 Markdown 阅览和本地内容维护能力。

当前开源版内置的是精简原创示例数据：保留 24 章目录结构，每章 3 个考点，共 72 个考点；不包含官方教材、考试题库、第三方培训资料或来源不明确的截图素材。

## Demo

在线演示：

https://vosamy1982.github.io/ruankao-gaoxiang-tools/

也可以直达常用视图：

- [原生交叉矩阵](https://vosamy1982.github.io/ruankao-gaoxiang-tools/#mapping)
- [Excel 列级检索](https://vosamy1982.github.io/ruankao-gaoxiang-tools/#matrix)
- [多维反向搜索](https://vosamy1982.github.io/ruankao-gaoxiang-tools/#search)
- [考点精炼阅览](https://vosamy1982.github.io/ruankao-gaoxiang-tools/#examPoints)
- [内容后台维护](https://vosamy1982.github.io/ruankao-gaoxiang-tools/#admin)

## 界面预览

| ITTO 交叉矩阵 | 考点阅览 |
|---|---|
| ![ITTO 交叉矩阵](docs/screenshots/mapping.png) | ![考点阅览](docs/screenshots/examPoints.png) |

| 反向搜索 | 内容维护 |
|---|---|
| ![反向搜索](docs/screenshots/search.png) | ![内容维护](docs/screenshots/admin.png) |

## 功能

- 10 大知识域、5 大过程组、49 个过程的 ITTO 交叉矩阵
- 按输入、工具与技术、输出进行列级检索
- 按关键词反向搜索过程、输入、工具与技术、输出
- 33 个项目文件和项目管理计划组件速查
- 八大绩效域目标、检查方法和记忆口诀
- Markdown 考点阅览，支持表格、图片路径和 GFM
- 开发模式下的本地内容维护与图片上传

## 快速开始

要求 Node.js `>=22.13.0`。

```bash
npm ci
npm run dev
```

构建生产静态文件：

```bash
npm run build
npm run preview
```

质量检查：

```bash
npm run lint
```

## 使用说明

1. 打开在线 demo 或本地开发服务器。
2. 在顶部导航选择复习模式：
   - `原生交叉矩阵`：按知识域和过程组查看 49 个过程分布。
   - `Excel列级检索`：按知识域、过程组、输入、工具与技术、输出做组合筛选。
   - `多维反向搜索`：输入关键词，反查相关过程及其输入、工具与技术、输出。
   - `考点精炼阅览`：浏览 24 章原创示例考点。
   - `内容后台维护`：在开发模式下编辑 Markdown 考点并预览。
3. 需要分享某个视图时，可以复制带 hash 的链接，例如 `/#examPoints`。

## 数据说明

核心数据文件：

- `src/data/pmbok.json`：知识域、过程组和 ITTO 数据
- `src/data/exam-points.json`：原创示例考点章节和 Markdown 内容
- `src/data/projectDocuments.ts`：项目文件和项目管理计划组件
- `src/data/performanceDomains.ts`：八大绩效域
- `src/data/concepts.ts`：知识点辨析

开源版保留工具能力和数据结构，但只内置可公开的原创示例内容。完整个人资料建议通过后续导入功能在本地使用，不随仓库发布。

## 开发期内容维护

`vite.config.ts` 中包含两个仅用于本地开发服务器的接口：

- `POST /api/save-exam-points`：保存考点 JSON，并生成 `.bak`
- `POST /api/upload-image`：上传图片到 `public/images`

这些接口只在 `npm run dev` 时存在，不是生产后端，也没有鉴权。不要将开发服务器暴露到公网。

## 版权与许可

代码使用 MIT License。

本项目不应包含官方教材、考试题库或第三方培训资料的未授权内容。用户导入或维护的数据由用户自行负责版权合规。

## 贡献

请阅读 `CONTRIBUTING.md`。本项目只接受原创或明确授权可再分发的学习内容。

## 开源前待办

- 补充数据导入/导出说明
