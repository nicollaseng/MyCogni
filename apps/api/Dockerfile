FROM node:24-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts --filter "@mycogni/api..."
RUN pnpm --filter "@mycogni/api..." run build
RUN rm -rf node_modules apps/*/node_modules packages/*/node_modules \
  && pnpm install --frozen-lockfile --ignore-scripts --prod --filter "@mycogni/api..."

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
USER node
CMD ["node", "apps/api/dist/server.js"]
