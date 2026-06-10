import { access, readFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateExamData } from '../src/services/ExamDataIO.ts';
import type { ExamChapter } from '../src/types.ts';

interface AuditFinding {
  code: string;
  location: string;
  message: string;
}

interface AuditSummary {
  chapters: number;
  points: number;
  knowledgeAreas: number;
  processGroups: number;
  processes: number;
  imageReferences: number;
  approvedExceptions: number;
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(projectRoot, 'public');
const findings: AuditFinding[] = [];
const approvedFindingKeys = new Set<string>();
const usedApprovedFindingKeys = new Set<string>();
const allowlistableCodes = new Set([
  'CONTENT_OVERSIZED',
  'CONTENT_LONG_LINE',
  'CONTENT_LONG_QUOTE',
  'CONTENT_SOURCE_MARKER',
  'CONTENT_EXTERNAL_LINK'
]);
let imageReferences = 0;

const addFinding = (code: string, location: string, message: string) => {
  const key = `${code}\u0000${location}`;
  if (approvedFindingKeys.has(key)) {
    usedApprovedFindingKeys.add(key);
    return;
  }
  findings.push({ code, location, message });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readJson = async (relativePath: string): Promise<unknown> => {
  const text = await readFile(resolve(projectRoot, relativePath), 'utf8');
  return JSON.parse(text) as unknown;
};

const normalizeContent = (content: string) =>
  content.replace(/\s+/g, '').toLowerCase();

const loadAllowlist = async () => {
  const value = await readJson('scripts/data-audit-allowlist.json');
  if (!Array.isArray(value)) {
    findings.push({
      code: 'AUDIT_ALLOWLIST',
      location: 'scripts/data-audit-allowlist.json',
      message: '根节点必须是数组'
    });
    return 0;
  }

  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const location = `scripts/data-audit-allowlist.json[${index}]`;
    if (!isRecord(entry)) {
      findings.push({ code: 'AUDIT_ALLOWLIST', location, message: '必须是对象' });
      return;
    }

    const code = typeof entry.code === 'string' ? entry.code.trim() : '';
    const targetLocation = typeof entry.location === 'string' ? entry.location.trim() : '';
    const reason = typeof entry.reason === 'string' ? entry.reason.trim() : '';
    if (!code || !targetLocation || reason.length < 10) {
      findings.push({
        code: 'AUDIT_ALLOWLIST',
        location,
        message: 'code、location 必须非空，reason 至少 10 个字符'
      });
      return;
    }
    if (!allowlistableCodes.has(code)) {
      findings.push({
        code: 'AUDIT_ALLOWLIST',
        location,
        message: `规则 ${code} 不允许加入例外`
      });
      return;
    }

    const key = `${code}\u0000${targetLocation}`;
    if (seen.has(key)) {
      findings.push({ code: 'AUDIT_ALLOWLIST', location, message: '存在重复例外' });
      return;
    }

    seen.add(key);
    approvedFindingKeys.add(key);
  });

  return approvedFindingKeys.size;
};

const collectImageTargets = (content: string) => {
  const targets = new Set<string>();

  for (const match of content.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    targets.add(match[1]);
  }

  const referenceTargets = new Map<string, string>();
  for (const match of content.matchAll(/^\[(\d+)\][：:]\s*(\S+)/gm)) {
    referenceTargets.set(match[1], match[2]);
  }
  for (const match of content.matchAll(/!\[[^\]]*]\[(\d+)]/g)) {
    const target = referenceTargets.get(match[1]);
    if (target) targets.add(target);
  }

  return targets;
};

