import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { fullNormalizeContent, contentReferences } from '../services/ExamDataManager';

// --- Types ---
type IttoTable = {
  headers: string[];
  rows: string[][];
};

const ittoPointPattern = /过程的输入、工具与技术/;

const implicitItemStarters = [
  '项目管理计划', '项目文件', '组织过程资产', '事业环境因素', '变更请求',
  '工作绩效信息', '工作绩效报告', '经验教训登记册', '项目沟通记录',
  '风险登记册', '风险报告', '采购文档', '团队绩效评价', '进度预测',
  '成本预测', '项目日历', '进度数据', '项目资金需求', '最终产品',
  '最终报告', '验收的可交付成果', '核实的可交付成果', '物质资源分配单',
  '项目团队派工单', '资源日历', '质量报告', '测试与评估文件',
  '质量控制测量结果', '批准的变更请求', '项目范围说明书', '范围基准',
  '需求跟踪矩阵', '需求文件'
].sort((a, b) => b.length - a.length);

// --- Helpers ---

const splitTopLevelItems = (text: string, separators: Set<string>) => {
  const items: string[] = [];
  let current = '';
  let depth = 0;
  for (const char of text) {
    if (char === '（' || char === '(') depth += 1;
    if (separators.has(char) && depth === 0) {
      const value = current.trim().replace(/[。；]+$/g, '').trim();
      if (value) items.push(value);
      current = '';
      continue;
    }
    current += char;
    if ((char === '）' || char === ')') && depth > 0) depth -= 1;
  }
  const tail = current.trim().replace(/[。；]+$/g, '').trim();
  if (tail) items.push(tail);
  return items;
};

const splitImplicitItems = (text: string) => {
  const items: string[] = [];
  let current = '';
  for (let index = 0; index < text.length; index += 1) {
    const starter = implicitItemStarters.find(candidate => text.startsWith(candidate, index));
    const prevChar = index > 0 ? text[index - 1] : '';
    const canSplit = Boolean(starter) && current.trim() && (prevChar === ' ' || prevChar === '）' || prevChar === ')');
    if (canSplit) {
      items.push(current.trim());
      current = '';
    }
    current += text[index];
  }
  const tail = current.trim();
  if (tail) items.push(tail);
  return items;
};

const sanitizeIttoCellText = (text: string) => text
  .replace(/◎/g, '●')
  .replace(/\*\*([^*，、|]{4,}?)\*\*\s+\*\*([^*，、|]{4,}?)\*\*/g, '**$1**●**$2**')
  .replace(/\*+/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const extractIttoItems = (cell: string) => {
  const cleaned = sanitizeIttoCellText(cell);
  const bulletItems = splitTopLevelItems(cleaned, new Set(['●'])).flatMap(splitImplicitItems);
  if (bulletItems.length > 1) return bulletItems;
  const implicitItems = splitImplicitItems(cleaned);
  if (implicitItems.length > 1) return implicitItems;
  const commaItems = splitTopLevelItems(cleaned, new Set(['、', '，']));
  if (commaItems.length > 1) return commaItems;
  return cleaned ? [cleaned] : [];
};

const parseIttoTable = (content: string): IttoTable | null => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 3) return null;
  const splitRow = (line: string) => line.split('|').map(cell => cell.trim());
  const headers = splitRow(lines[0]).map(header => header.replace(/\*+/g, '').trim());
  const rows = lines.slice(2).map(splitRow).filter(cells => cells.length === 4);
  if (headers.length !== 4 || rows.length === 0) return null;
  return { headers, rows };
};

// --- Component ---

interface ExamPointRendererProps {
  content: string;
  title: string;
}

export const ExamPointRenderer: React.FC<ExamPointRendererProps> = ({ content, title }) => {
  const processedContent = fullNormalizeContent(content, contentReferences);
  const isIttoTable = ittoPointPattern.test(title);
  const ittoTable = isIttoTable ? parseIttoTable(processedContent) : null;

  if (ittoTable) {
    return (
      <div className="table-responsive">
        <table className="markdown-table markdown-table-itto">
          <thead>
            <tr>{ittoTable.headers.map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {ittoTable.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>
                    {(() => {
                      const items = extractIttoItems(cell);
                      if (items.length <= 1) return items[0] || '';
                      return (
                        <ul className="itto-cell-list">
                          {items.map((item, ii) => <li key={ii}>{item}</li>)}
                        </ul>
                      );
                    })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        img: ({ node, ...props }) => {
          void node;
          return <img className="markdown-image" {...props} loading="lazy" />;
        },
        table: ({ node, ...props }) => {
          void node;
          return <div className="table-responsive"><table className="markdown-table" {...props} /></div>;
        },
        p: ({ node, children, ...props }) => {
          void node;
          return <p {...props}>{children}</p>;
        },
        a: ({ node, ...props }) => {
          void node;
          return <a className="markdown-link" {...props} target="_blank" rel="noopener noreferrer" />;
        }
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};
