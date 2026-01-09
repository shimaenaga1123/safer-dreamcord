FROM rust:slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y musl-tools mold \
    && rm -rf /var/lib/apt/lists/*
RUN rustup target add $(uname -m)-unknown-linux-musl
COPY Cargo.toml ./
COPY src ./src
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    RUSTFLAGS="-C target-feature=+crt-static -C linker=musl-gcc -C link-arg=-fuse-ld=mold" \
    cargo build --release --target $(uname -m)-unknown-linux-musl && \
    cp target/$(uname -m)-unknown-linux-musl/release/server /server

FROM scratch
COPY --from=builder /server /server
EXPOSE 8080
ENTRYPOINT ["/server"]