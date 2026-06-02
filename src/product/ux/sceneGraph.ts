/** Product-layer scene graph metadata (UI only — no engine parenting). */

export interface SceneGraphNode {
  objectId: string;
  name: string;
  type: 'model' | 'camera' | 'light';
  parentId: string | null;
  groupId: string | null;
  locked: boolean;
  visible: boolean;
}

export interface SceneGraphGroup {
  id: string;
  name: string;
  collapsed: boolean;
}

export interface SceneGraphState {
  nodes: SceneGraphNode[];
  groups: SceneGraphGroup[];
}

export function buildSceneGraphFromObjects(
  objects: Array<{ id: string; name: string; type: 'model' | 'camera' | 'light'; visible: boolean }>,
  meta: Record<string, Partial<Pick<SceneGraphNode, 'parentId' | 'groupId' | 'locked'>>>
): SceneGraphState {
  return {
    nodes: objects.map((o) => ({
      objectId: o.id,
      name: o.name,
      type: o.type,
      parentId: meta[o.id]?.parentId ?? null,
      groupId: meta[o.id]?.groupId ?? null,
      locked: meta[o.id]?.locked ?? false,
      visible: o.visible,
    })),
    groups: [],
  };
}

export function toggleNodeVisibility(
  state: SceneGraphState,
  objectId: string
): SceneGraphState {
  return {
    ...state,
    nodes: state.nodes.map((n) =>
      n.objectId === objectId ? { ...n, visible: !n.visible } : n
    ),
  };
}

export function toggleNodeLock(state: SceneGraphState, objectId: string): SceneGraphState {
  return {
    ...state,
    nodes: state.nodes.map((n) =>
      n.objectId === objectId ? { ...n, locked: !n.locked } : n
    ),
  };
}

export function createGroup(state: SceneGraphState, name: string): SceneGraphState {
  const id = `grp_${Date.now()}`;
  return {
    ...state,
    groups: [...state.groups, { id, name, collapsed: false }],
  };
}

export function assignToGroup(
  state: SceneGraphState,
  objectId: string,
  groupId: string | null
): SceneGraphState {
  return {
    ...state,
    nodes: state.nodes.map((n) =>
      n.objectId === objectId ? { ...n, groupId, parentId: groupId } : n
    ),
  };
}
