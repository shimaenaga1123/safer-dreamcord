FROM lukemathwalker/cargo-chef:latest-rust-slim-trixie as chef
WORKDIR /app

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
ARG TARGETPLATFORM

RUN apt-get update && apt-get install -y clang lld && \
    if [ "${TARGETPLATFORM}" = "linux/arm64" ]; then \
    RUST_TARGET=aarch64-unknown-linux-gnu; \
    mkdir -p .cargo && \
    printf '[target.aarch64-unknown-linux-gnu]\nlinker = "clang"\nrustflags = ["-C", "link-arg=-fuse-ld=lld"]\n' > .cargo/config.toml; \
    else \
    RUST_TARGET=x86_64-unknown-linux-gnu; \
    fi && \
    rustup target add ${RUST_TARGET} && \
    echo "RUST_TARGET=${RUST_TARGET}" > /build.env

COPY --from=planner /app/recipe.json recipe.json
RUN . /build.env && cargo chef cook --release --recipe-path recipe.json --target ${RUST_TARGET}

COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN . /build.env && \
    cargo build --release --target ${RUST_TARGET} && \
    cp "target/${RUST_TARGET}/release/server" "server"

FROM debian:trixie-slim
WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
