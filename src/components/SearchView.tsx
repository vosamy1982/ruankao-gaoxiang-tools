import React, { useState, useMemo } from 'react';
import type { PmbokData, Process } from '../types';
import { Search } from 'lucide-react';
import './SearchView.css';

interface Props {
  data: PmbokData;
  onSelectProcess: (process: Process) => void;
}

const SearchView: React.FC<Props> = ({ data, onSelectProcess }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProcesses = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();

    return data.processes.map(p => {
      const matchInput = p.inputs.filter(i => i.toLowerCase().includes(term));
      const matchTool = p.tools.filter(t => t.toLowerCase().includes(term));
      const matchOutput = p.outputs.filter(o => o.toLowerCase().includes(term));
      const matchName = p.name.toLowerCase().includes(term);

      if (matchInput.length || matchTool.length || matchOutput.length || matchName) {
        return { p, matchInput, matchTool, matchOutput, matchName };
      }
      return null;
    }).filter(Boolean) as {p: Process, matchInput: string[], matchTool: string[], matchOutput: string[], matchName: boolean}[];
  }, [searchTerm, data]);

  return (
    <div className="search-view fade-in">
      <div className="search-header glass">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="搜索任何输入、工具与技术、输出或过程名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="search-results">
        {!searchTerm && (
          <div className="empty-state text-muted">
            输入关键词开始搜索（例如：专家判断、变更请求、项目管理计划）
          </div>
        )}

        {searchTerm && filteredProcesses.length === 0 && (
          <div className="empty-state text-muted">
            未找到包含“{searchTerm}”的结果
          </div>
        )}

        {filteredProcesses.map((result, idx) => (
          <div
            key={idx}
            className="result-card glass-card"
            onClick={() => onSelectProcess(result.p)}
          >
            <div className="result-title">
              <h4>{result.p.name}</h4>
              <span className="kb-tag">
                {data.knowledgeAreas.find(ka => ka.id === result.p.knowledgeAreaId)?.name}
              </span>
            </div>
            
            <div className="match-tags">
              {result.matchInput.map((m, i) => <span key={`i-${i}`} className="match-badge badge-input">输入：{m}</span>)}
              {result.matchTool.map((m, i) => <span key={`t-${i}`} className="match-badge badge-tool">工具：{m}</span>)}
              {result.matchOutput.map((m, i) => <span key={`o-${i}`} className="match-badge badge-output">输出：{m}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchView;
