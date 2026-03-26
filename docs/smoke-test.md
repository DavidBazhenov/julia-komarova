# Smoke Test

## Public

1. Открыть `/ru`
2. Открыть `/en`
3. Проверить переключение языка
4. Открыть `/ru/gallery`
5. Открыть `/en/gallery`
6. Проверить фильтр по категории
7. Проскроллить gallery и проверить infinite scroll
8. Открыть 1-2 artwork pages
9. Проверить:
   - hero image
   - дополнительные изображения
   - title
   - status
   - related works
10. Открыть `/ru/exhibitions`
11. Открыть `/ru/about`
12. Открыть `/ru/contacts`

## Contact Form

1. Отправить тестовую заявку
2. Проверить success state
3. Проверить, что заявка появилась в админке
4. Проверить Telegram notification, если токены настроены

## Admin Auth

1. Открыть `/admin/login`
2. Войти под admin пользователем
3. Открыть `/admin`
4. Открыть `/admin/artworks`
5. Открыть `/admin/categories`
6. Открыть `/admin/exhibitions`
7. Открыть `/admin/inquiries`

## Artworks

1. Создать test artwork
2. Открыть `/admin/artworks/[id]`
3. Обновить bilingual поля
4. Добавить категории
5. Загрузить изображение
6. Проверить:
   - `primary`
   - reorder
   - delete
7. Открыть public artwork page и убедиться, что изображение видно

## Categories

1. Создать test category
2. Открыть `/admin/categories/[id]`
3. Изменить title/description/sort/visibility
4. Проверить, что category filter отображается корректно

## Exhibitions

1. Создать test exhibition
2. Открыть `/admin/exhibitions/[id]`
3. Обновить даты и bilingual поля
4. Проверить public `/exhibitions`

## Inquiries

1. Открыть `/admin/inquiries`
2. Открыть detail page конкретной заявки
3. Изменить статус:
   - `NEW`
   - `READ`
   - `ARCHIVED`
4. Проверить, что фильтры inbox работают

## SEO / Meta

1. Открыть `/sitemap.xml`
2. Открыть `/robots.txt`
3. Проверить source у `/ru`, `/en/gallery`, artwork page:
   - `canonical`
   - `hreflang`
   - `og:title`
   - `og:description`
   - JSON-LD

## Docker

1. Выполнить `docker compose ps`
2. Убедиться, что `web` и `mongo` имеют статус `Up`
3. Проверить, что после `docker compose down` и повторного `up` данные в Mongo и `storage` сохраняются

