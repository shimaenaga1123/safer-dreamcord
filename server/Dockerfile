FROM --platform=$BUILDPLATFORM shimaenaga1123/alpine-rust-zigbuild:latest AS builder

ARG TARGETARCH
WORKDIR /app

COPY Cargo.toml ./
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    case "$TARGETARCH" in \
      "amd64") RUST_TARGET="x86_64-unknown-linux-musl" ;; \
      "arm64") RUST_TARGET="aarch64-unknown-linux-musl" ;; \
      *) exit 1 ;; \
    esac && \
    cargo zigbuild --release --target $RUST_TARGET && \
    cp target/$RUST_TARGET/release/server /server

FROM scratch
COPY --from=builder /server /server
EXPOSE 8080
ENTRYPOINT ["/server"]