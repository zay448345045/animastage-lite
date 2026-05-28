import type { ThreeElements } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { isWebGpuRenderer } from '../utils/webgpuSupport';

type BasicMaterialProps = ThreeElements['meshBasicMaterial'];
type ToonMaterialProps = ThreeElements['meshToonMaterial'];

function useWebGpuMaterials(): boolean {
  const { gl } = useThree();
  return isWebGpuRenderer(gl);
}

/** WebGPU node basic material on desktop WebGPU; legacy MeshBasicMaterial on WebGL / mobile. */
export function AdaptiveBasicMaterial(props: BasicMaterialProps) {
  return useWebGpuMaterials() ? (
    <meshBasicNodeMaterial {...props} />
  ) : (
    <meshBasicMaterial {...props} />
  );
}

/** WebGPU node toon material on desktop WebGPU; legacy MeshToonMaterial on WebGL / mobile. */
export function AdaptiveToonMaterial(props: ToonMaterialProps) {
  return useWebGpuMaterials() ? (
    <meshToonNodeMaterial {...props} />
  ) : (
    <meshToonMaterial {...props} />
  );
}
