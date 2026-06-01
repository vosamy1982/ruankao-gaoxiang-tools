import React from 'react';
import type { Process, KnowledgeArea } from '../types';
import { X } from 'lucide-react';
import './ProcessDetail.css';

interface Props {
  process: Process | null;
  knowledgeArea: KnowledgeArea | undefined;
  onClose: () => void;
}

const ProcessDetail: React.FC<Props> = ({ process, knowledgeArea, onClose }) => {
  if (!process) return null;

  return (
    <div className="modal-overlay glass">
      <div className="modal-content fade-in">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>

        <div className="modal-header">
          <span className="kb-tag">{knowledgeArea?.name}</span>
          <h2>{process.name}</h2>
        </div>

        <div className="itto-container">
          {/* Inputs */}
          <div className="itto-column">
            <h3 className="text-blue-600">输入(Inputs)</h3>
            <ul className="itto-list">
              {process.inputs.map((item, idx) => (
                <li key={`i-${idx}`} className="badge-input">{item}</li>
              ))}
            </ul>
          </div>

          {/* Tools & Techniques */}
          <div className="itto-column">
            <h3 className="text-yellow-600">工具与技术(Tools)</h3>
            <ul className="itto-list">
              {process.tools.map((item, idx) => (
                <li key={`t-${idx}`} className="badge-tool">{item}</li>
              ))}
            </ul>
          </div>

          {/* Outputs */}
          <div className="itto-column">
            <h3 className="text-green-600">输出(Outputs)</h3>
            <ul className="itto-list">
              {process.outputs.map((item, idx) => (
                <li key={`o-${idx}`} className="badge-output">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDetail;
