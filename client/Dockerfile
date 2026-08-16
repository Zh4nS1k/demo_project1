# ─────────────────────────────────────────────────────────────
# Coffee Drinker — Next.js client (multi-stage, standalone output)
# Build:  docker build -t coffee-client ./client
# Run:    docker run -p 3001:3001 -e NEXT_PUBLIC_API_URL=http://server:3000 coffee-client
#
# Stage 1 builds the app; stage 2 ships only the standalone server
# (~150MB vs ~1GB with full node_modules). Because next.config.js sets
# outputFileTracingRoot to the repo root, the standalone tree mirrors
# that layout: .next/standalone/client/server.js
# ─────────────────────────────────────────────────────────────

# ── Stage 1: builder ──
FROM node:24-alpine AS builder

# Recreate the repo layout the tracing root expects
WORKDIR /repo
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY client ./client
WORKDIR /repo/client

ENV NEXT_TELEMETRY_DISABLED=1
# The rewrite target (/api/* → backend) is baked in at BUILD time by Next.js —
# changing it later requires a rebuild. Default keeps local non-Docker dev working;
# docker-compose.yml overrides it to http://server:3000.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ── Stage 2: runtime ──
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0

COPY --from=builder /repo/client/.next/standalone ./
COPY --from=builder /repo/client/.next/static ./client/.next/static
COPY --from=builder /repo/client/public ./client/public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/ > /dev/null || exit 1

CMD ["node", "client/server.js"]
