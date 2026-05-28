# Backup: pre-reze-integration

Создан перед интеграцией редактора (reze-studio features).

## Восстановление одного файла

```powershell
Copy-Item "backup\pre-reze-integration\src\utils\mmdCharacterPhysics.ts" "src\utils\mmdCharacterPhysics.ts" -Force
```

## Восстановить всё из бэкапа

```powershell
Get-ChildItem -Recurse "backup\pre-reze-integration\src" -File | ForEach-Object {
  $rel = $_.FullName.Replace((Resolve-Path "backup\pre-reze-integration").Path + "\", "")
  Copy-Item $_.FullName $rel -Force
}
```

## Файлы

- `mmdCharacterPhysics.ts`, `mmdPhysicsLifecycle.ts`, `mmdPhysicsPresets.ts` — Bullet/физика
- `MMDModelWrapper.tsx`, `mmdFrameLoop.ts` — модель и цикл
- `App.tsx`, `useTimeline.ts`, `TimelineLogic.ts`, `types.ts` — состояние приложения
