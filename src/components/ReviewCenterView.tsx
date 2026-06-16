import { useEffect, useMemo, useRef, useState } from 'react';
import { processExamChapters } from '../services/ExamDataManager';
import {
  createReviewQueue,
  getAdjacentReviewPointId,
  getRandomReviewPointId,
  getStudySummary,
  loadStudyRecords,
  saveStudyRecords,
  setStudyRecord
} from '../services/StudyProgress';
import type { ReviewQueueKind } from '../services/StudyProgress';
import type { ExamChapter, ExamPoint, StudyRecords, StudyStatus } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Heart,
  Play,
  Shuffle,
  Target,
  X
} from 'lucide-react';
import { ExamPointRenderer } from './ExamPointRenderer';
import {
  defaultStudyRecord,
  getPointUniqueId,
  renderStars,
  reviewQueueOptions,
  studyStatusOptions
} from './studyPointHelpers';
import './ReviewCenterView.css';

interface ReviewCenterViewProps {
  sourceChapters: ExamChapter[];
}

interface PointLocation {
  chapterId: string;
  chapterTitle: string;
  point: ExamPoint;
}

const reviewQueueDescriptions: Record<ReviewQueueKind, string> = {
  smart: '优先学习中的考点，其次是尚未掌握的收藏，最后是未学习考点。',
  studying: '只复习当前标记为学习中的考点。',
  'not-started': '按章节顺序复习尚未开始的考点。',
  favorites: '复习全部收藏考点，包括已经掌握的内容。'
};

