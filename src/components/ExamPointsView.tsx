import { useState, useMemo, useEffect, useRef } from 'react';
import { processExamChapters } from '../services/ExamDataManager';
import {
  MAX_STUDY_DATA_FILE_SIZE,
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
} from '../services/StudyProgress';
import type { ReviewQueueKind } from '../services/StudyProgress';
import type { ExamChapter, StudyRecords, StudyStatus } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Download,
  FileText,
  Heart,
  Play,
  Search,
  Shuffle,
  Star,
  Timer,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { ExamPointRenderer } from './ExamPointRenderer';
import './ExamPointsView.css';

const getPointUniqueId = (chapterId: string, pointId: string, uniqueId?: string) => uniqueId ?? `${chapterId}_${pointId}`;
const defaultStudyRecord = { favorite: false, status: 'not-started' as const };

type StudyFilter = 'all' | 'favorites' | StudyStatus;

const studyStatusOptions: Array<{
  value: StudyStatus;
  label: string;
  icon: typeof Circle;
}> = [
  { value: 'not-started', label: '未学习', icon: Circle },
  { value: 'studying', label: '学习中', icon: Timer },
  { value: 'mastered', label: '已掌握', icon: CheckCircle2 }
];

const reviewQueueOptions: Array<{ value: ReviewQueueKind; label: string }> = [
  { value: 'smart', label: '智能复习' },
  { value: 'studying', label: '学习中' },
  { value: 'not-started', label: '未学习' },
  { value: 'favorites', label: '收藏' }
];

interface ExamPointsViewProps {
  sourceChapters: ExamChapter[];
}

