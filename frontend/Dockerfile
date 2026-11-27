# build from the repo root: docker build -f frontend/Dockerfile .
FROM rust:1.100-slim AS wasm
RUN rustup target add wasm32-unknown-unknown \
  && cargo install wasm-bindgen-cli --version 0.2.130 --locked  # must match wasm-bindgen in compute/Cargo.toml

WORKDIR /app
COPY compute/ compute/
RUN cargo build --release --locked --manifest-path compute/Cargo.toml --target wasm32-unknown-unknown --lib \
  && wasm-bindgen --target web --out-dir pkg compute/target/wasm32-unknown-unknown/release/cif_compute.wasm

FROM oven/bun:1.4.3 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ frontend/
COPY --from=wasm /app/pkg frontend/src/compute/pkg
RUN bun run build:web

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
