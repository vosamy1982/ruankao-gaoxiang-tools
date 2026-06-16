import { lazy, Suspense, useEffect, useState } from 'react';
import pmbokDataJson from './data/pmbok.json';
import examDataJson from './data/exam-points.json';
import type { ExamChapter, PmbokData, Process } from './types';
import { LayoutGrid, Search, BookOpen, Layers, PieChart, BookOpenText, ListChecks, Settings, Lightbulb, Menu, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './App.css';

const MatrixView = lazy(() => import('./components/MatrixView'));
const SearchView = lazy(() => import('./components/SearchView'));
const ProcessMatrixView = lazy(() => import('./components/ProcessMatrixView'));
const ProcessDetail = lazy(() => import('./components/ProcessDetail'));
const DocumentListView = lazy(() => import('./components/DocumentListView'));
const DomainsView = lazy(() => import('./components/DomainsView'));
const ExamPointsView = lazy(() => import('./components/ExamPointsView'));
const ReviewCenterView = lazy(() => import('./components/ReviewCenterView'));
const AdminView = lazy(() => import('./components/AdminView'));
const ConceptsView = lazy(() => import('./components/ConceptsView'));

// 强制转换以匹配类型
const pmbokData = pmbokDataJson as PmbokData;
type ViewMode = 'mapping' | 'matrix' | 'search' | 'documents' | 'eightDomains' | 'examPoints' | 'reviewCenter' | 'admin' | 'concepts';

const viewModes: ViewMode[] = ['mapping', 'matrix', 'search', 'documents', 'eightDomains', 'examPoints', 'reviewCenter', 'admin', 'concepts'];

type NavGroupId = 'itto' | 'study' | 'reference' | 'admin';

interface NavigationItem {
  view: ViewMode;
  label: string;
  icon: LucideIcon;
}

interface NavigationGroup {
  id: NavGroupId;
  label: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    id: 'itto',
    label: 'ITTO 查询',
    items: [
      { view: 'mapping', label: '交叉矩阵', icon: BookOpen },
      { view: 'matrix', label: 'Excel 检索', icon: LayoutGrid },
      { view: 'search', label: '反向搜索', icon: Search }
    ]
  },
  {
    id: 'study',
    label: '学习复习',
    items: [
      { view: 'examPoints', label: '考点阅览', icon: BookOpenText },
      { view: 'reviewCenter', label: '复习中心', icon: ListChecks },
      { view: 'concepts', label: '知识辨析', icon: Lightbulb }
    ]
  },
  {
    id: 'reference',
    label: '资料速查',
    items: [
      { view: 'documents', label: '项目文件', icon: Layers },
      { view: 'eightDomains', label: '绩效域', icon: PieChart }
    ]
  },
  {
    id: 'admin',
    label: '内容维护',
    items: [
      { view: 'admin', label: '后台维护', icon: Settings }
    ]
  }
];

const getNavigationGroup = (view: ViewMode) =>
  navigationGroups.find(group => group.items.some(item => item.view === view)) ?? navigationGroups[0];

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
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setView(getViewFromHash());
      setSelectedProcess(null);
      setIsNavigationOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleViewChange = (nextView: ViewMode) => {
    setSelectedProcess(null);
    setIsNavigationOpen(false);
    if (window.location.hash === `#${nextView}`) {
      setView(nextView);
      return;
    }
    window.history.pushState(null, '', `#${nextView}`);
    setView(nextView);
  };

  const activeKnowledgeArea = selectedProcess
    ? pmbokData.knowledgeAreas.find(ka => ka.id === selectedProcess.knowledgeAreaId)
    : undefined;
  const activeNavigationGroup = getNavigationGroup(view);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-top">
          <div className="app-title">
            <span style={{ fontSize: '1.4rem' }}>📚</span>
            软考高项ITTO查询系统
          </div>
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-expanded={isNavigationOpen}
            aria-label={isNavigationOpen ? '关闭导航菜单' : '打开导航菜单'}
            onClick={() => setIsNavigationOpen(open => !open)}
          >
            {isNavigationOpen ? <X size={18} /> : <Menu size={18} />}
            <span>{activeNavigationGroup.label}</span>
          </button>
        </div>

        <nav
          className={`app-navigation ${isNavigationOpen ? 'open' : ''}`}
          aria-label="主导航"
        >
          <div className="primary-nav" aria-label="导航分组">
            {navigationGroups.map(group => {
              const isActive = activeNavigationGroup.id === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`nav-group-btn ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => handleViewChange(group.items[0].view)}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
          <div className="secondary-nav" aria-label={`${activeNavigationGroup.label}视图`}>
            {activeNavigationGroup.items.map(item => {
              const Icon = item.icon;
              const isActive = view === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleViewChange(item.view)}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
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
          ) : view === 'reviewCenter' ? (
            <ReviewCenterView sourceChapters={examChapters} />
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
