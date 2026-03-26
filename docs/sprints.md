# Sprints Plan

## Формат

- Длительность спринта: `5 рабочих дней`
- Релизный горизонт MVP: `4 спринта`
- После каждого спринта обязателен demo-check по реальным сценариям

## Sprint 1. Foundation

### Цель

Поднять технический каркас проекта и зафиксировать основные контракты.

### Задачи

- Инициализировать `Next.js App Router` проект на `TypeScript`
- Настроить базовую структуру: `app/`, `features/`, `server/`, `shared/`, `prisma/`
- Подключить `MongoDB` и `Prisma`
- Подготовить `schema.prisma` для `AdminUser`, `Artwork`, `ArtworkImage`, `Category`, `Exhibition`, `Inquiry`, `SiteSettings` с i18n-ready полями
- Ввести `env`-валидацию и базовый server config
- Подготовить `Dockerfile` и `docker-compose.yml`
- Заложить базовые layout primitives и design tokens
- Создать route skeleton для публичной части и админки
- Зафиксировать image storage policy: локальный volume + metadata в БД
- Зафиксировать multilingual rules: `ru` default locale, `en` secondary locale, shared slug/relations, localized content fields

### Deliverables

- Проект запускается локально через Docker
- Prisma подключена к MongoDB
- Есть базовая структура папок и route skeleton
- Зафиксированы naming rules и env contract
- Зафиксированы i18n contract и content rules

### Dependencies

- Нет, это стартовый спринт

### Definition of Done

- `docker compose up` поднимает приложение и MongoDB
- Prisma client генерируется без ошибок
- Все обязательные env переменные валидируются на старте
- Структура проекта не смешивает UI, data access и infra

## Sprint 2. Public Core

### Цель

Собрать рабочую публичную часть сайта на реальных данных и заложить стабильный gallery data contract.

### Задачи

- Реализовать repository/service слой для `artworks`, `categories`, `exhibitions`
- Подготовить seed с тестовыми данными
- Собрать главную страницу: `Hero`, `About`, `Featured Works`, `Categories`, `Exhibitions`, `Statement`, `Contact CTA`
- Реализовать страницу галереи с grid и category filters
- Реализовать `GET /api/gallery` с cursor pagination
- Собрать базовую страницу картины
- Внедрить начальную SEO-обвязку: `metadata`, `sitemap`, `robots`
- Настроить image rendering contracts: `thumbnail`, `display`, `original`
- Подключить locale-aware public routing и language switch
- Зафиксировать locale-aware gallery API contract для initial render и next-page fetch
- Добавить bounded timeout policy для Mongo access path, чтобы SSR и API не висели на проблемной базе

### Deliverables

- Публичные страницы рендерятся из БД
- Галерея получает данные через стабильный контракт
- Есть базовая SEO-структура
- Публичный контент может рендериться в `ru` и `en` без ручных заглушек на странице
- `GET /api/gallery` стабильно работает как источник данных для client-side pagination
- slow DB path не блокирует initial gallery load надолго

### Dependencies

- Требует завершенного Sprint 1

### Definition of Done

- Галерея работает с фильтрами
- Страница картины открывается по `slug`
- Начальные metadata и sitemap существуют
- Публичный контент не зависит от моков
- API contract для gallery не расходится между SSR и client fetch

## Sprint 3. Admin and Media

### Цель

Дать редактору полноценное управление контентом и изображениями.

### Задачи

- Реализовать session auth для админки
- Защитить `/admin` через middleware и server-side guards
- Собрать CRUD для `categories`
- Собрать CRUD для `artworks`
- Собрать CRUD для `exhibitions`
- Добавить `ru/en` поля в admin forms для localized content
- Реализовать upload pipeline через `sharp`
- Генерировать `thumbnail`, `display`, `original`
- Хранить файлы в локальном volume
- Реализовать image ordering, cover selection, delete flow
- Подключить `revalidatePath` и `revalidateTag`

### Deliverables

- Админка позволяет управлять контентом без ручной работы с БД
- Загрузка изображений и производные версии работают стабильно
- Админка редактирует multilingual content без отдельной CMS

### Dependencies

- Требует финальных моделей из Sprint 1
- Требует service contracts из Sprint 2

### Definition of Done

- Логин и logout работают стабильно
- Все CRUD-мутations валидируются на сервере
- Upload не принимает битые и слишком большие файлы
- После публикации контент обновляется на публичных страницах

## Sprint 4. Inquiry, SEO, Hardening

### Цель

Довести проект до production-ready MVP.

### Задачи

- Реализовать публичную contact form
- Сохранять inquiry в MongoDB
- Отправлять inquiry в Telegram
- Реализовать admin inbox для заявок
- Добавить anti-spam: honeypot, rate limit, throttling
- Довести `generateMetadata`, `canonical`, `OpenGraph`, `structured data`
- Провести performance pass по изображениям и critical content
- Подготовить backup checklist для MongoDB и image volume
- Провести smoke tests на критический путь
- Проверить отсутствие mixed-language fragments на основных страницах

### Deliverables

- Обратная связь работает end-to-end
- Админка показывает заявки
- Публичная часть доведена по SEO и performance
- Контентные блоки согласованы на `ru/en` и не требуют ручной правки при релизе

### Dependencies

- Требует готовой админки и image pipeline

### Definition of Done

- Inquiry сначала сохраняется в БД, затем уходит в Telegram
- Есть защита от базового спама
- Ключевые страницы имеют корректные metadata
- Есть понятный backup/restore сценарий

## Critical Path

- `Foundation -> Data Model -> Public API -> Gallery UX -> Admin Auth -> Upload Pipeline -> Inquiry Flow -> SEO/Hardening`

## Next Stage Backlog

Подробный backlog следующего этапа и ownership зафиксированы в [backlog.md](./backlog.md).

## Что можно вести параллельно

- Public UI и design system после фиксации data contracts
- Admin forms и server actions после фиксации validation schemas
- SEO plumbing и metadata helpers можно вести параллельно с разработкой страниц
- Inquiry inbox и Telegram integration можно вести параллельно после фиксации `Inquiry` model
- `gallery` infinite scroll можно вести параллельно с `gallery` API hardening после фиксации ordering contract
