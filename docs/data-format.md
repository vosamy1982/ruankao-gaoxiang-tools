# 数据格式

本文档说明项目内置数据的基本结构，便于后续将完整资料改造成可导入的本地数据。

## ITTO 数据

文件：`src/data/pmbok.json`

```json
{
  "knowledgeAreas": [{ "id": "integration", "name": "项目整合管理" }],
  "processGroups": [{ "id": "initiating", "name": "启动过程组" }],
  "processes": [
    {
      "id": "p01",
      "name": "制定项目章程",
      "knowledgeAreaId": "integration",
      "processGroupId": "initiating",
      "inputs": ["立项管理文件"],
      "tools": ["专家判断"],
      "outputs": ["项目章程"]
    }
  ]
}
```

## 考点数据

文件：`src/data/exam-points.json`

```json
[
  {
    "id": "chapter_1",
    "title": "第 1 章 示例章节",
    "points": [
      {
        "id": "point_1",
        "title": "示例考点",
        "importance": 3,
        "content": "支持 Markdown、表格和图片。"
      }
    ]
  }
]
```

字段说明：

- JSON 根节点必须是非空章节数组。
- 章节的 `id`、`title` 必须是非空字符串，`points` 必须是数组。
- 章节 `id` 在整个文件中不能重复。
- 考点的 `id`、`title` 必须是非空字符串。
- `importance` 必须是 `0-5` 的整数，用于显示星级。
- `content` 必须是字符串，使用 Markdown，支持 GFM 表格和软换行。
- 考点 `id` 在同一章节内不能重复。
- `uniqueId` 可选；填写时必须是非空字符串。应用加载后会按章节和考点 ID 生成会话内唯一标识。
- 图片路径建议使用 `/images/example.png`。

提交到公开仓库的数据还必须通过 `npm run audit:data`。该命令会额外检查重复正文、重复标题、占位内容、异常长内容、来源标记、外部链接和图片文件是否存在。

## 浏览器导入限制

- 文件扩展名建议使用 `.json`。
- 单个导入文件不能超过 5 MB。
- 导入会替换当前页面中的考点数据。
- 导入内容只存在当前会话，刷新前应使用 `导出 JSON` 保存。
- 未识别的额外字段不会进入导出的标准数据。

浏览器允许用户导入自己的私有内容，但私有数据不应直接提交到公开仓库。公开数据仍需遵守 `CONTRIBUTING.md` 中的原创和授权要求。
