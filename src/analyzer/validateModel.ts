import { buildAssetIndex, lookupInFileMap } from '../utils/mmdFiles';
import type { AnalyzerIssue, ModelAnalysisStats, ModelAnalysisReport } from './types';
import type { ParsedPmxSummary } from './parsePmx';

const THRESHOLDS = {
  verticesWarning: 80_000,
  verticesError: 150_000,
  trianglesWarning: 120_000,
  rigidBodiesWarning: 64,
  rigidBodiesError: 120,
  morphsWarning: 80,
  bonesWarning: 256,
  materialsWarning: 32,
};

function issue(
  id: string,
  severity: AnalyzerIssue['severity'],
  title: string,
  detail: string,
  suggestion?: string
): AnalyzerIssue {
  return { id, severity, title, detail, suggestion };
}

export function findMissingTextures(
  texturePaths: string[],
  fileMap?: Record<string, string>
): string[] {
  if (!fileMap || Object.keys(fileMap).length === 0) {
    return [];
  }
  const index = buildAssetIndex(fileMap);
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const raw of texturePaths) {
    const path = raw.trim();
    if (!path || path.startsWith('data:')) continue;
    const key = path.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const resolved = lookupInFileMap(path, fileMap, index);
    if (!resolved || !resolved.startsWith('blob:')) {
      missing.push(path);
    }
  }
  return missing;
}

export function buildStatsFromParsed(parsed: ParsedPmxSummary): ModelAnalysisStats {
  const dynamicRigidBodyCount = parsed.rigidBodies.filter(
    (b) => b.type === 1 || b.type === 2
  ).length;
  const triangleCount = parsed.materials.reduce((s, m) => s + m.faceCount, 0);

  return {
    boneCount: parsed.bones.length,
    morphCount: parsed.morphs.length,
    rigidBodyCount: parsed.rigidBodies.length,
    constraintCount: parsed.constraints.length,
    materialCount: parsed.materials.length,
    textureCount: parsed.textures.length,
    vertexCount: parsed.vertexCount,
    triangleCount,
    missingTextureCount: 0,
    dynamicRigidBodyCount,
    ikCount: 0,
  };
}

