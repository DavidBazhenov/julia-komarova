# Clean Code Rules

## Architectural Rules

- `app/` отвечает только за routing, layout composition, page-level loading и metadata
- Бизнес-логика не живет в React components
- Прямой доступ к Prisma допустим только в `server/` и repository layer
- UI-компоненты не импортируют `fs`, Prisma client, Telegram client, env parsing
- Один модуль отвечает за одну сущность или один сценарий
- Page files не содержат data transforms, только composition и binding к feature services

## Type Safety

- `TypeScript strict` обязателен
- `any` запрещен, кроме узко изолированных adapter boundaries
- Все public contracts типизированы
- Server actions и route handlers возвращают предсказуемые result shapes

## Validation

- Все входные данные валидируются через `zod`
- Нельзя полагаться только на client-side validation
- Ошибки формы возвращаются в структурированном виде
- Upload всегда валидирует mime, size и dimensions

## Data Access

- Нет дублирования запросов в разных слоях
- Repository слой отвечает за доступ к данным
- Service слой отвечает за orchestration и доменные правила
- Route handlers и server actions не содержат низкоуровневой data logic
- Для локализованных сущностей все преобразования проходят через единый mapping layer, а не через копипасту в page files
- Create/update flows используют общий schema + mapping boundary, а не две почти одинаковые реализации
- Fallback logic для БД должен быть централизованным, а не размазанным по page files

## React and Next.js

- Server Components по умолчанию
- `use client` только по необходимости
- URL search params являются source of truth для gallery filters
- Client state используется только для локального интерактива
- Не выносить доменную логику в hooks без причины

## CSS and UI

- CSS Modules рядом с компонентом
- Повторяющиеся значения выносятся в tokens
- Компоненты не должны зависеть от конкретной страницы без необходимости
- Декоративные эффекты не должны ухудшать readability и performance

## Error Handling

- Не пробрасывать сырые ошибки в UI
- Доменные ошибки должны быть нормализованы
- Все async operations должны иметь controlled failure path
- Ошибки внешних интеграций логируются на сервере

## File and Media Rules

- Изображения не хранятся в MongoDB
- В БД сохраняются только metadata и пути
- Удаление изображения удаляет и файл, и metadata record
- Публичный UI не использует original image для grid и slider
- `thumbnail` предназначен для gallery cards, `display` для detail view, `original` не должен попадать в обычный public rendering path

## Internationalization Rules

- `ru` является default locale и базовой редакционной версией
- `en` должен рендериться из тех же сущностей, а не из отдельного дублирующего хранилища
- Shared fields остаются single-source of truth, localized content лежит в `*Ru` / `*En`
- UI copy и content copy не смешиваются в одном модуле без явного naming
- Любой новый content block должен иметь план локализации до merge
- Locale-aware mapping должен жить рядом с data service, а не в каждой странице отдельно

## Current Increment Guardrails

- Не создавать отдельный edit/create contract для одной и той же сущности, если достаточно общего формы и режима
- Не дублировать image URL construction в public страницах и admin forms
- Не смешивать mock fallback и business logic в одном блоке рендера
- Не добавлять новый client state, если URL params или server data уже решают задачу
- Не расширять i18n контракт без обновления `backlog.md`, `agents.md` и service mapping

## Security Rules

- Все admin routes защищены middleware и server-side guard
- Secrets только через env
- Никаких hardcoded credentials
- Inquiry flow имеет anti-spam слой с первого релиза

## Code Review Checklist

- Код укладывается в слой своей ответственности
- Нет скрытых side effects
- Названия отражают предметную область, а не техническую случайность
- Новая логика покрыта минимальным happy-path и validation check
- Mutation, меняющая публичный контент, триггерит revalidation
