FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
  NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts --filter "@mycogni/web..."
ARG RAILWAY_GIT_COMMIT_SHA
RUN pnpm --filter "@mycogni/web..." run build

FROM node:24-slim AS runtime
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
RUN mkdir -p apps/web/node_modules/@ip-location-db \
  && ln -s /app/node_modules/.pnpm/@ip-location-db+geo-whois-asn-country-mmdb@*/node_modules/@ip-location-db/geo-whois-asn-country-mmdb \
  apps/web/node_modules/@ip-location-db/geo-whois-asn-country-mmdb \
  && test -f apps/web/node_modules/@ip-location-db/geo-whois-asn-country-mmdb/geo-whois-asn-country.mmdb
USER node
CMD ["node", "apps/web/server.js"]
