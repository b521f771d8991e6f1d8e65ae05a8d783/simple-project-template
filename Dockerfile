FROM docker.io/alpine:latest AS development

RUN apk update && apk add nix curl wget alpine-sdk cmake ninja-build cargo rust npm

WORKDIR /workspaces

FROM development AS cache

COPY Cargo.lock Cargo.toml ./
RUN cargo fetch

COPY package.json package-lock.json ./
RUN npm install

COPY . .

FROM cache AS build

RUN cargo build --release
RUN npm run build:web

FROM docker.io/node:alpine

COPY --from=build /workspaces/dist /app
COPY --from=build /workspaces/target/release /app/bin

CMD [ "node", "/app/main.js" ]