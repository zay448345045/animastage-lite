import './utils/consoleFilter';
import './utils/mmdMaterialPatch';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { initAmmo } from './utils/ammoLoader';
import { installAmmoCrashGuard } from './utils/mmdCharacterPhysics';

installAmmoCrashGuard();

void initAmmo().catch((error) => {
  console.warn('[MMD] Ammo preload failed — physics will stay disabled:', error);
});
import './utils/mmdCharsetPatch';
import { bootstrapNativeRoute } from './native/nativeStudioBootstrap';
import { initNativeShell } from './native/initNativeShell';
import RootRouter from './RootRouter.tsx';
import RootErrorBoundary from './RootErrorBoundary.tsx';
import './index.css';

bootstrapNativeRoute();
void initNativeShell();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <RootRouter />
    </RootErrorBoundary>
  </StrictMode>,
);
