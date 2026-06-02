## Scene Optimization Utilities — Complete Integration

### ✅ Что добавлено в проект

Все функции из внешнего проекта (`webgl-scene-optim.js`) полностью интегрированы:

#### 📁 Структура:
```
src/render/sceneOptim/
├── webglSceneOptim.ts       → 38 функций + 2 класса + все типы
├── mainThreadScheduler.ts   → runWorkInSlices, scheduleIdleWork
├── index.ts                 → центральный экспорт
└── USAGE_GUIDE.md          → подробная документация
```

#### 📤 Как импортировать:

**Вариант 1: Из основного модуля render**
```typescript
import {
  createOptimizedRenderer,
  freezeStaticObjectTree,
  DynamicResolutionGovernor,
  disposeMaterial,
} from '../render';
```

**Вариант 2: Прямо из sceneOptim**
```typescript
import {
  createOptimizedRenderer,
  freezeStaticObjectTree,
} from '../render/sceneOptim';
```

---

### 🛠️ Доступные утилиты

| Категория | Функции | Применение |
|-----------|---------|-----------|
| **Renderer** | `createOptimizedRenderer`, `applyPixelRatioCap`, `DynamicResolutionGovernor` | Создание и оптимизация рендера |
| **Geometry** | `estimateGeometryBudget`, `createStaticBatchedGroup`, `createInstancedDecorations`, `freezeStaticObjectTree` | Оптимизация геометрии и draw calls |
| **Materials** | `downgradeMaterial`, `applyMaterialDowngrade`, `clampTextureAnisotropy`, `auditTransparentMaterials` | Деградация материалов по дистанции |
| **Shadows** | `configureRendererShadows`, `fitDirectionalShadowCamera`, `applyShadowProxiesToMap`, `buildLowPolyProxyGeometry` | Оптимизация теней |
| **Raycasting** | `createPickProxy`, `raycastPickProxies` | Невидимые коллайдеры для пика |
| **Loading** | `createOptimizedGLTFLoader`, `optimizeLoadedGLTFScene`, `disposeMaterial`, `disposeObject3D` | Загрузка и очистка GPU памяти |
| **Analysis** | `estimateSceneComplexity`, `cleanupScene` | Анализ сложности и полная очистка сцены |
| **Scheduling** | `runWorkInSlices`, `scheduleIdleWork` | Распределение тяжелой работы по фреймам |

---

### 🎯 Примеры использования

**Создание оптимизированного рендера:**
```typescript
const renderer = createOptimizedRenderer(document.body, {
  maxPixelRatio: 1.5,
  antialias: false,
  precision: 'mediump',
});
```

**Автоматическое снижение разрешения при падении FPS:**
```typescript
const dprGov = new DynamicResolutionGovernor(renderer, {
  lowFps: 30,
  highFps: 56,
});

// В цикле рендеринга:
dprGov.tick(currentFps);
```

**Замораживание статичной геометрии:**
```typescript
freezeStaticObjectTree(cityProps, { skipSkinned: true });
```

**Деградация материалов по дистанции:**
```typescript
applyMaterialDowngrade(scene, {
  cameraPosition: camera.position,
  backdropDistance: 40,  // Дальше 40 юнитов → BACKDROP
  heroNames: ['character'],  // Не трогать эти
});
```

**Создание тень-прокси для тяжелых мешей:**
```typescript
applyShadowProxiesToMap(scene, camera, { minTriangles: 5000 });
```

**Правильная очистка GPU памяти:**
```typescript
disposeObject3D(oldModel, { scene, removeFromParent: true });
```

**Распределение тяжелой работы по фреймам:**
```typescript
await runWorkInSlices([
  () => processMaterials(mesh),
  () => applyQuality(mesh),
], 6);  // 6ms на слайс
```

---

### ✨ Ключевые особенности

- ✅ **38 функций + 2 класса** готовы к использованию
- ✅ **Полная типизация** — все параметры и возвращаемые значения типизированы
- ✅ **Константы** — `PROXY_LAYER`, `MaterialTier`, `DEFAULT_MAX_ANISOTROPY`
- ✅ **Нет изменений** в физике, анимации и таймлайне
- ✅ **Документация** — `USAGE_GUIDE.md` с примерами для каждой функции
- ✅ **Экспорты** — доступны из `src/render/` и `src/render/sceneOptim/`

---

### 📖 Документация

Полный гайд с примерами см. в:
```
src/render/sceneOptim/USAGE_GUIDE.md
```

---

### 🎬 Готово к использованию!

Все утилиты полностью интегрированы и готовы к применению в вашем проекте. Начните с импорта нужных функций и применяйте по необходимости для оптимизации сцены.
