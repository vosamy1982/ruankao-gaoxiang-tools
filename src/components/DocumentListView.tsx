import React from 'react';
import { projectDocumentsData, projectPlanData } from '../data/projectDocuments';
import type { DocumentCategory } from '../data/projectDocuments';
import {
  FileText, BookMarked, TrendingUp, FilePieChart,
  ListTodo, Target, Calculator, CalendarDays,
  Users2, CheckCircle, MessageSquare, Layers,
  FolderTree, ClipboardList, Ruler, Settings, Archive
} from 'lucide-react';
import './DocumentListView.css';

const IconMap: Record<string, React.ElementType> = {
  FileText,
  BookMarked,
  TrendingUp,
  FilePieChart,
  ListTodo,
  Target,
  Calculator,
  CalendarDays,
  Users2,
  CheckCircle,
  MessageSquare,
  FolderTree,
  ClipboardList,
  Ruler,
  Settings
};

// 可复用的卡片网格渲染器
const DocumentGrid: React.FC<{ data: DocumentCategory[] }> = ({ data }) => (
  <div className="document-grid">
    {data.map(category => {
      const IconComponent = IconMap[category.icon] || FileText;
      return (
        <div key={category.id} className="doc-card">
          <div className="doc-card-header">
            <IconComponent className="doc-card-icon" size={24} />
            <div className="doc-card-title-group">
              <span className="doc-card-title">{category.title}({category.count})</span>
              <span className="doc-card-mnemonic">{category.mnemonic}</span>
            </div>
          </div>
          <div className="doc-card-body">
            {category.documents.map((doc, index) => (
              <div key={index} className="doc-item">
                <span className="doc-number">{index + 1}</span>
                {doc}
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const DocumentListView: React.FC = () => {
  const docCount = projectDocumentsData.reduce((acc, cat) => acc + cat.count, 0);
  const planCount = projectPlanData.reduce((acc, cat) => acc + cat.count, 0);

  return (
    <div className="document-list-container">

      {/* ====== 板块一：项目文件 ====== */}
      <div className="doc-section">
        <div className="document-header-info">
          <Layers size={24} className="doc-card-icon" />
          <div>
            <h2 className="section-title">项目文件分类清单</h2>
            <div className="section-subtitle">
              项目过程中产生的核心文件，不属于项目管理计划的组成部分。总计：<span className="doc-badge">{docCount}</span>个
            </div>
          </div>
        </div>
        <DocumentGrid data={projectDocumentsData} />
      </div>

      {/* ====== 分割线 ====== */}
      <hr className="section-divider" />

      {/* ====== 板块二：项目管理计划 ====== */}
      <div className="doc-section">
        <div className="document-header-info">
          <Archive size={24} className="doc-card-icon" />
          <div>
            <h2 className="section-title">项目管理计划组成</h2>
            <div className="section-subtitle">
              项目管理计划由子管理计划、基准和其他组件三部分构成。总计组件：<span className="doc-badge">{planCount}</span>个
            </div>
          </div>
        </div>
        <DocumentGrid data={projectPlanData} />
      </div>
    </div>
  );
};

export default DocumentListView;
