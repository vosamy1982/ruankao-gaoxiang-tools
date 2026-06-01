import React, { useState, type ComponentType } from 'react';
import { domainsData, performanceDomainMnemonic } from '../data/performanceDomains';
import * as LucideIcons from 'lucide-react';
import './DomainsView.css';

type IconComponentType = ComponentType<{ size?: number; className?: string }>;
const iconComponents = LucideIcons as unknown as Record<string, IconComponentType>;

const DomainsView: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(domainsData[0].id);

  const activeDomain = domainsData.find(d => d.id === activeId) || domainsData[0];
  const IconComponent = iconComponents[activeDomain.icon] || LucideIcons.HelpCircle;

  return (
    <div className="domains-container">
      {/* 左侧口诀与列表栏 */}
      <aside className="mnemonic-sidebar">
        <div className="mnemonic-header">
          <div className="mnemonic-title">
            <LucideIcons.Quote size={18} /> 助记口诀
          </div>
          <div className="mnemonic-text">
            {performanceDomainMnemonic}
          </div>
        </div>
        <div className="domain-list">
          {domainsData.map((domain) => (
            <button
              key={domain.id}
              className={`domain-list-item ${activeId === domain.id ? 'active' : ''}`}
              onClick={() => setActiveId(domain.id)}
            >
              <div className="domain-char-badge">{domain.char}</div>
              <span className="domain-name">{domain.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* 右侧详情面板 */}
      <main className="domain-detail-panel">
        <div className="detail-header">
          <div className="detail-icon-wrapper">
            <IconComponent size={40} />
          </div>
          <div className="detail-title-block">
            <h2>{activeDomain.name}</h2>
            <div className="detail-desc">{activeDomain.description}</div>
          </div>
        </div>

        {/* 1. 预期目标与指标及检查方法 — 一对一映射表 */}
        <div className="detail-section">
          <div className="section-title">
            <LucideIcons.Target className="section-title-icon" size={20} />
            预期目标与指标及检查方法
          </div>
          <div className="goals-table-wrapper">
            <table className="goals-table">
              <thead>
                <tr>
                  <th>预期目标</th>
                  <th>指标及检查方法</th>
                </tr>
              </thead>
              <tbody>
                {activeDomain.goalsAndChecks.map((gc, index) => (
                  <tr key={index}>
                    <td className="goal-cell">
                      <LucideIcons.CheckCircle2 size={16} className="goal-icon" />
                      {gc.goal}
                    </td>
                    <td className="check-cell">{gc.check}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. 绩效要点 */}
        <div className="detail-section">
          <div className="section-title">
            <LucideIcons.Star className="section-title-icon" size={20} />
            绩效要点
          </div>
          <div className="keypoints-block">
            <div className="keypoints-text">{activeDomain.keyPoints}</div>
            {activeDomain.mnemonic && (
              <div className="mnemonic-badge">
                <LucideIcons.Lightbulb size={16} />
                速记词：{activeDomain.mnemonic}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DomainsView;
