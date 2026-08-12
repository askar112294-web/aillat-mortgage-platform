# Project Detail v2

Скопируйте два файла в текущую папку `components/`:

- `project-detail-view.tsx`
- `project-detail-view.module.css`

Это изолированный CSS-module. Старые `project-detail-*` стили в `app/globals.css` можно пока не удалять — новая страница их не использует.

После копирования:

```bash
npm run build
npm run dev
```

Откройте любую карточку ЖК → `Подробнее`.

Если результат устраивает:

```bash
git add .
git commit -m "feat: redesign project detail page v2"
git push
```
