FROM node:24-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI="true"
RUN corepack enable

COPY . /app
WORKDIR /app

RUN pnpm install --frozen-lockfile
RUN pnpm build --filter provisioner-cleanup
RUN pnpm deploy --filter provisioner-cleanup --prod /deploy

FROM node:24-alpine

COPY --from=build /deploy /app
WORKDIR /app

USER node
CMD ["node", "dist/index.js"]
