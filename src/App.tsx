import { useState } from 'react';
import pmbokDataJson from './data/pmbok.json';
import type { PmbokData, Process } from './types';
import MatrixView from './components/MatrixView';
import SearchView from './components/SearchView';
import ProcessMatrixView from './components/ProcessMatrixView';
import ProcessDetail from './components/ProcessDetail';
import DocumentListView from './components/DocumentListView';
import DomainsView from './components/DomainsView';
import ExamPointsView from './components/ExamPointsView';
import AdminView from './components/AdminView';
import ConceptsView from './components/ConceptsView';
import { LayoutGrid, Search, BookOpen, Layers, PieChart, BookOpenText, Settings, Lightbulb } from 'lucide-react';
import './App.css';

// 强制转换以匹配类型
const pmbokData = pmbokDataJson as PmbokData;
type ViewMode = 'mapping' | 'matrix' | 'search' | 'documents' | 'eightDomains' | 'examPoints' | 'admin' | 'concepts';

function App() {
  const [view, setView] = useState<ViewMode>('mapping'); // 默认展示宏观映射矩阵
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

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
            onClick={() => setView('mapping')}
          >
            <BookOpen size={18} />
            原生交叉矩阵
          </button>
          <button
            className={`toggle-btn ${view === 'matrix' ? 'active' : ''}`}
            onClick={() => setView('matrix')}
          >
            <LayoutGrid size={18} />
            Excel列级检索
          </button>
          <button
            className={`toggle-btn ${view === 'search' ? 'active' : ''}`}
            onClick={() => setView('search')}
          >
            <Search size={18} />
            多维反向搜索
          </button>
          <button
            className={`toggle-btn ${view === 'documents' ? 'active' : ''}`}
            onClick={() => setView('documents')}
          >
            <Layers size={18} />
            33项目文件清单
          </button>
          <button
            className={`toggle-btn ${view === 'eightDomains' ? 'active' : ''}`}
            onClick={() => setView('eightDomains')}
          >
            <PieChart size={18} />
            八大绩效域
          </button>
          <button
            className={`toggle-btn ${view === 'examPoints' ? 'active' : ''}`}
            onClick={() => setView('examPoints')}
          >
            <BookOpenText size={18} />
            考点精炼阅览
          </button>
          <button
            className={`toggle-btn ${view === 'admin' ? 'active' : ''}`}
            onClick={() => setView('admin')}
          >
            <Settings size={18} />
            内容后台维护
          </button>
          <button
            className={`toggle-btn ${view === 'concepts' ? 'active' : ''}`}
            onClick={() => setView('concepts')}
          >
            <Lightbulb size={18} />
            知识点辨析
          </button>
        </div>
      </header>

      <main className="app-wrapper">
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
          <AdminView />
        ) : view === 'concepts' ? (
          <ConceptsView />
        ) : (
          <ExamPointsView />
        )}
      </main>

      {/* 详情弹窗 */}
      <ProcessDetail
        process={selectedProcess}
        knowledgeArea={activeKnowledgeArea}
        onClose={() => setSelectedProcess(null)}
      />
    </div>
  );
}

export default App;
