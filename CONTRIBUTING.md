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
npm run lint
npm run build
```

## Data Contributions

The built-in study data is intentionally small and original. Please keep contributions concise and written in your own words.

Do not submit:

- Official exam questions or answers.
- Text copied from textbooks, training slides, paid courses, or websites.
- Screenshots or diagrams without a clear open license.
- Personal or sensitive data.

## Pull Request Checklist

- The change is focused and easy to review.
- `npm run lint` passes.
- `npm run build` passes.
- Documentation is updated when behavior or data format changes.
- Any new study content is original or clearly licensed for redistribution.