const auditImageTarget = async (target: string, location: string) => {
  imageReferences += 1;

  if (/^https?:\/\//i.test(target)) {
    addFinding('CONTENT_EXTERNAL_IMAGE', location, `外部图片需要明确再分发许可：${target}`);
    return;
  }

  const cleanTarget = target.split(/[?#]/, 1)[0];
  if (!cleanTarget.startsWith('/images/')) {
    addFinding('CONTENT_IMAGE_PATH', location, `图片应使用 /images/ 下的绝对路径：${target}`);
    return;
  }

  let decodedTarget: string;
  try {
    decodedTarget = decodeURIComponent(cleanTarget);
  } catch {
    addFinding('CONTENT_IMAGE_PATH', location, `图片路径包含无效编码：${target}`);
    return;
  }

  const assetPath = resolve(publicRoot, `.${decodedTarget}`);
  if (assetPath !== publicRoot && !assetPath.startsWith(`${publicRoot}${sep}`)) {
    addFinding('CONTENT_IMAGE_PATH', location, `图片路径越出 public 目录：${target}`);
    return;
  }

  try {
    await access(assetPath);
  } catch {
    addFinding('CONTENT_IMAGE_MISSING', location, `未找到已提交的图片资源：${decodedTarget}`);
  }
};

const auditExamContent = async (chapters: ExamChapter[]) => {
  const contentOwners = new Map<string, string>();

  for (const chapter of chapters) {
    const titleOwners = new Map<string, string>();

    for (const point of chapter.points) {
      const location = `${chapter.id}/${point.id}`;
      const normalizedTitle = point.title.trim().toLowerCase();
      const existingTitleOwner = titleOwners.get(normalizedTitle);
      if (existingTitleOwner) {
        addFinding('CONTENT_DUPLICATE_TITLE', location, `与 ${existingTitleOwner} 的标题重复`);
      } else {
        titleOwners.set(normalizedTitle, location);
      }

      const normalized = normalizeContent(point.content);
      if (normalized.length >= 40) {
        const existingContentOwner = contentOwners.get(normalized);
        if (existingContentOwner) {
          addFinding('CONTENT_DUPLICATE_BODY', location, `与 ${existingContentOwner} 的正文完全重复`);
        } else {
          contentOwners.set(normalized, location);
        }
      }

      if (point.content.length > 1200) {
        addFinding('CONTENT_OVERSIZED', location, `正文长度为 ${point.content.length} 字符，超过 1200 字符审阅阈值`);
      }

      const longestLine = point.content.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
      if (longestLine > 600) {
        addFinding('CONTENT_LONG_LINE', location, `单行长度为 ${longestLine} 字符，可能包含未整理的长段落`);
      }

      const quotedLength = point.content
        .split('\n')
        .filter(line => /^\s*>\s?/.test(line))
        .join('')
        .length;
      if (quotedLength > 300) {
        addFinding('CONTENT_LONG_QUOTE', location, `Markdown 引用内容为 ${quotedLength} 字符，需要确认授权`);
      }

      const suspiciousMarker = point.content.match(/转载自|摘自|原文链接|资料来源|内容来源|来源[：:]|版权所有|版权归|©/);
      if (suspiciousMarker) {
        addFinding('CONTENT_SOURCE_MARKER', location, `发现需要人工确认的来源标记：${suspiciousMarker[0]}`);
      }

      if (/TODO|TBD|待补充|待完善|在这里输入内容/i.test(point.content)) {
        addFinding('CONTENT_PLACEHOLDER', location, '正文仍包含占位内容');
      }

      const externalUrls = new Set(point.content.match(/https?:\/\/[^\s)>\]]+/gi) ?? []);
      for (const url of externalUrls) {
        addFinding('CONTENT_EXTERNAL_LINK', location, `外部链接需要确认来源和许可：${url}`);
      }

      for (const imageTarget of collectImageTargets(point.content)) {
        await auditImageTarget(imageTarget, location);
      }
    }
  }
};

const readNamedId = (
  value: unknown,
  path: string,
  ids: Set<string>
) => {
  if (!isRecord(value)) {
    addFinding('PMBOK_SCHEMA', path, '必须是对象');
    return null;
  }

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!id) addFinding('PMBOK_SCHEMA', `${path}.id`, '必须是非空字符串');
  if (!name) addFinding('PMBOK_SCHEMA', `${path}.name`, '必须是非空字符串');
  if (id && ids.has(id)) {
    addFinding('PMBOK_DUPLICATE_ID', `${path}.id`, `ID 重复：${id}`);
  } else if (id) {
    ids.add(id);
  }

  return id || null;
};

const auditStringArray = (value: unknown, path: string) => {
  if (!Array.isArray(value)) {
    addFinding('PMBOK_SCHEMA', path, '必须是字符串数组');
    return;
  }

  const seen = new Set<string>();
  value.forEach((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      addFinding('PMBOK_SCHEMA', `${path}[${index}]`, '必须是非空字符串');
      return;
    }
    if (seen.has(item)) {
      addFinding('PMBOK_DUPLICATE_ITEM', `${path}[${index}]`, `条目重复：${item}`);
    }
    seen.add(item);
  });
};

