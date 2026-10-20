# build from the repo root: docker build -f frontend/Dockerfile .
FROM oven/bun:1.4.3 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ frontend/
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