export default function ReviewCenterView({ sourceChapters }: ReviewCenterViewProps) {
  const chapters = useMemo(() => processExamChapters(sourceChapters), [sourceChapters]);
  const pointIndex = useMemo(() => {
    const index = new Map<string, PointLocation>();
    chapters.forEach(chapter => {
      chapter.points.forEach(point => {
        index.set(getPointUniqueId(chapter.id, point.id, point.uniqueId), {
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          point
        });
      });
    });
    return index;
  }, [chapters]);
  const allPointIds = useMemo(() => Array.from(pointIndex.keys()), [pointIndex]);
  const allowedPointIds = useMemo(() => new Set(allPointIds), [allPointIds]);
  const [reviewQueueKind, setReviewQueueKind] = useState<ReviewQueueKind>('smart');
  const [activeReviewQueueKind, setActiveReviewQueueKind] = useState<ReviewQueueKind | null>(null);
  const [activeReviewQueue, setActiveReviewQueue] = useState<string[]>([]);
  const [selectedUniqueId, setSelectedUniqueId] = useState<string | null>(null);
  const [studyRecords, setStudyRecords] = useState<StudyRecords>(() =>
    loadStudyRecords(window.localStorage, allowedPointIds)
  );
  const [studyMessage, setStudyMessage] = useState('');
  const articleBodyRef = useRef<HTMLDivElement>(null);

  const studySummary = useMemo(
    () => getStudySummary(studyRecords, allPointIds),
    [allPointIds, studyRecords]
  );
  const reviewQueuePreview = useMemo(
    () => createReviewQueue(reviewQueueKind, allPointIds, studyRecords),
    [allPointIds, reviewQueueKind, studyRecords]
  );
  const validSelectedUniqueId = selectedUniqueId && pointIndex.has(selectedUniqueId)
    ? selectedUniqueId
    : null;
  const selectedLocation = validSelectedUniqueId ? pointIndex.get(validSelectedUniqueId) ?? null : null;
  const selectedPoint = selectedLocation?.point ?? null;
  const selectedStudyRecord = validSelectedUniqueId
    ? studyRecords[validSelectedUniqueId] ?? defaultStudyRecord
    : defaultStudyRecord;
  const activeReviewPosition = validSelectedUniqueId
    ? activeReviewQueue.indexOf(validSelectedUniqueId)
    : -1;
  const activeReviewLabel = activeReviewQueueKind
    ? reviewQueueOptions.find(option => option.value === activeReviewQueueKind)?.label
    : null;

  useEffect(() => {
    articleBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [validSelectedUniqueId]);

  const selectPointById = (uniqueId: string) => {
    if (!pointIndex.has(uniqueId)) return false;
    setSelectedUniqueId(uniqueId);
    return true;
  };

  const commitStudyRecords = (records: StudyRecords) => {
    try {
      saveStudyRecords(window.localStorage, records);
      setStudyRecords(records);
      return true;
    } catch {
      setStudyMessage('学习记录保存失败，请检查浏览器存储空间');
      return false;
    }
  };

  const updateSelectedStudyRecord = (
    updates: Partial<{ favorite: boolean; status: StudyStatus }>
  ) => {
    if (!validSelectedUniqueId) return;
    commitStudyRecords(setStudyRecord(studyRecords, validSelectedUniqueId, updates));
  };

  const handleStartReview = () => {
    const queue = createReviewQueue(reviewQueueKind, allPointIds, studyRecords);
    if (queue.length === 0) {
      const label = reviewQueueOptions.find(option => option.value === reviewQueueKind)?.label;
      setStudyMessage(`${label ?? '当前'}队列没有可复习的考点`);
      return;
    }

    const canResume = activeReviewQueueKind === reviewQueueKind
      && validSelectedUniqueId !== null
      && queue.includes(validSelectedUniqueId);
    const startPointId = canResume && validSelectedUniqueId ? validSelectedUniqueId : queue[0];
    setActiveReviewQueue(queue);
    setActiveReviewQueueKind(reviewQueueKind);
    selectPointById(startPointId);
    setStudyMessage(`已生成 ${queue.length} 个考点的复习队列`);
  };

  const handleReviewNavigation = (direction: 'previous' | 'next') => {
    const pointId = getAdjacentReviewPointId(activeReviewQueue, validSelectedUniqueId, direction);
    if (pointId) {
      selectPointById(pointId);
    }
  };

  const handleRandomReviewPoint = () => {
    const pointId = getRandomReviewPointId(activeReviewQueue, validSelectedUniqueId);
    if (pointId) {
      selectPointById(pointId);
    }
  };

  const handleStopReview = () => {
    setActiveReviewQueue([]);
    setActiveReviewQueueKind(null);
    setStudyMessage('已退出快速复习');
  };

  if (!chapters || chapters.length === 0) {
    return <div className="review-center-empty">无考点数据加载。</div>;
  }

  return (
    <div className="review-center-container fade-in">
      <aside className="review-control-panel glass-panel">
        <h3 className="review-panel-title">
          <BookOpenCheck size={20} className="review-panel-title-icon" />
          复习中心
        </h3>

        <div className="review-summary" aria-label="学习进度">
          <div className="review-summary-header">
            <span>学习进度</span>
            <strong>{studySummary.mastered}/{studySummary.total}</strong>
          </div>
          <div className="review-progress-track" aria-hidden="true">
            <span style={{ width: `${studySummary.masteredPercent}%` }} />
          </div>
          <div className="review-summary-grid">
            <span>{studySummary.masteredPercent}% 已掌握</span>
            <span>学习中 {studySummary.studying}</span>
            <span>未学习 {studySummary.notStarted}</span>
            <span>收藏 {studySummary.favorites}</span>
          </div>
        </div>

        <section className="review-launch-box" aria-label="复习队列">
          <label className="review-queue-label">
            <span>复习队列</span>
            <select
              className="review-queue-select"
              value={reviewQueueKind}
              onChange={event => setReviewQueueKind(event.target.value as ReviewQueueKind)}
            >
              {reviewQueueOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <p className="review-queue-description">
            {reviewQueueDescriptions[reviewQueueKind]}
          </p>
          <button
            type="button"
            className="review-start-button"
            disabled={reviewQueuePreview.length === 0}
            onClick={handleStartReview}
          >
            <Play size={16} fill="currentColor" />
            继续学习
            <span>{reviewQueuePreview.length}</span>
          </button>
        </section>

        {activeReviewQueueKind && activeReviewQueue.length > 0 && (
          <section className="review-session-card" aria-label="当前复习轮次">
            <div>
              <span>当前轮次</span>
              <strong>{activeReviewLabel}</strong>
            </div>
            <div>
              <span>当前位置</span>
              <strong>
                {activeReviewPosition >= 0 ? activeReviewPosition + 1 : 0}
                {' / '}
                {activeReviewQueue.length}
              </strong>
            </div>
          </section>
        )}

        {studyMessage && (
          <div className="review-message" role="status">
            <span>{studyMessage}</span>
            <button
              type="button"
              aria-label="关闭提示"
              onClick={() => setStudyMessage('')}
            >
              <X size={13} />
            </button>
          </div>
        )}
      </aside>

      <section className="review-content-panel">
        {selectedPoint ? (
          <article className="review-article glass-panel slide-up">
            <header className="review-article-header">
              <div className="review-article-header-inner">
                <p className="review-point-chapter">{selectedLocation?.chapterTitle}</p>
                <div className="review-title-row">
                  <h1 className="review-title">{selectedPoint.title}</h1>
                  <button
                    type="button"
                    className={`review-favorite-button ${selectedStudyRecord.favorite ? 'active' : ''}`}
                    aria-pressed={selectedStudyRecord.favorite}
                    onClick={() => updateSelectedStudyRecord({
                      favorite: !selectedStudyRecord.favorite
                    })}
                  >
                    <Heart size={18} fill={selectedStudyRecord.favorite ? 'currentColor' : 'none'} />
                    {selectedStudyRecord.favorite ? '已收藏' : '收藏'}
                  </button>
                </div>
                <div className="review-study-controls">
                  {selectedPoint.importance > 0 && (
                    <div className="review-article-meta">
                      <span className="review-importance-label">考点重要度:</span>
                      {renderStars(selectedPoint.importance)}
                    </div>
                  )}
                  <div className="review-status-control" aria-label="学习状态">
                    {studyStatusOptions.map(option => {
                      const Icon = option.icon;
                      const isActive = selectedStudyRecord.status === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          className={`review-status-button ${option.value} ${isActive ? 'active' : ''}`}
                          aria-pressed={isActive}
                          onClick={() => updateSelectedStudyRecord({ status: option.value })}
                        >
                          <Icon size={15} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeReviewQueueKind && activeReviewQueue.length > 0 && (
                  <div className="review-navigation" aria-label="快速复习导航">
                    <div className="review-navigation-info">
                      <span>{activeReviewLabel}</span>
                      <strong>
                        {activeReviewPosition >= 0 ? activeReviewPosition + 1 : 0}
                        {' / '}
                        {activeReviewQueue.length}
                      </strong>
                    </div>
                    <div className="review-navigation-actions">
                      <button
                        type="button"
                        aria-label="上一个考点"
                        disabled={activeReviewPosition <= 0}
                        onClick={() => handleReviewNavigation('previous')}
                      >
                        <ArrowLeft size={16} />
                        上一个
                      </button>
                      <button
                        type="button"
                        aria-label="随机考点"
                        onClick={handleRandomReviewPoint}
                      >
                        <Shuffle size={16} />
                        随机
                      </button>
                      <button
                        type="button"
                        aria-label="下一个考点"
                        disabled={
                          activeReviewPosition < 0
                          || activeReviewPosition >= activeReviewQueue.length - 1
                        }
                        onClick={() => handleReviewNavigation('next')}
                      >
                        下一个
                        <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        className="review-stop-button"
                        aria-label="退出快速复习"
                        title="退出快速复习"
                        onClick={handleStopReview}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </header>
            <div className="review-article-body" ref={articleBodyRef}>
              <div className="review-article-body-inner">
                <ExamPointRenderer
                  content={selectedPoint.content}
                  title={selectedPoint.title}
                />
              </div>
            </div>
          </article>
        ) : (
          <div className="review-no-selection glass-panel">
            <Target size={48} className="review-empty-icon" />
            <p>选择一个复习队列，然后点击继续学习</p>
          </div>
        )}
      </section>
    </div>
  );
}
