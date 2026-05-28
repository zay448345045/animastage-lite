import initJolt from 'jolt-physics/wasm-compat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JoltModule = any;

let joltModule: JoltModule | null = null;
let initPromise: Promise<JoltModule> | null = null;

export function isJoltInitialized(): boolean {
  return joltModule !== null;
}

export function getJolt(): JoltModule {
  if (!joltModule) {
    throw new Error('[Jolt] Call initJoltPhysics() before using physics');
  }
  return joltModule;
}

/** Async bootstrap — call once at app start and before loading PMX models. */
export function initJoltPhysics(): Promise<JoltModule> {
  if (joltModule) return Promise.resolve(joltModule);
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('[Jolt] Requires a browser environment'));
  }

  if (!initPromise) {
    initPromise = initJolt()
      .then((Jolt) => {
        joltModule = Jolt;
        return Jolt;
      })
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }

  return initPromise;
}
