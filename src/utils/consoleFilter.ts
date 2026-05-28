if (typeof console !== 'undefined') {
  const shouldSuppressWarn = (msg: string): boolean =>
    msg.includes('THREE.Clock: This module has been deprecated') ||
    msg.includes("THREE.Material: 'skinning' is not a property") ||
    msg.includes("THREE.Material: 'morphTargets' is not a property") ||
    msg.includes("THREE.Material: 'envMap' is not a property") ||
    msg.includes("THREE.Material: 'combine' is not a property") ||
    msg.includes('Texture marked for update but no image data found') ||
    msg.includes('PCFSoftShadowMap has been deprecated');

  const shouldSuppressError = (msg: string): boolean => msg.includes('unknown char code');

  const messageFromArgs = (args: unknown[]): string =>
    args
      .map((arg) => (typeof arg === 'string' ? arg : ''))
      .filter(Boolean)
      .join(' ');

  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const msg = messageFromArgs(args);
    if (msg && shouldSuppressWarn(msg)) {
      return;
    }
    originalWarn(...args);
  };

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (args[0] && typeof args[0] === 'string' && shouldSuppressError(args[0])) {
      return;
    }
    originalError(...args);
  };
}
