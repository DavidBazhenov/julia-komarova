# Subagents Plan

## Общий принцип

Проект ведется четырьмя потоками:

- `Lead / Integrator`
- `Subagent A - Platform Backend`
- `Subagent B - Public Frontend`
- `Subagent C - Admin Content`

Каждый агент владеет своей зоной и не дублирует работу другого.

## Current Stage Allocation

Следующий этап распределяется так:

- `Subagent A - Platform Backend` владеет data contract cleanup, fallback policy, inquiry backend, backup policy
- `Subagent B - Public Frontend` владеет реальным image rendering, gallery UX, locale-safe public navigation, infinite scroll
- `Subagent C - Admin Content` владеет `artwork edit flow`, form UX, media metadata editing
- `Lead / Integrator` держит cross-cutting contracts, merge order и final acceptance

Ни один агент не должен расширять свою зону за счет owned files другого агента без явного handoff.

## Lead / Integrator

### Роль

Управляет архитектурной целостностью, принимает решения по контрактам и собирает итоговые интеграции.

### Ответственность

- Утверждает структуру данных и naming rules
- Следит за тем, чтобы `app/` не превращался в слой бизнес-логики
- Проверяет контракты между UI, services и data layer
- Контролирует merge order и release readiness
- Проводит cross-cutting review по SEO, auth, upload и inquiry flow
- Утверждает i18n contracts между public, admin и data layer

## Subagent A - Platform Backend

### Зона ответственности

- `Prisma schema`
- `MongoDB` integration
- repository/service layer
- `env` validation
- auth/session/middleware
- Docker setup
- revalidation strategy
- image storage policy
- Telegram integration backend side
- multilingual schema contracts

### Owned deliverables

- `prisma/`
- `src/server/`
- `middleware.ts`
- `Dockerfile`
- `docker-compose.yml`
- gallery API contract and DB timeout policy

### Sprint focus

- Sprint 1: foundation, schema, env, Docker
- Sprint 2: services, repositories, public data contracts
- Sprint 3: upload pipeline, revalidation
- Sprint 4: inquiry backend, Telegram, backup policy
- gallery API stability, bounded timeouts, controlled fallback behavior
- i18n fields и fallbacks should be kept in sync with public loaders

## Subagent B - Public Frontend

### Зона ответственности

- landing
- gallery
- artwork page
- exhibitions/about/contacts
- public reusable components
- metadata integration
- responsive behavior
- image presentation rules
- locale-aware content rendering

### Owned deliverables

- `src/app/(public)/`
- `src/features/home/`
- `src/features/artworks/components/`
- `src/features/exhibitions/components/`
- `src/shared/ui/` для публичных компонентов
- gallery infinite scroll shell and client-side loading states

### Sprint focus

- Sprint 1: layout shell, typography, tokens
- Sprint 2: landing, gallery, artwork page shell
- Sprint 3: integration with real data, media states, and gallery pagination
- Sprint 4: SEO/performance polish
- locale routing and language switch are part of this owner scope

## Subagent C - Admin Content

### Зона ответственности

- admin auth UI
- admin layout
- CRUD pages and forms
- server actions for content mutations
- upload UI
- image ordering UI
- inquiries inbox
- validation and editor UX
- bilingual content forms and content rules

### Owned deliverables

- `src/app/(admin)/`
- `src/features/auth/`
- `src/features/inquiries/`
- admin form components

### Sprint focus

- Sprint 1: admin route skeleton and form patterns
- Sprint 2: auth flow and CRUD skeletons
- Sprint 3: full CRUD and media management
- Sprint 4: inquiry inbox and operational hardening
- admin forms must expose `ru/en` fields for localized content

## Правила взаимодействия агентов

- Нельзя менять owned files другого агента без явной договоренности
- Общие контракты сначала фиксируются, потом реализуются
- Любая mutation contract change требует синхронизации с UI owner
- Любой breaking change в schema должен быть объявлен до merge
- Интеграция идет только после прохождения typecheck и smoke checks
- i18n changes are a shared contract change and require signoff from Backend, Frontend and Admin owners
- Backlog items должны закрываться в порядке dependency chain, а не по удобству реализации
- Если задача затрагивает `admin/public/server` одновременно, нужен явный lead review до merge

## Handoffs

- `A -> B`: data contracts, image model, public API contracts
- `A -> C`: auth/session contracts, validation contracts, upload contracts
- `C -> B`: admin-published content assumptions and image selection rules
- `B -> Lead`: SEO/perf findings, UI integration issues

## Merge Order

1. Platform foundation
2. Data contracts
3. Public pages on stable data contracts
4. Admin mutations
5. Media pipeline
6. Inquiry flow
7. SEO/performance hardening
