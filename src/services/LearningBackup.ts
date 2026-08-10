import type { DailyStudyPlan, ReviewHistory } from './DailyStudyPlan.ts';
import { validateDailyStudyPlan } from './DailyStudyPlan.ts';
import type { StudyDataFile } from './StudyProgress.ts';
import { createStudyData, validateStudyData } from './StudyProgress.ts';
import type { StudyRecords } from '../types';

export const LEARNING_BACKUP_APP_ID = 'ruankao-gaoxiang-tools';
export const LEARNING_BACKUP_FORMAT_VERSION = 1;
export const MAX_LEARNING_BACKUP_FILE_SIZE = 2 * 1024 * 1024;

export interface LearningBackupFile {
  formatVersion: typeof LEARNING_BACKUP_FORMAT_VERSION;
  app: typeof LEARNING_BACKUP_APP_ID;
  exportedAt: string;
  studyData: StudyDataFile;
  dailyStudyPlan: DailyStudyPlan;
}

export type LearningBackupValidationResult =
  | { success: true; data: LearningBackupFile }
  | { success: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));

const cloneReviewHistory = (history: ReviewHistory): ReviewHistory =>
  Object.fromEntries(
    Object.entries(history).map(([pointId, entry]) => [
      pointId,
      {
        lastReviewedAt: entry.lastReviewedAt,
        reviewCount: entry.reviewCount
      }
    ])
  );

const cloneDailyStudyPlan = (plan: DailyStudyPlan): DailyStudyPlan => ({
  formatVersion: plan.formatVersion,
  date: plan.date,
  target: plan.target,
  pointIds: [...plan.pointIds],
  completedPointIds: [...plan.completedPointIds],
  reviewHistory: cloneReviewHistory(plan.reviewHistory),
  updatedAt: plan.updatedAt
});

export const createLearningBackup = (
  records: StudyRecords,
  dailyStudyPlan: DailyStudyPlan,
  date = new Date()
): LearningBackupFile => ({
  formatVersion: LEARNING_BACKUP_FORMAT_VERSION,
  app: LEARNING_BACKUP_APP_ID,
  exportedAt: date.toISOString(),
  studyData: createStudyData(records, date),
  dailyStudyPlan: cloneDailyStudyPlan(dailyStudyPlan)
});

export const validateLearningBackup = (
  value: unknown,
  allowedPointIds: ReadonlySet<string>
): LearningBackupValidationResult => {
  if (!isRecord(value)) {
    return { success: false, errors: ['完整备份根节点必须是对象'] };
  }

  const errors: string[] = [];
  if (value.formatVersion !== LEARNING_BACKUP_FORMAT_VERSION) {
    errors.push(`formatVersion 必须是 ${LEARNING_BACKUP_FORMAT_VERSION}`);
  }
  if (value.app !== LEARNING_BACKUP_APP_ID) {
    errors.push(`app 必须是 ${LEARNING_BACKUP_APP_ID}`);
  }
  if (!isValidDate(value.exportedAt)) {
    errors.push('exportedAt 必须是有效日期字符串');
  }

  const studyResult = validateStudyData(value.studyData, allowedPointIds);
  if (!studyResult.success) {
    errors.push(...studyResult.errors.map(error => `studyData.${error}`));
  }

  const dailyStudyPlan = validateDailyStudyPlan(value.dailyStudyPlan, allowedPointIds);
  if (!dailyStudyPlan) {
    errors.push('dailyStudyPlan 必须是有效的今日计划数据');
  }

  if (errors.length > 0 || !studyResult.success || !dailyStudyPlan || !isValidDate(value.exportedAt)) {
    return { success: false, errors: errors.slice(0, 20) };
  }

  return {
    success: true,
    data: {
      formatVersion: LEARNING_BACKUP_FORMAT_VERSION,
      app: LEARNING_BACKUP_APP_ID,
      exportedAt: value.exportedAt,
      studyData: studyResult.data,
      dailyStudyPlan
    }
  };
};

export const createLearningBackupFilename = (date = new Date()) =>
  `ruankao-learning-backup-${date.toISOString().slice(0, 10)}.json`;
