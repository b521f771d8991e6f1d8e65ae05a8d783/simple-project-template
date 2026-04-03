FROM docker.io/oven/bun:alpine AS build
RUN apk update && apk add alpine-sdk npm git
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache --mount=type=cache,target=/app/node_modules bun install && bun run build:node

FROM docker.io/node:alpine
VOLUME ["/data"]
EXPOSE 8081
COPY --from=build /app/dist /app
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8081/api/healthcheck || exit 1
CMD ["node", "/app/main.js"]
