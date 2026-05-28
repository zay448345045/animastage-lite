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
import RootRouter from './RootRouter.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
