FROM rust:slim-trixie as builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./

RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

COPY src ./src

RUN touch src/main.rs && \
    cargo build --release

FROM debian:trixie-slim

WORKDIR /app

COPY --from=builder /app/target/release/server /app/server

EXPOSE 8080

CMD ["./server"]
