import type { ExamChapter, ExamPoint } from '../types';

export const MAX_EXAM_DATA_FILE_SIZE = 5 * 1024 * 1024;

export type ExamDataValidationResult =
  | { success: true; data: ExamChapter[] }
  | { success: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readRequiredString = (
  value: unknown,
  path: string,
  errors: string[]
) => {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${path} 必须是非空字符串`);
    return null;
  }
  return value;
};

const validatePoint = (
  value: unknown,
  path: string,
  errors: string[]
): ExamPoint | null => {
  if (!isRecord(value)) {
    errors.push(`${path} 必须是对象`);
    return null;
  }

  const id = readRequiredString(value.id, `${path}.id`, errors);
  const title = readRequiredString(value.title, `${path}.title`, errors);
  const importance = typeof value.importance === 'number' ? value.importance : null;
  const importanceIsValid =
    importance !== null
    && Number.isInteger(importance)
    && importance >= 0
    && importance <= 5;

  if (!importanceIsValid) {
    errors.push(`${path}.importance 必须是 0-5 的整数`);
  }

  if (typeof value.content !== 'string') {
    errors.push(`${path}.content 必须是字符串`);
  }

  if (value.uniqueId !== undefined && (typeof value.uniqueId !== 'string' || !value.uniqueId.trim())) {
    errors.push(`${path}.uniqueId 必须是非空字符串`);
  }

  if (!id || !title || !importanceIsValid || importance === null || typeof value.content !== 'string') {
    return null;
  }

  const point: ExamPoint = {
    id,
    title,
    importance,
    content: value.content
  };

  if (typeof value.uniqueId === 'string' && value.uniqueId.trim()) {
    point.uniqueId = value.uniqueId;
  }

  return point;
};

export const validateExamData = (value: unknown): ExamDataValidationResult => {
  if (!Array.isArray(value)) {
    return { success: false, errors: ['JSON 根节点必须是章节数组'] };
  }

  if (value.length === 0) {
    return { success: false, errors: ['章节数组不能为空'] };
  }

  const errors: string[] = [];
  const chapters: ExamChapter[] = [];
  const chapterIds = new Set<string>();

  value.forEach((chapterValue, chapterIndex) => {
    const path = `chapters[${chapterIndex}]`;
    if (!isRecord(chapterValue)) {
      errors.push(`${path} 必须是对象`);
      return;
    }

    const id = readRequiredString(chapterValue.id, `${path}.id`, errors);
    const title = readRequiredString(chapterValue.title, `${path}.title`, errors);

    if (!Array.isArray(chapterValue.points)) {
      errors.push(`${path}.points 必须是数组`);
      return;
    }

    if (id && chapterIds.has(id)) {
      errors.push(`${path}.id 与其他章节重复：${id}`);
    } else if (id) {
      chapterIds.add(id);
    }

    const pointIds = new Set<string>();
    const points: ExamPoint[] = [];

    chapterValue.points.forEach((pointValue, pointIndex) => {
      const pointPath = `${path}.points[${pointIndex}]`;
      const point = validatePoint(pointValue, pointPath, errors);
      if (!point) return;

      if (pointIds.has(point.id)) {
        errors.push(`${pointPath}.id 在当前章节内重复：${point.id}`);
        return;
      }

      pointIds.add(point.id);
      points.push(point);
    });

    if (id && title) {
      chapters.push({ id, title, points });
    }
  });

  if (errors.length > 0) {
    return { success: false, errors: errors.slice(0, 20) };
  }

  return { success: true, data: chapters };
};

export const createExamDataFilename = (date = new Date()) =>
  `exam-points-${date.toISOString().slice(0, 10)}.json`;
