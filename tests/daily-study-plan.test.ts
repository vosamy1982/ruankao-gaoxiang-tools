import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DAILY_STUDY_PLAN_STORAGE_KEY,
  completeDailyStudyPoint,
  createDailyStudyPlan,
  getDailyStudyProgress,
  getDailyStudyResumePointId,
  getLocalDateKey,
  getNextIncompleteDailyPointId,
  loadDailyStudyPlan,
  saveDailyStudyPlan,
  validateDailyStudyPlan
} from '../src/services/DailyStudyPlan.ts';

const date = new Date('2026-06-22T08:00:00Z');
const nextDate = new Date('2026-06-23T08:00:00Z');
const pointIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const records = {
  p2: {
    favorite: false,
    status: 'studying' as const,
    updatedAt: date.toISOString()
  },
  p3: {
    favorite: true,
    status: 'not-started' as const,
    updatedAt: date.toISOString()
  },
  p5: {
    favorite: false,
    status: 'mastered' as const,
    updatedAt: date.toISOString()
  }
};

const createStorage = () => {
  const data = new Map<string, string>();
  return {
    data,
    storage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      }
    }
  };
};

test('creates a daily plan from the smart review priority', () => {
  const plan = createDailyStudyPlan(pointIds, records, 5, date);

  assert.equal(plan.date, getLocalDateKey(date));
  assert.equal(plan.target, 5);
  assert.deepEqual(plan.pointIds, ['p2', 'p3', 'p1', 'p4', 'p6']);
  assert.deepEqual(plan.completedPointIds, []);
  assert.deepEqual(getDailyStudyProgress(plan), {
    total: 5,
    completed: 0,
    percent: 0,
    isComplete: false
  });
});

test('preserves progress when the same-day target changes', () => {
  const plan = createDailyStudyPlan(pointIds, records, 5, date);
  const completed = completeDailyStudyPoint(plan, 'p2', date);
  const resized = createDailyStudyPlan(pointIds, records, 3, date, completed);

  assert.deepEqual(resized.pointIds, ['p2', 'p3', 'p1']);
  assert.deepEqual(resized.completedPointIds, ['p2']);
  assert.equal(getDailyStudyResumePointId(resized), 'p3');
});

test('completes points and selects the next incomplete item', () => {
  const plan = createDailyStudyPlan(pointIds, records, 3, date);
  const firstCompleted = completeDailyStudyPoint(plan, 'p2', date);

  assert.equal(getNextIncompleteDailyPointId(firstCompleted, 'p2'), 'p3');
  const secondCompleted = completeDailyStudyPoint(firstCompleted, 'p3', date);
  assert.equal(getNextIncompleteDailyPointId(secondCompleted, 'p3'), 'p1');
  const complete = completeDailyStudyPoint(secondCompleted, 'p1', date);
  assert.deepEqual(getDailyStudyProgress(complete), {
    total: 3,
    completed: 3,
    percent: 100,
    isComplete: true
  });
  assert.equal(getNextIncompleteDailyPointId(complete, 'p1'), null);
});

test('starts a fresh queue on a new local date while preserving the target', () => {
  const plan = createDailyStudyPlan(pointIds, records, 10, date);
  const completed = completeDailyStudyPoint(plan, 'p2', date);
  const nextPlan = createDailyStudyPlan(pointIds, records, completed.target, nextDate, completed);

  assert.equal(nextPlan.date, getLocalDateKey(nextDate));
  assert.equal(nextPlan.target, 10);
  assert.deepEqual(nextPlan.completedPointIds, []);
});

test('loads and saves a validated plan from browser storage', () => {
  const { data, storage } = createStorage();
  const plan = createDailyStudyPlan(pointIds, records, 5, date);

  saveDailyStudyPlan(storage, plan);
  assert.equal(data.has(DAILY_STUDY_PLAN_STORAGE_KEY), true);
  assert.deepEqual(loadDailyStudyPlan(storage, pointIds, records, date), plan);

  data.set(DAILY_STUDY_PLAN_STORAGE_KEY, '{bad json');
  assert.deepEqual(loadDailyStudyPlan(storage, pointIds, records, date).pointIds, plan.pointIds);
});

test('rejects malformed or unknown daily plan entries', () => {
  const plan = createDailyStudyPlan(pointIds, records, 5, date);
  assert.deepEqual(validateDailyStudyPlan(plan, new Set(pointIds)), plan);
  assert.equal(validateDailyStudyPlan({ ...plan, pointIds: ['unknown'] }, new Set(pointIds)), null);
  assert.equal(validateDailyStudyPlan({ ...plan, completedPointIds: ['p5'] }, new Set(pointIds)), null);
  assert.equal(validateDailyStudyPlan({ ...plan, target: 0 }, new Set(pointIds)), null);
});
