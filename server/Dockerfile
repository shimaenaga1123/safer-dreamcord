FROM rust:alpine AS builder
WORKDIR /app

RUN apk update && apk add --no-cache mold \
    && rm -rf /var/cache/apk/*

COPY Cargo.toml ./
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    mold -run cargo build --release --target-dir ./target && \
    cp target/$(cargo --print-target-triple)/release/server /server

FROM alpine:latest
WORKDIR /app

COPY --from=builder /server .

EXPOSE 8080

CMD ["./server"]