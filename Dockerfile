FROM rust:alpine AS builder

RUN apk add --no-cache musl-dev curl

WORKDIR /usr/src/app

COPY rust/Cargo.toml rust/Cargo.lock ./
# Create a dummy main to cache built dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Now copy the actual source and compile
COPY rust/src ./src
RUN touch src/main.rs && cargo build --release

FROM alpine:latest

RUN apk add --no-cache tzdata

WORKDIR /app

COPY --from=builder /usr/src/app/target/release/hqaudio-api-rust ./hqaudio-api-rust

EXPOSE 3000

ENV PORT=3000
ENV RUST_LOG=info

CMD ["./hqaudio-api-rust"]
