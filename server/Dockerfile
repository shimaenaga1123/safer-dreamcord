FROM --platform=$BUILDPLATFORM rust:alpine AS builder

ARG TARGETARCH
WORKDIR /app

RUN apk add --no-cache zig git musl-dev cargo-zigbuild

RUN case "$TARGETARCH" in \
      "amd64") echo "x86_64-unknown-linux-musl" > /rust_target.txt ;; \
      "arm64") echo "aarch64-unknown-linux-musl" > /rust_target.txt ;; \
      *) exit 1 ;; \
    esac

RUN rustup target add $(cat /rust_target.txt)

COPY Cargo.toml ./
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    TARGET=$(cat /rust_target.txt) && \
    cargo zigbuild --release --target $TARGET && \
    cp target/$TARGET/release/server /server

FROM scratch
COPY --from=builder /server /server
EXPOSE 8080
ENTRYPOINT ["/server"]