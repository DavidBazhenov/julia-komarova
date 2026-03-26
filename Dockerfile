FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm install

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=mongodb://127.0.0.1:27017/julia_komarova_build
ENV AUTH_SECRET=build-secret
ENV ADMIN_EMAIL=admin@example.com
ENV ADMIN_PASSWORD_HASH=build-password-hash
ENV TELEGRAM_BOT_TOKEN=build-telegram-token
ENV TELEGRAM_CHAT_ID=build-telegram-chat
ENV NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV REVALIDATE_SECRET=build-revalidate-secret
ENV SKIP_DATABASE_DURING_BUILD=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
