import type { ThreeElements } from '@react-three/fiber';
import type { MeshBasicNodeMaterial, MeshToonNodeMaterial } from 'three/webgpu';

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshToonNodeMaterial: ThreeElements['meshStandardMaterial'] & {
      args?: ConstructorParameters<typeof MeshToonNodeMaterial>[0];
    };
    meshBasicNodeMaterial: ThreeElements['meshBasicMaterial'] & {
      args?: ConstructorParameters<typeof MeshBasicNodeMaterial>[0];
    };
  }
}

export {};
