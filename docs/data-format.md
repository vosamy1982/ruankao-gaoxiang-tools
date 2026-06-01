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

- `importance` 建议使用 `0-5`，用于显示星级。
- `content` 使用 Markdown，支持 GFM 表格和软换行。
- 图片路径建议使用 `/images/example.png`。
