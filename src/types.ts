export interface KnowledgeArea {
  id: string;
  name: string;
}

export interface ProcessGroup {
  id: string;
  name: string;
}

export interface Process {
  id: string;
  name: string;
  knowledgeAreaId: string;
  processGroupId: string;
  inputs: string[];
  tools: string[];
  outputs: string[];
}

export interface PmbokData {
  knowledgeAreas: KnowledgeArea[];
  processGroups: ProcessGroup[];
  processes: Process[];
}

export interface ExamPoint {
  id: string;
  uniqueId?: string;
  title: string;
  importance: number;
  content: string;
}

export interface ExamChapter {
  id: string;
  title: string;
  points: ExamPoint[];
}

export type StudyStatus = 'not-started' | 'studying' | 'mastered';

export interface StudyRecord {
  favorite: boolean;
  status: StudyStatus;
  updatedAt: string;
}

export type StudyRecords = Record<string, StudyRecord>;
