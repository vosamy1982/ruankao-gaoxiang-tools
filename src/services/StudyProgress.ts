import type { StudyRecord, StudyRecords, StudyStatus } from '../types';

export const STUDY_DATA_FORMAT_VERSION = 1;
export const STUDY_STORAGE_KEY = 'ruankao-gaoxiang-study-progress:v1';
export const MAX_STUDY_DATA_FILE_SIZE = 1024 * 1024;

export interface StudyDataFile {
  formatVersion: typeof STUDY_DATA_FORMAT_VERSION;
  exportedAt: string;
  records: StudyRecords;
}

export interface StudySummary {
  total: number;
  notStarted: number;
  studying: number;
  mastered: number;
  favorites: number;
  masteredPercent: number;
}

export type ReviewQueueKind = 'smart' | 'not-started' | 'studying' | 'favorites';

export type StudyDataValidationResult =
  | { success: true; data: StudyDataFile }
  | { success: false; errors: string[] };

interface StudyStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const studyStatuses = new Set<StudyStatus>(['not-started', 'studying', 'mastered']);
const unsafeRecordKeys = new Set(['__proto__', 'constructor', 'prototype']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));

const isStudyStatus = (value: unknown): value is StudyStatus =>
  typeof value === 'string' && studyStatuses.has(value as StudyStatus);

const isDefaultRecord = (record: StudyRecord) =>
  !record.favorite && record.status === 'not-started';

export const createStudyData = (
  records: StudyRecords,
  date = new Date()
): StudyDataFile => ({
  formatVersion: STUDY_DATA_FORMAT_VERSION,
  exportedAt: date.toISOString(),
  records
});

export const validateStudyData = (
  value: unknown,
  allowedPointIds?: ReadonlySet<string>
): StudyDataValidationResult => {
  if (!isRecord(value)) {
    return { success: false, errors: ['学习记录根节点必须是对象'] };
  }

  const errors: string[] = [];
  if (value.formatVersion !== STUDY_DATA_FORMAT_VERSION) {
    errors.push(`formatVersion 必须是 ${STUDY_DATA_FORMAT_VERSION}`);
  }
  if (!isValidDate(value.exportedAt)) {
    errors.push('exportedAt 必须是有效日期字符串');
  }
  if (!isRecord(value.records)) {
    errors.push('records 必须是对象');
  }

  if (errors.length > 0 || !isRecord(value.records) || !isValidDate(value.exportedAt)) {
    return { success: false, errors };
  }

  const records: StudyRecords = {};
  const entries = Object.entries(value.records);
  if (entries.length > 10000) {
    return { success: false, errors: ['学习记录不能超过 10000 条'] };
  }

  for (const [pointId, recordValue] of entries) {
    const path = `records.${pointId}`;
    if (!pointId.trim() || pointId.length > 200 || unsafeRecordKeys.has(pointId)) {
      errors.push(`${path} 的考点 ID 无效`);
      continue;
    }
    if (allowedPointIds && !allowedPointIds.has(pointId)) {
      errors.push(`${path} 对应的考点不存在`);
      continue;
    }
    if (!isRecord(recordValue)) {
      errors.push(`${path} 必须是对象`);
      continue;
    }
    if (typeof recordValue.favorite !== 'boolean') {
      errors.push(`${path}.favorite 必须是布尔值`);
    }
    if (!isStudyStatus(recordValue.status)) {
      errors.push(`${path}.status 必须是 not-started、studying 或 mastered`);
    }
    if (!isValidDate(recordValue.updatedAt)) {
      errors.push(`${path}.updatedAt 必须是有效日期字符串`);
    }
    if (
      typeof recordValue.favorite !== 'boolean'
      || !isStudyStatus(recordValue.status)
      || !isValidDate(recordValue.updatedAt)
    ) {
      continue;
    }

    const record: StudyRecord = {
      favorite: recordValue.favorite,
      status: recordValue.status,
      updatedAt: recordValue.updatedAt
    };
    if (!isDefaultRecord(record)) {
      records[pointId] = record;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors: errors.slice(0, 20) };
  }

  return {
    success: true,
    data: {
      formatVersion: STUDY_DATA_FORMAT_VERSION,
      exportedAt: value.exportedAt,
      records
    }
  };
};

