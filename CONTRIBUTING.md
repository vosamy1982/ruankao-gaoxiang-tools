# Contributing

Thanks for considering a contribution to Ruankao Gaoxiang Tools.

## Scope

This repository accepts contributions for:

- UI improvements and accessibility fixes.
- ITTO query, search, and study workflow improvements.
- Documentation and data format improvements.
- Original sample study notes that do not copy official textbooks, exam banks, paid training material, or third-party copyrighted content.

## Local Setup

Use Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Before opening a pull request, run:

```bash
npm run check
```

## Data Contributions

The built-in study data is intentionally small and original. Please keep contributions concise and written in your own words.

Data changes must also satisfy the automated audit:

- Keep chapter, point, knowledge-area, process-group, and process IDs unique in their documented scope.
- Keep individual exam-point notes below 1,200 characters unless the threshold is deliberately reviewed and changed.
- Do not include placeholder text, long copied quotations, source markers that imply copied content, or unexplained external links.
- Store redistributable images in `public/images` and reference them as `/images/<filename>`.
- Do not use remote images. Every committed image must have a known license or be original.

If clearly licensed content intentionally triggers a review rule, a maintainer may add an entry to `scripts/data-audit-allowlist.json`. Each exception must identify the exact finding code and data location, and include a concrete reason. Do not use the allowlist to bypass schema, missing-file, or placeholder errors. Stale exceptions fail the audit and must be removed.

Do not submit:

- Official exam questions or answers.
- Text copied from textbooks, training slides, paid courses, or websites.
- Screenshots or diagrams without a clear open license.
- Personal or sensitive data.

## Pull Request Checklist

- The change is focused and easy to review.
- `npm run lint` passes.
- `npm test` passes.
- `npm run audit:data` passes.
- `npm run build` passes.
- Documentation is updated when behavior or data format changes.
- Any new study content is original or clearly licensed for redistribution.
