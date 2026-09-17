# syntax=docker/dockerfile:1
# GlobeGuard storefront (globeguard.ch) - multi-stage build for Next.js "standalone" output.
#
# NEXT_PUBLIC_* values are baked into the client bundle at build time, so pass them as
# build args:
#   docker build \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://globeguard.ch \
#     --build-arg NEXT_PUBLIC_ASSET_HOST=api.globeguard.ch \
#     -t globeguard-frontend .
#   docker run -p 3100:3100 --env-file .env.local globeguard-frontend
#
# Server-only variables (VENDURE_SHOP_API_URL, VENDURE_CHANNEL_TOKEN, REVALIDATION_SECRET)
# are read at runtime and must be supplied to `docker run` / the compose service.

# ---------------------------------------------------------------------------
# 1. Dependencies
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------------------
# 2. Build (next build with output: "standalone", see next.config.ts)
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_NAME=GlobeGuard
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3100
ARG NEXT_PUBLIC_ASSET_HOST=
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ASSET_HOST=$NEXT_PUBLIC_ASSET_HOST \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# 3. Runtime
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0
RUN groupadd --system nextjs && useradd --system --gid nextjs --create-home nextjs
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
USER nextjs
EXPOSE 3100
CMD ["node", "server.js"]
