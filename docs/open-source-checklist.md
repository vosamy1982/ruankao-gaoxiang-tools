# 开源检查清单

发布到 GitHub 前建议逐项确认：

- `LICENSE` 已存在，且 README 中说明代码许可。
- README 不再是框架模板，包含功能、运行方式和数据说明。
- `npm ci` 和 `npm run check` 均通过。
- 仓库没有 `.env`、token、私钥、账号密码或本地路径。
- 不包含未授权教材、题库、讲义、截图或培训资料。
- 图片素材来源明确，或替换为原创/示例图片；不使用图片时保留 `public/images/.gitkeep` 即可。
- 如保留数据，应确认数据表达为原创整理，且不会替代原始资料。
- 初始化新 Git 历史，不从包含完整资料的历史仓库直接公开。
- GitHub Actions 在 Pull Request 中执行数据审计、测试、Lint 和构建。