export function validateParsedModel(
  parsed: ParsedPmxSummary,
  options: {
    modelFileName?: string;
    fileMap?: Record<string, string>;
    meshVertexCount?: number;
    meshTriangleCount?: number;
    ikCount?: number;
  } = {}
): ModelAnalysisReport {
  const missingTextures = findMissingTextures(parsed.textures, options.fileMap);
  const stats = buildStatsFromParsed(parsed);
  stats.missingTextureCount = missingTextures.length;
  if (options.meshVertexCount && options.meshVertexCount > 0) {
    stats.vertexCount = options.meshVertexCount;
  }
  if (options.meshTriangleCount && options.meshTriangleCount > 0) {
    stats.triangleCount = options.meshTriangleCount;
  }
  stats.ikCount = options.ikCount ?? 0;

  const issues: AnalyzerIssue[] = [];
  const suggestions: string[] = [];

  if (missingTextures.length > 0) {
    issues.push(
      issue(
        'missing_textures',
        'error',
        `${missingTextures.length} missing texture(s)`,
        missingTextures.slice(0, 5).join(', ') +
          (missingTextures.length > 5 ? '…' : ''),
        'Drop the texture folder with the PMX, or fix paths in PMX Editor. Check Texture\\ paths match file names.'
      )
    );
    suggestions.push('Re-import the model folder including all Texture/ subfolders.');
  }

  if (stats.vertexCount >= THRESHOLDS.verticesError) {
    issues.push(
      issue(
        'vertices_high',
        'error',
        'Very high polygon count',
        `${stats.vertexCount.toLocaleString()} vertices`,
        'Use a decimated / Lite model for browser preview and Shorts export.'
      )
    );
  } else if (stats.vertexCount >= THRESHOLDS.verticesWarning) {
    issues.push(
      issue(
        'vertices_warn',
        'warning',
        'High polygon count',
        `${stats.vertexCount.toLocaleString()} vertices`,
        'Enable 9:16 Lite mode and lower character quality if FPS drops.'
      )
    );
  }

  if (stats.triangleCount >= THRESHOLDS.trianglesWarning) {
    issues.push(
      issue(
        'tris_warn',
        'warning',
        'Many triangles',
        `${stats.triangleCount.toLocaleString()} faces`,
        'Hide unused morphs/materials in PMX; merge materials where possible.'
      )
    );
  }

  if (stats.rigidBodyCount >= THRESHOLDS.rigidBodiesError) {
    issues.push(
      issue(
        'physics_heavy',
        'error',
        'Heavy physics setup',
        `${stats.rigidBodyCount} rigid bodies (${stats.dynamicRigidBodyCount} dynamic)`,
        'Reduce skirt/hair physics bodies in PMX or set Physics to Playtime / Off for preview.'
      )
    );
  } else if (stats.rigidBodyCount >= THRESHOLDS.rigidBodiesWarning) {
    issues.push(
      issue(
        'physics_warn',
        'warning',
        'Many physics bodies',
        `${stats.rigidBodyCount} rigid bodies`,
        'Use Physics: Playtime only, or disable physics while posing.'
      )
    );
  }

  if (stats.morphCount >= THRESHOLDS.morphsWarning) {
    issues.push(
      issue(
        'morphs_many',
        'info',
        'Large morph list',
        `${stats.morphCount} morphs`,
        'Studio uses a subset for timeline; unused morphs do not affect playback much.'
      )
    );
  }

  if (stats.boneCount >= THRESHOLDS.bonesWarning) {
    issues.push(
      issue(
        'bones_many',
        'info',
        'Complex skeleton',
        `${stats.boneCount} bones`,
        'Use bone groups in the Editor tab to solo/mute arm or leg chains.'
      )
    );
  }

  if (stats.materialCount >= THRESHOLDS.materialsWarning) {
    issues.push(
      issue(
        'materials_many',
        'warning',
        'Many materials',
        `${stats.materialCount} materials`,
        'Merge materials in PMX Editor to reduce draw calls in WebGL.'
      )
    );
  }

  const orphanTex = parsed.materials.filter(
    (m) => m.textureIndex >= 0 && m.textureIndex >= parsed.textures.length
  );
  if (orphanTex.length > 0) {
    issues.push(
      issue(
        'bad_tex_index',
        'warning',
        'Invalid material texture indices',
        `${orphanTex.length} material(s) reference missing texture slots`,
        'Re-save textures in PMX Editor or re-export from Blender/MMD.'
      )
    );
  }

  if (stats.rigidBodyCount === 0) {
    issues.push(
      issue(
        'no_physics',
        'info',
        'No rigid bodies',
        'This model has no MMD physics data',
        'Skirt/hair will not simulate unless you add bodies in PMX.'
      )
    );
  }

  if (!options.fileMap || Object.keys(options.fileMap).length === 0) {
    issues.push(
      issue(
        'no_filemap',
        'info',
        'Preset / remote model',
        'Texture paths were not validated against local files',
        'For full texture checks, load PMX via folder drop (PMX + textures).'
      )
    );
  }

  if (suggestions.length === 0 && issues.length === 0) {
    suggestions.push('Model looks browser-friendly. Good to go for preview and Shorts export.');
  } else {
    if (stats.vertexCount > 50_000) {
      suggestions.push('Use Render tier Lite + 9:16 mode for smoother recording.');
    }
    if (stats.rigidBodyCount > 40) {
      suggestions.push('Set Physics to Playtime to avoid sim cost while scrubbing the timeline.');
    }
    if (missingTextures.length === 0 && stats.vertexCount < THRESHOLDS.verticesWarning) {
      suggestions.push('No critical issues — safe for timeline posing and MP4 export.');
    }
  }

  return {
    analyzedAt: Date.now(),
    modelFileName: options.modelFileName,
    format: parsed.format,
    stats,
    missingTextures,
    issues,
    suggestions,
  };
}
