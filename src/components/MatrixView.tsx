import React, { useState, useMemo } from 'react';
import type { PmbokData, Process } from '../types';
import './MatrixView.css';

interface Props {
  data: PmbokData;
  onSelectProcess?: (process: Process) => void;
}

// 高亮渲染器组件，专门匹配指定列的关键词并添加原生的 <mark> 标签
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightText: React.FC<{ text: string, highlight?: string }> = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) return <>{text}</>;
  const normalizedHighlight = highlight.trim();
  const parts = text.split(new RegExp(`(${escapeRegExp(normalizedHighlight)})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === normalizedHighlight.toLowerCase()
          ? <mark key={i} className="highlight-mark">{p}</mark>
          : p
      )}
    </>
  );
};

const MatrixView: React.FC<Props> = ({ data, onSelectProcess }) => {
  const [selectedKA, setSelectedKA] = useState<string>('ALL');
  const [selectedPG, setSelectedPG] = useState<string>('ALL');
  const [filterInput, setFilterInput] = useState<string>('');
  const [filterTool, setFilterTool] = useState<string>('');
  const [filterOutput, setFilterOutput] = useState<string>('');

  const handleClear = () => {
    setSelectedKA('ALL');
    setSelectedPG('ALL');
    setFilterInput('');
    setFilterTool('');
    setFilterOutput('');
  };

  // 通过并集策略，全维计算出最终留下的合法知识域与过程（实现章节折叠与精准剔除）
  const filteredData = useMemo(() => {
    const validProcesses = data.processes.filter(p => {
      if (selectedKA !== 'ALL' && p.knowledgeAreaId !== selectedKA) return false;
      if (selectedPG !== 'ALL' && p.processGroupId !== selectedPG) return false;
      if (filterInput && !p.inputs.some(i => i.toLowerCase().includes(filterInput.toLowerCase()))) return false;
      if (filterTool && !p.tools.some(i => i.toLowerCase().includes(filterTool.toLowerCase()))) return false;
      if (filterOutput && !p.outputs.some(i => i.toLowerCase().includes(filterOutput.toLowerCase()))) return false;
      return true;
    });

    const activeKAs = data.knowledgeAreas.filter(ka =>
      validProcesses.some(vp => vp.knowledgeAreaId === ka.id)
    );

    return { activeKAs, validProcesses };
  }, [data, selectedKA, selectedPG, filterInput, filterTool, filterOutput]);

  const { activeKAs, validProcesses } = filteredData;

  return (
    <div className="excel-container fade-in">
      {/* 极简风顶部企业过滤栏 */}
      <div className="filter-toolbar">
        <div className="filter-row">
          <div className="filter-item">
            <label>知识域关联：</label>
            <select value={selectedKA} onChange={e => setSelectedKA(e.target.value)} className="excel-input">
              <option value="ALL">显示全部知识域</option>
              {data.knowledgeAreas.map(ka => (
                <option key={ka.id} value={ka.id}>{ka.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>过程组边界：</label>
            <select value={selectedPG} onChange={e => setSelectedPG(e.target.value)} className="excel-input">
              <option value="ALL">显示全部过程组</option>
              {data.processGroups.map(pg => (
                <option key={pg.id} value={pg.id}>{pg.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-clear">
            <button onClick={handleClear} className="excel-btn-clear">清空过滤器</button>
          </div>
        </div>

        <div className="filter-row filter-row-inputs">
          <div className="filter-item-large">
            <label>包含输入(I)：</label>
            <input
              type="text"
              placeholder="检索如：项目章程"
              value={filterInput}
              onChange={e => setFilterInput(e.target.value)}
              className="excel-input text-input"
            />
          </div>
          <div className="filter-item-large">
            <label>包含工具(T)：</label>
            <input
              type="text"
              placeholder="检索如：专家判断"
              value={filterTool}
              onChange={e => setFilterTool(e.target.value)}
              className="excel-input text-input"
            />
          </div>
          <div className="filter-item-large">
            <label>包含输出(O)：</label>
            <input
              type="text"
              placeholder="检索如：变更请求"
              value={filterOutput}
              onChange={e => setFilterOutput(e.target.value)}
              className="excel-input text-input"
            />
          </div>
        </div>
      </div>

      <div className="excel-viewport">
        <table className="excel-table flat-excel">
          <thead>
            <tr>
              <th className="excel-border-header" style={{ width: '80px', left: 0, zIndex: 30 }}>知识域</th>
              <th className="excel-border-header" style={{ width: '160px' }}>过程</th>
              <th className="excel-border-header">输入(I)</th>
              <th className="excel-border-header">工具与技术(T)</th>
              <th className="excel-border-header">输出(O)</th>
            </tr>
          </thead>
          <tbody>
            {activeKAs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-excel-state">没有发现与您的跨维组合搜索匹配的方法集数据，请缩小交叉过滤范围。</td>
              </tr>
            ) : (
              activeKAs.map(ka => {
                const processes = validProcesses.filter(p => p.knowledgeAreaId === ka.id);

                return processes.map((p, index) => (
                  <tr key={p.id}>
                    {index === 0 && (
                      <th rowSpan={processes.length} className="excel-row-header">
                        {ka.name}
                      </th>
                    )}
                    <td
                      className={`excel-cell process-name ${onSelectProcess ? 'process-name-clickable' : ''}`}
                      onClick={() => onSelectProcess?.(p)}
                    >
                      <div className="p-title">{p.name}</div>
                      <div className="p-group-hint">
                        [{data.processGroups.find(g => g.id === p.processGroupId)?.name.replace('过程组', '')}]
                      </div>
                    </td>
                    <td className="excel-cell">
                      <ul className="itto-ul">
                        {p.inputs.map((item, i) => (
                          <li key={i}><HighlightText text={item} highlight={filterInput} /></li>
                        ))}
                      </ul>
                    </td>
                    <td className="excel-cell">
                      <ul className="itto-ul">
                        {p.tools.map((item, i) => (
                          <li key={i}><HighlightText text={item} highlight={filterTool} /></li>
                        ))}
                      </ul>
                    </td>
                    <td className="excel-cell">
                      <ul className="itto-ul">
                        {p.outputs.map((item, i) => (
                          <li key={i}><HighlightText text={item} highlight={filterOutput} /></li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatrixView;
