export type AnalyzerSeverity = 'info' | 'warning' | 'error';

export interface AnalyzerIssue {
  id: string;
  severity: AnalyzerSeverity;
  title: string;
  detail: string;
  suggestion?: string;
}

export interface ModelAnalysisStats {
  boneCount: number;
  morphCount: number;
  rigidBodyCount: number;
  constraintCount: number;
  materialCount: number;
  textureCount: number;
  vertexCount: number;
  triangleCount: number;
  missingTextureCount: number;
  dynamicRigidBodyCount: number;
  ikCount: number;
}

export interface ModelAnalysisReport {
  analyzedAt: number;
  modelFileName?: string;
  format?: 'pmx' | 'pmd' | 'unknown';
  stats: ModelAnalysisStats;
  missingTextures: string[];
  issues: AnalyzerIssue[];
  suggestions: string[];
}
