export interface DocumentCategory {
  id: string;
  title: string;
  mnemonic: string;
  count: number;
  icon: string;
  documents: string[];
}

// ========== 板块一：项目文件（33个） ==========
export const projectDocumentsData: DocumentCategory[] = [
  {
    id: "log",
    title: "日志类",
    mnemonic: "记忆：3大日志",
    count: 3,
    icon: "FileText",
    documents: ["假设日志", "问题日志", "变更日志"]
  },
  {
    id: "register",
    title: "登记册",
    mnemonic: "记忆：3大登记册",
    count: 3,
    icon: "BookMarked",
    documents: ["经验教训登记册", "风险登记册", "干系人登记册"]
  },
  {
    id: "forecast",
    title: "预测类",
    mnemonic: "记忆：成本与进度的双预测",
    count: 2,
    icon: "TrendingUp",
    documents: ["成本预测", "进度预测"]
  },
  {
    id: "report",
    title: "报告类",
    mnemonic: "记忆：质量与风险的报告",
    count: 2,
    icon: "FilePieChart",
    documents: ["质量报告", "风险报告"]
  },
  {
    id: "list_attr",
    title: "清单与属性",
    mnemonic: "记忆：2个清单，1个属性",
    count: 3,
    icon: "ListTodo",
    documents: ["活动清单", "里程碑清单", "活动属性"]
  },
  {
    id: "scope_req",
    title: "需求与范围",
    mnemonic: "记忆：需求（文件/矩阵）定范围",
    count: 3,
    icon: "Target",
    documents: ["需求文件", "需求跟踪矩阵", "项目范围说明书"]
  },
  {
    id: "estimation",
    title: "估算类",
    mnemonic: "记忆：时/钱/人 估个依据",
    count: 4,
    icon: "Calculator",
    documents: ["持续时间估算", "成本估算", "资源需求", "估算依据"]
  },
  {
    id: "schedule_plan",
    title: "进度计划层",
    mnemonic: "记忆：图/表/数据/日历齐上阵",
    count: 4,
    icon: "CalendarDays",
    documents: ["项目进度计划", "项目进度网络图", "进度数据", "项目日历"]
  },
  {
    id: "resource_alloc",
    title: "资源分配层",
    mnemonic: "记忆：人/物派工，日历/结构安排",
    count: 4,
    icon: "Users2",
    documents: ["资源分解结构（RBS）", "资源日历", "物质资源分配单", "项目团队派工单"]
  },
  {
    id: "quality_measure",
    title: "质量测试评估",
    mnemonic: "记忆：指标定、测结果、留文件",
    count: 3,
    icon: "CheckCircle",
    documents: ["质量测量指标", "质量控制测量结果", "测试与评估文件"]
  },
  {
    id: "others",
    title: "沟通与团队记录",
    mnemonic: "记忆：沟通过程，团队绩效",
    count: 2,
    icon: "MessageSquare",
    documents: ["项目沟通记录", "团队绩效评价"]
  }
];

// ========== 板块二：项目管理计划组件 ==========
export const projectPlanData: DocumentCategory[] = [
  {
    id: "master_plan",
    title: "项目管理计划（总纲）",
    mnemonic: "记忆：1总计划 = 子计划 + 基准 + 其他组件",
    count: 1,
    icon: "FolderTree",
    documents: ["项目管理计划"]
  },
  {
    id: "sub_plans",
    title: "子管理计划（12个）",
    mnemonic: "记忆：10大知识域各1个 + 变更管理 + 配置管理",
    count: 12,
    icon: "ClipboardList",
    documents: [
      "范围管理计划",
      "需求管理计划",
      "进度管理计划",
      "成本管理计划",
      "质量管理计划",
      "资源管理计划",
      "沟通管理计划",
      "风险管理计划",
      "采购管理计划",
      "干系人参与计划",
      "变更管理计划",
      "配置管理计划"
    ]
  },
  {
    id: "baselines",
    title: "三大基准",
    mnemonic: "记忆：范围/进度/成本 三条底线不可逾越",
    count: 3,
    icon: "Ruler",
    documents: ["范围基准", "进度基准", "成本基准"]
  },
  {
    id: "plan_other",
    title: "项目管理计划其他组件",
    mnemonic: "记忆：绩效基准 + 生命周期 + 开发方法 + 管理审查",
    count: 4,
    icon: "Settings",
    documents: [
      "绩效测量基准",
      "项目生命周期描述",
      "开发方法",
      "管理审查"
    ]
  }
];
