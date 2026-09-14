FROM node:26-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY tsconfig.base.json ./
RUN npm ci
RUN npm run build --workspace @timur/runtime && npm run build --workspace @timur/worker
RUN npm prune --omit=dev

FROM node:26-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages/runtime ./packages/runtime
COPY --from=build --chown=node:node /app/apps/worker ./apps/worker
USER node

CMD ["node", "apps/worker/dist/worker.js"]
