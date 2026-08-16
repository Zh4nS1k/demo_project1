# ─────────────────────────────────────────────────────────────
# Coffee Drinker — Express API
# Build:  docker build -t coffee-server ./server
# Run:    docker run -p 3000:3000 -e JWT_SECRET=... -e MONGODB_URI=... coffee-server
# (or just use docker compose from the repo root)
# ─────────────────────────────────────────────────────────────
FROM node:24-alpine

WORKDIR /app

# Install prod dependencies first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source (tests/ and .env are excluded by .dockerignore)
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/ > /dev/null || exit 1

CMD ["node", "src/server.js"]
