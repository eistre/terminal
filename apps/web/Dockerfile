FROM node:24-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI="true"
RUN corepack enable

COPY . /app
WORKDIR /app

RUN pnpm install --frozen-lockfile
RUN pnpm build --filter web

FROM node:24-alpine

COPY --from=build /app/apps/web/.output /app
WORKDIR /app

USER node
EXPOSE 3000
CMD ["node", "server/index.mjs"]
