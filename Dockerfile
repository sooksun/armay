# syntax=docker/dockerfile:1
# Next.js 16 (App Router, full-stack) + Prisma + MySQL — production image.
# Multi-stage: install deps -> build standalone -> slim runner that runs
# `prisma migrate deploy` on boot then serves on :3000.

# ---------- base ----------
# bookworm-slim => OpenSSL 3.0.x, matches prisma binaryTarget debian-openssl-3.0.x
FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps (full node_modules + generated prisma client) ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# ---------- build (produces .next/standalone) ----------
FROM deps AS build
COPY . .
RUN npm run build

# ---------- runner (slim) ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# Next standalone server + its traced node_modules, static assets, and public/
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Prisma bits needed at runtime: schema + migrations (for `migrate deploy`),
# the CLI, the schema/query engines, and the generated client (overlay onto the
# standalone node_modules so the trace can never miss the engine binary).
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=build /app/node_modules/@prisma/engines-version ./node_modules/@prisma/engines-version
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
  && mkdir -p /app/uploads \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
