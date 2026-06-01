import React, { useState } from 'react';
import { Lightbulb, Info } from 'lucide-react';
import { concepts } from '../data/concepts';
import './ConceptsView.css';

const ConceptsView: React.FC = () => {
  const [activeConceptId, setActiveConceptId] = useState(concepts[0].id);
  const activeConcept = concepts.find(c => c.id === activeConceptId) || concepts[0];

  return (
    <div className="concepts-view">
      {/* Sidebar */}
      <aside className="cv-sidebar">
        <h2 className="cv-sidebar-title">
          <Lightbulb size={18} /> 知识点辨析
        </h2>
        <nav className="cv-nav">
          {concepts.map(c => (
            <button
              key={c.id}
              className={`cv-nav-item ${activeConceptId === c.id ? 'active' : ''}`}
              onClick={() => setActiveConceptId(c.id)}
            >
              {c.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="cv-main">
        <header className="cv-header">
          <h1 className="cv-title">{activeConcept.title}</h1>
          <p className="cv-desc">{activeConcept.description}</p>
        </header>

        {/* Differences Cards */}
        <section className="cv-section">
          <h3 className="cv-section-title"><Info size={16} /> 核心特征比对</h3>
          <div className="cv-cards">
            {activeConcept.differences.map((diff, idx) => {
              const colonIdx = diff.indexOf('：');
              const title = diff.substring(0, colonIdx);
              const body = diff.substring(colonIdx + 1);
              const exampleText = activeConcept.examples[idx];
              const exColonIdx = exampleText?.indexOf('：') ?? -1;
              const exBody = exColonIdx > -1 ? exampleText.substring(exColonIdx + 1) : '';
              const colors = ['#2563EB', '#7C3AED', '#059669'];
              const icons = ['📊', '📐', '📋'];
              return (
                <div key={idx} className="cv-card" style={{ '--card-color': colors[idx] } as React.CSSProperties}>
                  <div className="cv-card-icon">{icons[idx]}</div>
                  <div className="cv-card-badge" style={{ background: colors[idx] }}>
                    {['数据 Data', '信息 Info', '报告 Report'][idx]}
                  </div>
                  <h4 className="cv-card-title">{title}</h4>
                  <p className="cv-card-body">{body}</p>
                  {exBody && (
                    <div className="cv-card-example">
                      <span className="cv-example-label">📌 典型案例</span>
                      {exBody}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Visual Flow */}
        {activeConcept.visualFlow && (
          <section className="cv-section">
            <h3 className="cv-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              输入输出流转全景图
            </h3>

            {/* The grand pipeline */}
            <div className="pipeline">
              {/* Animated SVG background */}
              <svg className="pipeline-bg" viewBox="0 0 1200 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15"/>
                    <stop offset="35%" stopColor="#7C3AED" stopOpacity="0.15"/>
                    <stop offset="70%" stopColor="#059669" stopOpacity="0.15"/>
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="20" width="1200" height="40" rx="20" fill="url(#pipeGrad)"/>
                {/* Animated flowing dots */}
                <circle r="6" fill="#2563EB" opacity="0.6">
                  <animateMotion dur="4s" repeatCount="indefinite" path="M 0,40 L 1200,40"/>
                </circle>
                <circle r="5" fill="#7C3AED" opacity="0.5">
                  <animateMotion dur="4s" repeatCount="indefinite" begin="1.3s" path="M 0,40 L 1200,40"/>
                </circle>
                <circle r="4" fill="#059669" opacity="0.5">
                  <animateMotion dur="4s" repeatCount="indefinite" begin="2.6s" path="M 0,40 L 1200,40"/>
                </circle>
              </svg>

              {/* Pipeline stages */}
              <div className="pipeline-stages">
                {/* Stage 1 */}
                <div className="pipe-stage">
                  <div className="pipe-node execute">
                    <div className="pipe-node-icon">⚙️</div>
                    <div className="pipe-node-title">指导与管理项目工作</div>
                    <div className="pipe-node-group">执行过程组</div>
                  </div>
                </div>

                {/* Connector 1 */}
                <div className="pipe-connector">
                  <div className="pipe-connector-line data-line"></div>
                  <div className="pipe-connector-label data-label-box">
                    <span className="pipe-label-dot" style={{background:'#2563EB'}}></span>
                    工作绩效数据
                  </div>
                  <div className="pipe-connector-arrow">→</div>
                </div>

                {/* Stage 2 */}
                <div className="pipe-stage wide-stage">
                  <div className="pipe-node monitor">
                    <div className="pipe-node-icon">🔍</div>
                    <div className="pipe-node-title">10 个控制过程</div>
                    <div className="pipe-node-group">监控过程组 · 对比分析</div>
                    <div className="pipe-tags">
                      {activeConcept.visualFlow.nodes.find(n => n.id === 'controls')?.details?.map((d, i) => (
                        <span key={i} className="pipe-tag">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connector 2 */}
                <div className="pipe-connector">
                  <div className="pipe-connector-line info-line"></div>
                  <div className="pipe-connector-label info-label-box">
                    <span className="pipe-label-dot" style={{background:'#7C3AED'}}></span>
                    工作绩效信息
                  </div>
                  <div className="pipe-connector-arrow">→</div>
                </div>

                {/* Stage 3 */}
                <div className="pipe-stage">
                  <div className="pipe-node monitor">
                    <div className="pipe-node-icon">📊</div>
                    <div className="pipe-node-title">监控项目工作</div>
                    <div className="pipe-node-group">监控过程组 · 汇总汇编</div>
                  </div>
                </div>

                {/* Connector 3 */}
                <div className="pipe-connector">
                  <div className="pipe-connector-line report-line"></div>
                  <div className="pipe-connector-label report-label-box">
                    <span className="pipe-label-dot" style={{background:'#059669'}}></span>
                    工作绩效报告
                  </div>
                  <div className="pipe-connector-arrow">→</div>
                </div>

                {/* Stage 4 */}
                <div className="pipe-stage wide-stage">
                  <div className="pipe-node destination">
                    <div className="pipe-node-icon">🎯</div>
                    <div className="pipe-node-title">4 个接收过程</div>
                    <div className="pipe-node-group">执行 / 监控 · 决策与行动</div>
                    <div className="pipe-tags">
                      {activeConcept.visualFlow.nodes.find(n => n.id === 'destinations')?.details?.map((d, i) => (
                        <span key={i} className="pipe-tag">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="cv-legend">
              <div className="cv-legend-title">图例说明</div>
              <div className="cv-legend-items">
                <div className="cv-legend-item">
                  <span className="cv-legend-dot" style={{background:'#2563EB'}}></span>
                  <span><strong>数据</strong>（原始值 · 做出来的）</span>
                </div>
                <div className="cv-legend-item">
                  <span className="cv-legend-dot" style={{background:'#7C3AED'}}></span>
                  <span><strong>信息</strong>（分析值 · 算出来的）</span>
                </div>
                <div className="cv-legend-item">
                  <span className="cv-legend-dot" style={{background:'#059669'}}></span>
                  <span><strong>报告</strong>（汇编件 · 编出来的）</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ConceptsView;
