FROM rust:slim-trixie AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends mold && \
    rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/target \
    mold -run cargo build --release && \
    cp target/release/server /server

FROM debian:trixie-slim
WORKDIR /app

COPY --from=builder /server .

EXPOSE 8080

CMD ["./server"]