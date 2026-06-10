import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExamDataFilename,
  validateExamData
} from '../src/services/ExamDataIO.ts';

const validData = [{
  id: 'chapter-1',
  title: '示例章节',
  points: [{
    id: 'point-1',
    title: '示例考点',
    importance: 3,
    content: '使用原创语言编写的示例内容。'
  }]
}];

test('accepts and sanitizes valid exam data', () => {
  const result = validateExamData([{
    ...validData[0],
    ignored: 'not exported',
    points: [{
      ...validData[0].points[0],
      uniqueId: 'chapter-1_point-1',
      ignored: 'not exported'
    }]
  }]);

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.deepEqual(result.data, [{
    id: 'chapter-1',
    title: '示例章节',
    points: [{
      id: 'point-1',
      title: '示例考点',
      importance: 3,
      content: '使用原创语言编写的示例内容。',
      uniqueId: 'chapter-1_point-1'
    }]
  }]);
});

test('rejects invalid roots and empty chapter arrays', () => {
  assert.deepEqual(validateExamData({}), {
    success: false,
    errors: ['JSON 根节点必须是章节数组']
  });
  assert.deepEqual(validateExamData([]), {
    success: false,
    errors: ['章节数组不能为空']
  });
});

test('rejects duplicate chapter and point IDs', () => {
  const duplicateChapterResult = validateExamData([
    validData[0],
    { ...validData[0], title: '重复章节' }
  ]);
  assert.equal(duplicateChapterResult.success, false);
  if (!duplicateChapterResult.success) {
    assert.match(duplicateChapterResult.errors.join('\n'), /与其他章节重复/);
  }

  const duplicatePointResult = validateExamData([{
    ...validData[0],
    points: [
      validData[0].points[0],
      { ...validData[0].points[0], title: '重复考点' }
    ]
  }]);
  assert.equal(duplicatePointResult.success, false);
  if (!duplicatePointResult.success) {
    assert.match(duplicatePointResult.errors.join('\n'), /在当前章节内重复/);
  }
});

test('rejects missing fields and invalid importance values', () => {
  for (const importance of [-1, 2.5, 6, '3']) {
    const result = validateExamData([{
      ...validData[0],
      points: [{ ...validData[0].points[0], importance }]
    }]);
    assert.equal(result.success, false);
  }

  const missingContentResult = validateExamData([{
    ...validData[0],
    points: [{ ...validData[0].points[0], content: null }]
  }]);
  assert.equal(missingContentResult.success, false);
});

test('limits validation output to twenty errors', () => {
  const result = validateExamData([{
    id: 'chapter-1',
    title: '示例章节',
    points: Array.from({ length: 30 }, () => ({}))
  }]);

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.length, 20);
  }
});

test('creates a stable dated export filename', () => {
  assert.equal(
    createExamDataFilename(new Date('2026-06-10T00:00:00Z')),
    'exam-points-2026-06-10.json'
  );
});
