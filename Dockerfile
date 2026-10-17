ARG VERSION=dev

# ---------- BASE ----------
FROM node:22-slim AS base

WORKDIR /usr/src/app

COPY shared ./shared
COPY proto ./proto

COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

COPY services/bot/package*.json ./services/bot/
COPY services/bot/jest.config.js ./services/bot/
COPY services/bot/tsconfig.json ./services/bot/
COPY services/bot/jest.setup.ts ./services/bot/
COPY services/bot/src ./services/bot/src/

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssl \
        protobuf-compiler \
        libprotobuf-dev \
        wget \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate


# ---------- DEPS ----------
FROM base AS deps

RUN pnpm fetch
RUN pnpm install --offline --frozen-lockfile --ignore-scripts

RUN mkdir -p ./services/bot/src/contracts/proto
RUN pnpm --filter bot proto:generate

RUN pnpm --filter @shared/cache-store build
RUN pnpm --filter @shared/state-store build
RUN pnpm --filter @shared/timer build
RUN pnpm --filter @shared/logger build
RUN pnpm --filter @shared/grpc-client-manager build
RUN pnpm --filter @shared/errors proto:generate
RUN pnpm --filter @shared/errors build
RUN pnpm --filter @shared/kafka-manager build
RUN pnpm --filter @shared/pg-boss-manager build

RUN pnpm --filter bot prisma:generate

# ---------- DEV ----------
FROM deps AS dev

COPY services/bot/tsconfig.test.json ./services/bot/

ENV NODE_ENV=development

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 50051

CMD ["pnpm", "--filter", "bot", "dev"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 50051 || exit 1

# ---------- BUILD ----------
FROM deps AS build

ENV NODE_ENV=production

RUN pnpm --filter bot build

RUN pnpm --filter bot deploy /deploy --prod

# ---------- PROD ----------
FROM node:22-slim AS prod

ARG VERSION=dev

ENV APP_VERSION=$VERSION

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssl \
        wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=build /deploy/dist ./dist
COPY --from=build /deploy/node_modules ./node_modules

RUN printf "%s\n" "$VERSION" > VERSION

LABEL org.opencontainers.image.version="$VERSION"

USER node

EXPOSE 50051

CMD ["node", "dist/app.js"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 50051 || exit 1

# ---------- PREDEPLOY ----------
FROM build AS predeploy

ARG VERSION=dev

ENV APP_VERSION=$VERSION

WORKDIR /usr/src/app

RUN printf "%s\n" "$VERSION" > VERSION

LABEL org.opencontainers.image.version="$VERSION"

WORKDIR /usr/src/app/services/bot

CMD ["pnpm", "--filter", "bot", "migrate:deploy"]
