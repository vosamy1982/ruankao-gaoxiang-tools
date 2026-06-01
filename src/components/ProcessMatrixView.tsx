import React from 'react';
import type { PmbokData } from '../types';
import './ProcessMatrixView.css';

interface Props {
  data: PmbokData;
}

const ProcessMatrixView: React.FC<Props> = ({ data }) => {
  return (
    <div className="pmv-container fade-in">
      <div className="pmv-viewport">
        <table className="pmv-table">
          <thead>
            <tr>
              <th className="pmv-corner-header">关联图</th>
              {data.processGroups.map(pg => (
                <th key={pg.id} className="pmv-col-header">
                  {pg.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.knowledgeAreas.map(ka => (
              <tr key={ka.id}>
                <th className="pmv-row-header">{ka.name}</th>
                {data.processGroups.map(pg => {
                  const procs = data.processes.filter(
                    p => p.knowledgeAreaId === ka.id && p.processGroupId === pg.id
                  );
                  return (
                    <td
                      key={pg.id}
                      className={`pmv-cell ${procs.length === 0 ? 'pmv-cell-empty' : ''}`}
                    >
                      {procs.length > 0 ? (
                        <div className="pmv-procs-list">
                          {procs.map(p => (
                            <div key={p.id} className="pmv-proc-item">{p.name}</div>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessMatrixView;
