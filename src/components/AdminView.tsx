import React, { useState, useCallback, useRef, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import {
  Save, Plus, Trash2, AlertCircle, BookOpenText, FileText, ChevronRight,
  ChevronDown, Search, X, Upload, Download
} from 'lucide-react';
import type { ExamChapter } from '../types';
import {
  createExamDataFilename,
  MAX_EXAM_DATA_FILE_SIZE,
  validateExamData
} from '../services/ExamDataIO';
import { ExamPointRenderer } from './ExamPointRenderer';
import './AdminView.css';

const createClientId = (prefix: string) => {
  if (crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
};

interface AdminViewProps {
  chapters: ExamChapter[];
  setChapters: React.Dispatch<React.SetStateAction<ExamChapter[]>>;
}

const AdminView: React.FC<AdminViewProps> = ({ chapters, setChapters }) => {
  const [selectedPointInfo, setSelectedPointInfo] = useState<{chapterId: string, pointId: string} | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set([chapters[0]?.id]));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredChapters = useMemo(() => {
    if (!normalizedQuery) return chapters;
    return chapters
      .map(c => {
        const chapterHit = c.title.toLowerCase().includes(normalizedQuery);
        if (chapterHit) return c;
        const matchedPoints = c.points.filter(p => p.title.toLowerCase().includes(normalizedQuery));
        if (matchedPoints.length === 0) return null;
        return { ...c, points: matchedPoints };
      })
      .filter((c): c is ExamChapter => c !== null);
  }, [chapters, normalizedQuery]);

  const selectedChapter = selectedPointInfo ? chapters.find(c => c.id === selectedPointInfo.chapterId) : null;
  const selectedPoint = selectedChapter && selectedPointInfo
    ? selectedChapter.points.find(p => p.id === selectedPointInfo.pointId)
    : null;

  const toggleChapter = (chapterId: string) => {
    const next = new Set(expandedChapters);
    if (next.has(chapterId)) {
      next.delete(chapterId);
    } else {
      next.add(chapterId);
    }
    setExpandedChapters(next);
  };

  const updatePointContent = useCallback((content: string | undefined) => {
    if (!selectedPointInfo || content === undefined) return;
    setChapters(prev => prev.map(c => {
      if (c.id !== selectedPointInfo.chapterId) return c;
      return {
        ...c,
        points: c.points.map(p => p.id === selectedPointInfo.pointId ? { ...p, content } : p)
      };
    }));
    setIsDirty(true);
  }, [selectedPointInfo, setChapters]);

  const updatePointTitle = (chapterId: string, pointId: string, newTitle: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== chapterId) return c;
      return {
        ...c,
        points: c.points.map(p => p.id === pointId ? { ...p, title: newTitle } : p)
      };
    }));
    setIsDirty(true);
  };

  const addChapter = () => {
    const newId = createClientId('chapter');
    setChapters(prev => [...prev, {
      id: newId,
      title: '新章节',
      points: []
    }]);
    setExpandedChapters(prev => new Set([...prev, newId]));
    setIsDirty(true);
  };

  const deleteChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除整个章节及其所有考点吗？')) {
      setChapters(prev => prev.filter(c => c.id !== chapterId));
      if (selectedPointInfo?.chapterId === chapterId) {
        setSelectedPointInfo(null);
      }
      setIsDirty(true);
    }
  };

  const addPoint = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPointId = createClientId('point');
    setChapters(prev => prev.map(c => {
      if (c.id === chapterId) {
        return {
          ...c,
          points: [...c.points, {
            id: newPointId,
            title: '新考点',
            importance: 3,
            content: '在这里输入内容...'
          }]
        };
      }
      return c;
    }));
    setSelectedPointInfo({ chapterId, pointId: newPointId });
    setExpandedChapters(prev => new Set([...prev, chapterId]));
    setIsDirty(true);
  };

  const deletePoint = (chapterId: string, pointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个考点吗？')) {
      setChapters(prev => prev.map(c => {
        if (c.id !== chapterId) return c;
        return {
          ...c,
          points: c.points.filter(p => p.id !== pointId)
        };
      }));
      if (selectedPointInfo?.chapterId === chapterId && selectedPointInfo?.pointId === pointId) {
        setSelectedPointInfo(null);
      }
      setIsDirty(true);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_EXAM_DATA_FILE_SIZE) {
      setSaveMessage('导入失败：文件不能超过 5 MB');
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = validateExamData(parsed);

      if (!result.success) {
        const details = result.errors.slice(0, 3).join('；');
        const remainder = result.errors.length > 3 ? `；另有 ${result.errors.length - 3} 个错误` : '';
        setSaveMessage(`导入失败：${details}${remainder}`);
        return;
      }

      if (isDirty && !confirm('当前有未导出的更改，确定要用导入文件覆盖吗？')) {
        return;
      }

      const firstChapter = result.data[0];
      const firstPoint = firstChapter?.points[0];
      setChapters(result.data);
      setSelectedPointInfo(firstChapter && firstPoint
        ? { chapterId: firstChapter.id, pointId: firstPoint.id }
        : null);
      setExpandedChapters(new Set(firstChapter ? [firstChapter.id] : []));
      setSearchQuery('');
      setIsDirty(true);
      setSaveMessage(`导入成功：${result.data.length} 章，${result.data.reduce((sum, chapter) => sum + chapter.points.length, 0)} 个考点`);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error) {
      setSaveMessage(`导入失败：${error instanceof SyntaxError ? 'JSON 格式无效' : String(error)}`);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(chapters, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createExamDataFilename();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setIsDirty(false);
    setSaveMessage(`导出成功：${chapters.length} 章`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('保存中...');
    try {
      const response = await fetch('/api/save-exam-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chapters)
      });
      const data = await response.json();
      if (data.success) {
        setSaveMessage('保存成功！');
        setIsDirty(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('保存失败：' + data.error);
      }
    } catch (err) {
      setSaveMessage('请求失败：' + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  // 简单的插入文本到编辑器
  const insertTextAtCursor = (text: string) => {
    const textarea = editorContainerRef.current?.querySelector('textarea');
    if (!textarea) {
      updatePointContent((selectedPoint?.content || '') + '\n' + text);
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = selectedPoint?.content || '';
    const newContent = content.substring(0, start) + text + content.substring(end);
    
    updatePointContent(newContent);
    
    // 稍作延迟以恢复光标
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 50);
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setSaveMessage('图片上传中...');
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        insertTextAtCursor(`\n![图片](${data.url})\n`);
        setSaveMessage('上传成功！');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        setSaveMessage('上传失败：' + data.error);
      }
    } catch {
      setSaveMessage('上传请求失败');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadImage(file);
          break;
        }
      }
    }
  };

  return (
    <div className="admin-container fade-in">
      {/* 侧边栏 */}
      <div className="admin-sidebar glass-panel">
        <div className="admin-sidebar-header">
          <h3>目录树管理</h3>
          <button className="icon-btn primary" onClick={addChapter} title="新建章节">
            <Plus size={16} />
          </button>
        </div>
        
        <div className="admin-search">
          <Search size={14} className="admin-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setSearchQuery(''); }}
            placeholder="搜索章节或考点..."
            className="admin-search-input"
          />
          {searchQuery && (
            <button className="icon-btn admin-search-clear" onClick={() => setSearchQuery('')} title="清除">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="admin-tree">
          {filteredChapters.map(chapter => {
            const isExpanded = expandedChapters.has(chapter.id) || !!normalizedQuery;
            return (
              <div key={chapter.id} className="admin-chapter">
                <div className="admin-chapter-header" onClick={() => toggleChapter(chapter.id)}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <input 
                    type="text" 
                    value={chapter.title} 
                    onChange={e => {
                      setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, title: e.target.value } : c));
                      setIsDirty(true);
                    }}
                    className="admin-edit-input"
                  />
                  <div className="admin-actions">
                    <button className="icon-btn" onClick={(e) => addPoint(chapter.id, e)} title="新建考点"><Plus size={14} /></button>
                    <button className="icon-btn danger" onClick={(e) => deleteChapter(chapter.id, e)} title="删除章节"><Trash2 size={14} /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="admin-points-list">
                    {chapter.points.map(point => (
                      <div 
                        key={point.id} 
                        className={`admin-point-item ${selectedPointInfo?.chapterId === chapter.id && selectedPointInfo?.pointId === point.id ? 'active' : ''}`}
                        onClick={() => setSelectedPointInfo({ chapterId: chapter.id, pointId: point.id })}
                      >
                        <FileText size={14} className="point-icon" />
                        <input 
                          type="text" 
                          value={point.title}
                          onChange={e => updatePointTitle(chapter.id, point.id, e.target.value)}
                          onFocus={() => setSelectedPointInfo({ chapterId: chapter.id, pointId: point.id })}
                          className="admin-edit-input point-input"
                        />
                        <button className="icon-btn danger delete-point-btn" onClick={(e) => deletePoint(chapter.id, point.id, e)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 主工作区 */}
      <div className="admin-main">
        <div className="admin-toolbar glass-panel">
          <div className="admin-toolbar-left">
            <AlertCircle size={16} className="text-muted" />
            <span className="text-muted">支持 JSON 导入/导出；开发模式可 <b>Ctrl+V</b> 粘贴图片上传。</span>
          </div>
          <div className="admin-toolbar-right">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="admin-file-input"
              onChange={handleImport}
            />
            {saveMessage && <span className={`save-message ${saveMessage.includes('失败') ? 'error' : ''}`}>{saveMessage}</span>}
            {isDirty && !saveMessage && <span className="dirty-message">有未导出或保存的更改</span>}
            <button className="btn-data" onClick={() => importInputRef.current?.click()}>
              <Upload size={16} />
              导入 JSON
            </button>
            <button className="btn-data" onClick={handleExport}>
              <Download size={16} />
              导出 JSON
            </button>
            <button className="btn-save" onClick={handleSave} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? '保存中...' : '保存全部更改'}
            </button>
          </div>
        </div>

        <div className="admin-editor-wrapper glass-panel" ref={editorContainerRef} onPaste={handlePaste}>
          {selectedPoint ? (
            <div className="admin-editor-layout">
              <MDEditor
                value={selectedPoint.content}
                onChange={updatePointContent}
                height="100%"
                visibleDragbar={false}
                preview="edit"
                extraCommands={[]}
              />
              <div className="admin-live-preview article-body">
                <div className="article-body-inner">
                  <ExamPointRenderer 
                    content={selectedPoint.content} 
                    title={selectedPoint.title} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <BookOpenText size={48} className="text-muted" />
              <p>请在左侧选择一个考点进行编辑</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminView;
