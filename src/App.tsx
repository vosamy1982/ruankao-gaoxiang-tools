import { lazy, Suspense, useEffect, useState } from 'react';
import pmbokDataJson from './data/pmbok.json';
import examDataJson from './data/exam-points.json';
import type { ExamChapter, PmbokData, Process } from './types';
import { LayoutGrid, Search, BookOpen, Layers, PieChart, BookOpenText, Settings, Lightbulb } from 'lucide-react';
import './App.css';

const MatrixView = lazy(() => import('./components/MatrixView'));
const SearchView = lazy(() => import('./components/SearchView'));
const ProcessMatrixView = lazy(() => import('./components/ProcessMatrixView'));
const ProcessDetail = lazy(() => import('./components/ProcessDetail'));
const DocumentListView = lazy(() => import('./components/DocumentListView'));
const DomainsView = lazy(() => import('./components/DomainsView'));
const ExamPointsView = lazy(() => import('./components/ExamPointsView'));
const AdminView = lazy(() => import('./components/AdminView'));
const ConceptsView = lazy(() => import('./components/ConceptsView'));

// 强制转换以匹配类型
const pmbokData = pmbokDataJson as PmbokData;
type ViewMode = 'mapping' | 'matrix' | 'search' | 'documents' | 'eightDomains' | 'examPoints' | 'admin' | 'concepts';

const viewModes: ViewMode[] = ['mapping', 'matrix', 'search', 'documents', 'eightDomains', 'examPoints', 'admin', 'concepts'];

const getViewFromHash = (): ViewMode => {
  const hashView = window.location.hash.replace('#', '');
  return viewModes.includes(hashView as ViewMode) ? hashView as ViewMode : 'mapping';
};

const ViewLoadingState = () => (
  <div className="view-loading" role="status" aria-live="polite">
    <span className="view-loading-spinner" aria-hidden="true" />
    <span>正在加载当前视图...</span>
  </div>
);

function App() {
  const [view, setView] = useState<ViewMode>(getViewFromHash); // 默认展示宏观映射矩阵
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [examChapters, setExamChapters] = useState<ExamChapter[]>(examDataJson as ExamChapter[]);

  useEffect(() => {
    const handleHashChange = () => {
      setView(getViewFromHash());
      setSelectedProcess(null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleViewChange = (nextView: ViewMode) => {
    setSelectedProcess(null);
    if (window.location.hash === `#${nextView}`) {
      setView(nextView);
      return;
    }
    window.location.hash = nextView;
  };

  const activeKnowledgeArea = selectedProcess
    ? pmbokData.knowledgeAreas.find(ka => ka.id === selectedProcess.knowledgeAreaId)
    : undefined;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <span style={{ fontSize: '1.4rem' }}>📚</span>
          软考高项ITTO查询系统
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'mapping' ? 'active' : ''}`}
            onClick={() => handleViewChange('mapping')}
          >
            <BookOpen size={18} />
            原生交叉矩阵
          </button>
          <button
            className={`toggle-btn ${view === 'matrix' ? 'active' : ''}`}
            onClick={() => handleViewChange('matrix')}
          >
            <LayoutGrid size={18} />
            Excel列级检索
          </button>
          <button
            className={`toggle-btn ${view === 'search' ? 'active' : ''}`}
            onClick={() => handleViewChange('search')}
          >
            <Search size={18} />
            多维反向搜索
          </button>
          <button
            className={`toggle-btn ${view === 'documents' ? 'active' : ''}`}
            onClick={() => handleViewChange('documents')}
          >
            <Layers size={18} />
            33项目文件清单
          </button>
          <button
            className={`toggle-btn ${view === 'eightDomains' ? 'active' : ''}`}
            onClick={() => handleViewChange('eightDomains')}
          >
            <PieChart size={18} />
            八大绩效域
          </button>
          <button
            className={`toggle-btn ${view === 'examPoints' ? 'active' : ''}`}
            onClick={() => handleViewChange('examPoints')}
          >
            <BookOpenText size={18} />
            考点精炼阅览
          </button>
          <button
            className={`toggle-btn ${view === 'admin' ? 'active' : ''}`}
            onClick={() => handleViewChange('admin')}
          >
            <Settings size={18} />
            内容后台维护
          </button>
          <button
            className={`toggle-btn ${view === 'concepts' ? 'active' : ''}`}
            onClick={() => handleViewChange('concepts')}
          >
            <Lightbulb size={18} />
            知识点辨析
          </button>
        </div>
      </header>

      <main className="app-wrapper">
        <Suspense fallback={<ViewLoadingState />}>
          {view === 'mapping' ? (
            <ProcessMatrixView data={pmbokData} />
          ) : view === 'matrix' ? (
            <MatrixView data={pmbokData} onSelectProcess={setSelectedProcess} />
          ) : view === 'search' ? (
            <SearchView data={pmbokData} onSelectProcess={setSelectedProcess} />
          ) : view === 'documents' ? (
            <DocumentListView />
          ) : view === 'eightDomains' ? (
            <DomainsView />
          ) : view === 'admin' ? (
            <AdminView chapters={examChapters} setChapters={setExamChapters} />
          ) : view === 'concepts' ? (
            <ConceptsView />
          ) : (
            <ExamPointsView sourceChapters={examChapters} />
          )}
        </Suspense>
      </main>

      {selectedProcess && (
        <Suspense fallback={null}>
          <ProcessDetail
            process={selectedProcess}
            knowledgeArea={activeKnowledgeArea}
            onClose={() => setSelectedProcess(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