export const loadStudyRecords = (
  storage: StudyStorage,
  allowedPointIds: ReadonlySet<string>
): StudyRecords => {
  try {
    const stored = storage.getItem(STUDY_STORAGE_KEY);
    if (!stored) return {};
    const result = validateStudyData(JSON.parse(stored) as unknown, allowedPointIds);
    return result.success ? result.data.records : {};
  } catch {
    return {};
  }
};

export const saveStudyRecords = (
  storage: StudyStorage,
  records: StudyRecords,
  date = new Date()
) => {
  storage.setItem(STUDY_STORAGE_KEY, JSON.stringify(createStudyData(records, date)));
};

export const clearStudyRecords = (storage: StudyStorage) => {
  storage.removeItem(STUDY_STORAGE_KEY);
};

export const setStudyRecord = (
  records: StudyRecords,
  pointId: string,
  updates: Partial<Pick<StudyRecord, 'favorite' | 'status'>>,
  date = new Date()
): StudyRecords => {
  const current = records[pointId] ?? {
    favorite: false,
    status: 'not-started' as const,
    updatedAt: date.toISOString()
  };
  const next: StudyRecord = {
    ...current,
    ...updates,
    updatedAt: date.toISOString()
  };
  const updated = { ...records };
  if (isDefaultRecord(next)) {
    delete updated[pointId];
  } else {
    updated[pointId] = next;
  }
  return updated;
};

export const getStudySummary = (
  records: StudyRecords,
  pointIds: readonly string[]
): StudySummary => {
  let studying = 0;
  let mastered = 0;
  let favorites = 0;

  pointIds.forEach(pointId => {
    const record = records[pointId];
    if (record?.status === 'studying') studying += 1;
    if (record?.status === 'mastered') mastered += 1;
    if (record?.favorite) favorites += 1;
  });

  const total = pointIds.length;
  return {
    total,
    notStarted: Math.max(0, total - studying - mastered),
    studying,
    mastered,
    favorites,
    masteredPercent: total === 0 ? 0 : Math.round((mastered / total) * 100)
  };
};

export const createReviewQueue = (
  kind: ReviewQueueKind,
  pointIds: readonly string[],
  records: StudyRecords
): string[] => {
  if (kind === 'not-started') {
    return pointIds.filter(pointId => !records[pointId] || records[pointId].status === 'not-started');
  }
  if (kind === 'studying') {
    return pointIds.filter(pointId => records[pointId]?.status === 'studying');
  }
  if (kind === 'favorites') {
    return pointIds.filter(pointId => records[pointId]?.favorite);
  }

  const studying: string[] = [];
  const favoriteNotMastered: string[] = [];
  const notStarted: string[] = [];

  pointIds.forEach(pointId => {
    const record = records[pointId];
    if (record?.status === 'studying') {
      studying.push(pointId);
    } else if (record?.favorite && record.status !== 'mastered') {
      favoriteNotMastered.push(pointId);
    } else if (!record || record.status === 'not-started') {
      notStarted.push(pointId);
    }
  });

  return [...studying, ...favoriteNotMastered, ...notStarted];
};

export const getAdjacentReviewPointId = (
  queue: readonly string[],
  currentPointId: string | null,
  direction: 'previous' | 'next'
): string | null => {
  if (queue.length === 0) return null;
  const currentIndex = currentPointId ? queue.indexOf(currentPointId) : -1;
  if (currentIndex === -1) {
    return direction === 'next' ? queue[0] : queue[queue.length - 1];
  }
  const targetIndex = currentIndex + (direction === 'next' ? 1 : -1);
  return queue[targetIndex] ?? null;
};

export const getRandomReviewPointId = (
  queue: readonly string[],
  currentPointId: string | null,
  random = Math.random
): string | null => {
  if (queue.length === 0) return null;
  if (queue.length === 1) return queue[0];

  const currentIndex = currentPointId ? queue.indexOf(currentPointId) : -1;
  if (currentIndex === -1) {
    return queue[Math.min(queue.length - 1, Math.floor(random() * queue.length))];
  }

  const randomIndex = Math.min(queue.length - 2, Math.floor(random() * (queue.length - 1)));
  const targetIndex = randomIndex >= currentIndex ? randomIndex + 1 : randomIndex;
  return queue[targetIndex];
};

export const createStudyDataFilename = (date = new Date()) =>
  `study-progress-${date.toISOString().slice(0, 10)}.json`;
