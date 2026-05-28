import * as THREE from 'three';
import { createMmdDebugGeometry, MMDRigidBodyJolt } from './mmdRigidBodyJolt';
import type { MMDPhysicsJolt } from './mmdPhysicsJolt';
import { MMD_BODY_KINEMATIC } from './mmdTypes';

const _matrixWorldInv = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _bodyMat = new THREE.Matrix4();

function createDebugMaterials(_webgpu: boolean): THREE.Material[] {
  const colors = [0xff6668, 0x88cc88, 0x8888ff];
  return colors.map(
    (color) =>
      new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.35,
      })
  );
}

export function createMmdPhysicsHelper(
  mesh: THREE.SkinnedMesh,
  physics: MMDPhysicsJolt,
  options: { webgpu?: boolean } = {}
): THREE.Object3D {
  const root = new THREE.Object3D();
  root.name = 'MMDPhysicsHelperJolt';
  root.userData.skipWebGpuMaterialConvert = true;
  root.matrix.copy(mesh.matrixWorld);
  root.matrixAutoUpdate = false;

  const materials = createDebugMaterials(options.webgpu ?? false);

  for (const body of physics.bodies) {
    const geometry = createMmdDebugGeometry(body.params);
    const mat = materials[Math.min(body.params.type, 2)]!;
    const child = new THREE.Mesh(geometry, mat);
    child.userData.mmdBody = body;
    child.userData.skipWebGpuMaterialConvert = true;
    root.add(child);
  }

  const originalUpdate = root.updateMatrixWorld.bind(root);
  root.updateMatrixWorld = (force?: boolean) => {
    originalUpdate(force);
    if (!root.visible) return;

    _matrixWorldInv.copy(mesh.matrixWorld).decompose(_position, _quaternion, _scale);
    _matrixWorldInv.compose(_position, _quaternion, _scale.set(1, 1, 1)).invert();

    root.children.forEach((child, index) => {
      const body = physics.bodies[index] as MMDRigidBodyJolt | undefined;
      if (!body) return;
      body.getDebugMatrix(_bodyMat, physics.syncBuffers);
      child.matrix.copy(_bodyMat).premultiply(_matrixWorldInv);
      child.matrixAutoUpdate = false;
      child.matrixWorldNeedsUpdate = true;
    });
  };

  root.userData.dispose = () => {
    materials.forEach((m) => m.dispose());
    root.children.forEach((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).geometry.dispose();
      }
    });
  };

  return root;
}

void MMD_BODY_KINEMATIC;
