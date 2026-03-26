# Release Checklist

## Before Release

- Проверить `NEXT_PUBLIC_SITE_URL` в production env
- Проверить `AUTH_SECRET`
- Проверить `ADMIN_EMAIL` и `ADMIN_PASSWORD_HASH`
- Проверить `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
- Проверить `DATABASE_URL`
- Проверить права на директорию `storage`
- Проверить, что volume для MongoDB подключен
- Проверить, что volume/директория для изображений подключены и переживают recreate контейнера

## Content Readiness

- Созданы реальные категории
- Созданы реальные картины
- Загружены `thumbnail/display/original` изображения
- У каждой опубликованной картины есть:
  - `titleRu/titleEn`
  - `descriptionRu/descriptionEn`
  - `slug`
  - `status`
  - `cover image`
- Созданы реальные выставки
- Проверены тексты `About` и `Contacts`

## Functional Checks

- Работает `/ru`
- Работает `/en`
- Работает `/ru/gallery`
- Работает `/en/gallery`
- Открывается страница конкретной картины
- Работает admin login
- Работает create/update для `artworks`
- Работает create/update для `categories`
- Работает create/update для `exhibitions`
- Работает upload изображений
- Работает reorder / primary / delete для изображений
- Работает inquiry form
- Inquiry сохраняется в БД
- Inquiry появляется в `/admin/inquiries`
- Работает смена статуса `NEW / READ / ARCHIVED`

## SEO Checks

- `robots.txt` доступен
- `sitemap.xml` доступен
- У locale-страниц есть `canonical`
- У locale-страниц есть `alternate hreflang`
- У artwork pages есть `VisualArtwork` JSON-LD
- У home page есть `Person` и `WebSite` JSON-LD
- У страниц нет пустых title/description

## Deployment Checks

- `docker compose up -d --build` проходит без ошибок
- `docker compose ps` показывает `web` и `mongo` в статусе `Up`
- Приложение открывается по production domain
- Логи `web` не содержат runtime exceptions
- Логи `mongo` не содержат crash/restart loop

## Post-Release

- Сделать smoke pass по публичной части
- Сделать smoke pass по админке
- Создать тестовую inquiry и подтвердить Telegram delivery
- Проверить, что sitemap и robots доступны с production domain

