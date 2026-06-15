import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STUDY_STORAGE_KEY,
  clearStudyRecords,
  createReviewQueue,
  createStudyData,
  createStudyDataFilename,
  getAdjacentReviewPointId,
  getRandomReviewPointId,
  getStudySummary,
  loadStudyRecords,
  saveStudyRecords,
  setStudyRecord,
  validateStudyData
} from '../src/services/StudyProgress.ts';

const date = new Date('2026-06-13T08:00:00Z');
const allowedPointIds = new Set(['chapter-1_point-1', 'chapter-1_point-2']);

test('validates and sanitizes study data', () => {
  const result = validateStudyData({
    formatVersion: 1,
    exportedAt: date.toISOString(),
    records: {
      'chapter-1_point-1': {
        favorite: true,
        status: 'studying',
        updatedAt: date.toISOString(),
        ignored: 'not exported'
      }
    },
    ignored: 'not exported'
  }, allowedPointIds);

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(result.data, {
    formatVersion: 1,
    exportedAt: date.toISOString(),
    records: {
      'chapter-1_point-1': {
        favorite: true,
        status: 'studying',
        updatedAt: date.toISOString()
      }
    }
  });
});

test('rejects invalid and unknown study records', () => {
  const invalidStatus = validateStudyData(createStudyData({
    'chapter-1_point-1': {
      favorite: false,
      status: 'invalid',
      updatedAt: date.toISOString()
    }
  } as never, date), allowedPointIds);
  assert.equal(invalidStatus.success, false);

  const unknownPoint = validateStudyData(createStudyData({
    'chapter-2_point-1': {
      favorite: true,
      status: 'mastered',
      updatedAt: date.toISOString()
    }
  }, date), allowedPointIds);
  assert.equal(unknownPoint.success, false);
  if (!unknownPoint.success) {
    assert.match(unknownPoint.errors.join('\n'), /考点不存在/);
  }
});

test('updates records and removes default entries', () => {
  const studying = setStudyRecord({}, 'chapter-1_point-1', {
    status: 'studying'
  }, date);
  assert.equal(studying['chapter-1_point-1'].status, 'studying');

  const favorite = setStudyRecord(studying, 'chapter-1_point-1', {
    favorite: true
  }, date);
  assert.equal(favorite['chapter-1_point-1'].favorite, true);

  const cleared = setStudyRecord(favorite, 'chapter-1_point-1', {
    favorite: false,
    status: 'not-started'
  }, date);
  assert.deepEqual(cleared, {});
});

test('calculates study summary for known points', () => {
  const records = {
    'chapter-1_point-1': {
      favorite: true,
      status: 'mastered' as const,
      updatedAt: date.toISOString()
    },
    'chapter-1_point-2': {
      favorite: false,
      status: 'studying' as const,
      updatedAt: date.toISOString()
    }
  };
  assert.deepEqual(getStudySummary(records, [...allowedPointIds]), {
    total: 2,
    notStarted: 0,
    studying: 1,
    mastered: 1,
    favorites: 1,
    masteredPercent: 50
  });
});

test('loads, saves, and clears browser storage safely', () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    }
  };
  const records = {
    'chapter-1_point-1': {
      favorite: true,
      status: 'mastered' as const,
      updatedAt: date.toISOString()
    }
  };

  saveStudyRecords(storage, records, date);
  assert.deepEqual(loadStudyRecords(storage, allowedPointIds), records);
  clearStudyRecords(storage);
  assert.equal(data.has(STUDY_STORAGE_KEY), false);

  data.set(STUDY_STORAGE_KEY, '{bad json');
  assert.deepEqual(loadStudyRecords(storage, allowedPointIds), {});
});

test('creates a stable dated study export filename', () => {
  assert.equal(createStudyDataFilename(date), 'study-progress-2026-06-13.json');
});

test('creates focused review queues from study records', () => {
  const pointIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
  const records = {
    p1: {
      favorite: false,
      status: 'mastered' as const,
      updatedAt: date.toISOString()
    },
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
    p4: {
      favorite: true,
      status: 'mastered' as const,
      updatedAt: date.toISOString()
    }
  };

  assert.deepEqual(createReviewQueue('smart', pointIds, records), ['p2', 'p3', 'p5']);
  assert.deepEqual(createReviewQueue('studying', pointIds, records), ['p2']);
  assert.deepEqual(createReviewQueue('not-started', pointIds, records), ['p3', 'p5']);
  assert.deepEqual(createReviewQueue('favorites', pointIds, records), ['p3', 'p4']);
});

test('navigates review queues without wrapping', () => {
  const queue = ['p1', 'p2', 'p3'];

  assert.equal(getAdjacentReviewPointId(queue, 'p2', 'previous'), 'p1');
  assert.equal(getAdjacentReviewPointId(queue, 'p2', 'next'), 'p3');
  assert.equal(getAdjacentReviewPointId(queue, 'p1', 'previous'), null);
  assert.equal(getAdjacentReviewPointId(queue, 'p3', 'next'), null);
  assert.equal(getAdjacentReviewPointId(queue, null, 'next'), 'p1');
});

test('selects a different random review point when possible', () => {
  const queue = ['p1', 'p2', 'p3'];

  assert.equal(getRandomReviewPointId(queue, 'p2', () => 0), 'p1');
  assert.equal(getRandomReviewPointId(queue, 'p2', () => 0.999), 'p3');
  assert.equal(getRandomReviewPointId(['p1'], 'p1', () => 0), 'p1');
  assert.equal(getRandomReviewPointId([], null, () => 0), null);
});
