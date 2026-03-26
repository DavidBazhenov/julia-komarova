# Next Stage Backlog

## Scope

Следующий этап фокусируется на трех вещах:

- полноценный `artwork edit flow`
- end-to-end вывод реальных изображений в public UI
- выравнивание data contracts и технической чистоты после i18n и media pipeline
- production-like `gallery` experience с `infinite scroll` и locale-aware API
- стабилизация Mongo access path, чтобы public pages не зависели от долгих DB timeouts

## Workstream 1. Admin Artwork Edit

### Goal

Сделать отдельную страницу редактирования картины с единым server-side contract.

### Tasks

- Добавить `/admin/artworks/[id]`
- Подгрузить текущие данные картины по `id`
- Реализовать update form для:
  - `titleRu` / `titleEn`
  - `descriptionRu` / `descriptionEn`
  - `year`
  - `medium`
  - `dimensions`
  - `status`
  - `isFeatured`
  - `isPublished`
  - `sortOrder`
  - `priceOnRequest`
  - `categoryIds`
  - `relatedArtworkIds`
- Добавить редактирование image metadata:
  - `alt`
  - `isPrimary`
  - cover selection
- Вынести общую validation/mapping логику из create/update в один слой

### Acceptance Criteria

- Страница открывается по существующему `id`
- Текущие значения формы совпадают с БД
- Save обновляет запись без потери media links
- Validation errors возвращаются структурированно
- Create/update используют один и тот же mapping layer
- После сохранения публичные страницы обновляются через revalidation

### Dependencies

- Готовая admin auth
- Существующие Prisma models и bilingual fields
- Existing artwork service/admin contracts

### Owner

- `Subagent C - Admin Content`
- `Lead / Integrator` for contract review

## Workstream 2. Public Images

### Goal

Показать загруженные изображения в публичном UI без декоративных заглушек.

### Tasks

- Подключить `thumbnailUrl` в gallery cards
- Подключить `displayUrl` и `coverImage` на artwork page
- Рендерить gallery hero/slider из реальных image records
- Добавить graceful fallback, если у artwork нет изображений
- Проверить, что locale-aware pages используют один и тот же data contract

### Acceptance Criteria

- `/gallery` показывает реальные thumbnails из storage
- `/gallery/[slug]` показывает cover image и список дополнительных изображений
- Отсутствие изображений не ломает layout
- Public pages не зависят от mock-only rendering path, если БД доступна

### Dependencies

- Image storage pipeline
- Artwork image metadata in Prisma
- Public service layer for artworks

### Owner

- `Subagent B - Public Frontend`
- `Subagent A - Platform Backend` for data contract review

## Workstream 3. Gallery UX

### Goal

Сделать gallery стабильной по производительности, навигации и подгрузке данных.

### Tasks

- Довести `infinite scroll` до production-like behavior
- Завести `cursor pagination` end-to-end
- Сохранить category filters в URL search params
- Добавить loading/skeleton states
- Не терять locale при навигации и фильтрации
- Привязать `gallery` к locale-aware API contract, а не к offset-based page loading
- Проверить, что initial SSR и client-side fetch используют один и тот же ordering contract

### Acceptance Criteria

- Подгрузка работает без полного перерендеринга страницы
- Фильтры сохраняются в URL и восстанавливаются после refresh
- Pagination не использует offset как source of truth
- UI не дергается при подгрузке следующей порции
- `GET /api/gallery` возвращает locale-safe payload, который можно использовать и для initial render, и для next-page fetch
- `gallery` остается responsive даже при slow DB conditions за счет быстрых fallbacks и predictable loading states

### Dependencies

- Stable locale-aware `GET /api/gallery`
- Public data layer returning deterministic ordering
- Mongo access path with bounded timeouts or fallback policy

### Owner

- `Subagent B - Public Frontend`
- `Subagent A - Platform Backend` for API and DB contract review

## Workstream 4. Data Contract Cleanup

### Goal

Убрать остаточные дубли и стабилизировать server/data boundaries.

### Tasks

- Вынести локализованный mapping в единый helper layer
- Свести к одному месту fallback logic для Prisma/Mongo availability
- Проверить, что page files не содержат business transforms
- Привести naming к единому контракту между admin/public/services
- Убедиться, что build не требует live DB
- Зафиксировать DB timeout policy для build, SSR и API routes
- Убедиться, что public gallery flow не блокируется на медленном Mongo connection handshake

### Acceptance Criteria

- Один source of truth для localization mapping
- No duplicate transform logic across page files
- Services fail fast or fallback predictably
- Build проходит без зависимости от живой MongoDB
- Gallery pages и gallery API не ждут unbounded DB timeout
- Mongo-related errors переходят в controlled fallback path, а не в long-hanging request

### Dependencies

- Existing server/db and service layer
- i18n helpers

### Owner

- `Subagent A - Platform Backend`
- `Lead / Integrator`

## Workstream 5. Inquiry and Hardening

### Goal

Закрыть operational хвосты после media и public image work.

### Tasks

- Довести inquiry flow до стабильного production behavior
- Проверить Telegram delivery path
- Добавить/проверить anti-spam guards
- Подготовить smoke scenarios для critical path
- Зафиксировать backup/restore checklist

### Acceptance Criteria

- Inquiry сохраняется до отправки во внешнюю интеграцию
- Ошибки Telegram не ломают сохранение заявки
- Есть понятный recovery path для DB и media volume

### Dependencies

- Stable inquiry model
- Telegram service and env contract

### Owner

- `Subagent A - Platform Backend`
- `Subagent C - Admin Content`
