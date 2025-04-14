FROM node:22-slim AS build

WORKDIR /app

# can I include package-lock.json without cross-platform compatibility issues?
COPY package.json ./


RUN npm i

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf ## TODO: make a custom nginx config

EXPOSE 80