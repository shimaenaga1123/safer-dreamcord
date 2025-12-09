FROM --platform=$BUILDPLATFORM rust:slim-trixie AS builder
WORKDIR /app

COPY --from=tonistiigi/xx:1.2.1 / /

RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    mold \
    && rm -rf /var/lib/apt/lists/*

ARG TARGETPLATFORM
RUN xx-apt-get update && xx-apt-get install -y \
    gcc \
    g++ \
    libc6-dev

COPY Cargo.toml ./
COPY src ./src

ENV RUSTFLAGS="-C linker=xx-clang -C link-arg=-fuse-ld=mold"

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    xx-cargo build --release --target-dir ./target && \
    cp target/$(xx-cargo --print-target-triple)/release/server /server

FROM debian:trixie-slim
WORKDIR /app

COPY --from=builder /server .

EXPOSE 8080

CMD ["./server"]