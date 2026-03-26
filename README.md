# Julia Komarova Site

Production-ready foundation for the Julia Komarova artist website.

## Stack

- Next.js App Router
- TypeScript
- CSS Modules
- MongoDB
- Prisma ORM
- Docker / Docker Compose
- Telegram Bot API

## Structure

- `docs/` - planning, clean code rules, sprint map, design direction
- `prisma/` - Prisma schema for MongoDB
- `src/` - application code, added by feature workers

## Local Development

1. Copy `.env.example` to `.env`
2. Fill in secrets and local values
3. Run `docker compose up --build`

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - run the production server
- `npm run lint` - lint the project
- `npm run typecheck` - TypeScript type check
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:dbpush` - sync Prisma schema to MongoDB
- `npm run prisma:studio` - open Prisma Studio

## Notes

- Images are stored on disk in a Docker volume, not in MongoDB.
- `prisma db push` is the intended schema sync strategy for MongoDB.
- Public pages and admin UI will be implemented in `src/` by the other workers.
