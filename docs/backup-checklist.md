# Backup Checklist

## Что нужно бэкапить

- MongoDB data volume
- директорию/volume `storage` с изображениями
- production `.env` или секреты в вашем secret manager

## Minimum Policy

- Ежедневный backup MongoDB
- Ежедневный backup `storage`
- Отдельное хранение backup-архивов вне текущего сервера
- Хранить минимум 7 дневных копий

## MongoDB

- Использовать `mongodump` для регулярного snapshot backup
- Проверять, что backup реально читается через тестовый restore
- Фиксировать дату, размер и результат каждого backup job

## Storage

- Архивировать весь каталог с `artworks/*`
- Проверять, что структура директорий и файлов сохраняется
- Проверять, что после restore media route продолжает отдавать файлы по тем же путям

## Restore Drill

Минимум раз перед реальным релизом:

- поднять чистую MongoDB
- восстановить дамп
- восстановить `storage`
- поднять приложение
- открыть 2-3 artwork pages
- убедиться, что изображения читаются
- убедиться, что admin видит картины и inquiries

## Incident Notes

Если потерян только `web` контейнер:

- данные не теряются, если volumes сохранены

Если потеряна MongoDB:

- восстановить Mongo backup
- проверить `artworks`, `categories`, `exhibitions`, `inquiries`

Если потерян `storage`:

- восстановить backup каталога изображений
- проверить media route и artwork pages

Если потеряно и то и другое:

- сначала восстановить MongoDB
- затем восстановить `storage`
- потом поднимать `web`