const auditPmbokData = (value: unknown) => {
  const emptySummary = { knowledgeAreas: 0, processGroups: 0, processes: 0 };
  if (!isRecord(value)) {
    addFinding('PMBOK_SCHEMA', 'pmbok', '根节点必须是对象');
    return emptySummary;
  }

  const knowledgeAreas = Array.isArray(value.knowledgeAreas) ? value.knowledgeAreas : [];
  const processGroups = Array.isArray(value.processGroups) ? value.processGroups : [];
  const processes = Array.isArray(value.processes) ? value.processes : [];
  if (!Array.isArray(value.knowledgeAreas)) addFinding('PMBOK_SCHEMA', 'pmbok.knowledgeAreas', '必须是数组');
  if (!Array.isArray(value.processGroups)) addFinding('PMBOK_SCHEMA', 'pmbok.processGroups', '必须是数组');
  if (!Array.isArray(value.processes)) addFinding('PMBOK_SCHEMA', 'pmbok.processes', '必须是数组');

  const knowledgeAreaIds = new Set<string>();
  const processGroupIds = new Set<string>();
  const processIds = new Set<string>();

  knowledgeAreas.forEach((item, index) => {
    readNamedId(item, `pmbok.knowledgeAreas[${index}]`, knowledgeAreaIds);
  });
  processGroups.forEach((item, index) => {
    readNamedId(item, `pmbok.processGroups[${index}]`, processGroupIds);
  });
  processes.forEach((item, index) => {
    const path = `pmbok.processes[${index}]`;
    readNamedId(item, path, processIds);
    if (!isRecord(item)) return;

    const knowledgeAreaId = typeof item.knowledgeAreaId === 'string' ? item.knowledgeAreaId : '';
    const processGroupId = typeof item.processGroupId === 'string' ? item.processGroupId : '';
    if (!knowledgeAreaIds.has(knowledgeAreaId)) {
      addFinding('PMBOK_FOREIGN_KEY', `${path}.knowledgeAreaId`, `未知知识域：${knowledgeAreaId || '(empty)'}`);
    }
    if (!processGroupIds.has(processGroupId)) {
      addFinding('PMBOK_FOREIGN_KEY', `${path}.processGroupId`, `未知过程组：${processGroupId || '(empty)'}`);
    }

    auditStringArray(item.inputs, `${path}.inputs`);
    auditStringArray(item.tools, `${path}.tools`);
    auditStringArray(item.outputs, `${path}.outputs`);
  });

  return {
    knowledgeAreas: knowledgeAreas.length,
    processGroups: processGroups.length,
    processes: processes.length
  };
};

const main = async () => {
  const approvedExceptions = await loadAllowlist();
  const examData = await readJson('src/data/exam-points.json');
  const validationResult = validateExamData(examData);
  let chapters: ExamChapter[] = [];
  if (!validationResult.success) {
    validationResult.errors.forEach((message, index) => {
      addFinding('EXAM_SCHEMA', `exam[${index}]`, message);
    });
  } else {
    chapters = validationResult.data;
    await auditExamContent(chapters);
  }

  const pmbokSummary = auditPmbokData(await readJson('src/data/pmbok.json'));
  for (const key of approvedFindingKeys) {
    if (usedApprovedFindingKeys.has(key)) continue;
    const [code, location] = key.split('\u0000');
    findings.push({
      code: 'AUDIT_ALLOWLIST',
      location: 'scripts/data-audit-allowlist.json',
      message: `例外已失效或位置不正确：${code} ${location}`
    });
  }

  const summary: AuditSummary = {
    chapters: chapters.length,
    points: chapters.reduce((count, chapter) => count + chapter.points.length, 0),
    ...pmbokSummary,
    imageReferences,
    approvedExceptions
  };

  if (findings.length > 0) {
    console.error(`Data audit failed with ${findings.length} finding(s):`);
    findings.forEach(finding => {
      console.error(`- [${finding.code}] ${finding.location}: ${finding.message}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log('Data audit passed.');
  console.log(`- Exam data: ${summary.chapters} chapters, ${summary.points} points`);
  console.log(`- PMBOK data: ${summary.knowledgeAreas} knowledge areas, ${summary.processGroups} process groups, ${summary.processes} processes`);
  console.log(`- Local image references checked: ${summary.imageReferences}`);
  console.log(`- Approved audit exceptions: ${summary.approvedExceptions}`);
};

await main();
