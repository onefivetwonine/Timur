FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY tsconfig.base.json ./
RUN npm ci
RUN npm run build --workspace @timur/runtime && npm run build --workspace @timur/api
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages/runtime ./packages/runtime
COPY --from=build --chown=node:node /app/apps/api ./apps/api
USER node
EXPOSE 8000
CMD ["node", "apps/api/dist/server.js"]
