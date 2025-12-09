FROM rust:slim-trixie AS builder
WORKDIR /app

ARG TARGETPLATFORM

RUN apt-get update && apt-get install -y clang mold && \
    if [ "${TARGETPLATFORM}" = "linux/arm64" ]; then \
    RUST_TARGET=aarch64-unknown-linux-gnu; \
    else \
    RUST_TARGET=x86_64-unknown-linux-gnu; \
    fi && \
    rustup target add ${RUST_TARGET} && \
    echo "RUST_TARGET=${RUST_TARGET}" > /build.env && \
    mkdir -p .cargo && \
    printf '[target.%s]\nlinker = "clang"\nrustflags = ["-C", "link-arg=-fuse-ld=mold"]\n' "${RUST_TARGET}" > .cargo/config.toml

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/target \
    . /build.env && \
    cargo build --release --target ${RUST_TARGET} && \
    cp "target/${RUST_TARGET}/release/server" "server"

FROM debian:trixie-slim
WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
