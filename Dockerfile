FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN npm run build:worker

# Worker-Stage: minimales Image, nur Prisma-Engine + pg (node-cron ist gebündelt)
FROM node:22-alpine AS worker-runner
WORKDIR /app
ENV NODE_ENV=production

# Gebündelter Worker (node-cron und alle weiteren pure-JS-Deps sind drin)
COPY --from=builder /app/dist/worker.js ./dist/worker.js

# Prisma native Query Engine
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Nur die 3 externen Deps installieren (~50 MB statt 1,5 GB)
COPY worker-deps.json ./package.json
RUN npm install --omit=dev

CMD ["node", "dist/worker.js"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
