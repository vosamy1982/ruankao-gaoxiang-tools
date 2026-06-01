export interface Concept {
  id: string;
  title: string;
  description: string;
  differences: string[];
  examples: string[];
  visualFlow?: {
    nodes: {
      id: string;
      label: string;
      type: 'process' | 'data' | 'process-group';
      description?: string;
      details?: string[];
    }[];
    edges: {
      source: string;
      target: string;
      label: string;
    }[];
  };
}

export const concepts: Concept[] = [
  {
    id: "work-performance",
    title: "工作绩效流转：数据、信息与报告",
    description: "在项目执行和监控过程中，工作绩效经历了从原始数据到加工信息，再到汇编报告的完整演进过程。这是软考高项中最为经典且必考的输入输出闭环。",
    differences: [
      "【工作绩效数据】：原始的、未经处理的观察值或测量值。它是“做”出来的，是纯粹的客观事实。",
      "【工作绩效信息】：将原始数据与计划基准比对、分析后的结果。它是“算”出来的，具有了实际管理意义（如偏差分析）。",
      "【工作绩效报告】：将工作绩效信息汇编成实体或电子形式的文件。它是“编”出来的，用于制定决策或提出问题。"
    ],
    examples: [
      "数据案例：已完成的工作百分比、实际发生成本、缺陷数量、开始和结束日期。",
      "信息案例：进度偏差（SV）、成本偏差（CV）、可交付成果状态、缺陷率趋势分析。",
      "报告案例：状态报告、备忘录、论证报告、信息电子仪表盘、演示文稿。"
    ],
    visualFlow: {
      nodes: [
        { id: "p03", label: "指导与管理项目工作", type: "process", description: "【执行过程组】产生原始数据" },
        { id: "data", label: "工作绩效数据", type: "data", description: "未经加工的原始测量值" },
        { 
          id: "controls", 
          label: "10个控制过程", 
          type: "process-group", 
          description: "【监控过程组】进行对比分析",
          details: ["确认范围", "控制范围", "控制进度", "控制成本", "控制质量", "控制资源", "监督沟通", "监督风险", "控制采购", "监督干系人参与"]
        },
        { id: "info", label: "工作绩效信息", type: "data", description: "分析后的偏差、趋势等信息" },
        { id: "p05", label: "监控项目工作", type: "process", description: "【监控过程组】汇总与汇编" },
        { id: "report", label: "工作绩效报告", type: "data", description: "汇编后的实体或电子演示文件" },
        { 
          id: "destinations", 
          label: "4个管理与监控过程", 
          type: "process-group", 
          description: "辅助决策与采取行动",
          details: ["实施整体变更控制", "管理团队", "管理沟通", "监督风险"]
        }
      ],
      edges: [
        { source: "p03", target: "data", label: "输出" },
        { source: "data", target: "controls", label: "输入" },
        { source: "controls", target: "info", label: "输出" },
        { source: "info", target: "p05", label: "输入" },
        { source: "p05", target: "report", label: "输出" },
        { source: "report", target: "destinations", label: "输入" }
      ]
    }
  }
];
