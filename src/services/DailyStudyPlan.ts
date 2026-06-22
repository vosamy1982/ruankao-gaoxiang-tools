import type { StudyRecords } from '../types';
import { createReviewQueue } from './StudyProgress.ts';

export const DAILY_STUDY_PLAN_FORMAT_VERSION = 1;
export const DAILY_STUDY_PLAN_STORAGE_KEY = 'ruankao-gaoxiang-daily-study-plan:v1';
export const DEFAULT_DAILY_STUDY_TARGET = 5;
export const DAILY_STUDY_TARGETS = [5, 10, 15, 20] as const;

export interface DailyStudyPlan {
  formatVersion: typeof DAILY_STUDY_PLAN_FORMAT_VERSION;
  date: string;
  target: number;
  pointIds: string[];
  completedPointIds: string[];
  updatedAt: string;
}

interface DailyStudyPlanStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));

const isValidTarget = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 100;

const isUniqueStringArray = (value: unknown): value is string[] =>
  Array.isArray(value)
  && value.length <= 100
  && value.every(item => typeof item === 'string' && item.length > 0 && item.length <= 200)
  && new Set(value).size === value.length;

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const validateDailyStudyPlan = (
  value: unknown,
  allowedPointIds: ReadonlySet<string>
): DailyStudyPlan | null => {
  if (!isRecord(value)) return null;
  if (value.formatVersion !== DAILY_STUDY_PLAN_FORMAT_VERSION) return null;
  if (typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return null;
  if (!isValidTarget(value.target)) return null;
  const pointIds = value.pointIds;
  const completedPointIds = value.completedPointIds;
  if (!isUniqueStringArray(pointIds) || !isUniqueStringArray(completedPointIds)) {
    return null;
  }
  if (!isValidDate(value.updatedAt)) return null;
  if (pointIds.some(pointId => !allowedPointIds.has(pointId))) return null;
  if (completedPointIds.some(pointId => !pointIds.includes(pointId))) return null;

  return {
    formatVersion: DAILY_STUDY_PLAN_FORMAT_VERSION,
    date: value.date,
    target: value.target,
    pointIds: [...pointIds],
    completedPointIds: [...completedPointIds],
    updatedAt: value.updatedAt
  };
};

export const createDailyStudyPlan = (
  pointIds: readonly string[],
  records: StudyRecords,
  target = DEFAULT_DAILY_STUDY_TARGET,
  date = new Date(),
  previousPlan?: DailyStudyPlan | null
): DailyStudyPlan => {
  const dateKey = getLocalDateKey(date);
  const allowedPointIds = new Set(pointIds);
  const normalizedTarget = isValidTarget(target) ? target : DEFAULT_DAILY_STUDY_TARGET;
  const preservedPointIds = previousPlan?.date === dateKey
    ? previousPlan.pointIds.filter(pointId => allowedPointIds.has(pointId))
    : [];
  const queue = createReviewQueue('smart', pointIds, records);
  const nextPointIds = [...preservedPointIds];

  for (const pointId of queue) {
    if (nextPointIds.length >= normalizedTarget) break;
    if (!nextPointIds.includes(pointId)) nextPointIds.push(pointId);
  }

  const plannedPointIds = nextPointIds.slice(0, normalizedTarget);
  const completedPointIds = previousPlan?.date === dateKey
    ? previousPlan.completedPointIds.filter(pointId => plannedPointIds.includes(pointId))
    : [];

  return {
    formatVersion: DAILY_STUDY_PLAN_FORMAT_VERSION,
    date: dateKey,
    target: normalizedTarget,
    pointIds: plannedPointIds,
    completedPointIds,
    updatedAt: date.toISOString()
  };
};

export const loadDailyStudyPlan = (
  storage: DailyStudyPlanStorage,
  pointIds: readonly string[],
  records: StudyRecords,
  date = new Date()
): DailyStudyPlan => {
  let storedPlan: DailyStudyPlan | null = null;
  try {
    const stored = storage.getItem(DAILY_STUDY_PLAN_STORAGE_KEY);
    if (stored) {
      storedPlan = validateDailyStudyPlan(JSON.parse(stored) as unknown, new Set(pointIds));
    }
  } catch {
    storedPlan = null;
  }

  const target = storedPlan?.target ?? DEFAULT_DAILY_STUDY_TARGET;
  return createDailyStudyPlan(pointIds, records, target, date, storedPlan);
};

export const saveDailyStudyPlan = (
  storage: DailyStudyPlanStorage,
  plan: DailyStudyPlan
) => {
  storage.setItem(DAILY_STUDY_PLAN_STORAGE_KEY, JSON.stringify(plan));
};

export const completeDailyStudyPoint = (
  plan: DailyStudyPlan,
  pointId: string,
  date = new Date()
): DailyStudyPlan => {
  if (!plan.pointIds.includes(pointId) || plan.completedPointIds.includes(pointId)) {
    return plan;
  }
  return {
    ...plan,
    completedPointIds: [...plan.completedPointIds, pointId],
    updatedAt: date.toISOString()
  };
};

export const getDailyStudyResumePointId = (plan: DailyStudyPlan): string | null =>
  plan.pointIds.find(pointId => !plan.completedPointIds.includes(pointId))
  ?? plan.pointIds[0]
  ?? null;

export const getNextIncompleteDailyPointId = (
  plan: DailyStudyPlan,
  currentPointId: string
): string | null => {
  const currentIndex = plan.pointIds.indexOf(currentPointId);
  const remainingPointIds = plan.pointIds.filter(pointId => !plan.completedPointIds.includes(pointId));
  return remainingPointIds.find(pointId => plan.pointIds.indexOf(pointId) > currentIndex)
    ?? remainingPointIds[0]
    ?? null;
};

export const getDailyStudyProgress = (plan: DailyStudyPlan) => {
  const total = plan.pointIds.length;
  const completed = plan.completedPointIds.length;
  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    isComplete: total > 0 && completed === total
  };
};
