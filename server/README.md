# dreamcord-server

## How to Run

1. Discord에서 웹훅을 생성합니다.
2. Docker를 활용해서 실행합니다.

```sh
   docker pull ghcr.io/shimaenaga1123/safer-dreamcord:latest
   docker run -e DISCORD_WEBHOOK_URL={위에서 생성한 웹훅} -p 8080:8080 ghcr.io/shimaenaga1123/safer-dreamcord:latest
```
