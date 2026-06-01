export interface GoalCheck {
  goal: string;
  check: string;
}

export interface PerformanceDomain {
  id: string;
  char: string;
  name: string;
  icon: string;
  description: string;
  goalsAndChecks: GoalCheck[];
  keyPoints: string;
  mnemonic?: string;
}

export const domainsData: PerformanceDomain[] = [
  {
    id: "stakeholder",
    char: "干",
    name: "干系人绩效域",
    icon: "Network",
    description: "涉及与项目干系人相关的活动和职能。",
    goalsAndChecks: [
      { goal: "建立高效的工作关系", check: "干系人参与的连续性" },
      { goal: "干系人认同项目目标", check: "变更的频率" },
      { goal: "提高支持项目的干系人的满意度，减少反对者的负面影响", check: "干系人行为；干系人满意度；干系人相关问题和风险" }
    ],
    keyPoints: "重点促进干系人的参与。"
  },
  {
    id: "team",
    char: "团",
    name: "团队绩效域",
    icon: "Users",
    description: "涉及与项目团队人员相关的活动和职能。",
    goalsAndChecks: [
      { goal: "共享责任", check: "目标和责任心" },
      { goal: "建立高绩效团队", check: "信任与协作程度；适应变化的能力；彼此赋能" },
      { goal: "所有团队成员都展现出相应的领导力和人际关系技能", check: "管理和领导力风格适宜性" }
    ],
    keyPoints: "项目团队文化；高绩效项目团队；领导力技能。",
    mnemonic: "领导 文化高几"
  },
  {
    id: "uncertainty",
    char: "部",
    name: "不确定性绩效域",
    icon: "HelpCircle",
    description: "涉及与风险和不确定性相关的活动和职能。",
    goalsAndChecks: [
      { goal: "了解项目的运行环境，包括技术、社会、政治、市场和经济环境等", check: "环境因素" },
      { goal: "积极识别、分析和应对不确定性", check: "风险应对措施" },
      { goal: "了解项目中多个因素之间的相互依赖关系", check: "应对措施适宜性" },
      { goal: "能够对威胁和机会进行预测，了解问题的后果", check: "风险管理机制或系统" },
      { goal: "最小化不确定性对项目交付的负面影响", check: "项目绩效处于临界值内" },
      { goal: "能够利用机会改进项目的绩效和成果", check: "利用机会的机制" },
      { goal: "有效利用成本和进度储备，与项目目标保持一致", check: "储备使用" }
    ],
    keyPoints: "风险；模糊性；复杂性；不确定性的应对方法。",
    mnemonic: "风险复杂，模糊，不确定"
  },
  {
    id: "measurement",
    char: "策",
    name: "度量绩效域",
    icon: "BarChart3",
    description: "涉及评估项目绩效、采取应对措施相关的活动和职能。",
    goalsAndChecks: [
      { goal: "对项目状况充分理解", check: "度量结果和报告：通过审计度量结果和报告，可表明数据是否可靠" },
      { goal: "数据充分，可支持决策", check: "度量结果：度量结果可表明项目是否按预期进行，或者是否存在偏差" },
      { goal: "及时采取行动，确保项目最佳绩效", check: "度量结果：度量结果提供了提前指标以及当前状态，可导致及时的决策和行动" },
      { goal: "能够基于预测和评估作出决策，实现目标并产生价值", check: "工作绩效数据：回顾过去的预测和当前的工作绩效数据可发现，以前的预测是否准确地反映了目前的情况。将实际绩效与计划绩效进行比较，并评估业务文档，可表明项目实现预期价值的可能性" }
    ],
    keyPoints: "制定有效的度量指标；度量内容及相应指标；展示度量信息和结果；度量陷阱；基于度量进行诊断；持续改进。"
  },
  {
    id: "planning",
    char: "划",
    name: "规划绩效域",
    icon: "Map",
    description: "涉及组织与协调项目工作以产出交付物的各项活动。",
    goalsAndChecks: [
      { goal: "项目以有条理、协调一致的方式推进", check: "绩效偏差" },
      { goal: "应用系统的方法交付项目成果", check: "规划的整体性" },
      { goal: "对演变情况进行详细说明", check: "规划的详尽程度" },
      { goal: "规划投入的时间成本是适当的", check: "规划适宜性" },
      { goal: "规划的内容对管理干系人的需求而言是充分的", check: "规划的充分性" },
      { goal: "可以根据新出现的和不断变化的需求进行调整", check: "可适应变化" }
    ],
    keyPoints: "规划的影响因素；项目估算；项目团队组成和结构规划；沟通规划；实物资源规划；采购规划；变更规划；度量指标和一致性。",
    mnemonic: "团队沟通采购资源变更，影响估算度量"
  },
  {
    id: "development",
    char: "开",
    name: "开发方法和生命周期绩效域",
    icon: "GitBranch",
    description: "涉及与项目的开发方法、交付节奏和生命周期相关的活动。",
    goalsAndChecks: [
      { goal: "开发方法与项目的可交付物相符", check: "产品质量和变更成本" },
      { goal: "将项目交付与干系人价值紧密联系", check: "价值导向性项目阶段" },
      { goal: "项目生命周期由促进交付节奏的项目阶段和产生项目交付物所需的开发方法组成", check: "适宜的交付节奏和开发方法" }
    ],
    keyPoints: "①交付节奏；②开发方法；③开发方法的选择。",
    mnemonic: "选择方法协调交付"
  },
  {
    id: "project_work",
    char: "公",
    name: "项目工作绩效域",
    icon: "Briefcase",
    description: "涉及项目确立、执行和资源调配相关的活动和职能。",
    goalsAndChecks: [
      { goal: "高效且有效的项目绩效", check: "状态报告" },
      { goal: "适合项目和环境的项目过程", check: "过程的适宜性" },
      { goal: "干系人适当的沟通和参与", check: "沟通有效性" },
      { goal: "对实物资源进行了有效管理", check: "资源利用率" },
      { goal: "对采购进行了有效管理", check: "采购过程适宜" },
      { goal: "有效处理了变更", check: "变更处理情况" },
      { goal: "通过持续学习和过程改进提高了团队能力", check: "团队绩效" }
    ],
    keyPoints: "项目过程；项目制约因素；专注于工作过程和能力；管理沟通和参与；管理实物资源；处理采购事宜；监督新工作和变更；学习与持续改进。",
    mnemonic: "学习监督采购资源，制约沟通过程工作"
  },
  {
    id: "delivery",
    char: "交",
    name: "交付绩效域",
    icon: "CheckSquare",
    description: "涉及与交付项目预期价值、范围和质量相关的活动和职能。",
    goalsAndChecks: [
      { goal: "项目有助于实现业务目标和战略", check: "目标一致性" },
      { goal: "项目实现了预期成果", check: "项目完成度" },
      { goal: "在预定时间内实现了项目收益", check: "项目收益" },
      { goal: "项目团队对需求有清晰理解", check: "需求稳定性" },
      { goal: "干系人接受项目可交付物和成果，并对其满意", check: "干系人满意度；质量问题" }
    ],
    keyPoints: "价值的交付；可交付物；质量。",
    mnemonic: "假物质"
  }
];

export const performanceDomainMnemonic = "团干部策划开公交";
