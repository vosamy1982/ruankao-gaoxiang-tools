import { useState, useMemo, useEffect, useRef } from 'react';
import { processedChapters as chapters } from '../services/ExamDataManager';
import type { ExamChapter } from '../types';
import { ChevronRight, ChevronDown, Star, Beaker, FileText, BookOpenText, Search, X } from 'lucide-react';
import { ExamPointRenderer } from './ExamPointRenderer';
import './ExamPointsView.css';

const getPointUniqueId = (chapterId: string, pointId: string, uniqueId?: string) => uniqueId ?? `${chapterId}_${pointId}`;

export default function ExamPointsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniqueId, setSelectedUniqueId] = useState<string | null>(
    chapters[0]?.points[0]
      ? getPointUniqueId(chapters[0].id, chapters[0].points[0].id, chapters[0].points[0].uniqueId)
      : null
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set([chapters[0]?.id]));
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const selectedPoint = useMemo(() => {
    if (!selectedUniqueId) return null;
    for (const chapter of chapters) {
      const point = chapter.points.find(p => getPointUniqueId(chapter.id, p.id, p.uniqueId) === selectedUniqueId);
      if (point) return point;
    }
    return null;
  }, [selectedUniqueId]);
  
  const filteredChapters = useMemo(() => {
    if (!searchTerm.trim()) return chapters;
    const term = searchTerm.toLowerCase();
    
    return chapters.map(chapter => {
      const filteredPoints = chapter.points.filter(point => 
        point.title.toLowerCase().includes(term) || 
        point.content.toLowerCase().includes(term)
      );
      if (filteredPoints.length > 0) return { ...chapter, points: filteredPoints };
      return null;
    }).filter(Boolean) as ExamChapter[];
  }, [searchTerm]);

  const visibleExpandedChapters = useMemo(() => {
    if (!searchTerm.trim()) return expandedChapters;
    const next = new Set(expandedChapters);
    filteredChapters.forEach(c => next.add(c.id));
    return next;
  }, [expandedChapters, filteredChapters, searchTerm]);

  // Handle auto-scroll to selected point
  useEffect(() => {
    if (selectedUniqueId) {
      const element = document.getElementById(`point-${selectedUniqueId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedUniqueId]);

  const handleSelectPoint = (uniqueId: string, chapterId: string) => {
    setSelectedUniqueId(uniqueId);
    // If we are searching, we might want to clear it or keep it?
    // User requested "find it then operate normally", which implies restoring context.
    if (searchTerm) {
      setSearchTerm('');
    }
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
    if (!term.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="search-highlight">{text.substring(index, index + term.length)}</span>
        {text.substring(index + term.length)}
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

        <div className="tree-navigation">
          {filteredChapters.length === 0 ? (
             <div className="sidebar-empty-state">
               未找到包含“{searchTerm}”的考点
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
                          {renderStars(point.importance)}
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
                <h1 className="article-title">{selectedPoint.title}</h1>
                {selectedPoint.importance > 0 && (
                  <div className="article-meta">
                    <span className="importance-label">考点重要度:</span>
                    {renderStars(selectedPoint.importance)}
                  </div>
                )}
              </div>
            </header>
            <div className="article-body">
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
