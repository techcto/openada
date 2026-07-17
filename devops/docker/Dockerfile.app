FROM node:24-bookworm-slim AS base

ARG APP_ENV
ENV NEXT_PUBLIC_APP_ENV=${APP_ENV}
ENV NEXT_PUBLIC_APP_NAME=OpenADA
ENV NEXT_PUBLIC_APP_BASE_PATH=

WORKDIR /app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
RUN npm ci

COPY tsconfig.json ./tsconfig.json
COPY next.config.ts ./next.config.ts
COPY next-env.d.ts ./next-env.d.ts
COPY src/pages/index.openada.tsx ./src/pages/index.openada.tsx
COPY src/pages/scan.openada.tsx ./src/pages/scan.openada.tsx
COPY src/pages/report.openada.tsx ./src/pages/report.openada.tsx
COPY src/pages/_app.openada.tsx ./src/pages/_app.openada.tsx
COPY src/components/OpenAdaShell.tsx ./src/components/OpenAdaShell.tsx
COPY src/pages/docs/index.openada.tsx ./src/pages/docs/index.openada.tsx
COPY src/pages/docs/privacy.openada.tsx ./src/pages/docs/privacy.openada.tsx
COPY src/pages/docs/terms.openada.tsx ./src/pages/docs/terms.openada.tsx
COPY src/pages/docs/mcp.openada.tsx ./src/pages/docs/mcp.openada.tsx
COPY src/pages/directory/index.openada.tsx ./src/pages/directory/index.openada.tsx
COPY src/pages/api-reference/index.openada.tsx ./src/pages/api-reference/index.openada.tsx
COPY src/sass/app.scss ./src/sass/app.scss
COPY devops/widget/openada-widget.js ./public/openada-widget.js
COPY public/openada-logo.svg ./public/openada-logo.svg
COPY public/openada-app-icon.svg ./public/openada-app-icon.svg
COPY public/openada-app-icon-dark.svg ./public/openada-app-icon-dark.svg
COPY public/openada-directory-icon.png ./public/openada-directory-icon.png
COPY public/openada-composer-icon.png ./public/openada-composer-icon.png
COPY public/openadademo1.mp4 ./public/openadademo1.mp4

COPY ./devops/docker/entrypoint/app-docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

FROM base AS dev
EXPOSE 3000
CMD ["/usr/local/bin/docker-entrypoint.sh", "dev"]

FROM base AS builder
RUN npm run build

FROM node:24-bookworm-slim AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=base /usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
CMD ["/usr/local/bin/docker-entrypoint.sh", "prod"]
