import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const loader = new HDRLoader();

export interface HdrEnvironmentResult {
  envMap: THREE.Texture;
  /** PMREM cube target — caller should dispose when replacing. */
  pmremTarget: THREE.WebGLRenderTarget;
  blobUrl: string;
}

/**
 * Load .hdr / .exr (if supported) for IBL — lite PMREM 128 (mmd_rtx uses full PMREM).
 */
export async function loadHdrEnvironmentFromFile(
  file: File,
  renderer: THREE.WebGLRenderer,
  options: { pmremSize?: number } = {}
): Promise<HdrEnvironmentResult> {
  const pmremSize = options.pmremSize ?? 128;
  const blobUrl = URL.createObjectURL(file);

  const hdrTexture = await new Promise<THREE.DataTexture>((resolve, reject) => {
    loader.load(
      blobUrl,
      (tex) => resolve(tex),
      undefined,
      (err) => reject(err)
    );
  });

  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  hdrTexture.colorSpace = THREE.LinearSRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(hdrTexture);
  pmrem.dispose();
  hdrTexture.dispose();

  target.texture.colorSpace = THREE.LinearSRGBColorSpace;

  return {
    envMap: target.texture,
    pmremTarget: target,
    blobUrl,
  };
}

export function disposeHdrEnvironment(result: HdrEnvironmentResult | null): void {
  if (!result) return;
  result.envMap?.dispose();
  result.pmremTarget?.dispose();
  if (result.blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(result.blobUrl);
  }
}

export function isHdrFile(file: File): boolean {
  const n = file.name.toLowerCase();
  return n.endsWith('.hdr') || n.endsWith('.exr');
}
