# Build step
FROM node:22-alpine AS build

USER node

WORKDIR /usr/src/app

COPY --chown=node:node package.json .
COPY --chown=node:node package-lock.json .

RUN npm install

COPY --chown=node:node . .

RUN npx prisma generate

RUN npm run build

# Prod image
FROM node:22-alpine AS final

RUN apk add --update --no-cache openssh-client

USER node

WORKDIR /usr/src/app

COPY --from=build --chown=node:node /usr/src/app/.output .
COPY --from=build --chown=node:node /usr/src/app/kubernetes ./kubernetes

EXPOSE 3000

CMD ["node", "server/index.mjs"]