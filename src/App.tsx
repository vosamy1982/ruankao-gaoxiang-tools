import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import pmbokDataJson from './data/pmbok.json';
import examDataJson from './data/exam-points.json';
import type { ExamChapter, PmbokData, Process } from './types';
import { LayoutGrid, Search, BookOpen, Layers, PieChart, BookOpenText, ListChecks, Settings, Lightbulb, Menu, X, ChevronDown } from 'lucide-react';
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

const getNavigationItem = (view: ViewMode) =>
  navigationGroups.flatMap(group => group.items).find(item => item.view === view) ?? navigationGroups[0].items[0];

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
  const [openNavigationGroupId, setOpenNavigationGroupId] = useState<NavGroupId | null>(null);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const dropdownTriggerRefs = useRef<Record<NavGroupId, HTMLButtonElement | null>>({
    itto: null,
    study: null,
    reference: null,
    admin: null
  });
  const dropdownItemRefs = useRef<Record<NavGroupId, Array<HTMLButtonElement | null>>>({
    itto: [],
    study: [],
    reference: [],
    admin: []
  });

  useEffect(() => {
    const handleHashChange = () => {
      setView(getViewFromHash());
      setSelectedProcess(null);
      setOpenNavigationGroupId(null);
      setIsMobileNavigationOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const closeNavigation = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpenNavigationGroupId(null);
      setIsMobileNavigationOpen(false);
    };

    const closeNavigationByKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenNavigationGroupId(null);
        setIsMobileNavigationOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeNavigation);
    document.addEventListener('keydown', closeNavigationByKeyboard);
    return () => {
      document.removeEventListener('pointerdown', closeNavigation);
      document.removeEventListener('keydown', closeNavigationByKeyboard);
    };
  }, []);

  const handleViewChange = (nextView: ViewMode) => {
    setSelectedProcess(null);
    setOpenNavigationGroupId(null);
    setIsMobileNavigationOpen(false);
    if (window.location.hash === `#${nextView}`) {
      setView(nextView);
      return;
    }
    window.history.pushState(null, '', `#${nextView}`);
    setView(nextView);
  };

  const focusNavigationTrigger = (nextGroupIndex: number) => {
    const normalizedIndex = (nextGroupIndex + navigationGroups.length) % navigationGroups.length;
    const nextGroupId = navigationGroups[normalizedIndex].id;
    dropdownTriggerRefs.current[nextGroupId]?.focus();
  };

  const focusNavigationItem = (groupId: NavGroupId, nextItemIndex: number) => {
    const group = navigationGroups.find(candidate => candidate.id === groupId);
    if (!group) return;

    const normalizedIndex = (nextItemIndex + group.items.length) % group.items.length;
    dropdownItemRefs.current[groupId][normalizedIndex]?.focus();
  };

  const openNavigationGroup = (groupId: NavGroupId, focusItemIndex: number) => {
    setIsMobileNavigationOpen(false);
    setOpenNavigationGroupId(groupId);
    window.requestAnimationFrame(() => focusNavigationItem(groupId, focusItemIndex));
  };

  const closeDesktopNavigation = (returnFocusGroupId?: NavGroupId) => {
    setOpenNavigationGroupId(null);
    if (returnFocusGroupId) {
      window.requestAnimationFrame(() => dropdownTriggerRefs.current[returnFocusGroupId]?.focus());
    }
  };

  const handleNavigationTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    group: NavigationGroup,
    groupIndex: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openNavigationGroup(group.id, 0);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openNavigationGroup(group.id, 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openNavigationGroup(group.id, group.items.length - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setOpenNavigationGroupId(null);
      focusNavigationTrigger(groupIndex + 1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setOpenNavigationGroupId(null);
      focusNavigationTrigger(groupIndex - 1);
      return;
    }

    if (event.key === 'Escape' && openNavigationGroupId) {
      event.preventDefault();
      closeDesktopNavigation(group.id);
    }
  };

  const handleNavigationItemKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    group: NavigationGroup,
    groupIndex: number,
    itemIndex: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleViewChange(group.items[itemIndex].view);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusNavigationItem(group.id, itemIndex + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusNavigationItem(group.id, itemIndex - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusNavigationItem(group.id, 0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusNavigationItem(group.id, group.items.length - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextGroup = navigationGroups[(groupIndex + 1) % navigationGroups.length];
      openNavigationGroup(nextGroup.id, 0);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const previousGroup = navigationGroups[(groupIndex - 1 + navigationGroups.length) % navigationGroups.length];
      openNavigationGroup(previousGroup.id, 0);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDesktopNavigation(group.id);
      return;
    }

    if (event.key === 'Tab') {
      setOpenNavigationGroupId(null);
    }
  };

  const activeKnowledgeArea = selectedProcess
    ? pmbokData.knowledgeAreas.find(ka => ka.id === selectedProcess.knowledgeAreaId)
    : undefined;
  const activeNavigationGroup = getNavigationGroup(view);
  const activeNavigationItem = getNavigationItem(view);

  return (
    <div className="app-container">
      <header className="app-header" ref={headerRef}>
        <div className="app-header-main">
          <div className="app-title">
            <span style={{ fontSize: '1.4rem' }}>📚</span>
            软考高项ITTO查询系统
          </div>
          <div className="app-current-location" aria-label="当前位置">
            <span>{activeNavigationGroup.label}</span>
            <span aria-hidden="true">/</span>
            <strong>{activeNavigationItem.label}</strong>
          </div>
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-expanded={isMobileNavigationOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileNavigationOpen ? '关闭导航菜单' : '打开导航菜单'}
            onClick={() => {
              setOpenNavigationGroupId(null);
              setIsMobileNavigationOpen(open => !open);
            }}
          >
            {isMobileNavigationOpen ? <X size={18} /> : <Menu size={18} />}
            <span>菜单</span>
          </button>
        </div>

        <nav className="desktop-navigation" aria-label="主导航">
          {navigationGroups.map((group, groupIndex) => {
            const isActiveGroup = activeNavigationGroup.id === group.id;
            const isOpen = openNavigationGroupId === group.id;
            return (
              <div className="nav-dropdown" key={group.id}>
                <button
                  id={`nav-trigger-${group.id}`}
                  type="button"
                  ref={element => {
                    dropdownTriggerRefs.current[group.id] = element;
                  }}
                  className={`nav-dropdown-trigger ${isActiveGroup ? 'active' : ''} ${isOpen ? 'open' : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  aria-controls={`nav-menu-${group.id}`}
                  onKeyDown={event => handleNavigationTriggerKeyDown(event, group, groupIndex)}
                  onClick={() => {
                    setIsMobileNavigationOpen(false);
                    setOpenNavigationGroupId(currentGroupId =>
                      currentGroupId === group.id ? null : group.id
                    );
                  }}
                >
                  <span>{group.label}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {isOpen && (
                  <div
                    id={`nav-menu-${group.id}`}
                    className="nav-dropdown-menu"
                    role="menu"
                    aria-labelledby={`nav-trigger-${group.id}`}
                  >
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = view === item.view;
                      return (
                        <button
                          key={item.view}
                          type="button"
                          role="menuitem"
                          ref={element => {
                            dropdownItemRefs.current[group.id][itemIndex] = element;
                          }}
                          className={`nav-dropdown-item ${isActive ? 'active' : ''}`}
                          aria-current={isActive ? 'page' : undefined}
                          onKeyDown={event => handleNavigationItemKeyDown(event, group, groupIndex, itemIndex)}
                          onClick={() => handleViewChange(item.view)}
                        >
                          <Icon size={17} aria-hidden="true" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <nav
          id="mobile-navigation"
          className={`mobile-navigation ${isMobileNavigationOpen ? 'open' : ''}`}
          aria-label="移动端主导航"
          hidden={!isMobileNavigationOpen}
        >
          {navigationGroups.map(group => (
            <section className="mobile-nav-section" key={group.id} aria-labelledby={`mobile-nav-${group.id}`}>
              <div className="mobile-nav-section-title" id={`mobile-nav-${group.id}`}>
                {group.label}
              </div>
              <div className="mobile-nav-items">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = view === item.view;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => handleViewChange(item.view)}
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
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