export default function ExamPointsView({ sourceChapters }: ExamPointsViewProps) {
  const chapters = useMemo(() => processExamChapters(sourceChapters), [sourceChapters]);
  const allPointIds = useMemo(
    () => chapters.flatMap(chapter =>
      chapter.points.map(point => getPointUniqueId(chapter.id, point.id, point.uniqueId))
    ),
    [chapters]
  );
  const allowedPointIds = useMemo(() => new Set(allPointIds), [allPointIds]);
  const pointLocations = useMemo(
    () => new Map(chapters.flatMap(chapter =>
      chapter.points.map(point => [
        getPointUniqueId(chapter.id, point.id, point.uniqueId),
        { chapterId: chapter.id }
      ] as const)
    )),
    [chapters]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [studyFilter, setStudyFilter] = useState<StudyFilter>('all');
  const [reviewQueueKind, setReviewQueueKind] = useState<ReviewQueueKind>('smart');
  const [activeReviewQueueKind, setActiveReviewQueueKind] = useState<ReviewQueueKind | null>(null);
  const [activeReviewQueue, setActiveReviewQueue] = useState<string[]>([]);
  const [studyRecords, setStudyRecords] = useState<StudyRecords>(() =>
    loadStudyRecords(window.localStorage, allowedPointIds)
  );
  const [studyMessage, setStudyMessage] = useState('');
  const [selectedUniqueId, setSelectedUniqueId] = useState<string | null>(
    chapters[0]?.points[0]
      ? getPointUniqueId(chapters[0].id, chapters[0].points[0].id, chapters[0].points[0].uniqueId)
      : null
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set([chapters[0]?.id]));
  const sidebarRef = useRef<HTMLDivElement>(null);
  const articleBodyRef = useRef<HTMLDivElement>(null);
  const studyImportInputRef = useRef<HTMLInputElement>(null);

  const studySummary = useMemo(
    () => getStudySummary(studyRecords, allPointIds),
    [allPointIds, studyRecords]
  );
  const reviewQueuePreview = useMemo(
    () => createReviewQueue(reviewQueueKind, allPointIds, studyRecords),
    [allPointIds, reviewQueueKind, studyRecords]
  );
  const activeReviewPosition = selectedUniqueId
    ? activeReviewQueue.indexOf(selectedUniqueId)
    : -1;
  const activeReviewLabel = activeReviewQueueKind
    ? reviewQueueOptions.find(option => option.value === activeReviewQueueKind)?.label
    : null;
  
  const selectedPoint = useMemo(() => {
    if (!selectedUniqueId) return null;
    for (const chapter of chapters) {
      const point = chapter.points.find(p => getPointUniqueId(chapter.id, p.id, p.uniqueId) === selectedUniqueId);
      if (point) return point;
    }
    return null;
  }, [chapters, selectedUniqueId]);

  const selectedStudyRecord = selectedUniqueId
    ? studyRecords[selectedUniqueId] ?? defaultStudyRecord
    : defaultStudyRecord;
  
  const filteredChapters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    return chapters.map(chapter => {
      const filteredPoints = chapter.points.filter(point => {
        const pointUniqueId = getPointUniqueId(chapter.id, point.id, point.uniqueId);
        const record = studyRecords[pointUniqueId] ?? defaultStudyRecord;
        const matchesSearch = !term
          || point.title.toLowerCase().includes(term)
          || point.content.toLowerCase().includes(term);
        const matchesFilter = studyFilter === 'all'
          || (studyFilter === 'favorites' && record.favorite)
          || (studyFilter !== 'favorites' && record.status === studyFilter);
        return matchesSearch && matchesFilter;
      });
      if (filteredPoints.length > 0) return { ...chapter, points: filteredPoints };
      return null;
    }).filter(Boolean) as ExamChapter[];
  }, [chapters, searchTerm, studyFilter, studyRecords]);

  const visibleExpandedChapters = useMemo(() => {
    if (!searchTerm.trim() && studyFilter === 'all') return expandedChapters;
    const next = new Set(expandedChapters);
    filteredChapters.forEach(c => next.add(c.id));
    return next;
  }, [expandedChapters, filteredChapters, searchTerm, studyFilter]);

  // Handle auto-scroll to selected point
  useEffect(() => {
    if (selectedUniqueId) {
      const element = document.getElementById(`point-${selectedUniqueId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedUniqueId]);

  useEffect(() => {
    articleBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedUniqueId]);

  const selectPointById = (uniqueId: string, clearSearch = true) => {
    const location = pointLocations.get(uniqueId);
    if (!location) return false;
    setSelectedUniqueId(uniqueId);
    if (clearSearch) {
      setSearchTerm('');
    }
    setExpandedChapters(prev => new Set(prev).add(location.chapterId));
    return true;
  };

  const handleSelectPoint = (uniqueId: string, chapterId: string) => {
    setActiveReviewQueue([]);
    setActiveReviewQueueKind(null);
    setSelectedUniqueId(uniqueId);
    setSearchTerm('');
    setExpandedChapters(prev => new Set(prev).add(chapterId));
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
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
    if (!selectedUniqueId) return;
    commitStudyRecords(setStudyRecord(studyRecords, selectedUniqueId, updates));
  };

  const handleStartReview = () => {
    const queue = createReviewQueue(reviewQueueKind, allPointIds, studyRecords);
    if (queue.length === 0) {
      const label = reviewQueueOptions.find(option => option.value === reviewQueueKind)?.label;
      setStudyMessage(`${label ?? '当前'}队列没有可复习的考点`);
      return;
    }

    const canResume = activeReviewQueueKind === reviewQueueKind
      && selectedUniqueId !== null
      && queue.includes(selectedUniqueId);
    const startPointId = canResume && selectedUniqueId ? selectedUniqueId : queue[0];
    setActiveReviewQueue(queue);
    setActiveReviewQueueKind(reviewQueueKind);
    selectPointById(startPointId);
    setStudyMessage(`已生成 ${queue.length} 个考点的复习队列`);
  };

  const handleReviewNavigation = (direction: 'previous' | 'next') => {
    const pointId = getAdjacentReviewPointId(activeReviewQueue, selectedUniqueId, direction);
    if (pointId) {
      selectPointById(pointId);
    }
  };

  const handleRandomReviewPoint = () => {
    const pointId = getRandomReviewPointId(activeReviewQueue, selectedUniqueId);
    if (pointId) {
      selectPointById(pointId);
    }
  };

  const handleStopReview = () => {
    setActiveReviewQueue([]);
    setActiveReviewQueueKind(null);
    setStudyMessage('已退出快速复习');
  };

  const handleStudyImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_STUDY_DATA_FILE_SIZE) {
      setStudyMessage('导入失败：学习记录文件不能超过 1 MB');
      return;
    }

    try {
      const result = validateStudyData(JSON.parse(await file.text()) as unknown, allowedPointIds);
      if (!result.success) {
        const details = result.errors.slice(0, 3).join('；');
        const remainder = result.errors.length > 3 ? `；另有 ${result.errors.length - 3} 个错误` : '';
        setStudyMessage(`导入失败：${details}${remainder}`);
        return;
      }
      if (
        Object.keys(studyRecords).length > 0
        && !confirm('导入将替换当前学习记录，确定继续吗？')
      ) {
        return;
      }
      if (commitStudyRecords(result.data.records)) {
        setActiveReviewQueue([]);
        setActiveReviewQueueKind(null);
        setStudyMessage(`导入成功：${Object.keys(result.data.records).length} 条学习记录`);
      }
    } catch (error) {
      setStudyMessage(`导入失败：${error instanceof SyntaxError ? 'JSON 格式无效' : String(error)}`);
    }
  };

  const handleStudyExport = () => {
    const blob = new Blob(
      [JSON.stringify(createStudyData(studyRecords), null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createStudyDataFilename();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStudyMessage(`已导出 ${Object.keys(studyRecords).length} 条学习记录`);
  };

  const handleClearStudyRecords = () => {
    if (Object.keys(studyRecords).length === 0) {
      setStudyMessage('当前没有需要清空的学习记录');
      return;
    }
    if (!confirm('确定清空全部收藏和学习状态吗？此操作不可撤销。')) {
      return;
    }
    if (commitStudyRecords({})) {
      setActiveReviewQueue([]);
      setActiveReviewQueueKind(null);
      setStudyFilter('all');
      setStudyMessage('学习记录已清空');
    }
  };

  const renderStars = (count: number) => {
    if (!count) return null;
    const currentCount = Math.min(count, 5);
    return (
      <div className="point-stars">
        {Array.from({ length: currentCount }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={count >= 4 ? 'star-high' : 'star-normal'}
            fill="currentColor"
          />
        ))}
      </div>
    );
  };

  const highlightText = (text: string, term: string) => {
    const normalizedTerm = term.trim();
    if (!normalizedTerm) return text;
    const lowerText = text.toLowerCase();
    const lowerTerm = normalizedTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="search-highlight">{text.substring(index, index + normalizedTerm.length)}</span>
        {text.substring(index + normalizedTerm.length)}
      </>
    );
  };

  if (!chapters || chapters.length === 0) {
    return <div className="exam-points-empty">无考点数据加载。</div>;
  }

  return (
    <div className="exam-points-container fade-in">
      {/* 左侧导航树 */}
      <div className="sidebar-container glass-panel" ref={sidebarRef}>
        <h3 className="sidebar-title">
          <BookOpenText size={20} className="title-icon" />
          系统考点目录
        </h3>
        
        <div className="exam-points-search-wrapper">
          <Search className="exam-points-search-icon" size={16} />
          <input
            type="text"
            className="exam-points-search-input"
            placeholder="搜索考点标题或内容..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="exam-points-search-clear" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="study-summary" aria-label="学习进度">
          <div className="study-summary-header">
            <span>学习进度</span>
            <strong>{studySummary.mastered}/{studySummary.total}</strong>
          </div>
          <div className="study-progress-track" aria-hidden="true">
            <span style={{ width: `${studySummary.masteredPercent}%` }} />
          </div>
          <div className="study-summary-meta">
            <span>{studySummary.masteredPercent}% 已掌握</span>
            <span>学习中 {studySummary.studying}</span>
            <span>收藏 {studySummary.favorites}</span>
          </div>
        </div>

        <div className="review-launcher">
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
          <button
            type="button"
            className="review-start-button"
            disabled={reviewQueuePreview.length === 0}
            onClick={handleStartReview}
          >
            <Play size={15} fill="currentColor" />
            继续学习
            <span>{reviewQueuePreview.length}</span>
          </button>
        </div>

        <div className="study-toolbar">
          <label className="study-filter-label">
            <span>筛选</span>
            <select
              className="study-filter-select"
              value={studyFilter}
              onChange={event => setStudyFilter(event.target.value as StudyFilter)}
            >
              <option value="all">全部考点</option>
              <option value="favorites">仅看收藏</option>
              <option value="not-started">未学习</option>
              <option value="studying">学习中</option>
              <option value="mastered">已掌握</option>
            </select>
          </label>
          <div className="study-data-actions">
            <input
              ref={studyImportInputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={handleStudyImport}
            />
            <button
              type="button"
              className="study-icon-button"
              title="导入学习记录"
              aria-label="导入学习记录"
              onClick={() => studyImportInputRef.current?.click()}
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              className="study-icon-button"
              title="导出学习记录"
              aria-label="导出学习记录"
              onClick={handleStudyExport}
            >
              <Download size={16} />
            </button>
            <button
              type="button"
              className="study-icon-button danger"
              title="清空学习记录"
              aria-label="清空学习记录"
              onClick={handleClearStudyRecords}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {studyMessage && (
          <div className="study-message" role="status">
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

        <div className="tree-navigation">
          {filteredChapters.length === 0 ? (
             <div className="sidebar-empty-state">
               没有符合当前搜索和筛选条件的考点
             </div>
          ) : (
            filteredChapters.map(chapter => {
              const isExpanded = visibleExpandedChapters.has(chapter.id);
              return (
              <div key={chapter.id} className="chapter-group">
                <div
                  className={`chapter-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleChapter(chapter.id)}
                >
                  {isExpanded ? <ChevronDown size={18} className="chevron" /> : <ChevronRight size={18} className="chevron" />}
                  <span className="chapter-title">{chapter.title}</span>
                </div>

                <div className={`points-list-wrapper ${isExpanded ? 'open' : ''}`}>
                  <div className="points-list">
                    {chapter.points.map(point => {
                      const pointUniqueId = getPointUniqueId(chapter.id, point.id, point.uniqueId);
                      const isSelected = selectedUniqueId === pointUniqueId;
                      const studyRecord = studyRecords[pointUniqueId] ?? defaultStudyRecord;
                      return (
                        <div
                          key={pointUniqueId}
                          id={`point-${pointUniqueId}`}
                          className={`point-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectPoint(pointUniqueId, chapter.id)}
                        >
                          <div className="point-item-title-wrapper">
                            <FileText size={14} className="point-icon"/>
                            <span className="point-item-title" title={point.title}>
                              {highlightText(point.title, searchTerm)}
                            </span>
                          </div>
                          <div className="point-item-indicators">
                            {studyRecord.favorite && (
                              <Heart
                                size={14}
                                className="point-favorite-indicator"
                                fill="currentColor"
                                aria-label="已收藏"
                              />
                            )}
                            <span
                              className={`point-status-indicator ${studyRecord.status}`}
                              title={studyStatusOptions.find(option => option.value === studyRecord.status)?.label}
                            />
                            {renderStars(point.importance)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="content-container">
        {selectedPoint ? (
          <div className="point-article glass-panel slide-up">
            <header className="article-header">
              <div className="article-header-inner">
                <div className="article-title-row">
                  <h1 className="article-title">{selectedPoint.title}</h1>
                  <button
                    type="button"
                    className={`favorite-button ${selectedStudyRecord.favorite ? 'active' : ''}`}
                    aria-pressed={selectedStudyRecord.favorite}
                    onClick={() => updateSelectedStudyRecord({
                      favorite: !selectedStudyRecord.favorite
                    })}
                  >
                    <Heart size={18} fill={selectedStudyRecord.favorite ? 'currentColor' : 'none'} />
                    {selectedStudyRecord.favorite ? '已收藏' : '收藏'}
                  </button>
                </div>
                <div className="article-study-controls">
                  {selectedPoint.importance > 0 && (
                    <div className="article-meta">
                      <span className="importance-label">考点重要度:</span>
                      {renderStars(selectedPoint.importance)}
                    </div>
                  )}
                  <div className="study-status-control" aria-label="学习状态">
                    {studyStatusOptions.map(option => {
                      const Icon = option.icon;
                      const isActive = selectedStudyRecord.status === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          className={`study-status-button ${option.value} ${isActive ? 'active' : ''}`}
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
            <div className="article-body" ref={articleBodyRef}>
              <div className="article-body-inner">
                <ExamPointRenderer 
                  content={selectedPoint.content} 
                  title={selectedPoint.title} 
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection glass-panel">
            <Beaker size={48} className="empty-icon" />
            <p>请在左侧选择一个考点</p>
          </div>
        )}
      </div>
    </div>
  );
}
