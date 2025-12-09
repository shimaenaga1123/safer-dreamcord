# Safer Dreamcord

Dreamhack의 문제 풀이 현황을 디스코드 웹훅과 연동하여 알려주는 브라우저 확장 프로그램입니다.

## Preview

<img src="https://github.com/user-attachments/assets/4e73c657-8844-4f42-bd46-87ca18dc5a8f" width=800>

| 항목                       | 설명                                                                         |
| -------------------------- | ---------------------------------------------------------------------------- |
| **해결자 (Solver)**        | 문제를 푼 사람                                                               |
| **난이도 (Difficulty)**    | 문제의 난이도 (LEVEL 1~10)                                                   |
| **태그 (Tag)**             | 문제의 태그 목록                                                             |
| **솔버 수 (Solvers Rate)** | 문제를 본 사람 중 푼 사람의 비율                                             |
| **예상되는 퍼포먼스 (pp)** | 문제의 객관적 난이도 지표 ([수식 보기](./server/src/modules/performance.rs)) |

## 설치 방법

### 1. 브라우저 확장 프로그램 설치

| 브라우저 | 링크                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| Chrome   | [Chrome 웹 스토어](https://chromewebstore.google.com/detail/safer-dreamcord/nleeioeanmgjaogedfdlpgamjoimlbnl) |
| Firefox  | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/safer-dreamcord/)                                  |

### 2. 서버 설정

자체 서버를 운영하려면 [서버 README](./server/README.md)를 참고하세요.

### 3. 확장 프로그램 설정

1. 확장 프로그램 아이콘 클릭
2. 서버 URL 입력 (예: `https://your-server.com`)
3. 저장 후 Dreamhack 문제 풀이 시 자동으로 디스코드에 알림 전송

## 프로젝트 구조

```
safer-dreamcord/
├── extension/          # 브라우저 확장 프로그램 (Chrome, Firefox)
├── server/             # 웹훅 프록시 서버 (Rust + Actix-web)
├── docker-compose.yml  # Docker Compose 설정
└── POLICY.md           # 개인정보처리방침
```

## 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dreamhack  │────▶│  Extension  │────▶│   Server    │
│   (문제풀이)  │     │  (브라우저)   │     │  (프록시)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Discord   │
                                        │   Webhook   │
                                        └─────────────┘
```

웹훅 URL을 클라이언트에 직접 노출하지 않고 서버를 통해 프록시함으로써 웹훅 악용을 방지합니다.

## 개발

각 컴포넌트의 개발 방법은 해당 디렉토리의 README를 참고하세요:

- [Extension 개발 가이드](./extension/README.md)
- [Server 개발 가이드](./server/README.md)

## Credits

이 프로젝트는 [Dreamcord](https://github.com/NeoMaster831/dreamcord)를 기반으로 웹훅의 악용을 막기 위해 서버와 확장으로 분리하여 재설계되었습니다.
