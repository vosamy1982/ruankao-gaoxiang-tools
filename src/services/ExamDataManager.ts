import examDataJson from '../data/exam-points.json';
import type { ExamChapter } from '../types';

export type ContentReferenceMap = Map<string, string>;

const rawChapters = examDataJson as ExamChapter[];

export const commonExamTextReplacements: Array<[RegExp, string]> = [
  [/顶目/g, '项目'],
  [/配置顶/g, '配置项'],
  [/TCP\/P/g, 'TCP/IP'],
  [/ACD 原则/g, 'ACID 原则'],
  [/\bPaas\b/g, 'PaaS'],
  [/1oV/g, 'IoV'],
  [/\bS8 D\b/g, 'S8D'],
  [/8 02\.11/g, '802.11'],
  [/802\.\s+([0-9])/g, '802.$1'],
  [/S O H O/g, 'SOHO'],
  [/En=P\+In/g, 'Fn=P+In'],
  [/其中，工为n 个计息期的总利息/g, '其中，I 为 n 个计息期的总利息'],
  [/Stom/g, 'Storm'],
  [/第i 种状态/g, '第 i 种状态'],
  [/CPI=EVAC\.CPI >/g, 'CPI=EV/AC。CPI >'],
  [/TCPI=（BAC-EV\/（BAC-AC）/g, 'TCPI=（BAC-EV）/（BAC-AC）'],
  [/该顶索赔/g, '该项索赔'],
  [/职责分矩/g, '职责分配矩阵'],
  [/审计事顶/g, '审计事项']
];

export const normalizeMarkdownWhitespace = (text: string) => text
  .replace(/\u00A0/g, ' ')
  .replace(/\r\n/g, '\n')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/(?<=[\u4e00-\u9fff])[^\S\n]+(?=[\u4e00-\u9fff])/g, '')
  .replace(/(?<=[\u4e00-\u9fff])[^\S\n]+(?=[（(])/g, '')
  .replace(/(?<=[）)])[^\S\n]+(?=[\u4e00-\u9fff])/g, '')
  .replace(/(?<=[，。；：])[^\S\n]+(?=[\u4e00-\u9fffA-Za-z0-9])/g, '')
  .trim();

export const mergeAdjacentBoldSegments = (text: string) => text.replace(/\*\*(.*?)\*\*\*\*(.*?)\*\*/g, '**$1$2**');

export const buildContentReferenceMap = (chapterData: ExamChapter[]) => {
  const references: ContentReferenceMap = new Map();
  for (const chapter of chapterData) {
    for (const point of chapter.points) {
      for (const match of point.content.matchAll(/\[(\d+)\][：:]\s*([^[]+?)(?=\[(\d+)\][：:]|$)/g)) {
        references.set(match[1], match[2].trim());
      }
    }
  }
  return references;
};

export const stripReferenceDefinitions = (content: string) => {
  const definitionStart = content.search(/\n\n\[\d+\][：:]/);
  return definitionStart >= 0 ? content.slice(0, definitionStart).trim() : content;
};

export const resolveContentReferenceTarget = (refId: string, references: ContentReferenceMap) => {
  const target = references.get(refId)?.trim();
  if (!target) return null;
  const imageMatch = target.match(/(?:^|[\\/])(image_\d+\.(?:png|jpe?g|svg))/i);
  if (imageMatch) return `/images/${imageMatch[1]}`;
  return target;
};

export const replaceReferenceImages = (content: string, references: ContentReferenceMap) => content.replace(
  /!\[([^\]]*)\]\[(\d+)\]/g,
  (_, altText: string, refId: string) => {
    const target = resolveContentReferenceTarget(refId, references);
    if (!target || !target.startsWith('/images/')) return altText || '';
    return `![${altText || `附图 ${refId}`}](${target})`;
  }
);

export const replaceReferenceLinks = (content: string, references: ContentReferenceMap) => content.replace(
  /\[([^\]]+)\]\[(\d+)\]/g,
  (_, label: string, refId: string) => {
    const target = resolveContentReferenceTarget(refId, references);
    if (!target) return label;
    if (/^https?:\/\//i.test(target)) return `[${label}](${target})`;
    return label;
  }
);

export const fullNormalizeContent = (content: string, references?: ContentReferenceMap) => {
  let processed = stripReferenceDefinitions(content);
  if (references) {
    processed = replaceReferenceImages(processed, references);
    processed = replaceReferenceLinks(processed, references);
  }
  processed = commonExamTextReplacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), processed);
  processed = mergeAdjacentBoldSegments(processed);
  return normalizeMarkdownWhitespace(processed);
};

export const contentReferences = buildContentReferenceMap(rawChapters);

export const processedChapters: ExamChapter[] = rawChapters.map(chapter => ({
  ...chapter,
  points: chapter.points.map(point => ({
    ...point,
    uniqueId: `${chapter.id}_${point.id}`,
    content: fullNormalizeContent(point.content, contentReferences)
  }))
}));
