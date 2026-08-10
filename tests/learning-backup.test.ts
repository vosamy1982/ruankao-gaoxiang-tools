import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeDailyStudyPoint,
  createDailyStudyPlan
} from '../src/services/DailyStudyPlan.ts';
import {
  LEARNING_BACKUP_APP_ID,
  createLearningBackup,
  createLearningBackupFilename,
  validateLearningBackup
} from '../src/services/LearningBackup.ts';

const date = new Date('2026-08-10T08:00:00Z');
const pointIds = ['p1', 'p2', 'p3'];
const allowedPointIds = new Set(pointIds);
const records = {
  p1: {
    favorite: true,
    status: 'studying' as const,
    updatedAt: date.toISOString()
  },
  p2: {
    favorite: false,
    status: 'mastered' as const,
    updatedAt: date.toISOString()
  }
};

const createCompletedPlan = () => {
  const plan = createDailyStudyPlan(pointIds, records, 2, date);
  return completeDailyStudyPoint(plan, 'p1', date);
};

test('creates a complete learning backup from study records and daily plan', () => {
  const plan = createCompletedPlan();
  const backup = createLearningBackup(records, plan, date);

  assert.equal(backup.formatVersion, 1);
  assert.equal(backup.app, LEARNING_BACKUP_APP_ID);
  assert.equal(backup.exportedAt, date.toISOString());
  assert.deepEqual(backup.studyData.records, records);
  assert.deepEqual(backup.dailyStudyPlan, plan);
});

test('validates and sanitizes a complete learning backup', () => {
  const plan = createCompletedPlan();
  const backup = {
    ...createLearningBackup(records, plan, date),
    ignored: 'not exported',
    studyData: {
      ...createLearningBackup(records, plan, date).studyData,
      records: {
        p1: {
          ...records.p1,
          ignored: 'not exported'
        }
      }
    },
    dailyStudyPlan: {
      ...plan,
      ignored: 'not exported'
    }
  };

  const result = validateLearningBackup(backup, allowedPointIds);

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(result.data.studyData.records, {
    p1: records.p1
  });
  assert.deepEqual(result.data.dailyStudyPlan, plan);
});

test('rejects invalid learning backup metadata', () => {
  const plan = createCompletedPlan();
  const backup = createLearningBackup(records, plan, date);
  const result = validateLearningBackup({
    ...backup,
    app: 'other-app',
    formatVersion: 2
  }, allowedPointIds);

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.errors.join('\n'), /formatVersion/);
    assert.match(result.errors.join('\n'), /app/);
  }
});

test('rejects backups with unknown study record point IDs', () => {
  const plan = createCompletedPlan();
  const backup = createLearningBackup({
    ...records,
    unknown: {
      favorite: true,
      status: 'studying' as const,
      updatedAt: date.toISOString()
    }
  }, plan, date);

  const result = validateLearningBackup(backup, allowedPointIds);

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.errors.join('\n'), /考点不存在/);
  }
});

test('rejects backups with invalid daily study plans', () => {
  const plan = createCompletedPlan();
  const backup = createLearningBackup(records, {
    ...plan,
    completedPointIds: ['unknown']
  }, date);

  const result = validateLearningBackup(backup, allowedPointIds);

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.errors.join('\n'), /dailyStudyPlan/);
  }
});

test('creates a stable dated learning backup filename', () => {
  assert.equal(createLearningBackupFilename(date), 'ruankao-learning-backup-2026-08-10.json');
});
