FROM node:18-alpine AS frontend-builder
WORKDIR /usr/src/app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM rust:alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /usr/src/app

COPY rust/Cargo.toml rust/Cargo.lock ./
# Create a dummy main to cache built dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Now copy the actual source and compile
COPY rust/src ./src
RUN touch src/main.rs && cargo build --release

FROM alpine:latest

WORKDIR /app

COPY --from=builder /usr/src/app/target/release/jiosaavn-api-rust ./jiosaavn-api-rust
COPY --from=frontend-builder /usr/src/app/dist ./dist

EXPOSE 3000

ENV PORT=3000
ENV RUST_LOG=info

CMD ["./jiosaavn-api-rust"]
