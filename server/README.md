# Safer Dreamcord Server

Dreamhack 문제 풀이 정보를 받아 Discord 웹훅으로 전송하는 프록시 서버입니다.

## 기능

- Dreamhack API에서 문제 및 사용자 정보 조회
- 퍼포먼스 점수 (pp) 계산
- Discord Embed 메시지 생성 및 전송
- 테스트 모드 지원 (실제 전송 없이 메시지 미리보기)

## 실행 방법

### Docker Compose (권장)

1. 루트 디렉토리에 `.env` 파일 생성:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
```

2. 실행:

```bash
docker compose up -d
```

### Docker로 수동 실행

```bash
# GitHub Container Registry에서 이미지 실행
docker run -d \
  -e DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... \
  -p 8080:8080 \
  ghcr.io/shimaenaga1123/safer-dreamcord:latest
```

### 직접 빌드

```bash
# 의존성 설치 및 빌드
cargo build --release

# 환경 변수 설정
export DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# 실행
./target/release/server
```

## 환경 변수

| 변수명                | 설명             |
| --------------------- | ---------------- |
| `DISCORD_WEBHOOK_URL` | Discord 웹훅 URL |

## API

### POST /

문제 풀이 정보를 받아 Discord로 전송합니다.

**요청 본문:**

```json
{
  "challenge_id": 123,
  "solver": 456,
  "test": false
}
```

| 필드           | 타입   | 설명              |
| -------------- | ------ | ----------------- |
| `challenge_id` | `u32`  | Dreamhack 문제 ID |
| `solver`       | `u32`  | 풀이자 사용자 ID  |
| `test`         | `bool` | 테스트 모드 여부  |

**응답:**

- `test: false` → `200 OK` (본문 없음)
- `test: true` → `200 OK` + Discord 메시지 JSON

**예시:**

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"challenge_id": 1, "solver": 12345, "test": true}'
```

## 프로젝트 구조

```
server/
├── src/
│   ├── main.rs              # 진입점 및 라우팅
│   └── modules/
│       ├── mod.rs           # 모듈 선언
│       ├── dmessage.rs      # Discord 메시지 생성/전송
│       ├── logger.rs        # 커스텀 로거
│       ├── performance.rs   # pp 계산 알고리즘
│       ├── request.rs       # Dreamhack API 요청
│       └── types.rs         # 타입 정의
├── Cargo.toml
├── Dockerfile
└── README.md
```

## 기술 스택

- **언어**: Rust
- **웹 프레임워크**: Actix-web
- **HTTP 클라이언트**: reqwest
- **HTML 파싱**: dom_query
- **로깅**: tracing

## 퍼포먼스 점수 (pp) 계산

문제의 객관적 난이도를 나타내는 지표입니다.

```rust
let base_pp = 10.0 * 1.5 * difficulty;
let solve_rate = cnt_solvers / hitcount * 100.0;
let pp_multiplier1 = 10.0 / solve_rate;
let pp_multiplier2 = 2.0 / log10(max(100, 100 + cnt_solvers));
let pp_multiplier3 = 3.0 / log10(max(1000, 100 + hitcount));
let pp = base_pp * pp_multiplier1 * pp_multiplier2 * pp_multiplier3;
```

**영향 요소:**

- 문제 난이도 (LEVEL)
- 풀이율 (solvers / viewers)
- 총 풀이자 수
- 총 조회수

## Docker 빌드

```bash
# 로컬에서 이미지 빌드
docker build -t safer-dreamcord-server .

# 멀티 플랫폼 빌드 (linux/amd64, linux/arm64)
docker buildx build --platform linux/amd64,linux/arm64 -t safer-dreamcord-server .
```

## 개발

```bash
# 개발 모드 실행 (핫 리로드)
cargo watch -x run

# 린트
cargo clippy

# 포맷팅
cargo fmt
```
