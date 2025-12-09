# Safer Dreamcord Extension

Dreamhack 문제 풀이를 감지하여 서버로 전송하는 브라우저 확장 프로그램입니다.

## 기능

- Dreamhack 문제 풀이 API 호출 감지
- 설정된 서버 URL로 풀이 정보 전송
- 다중 웹훅 서버 지원
- 테스트 모드 지원

## 설치

### 스토어에서 설치

| 브라우저 | 링크                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| Chrome   | [Chrome 웹 스토어](https://chromewebstore.google.com/detail/safer-dreamcord/nleeioeanmgjaogedfdlpgamjoimlbnl) |
| Firefox  | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/safer-dreamcord/)                                  |

### 개발용 설치

1. 확장 프로그램 빌드
2. 브라우저에서 `chrome://extensions` (Chrome) 또는 `about:debugging` (Firefox) 접속
3. 개발자 모드 활성화
4. `dist` 폴더 로드

## 개발

### 요구 사항

- [Bun](https://bun.sh/) (최신 버전)

### 설치 및 빌드

```bash
# 의존성 설치
bun install

# 빌드
bun run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 프로젝트 구조

```
extension/
├── src/
│   ├── background/
│   │   └── background.js   # 백그라운드 서비스 워커
│   ├── module/
│   │   └── dwebhook.js     # 웹훅 전송 모듈
│   └── popup/
│       ├── popup.html      # 팝업 UI
│       ├── popup.css       # 팝업 스타일
│       └── popup.js        # 팝업 로직
├── images/                  # 아이콘 이미지
├── manifest.json            # 확장 프로그램 매니페스트
├── build.js                 # 빌드 스크립트
└── package.json
```

### 기술 스택

- **번들러**: [Rolldown](https://rolldown.rs/)
- **런타임**: [Bun](https://bun.sh/)
- **UI**: jQuery
- **HTML 파싱**: Cheerio

## 작동 방식

1. `webRequest` API로 Dreamhack의 문제 인증 API 호출 감지
2. 인증 성공 시 (HTTP 2xx) Challenge ID 추출
3. 저장된 서버 URL들로 풀이 정보 POST 요청 전송

### 요청 형식

```json
{
  "challenge_id": 123,
  "solver": 456,
  "test": false
}
```

## 권한

| 권한                             | 용도                       |
| -------------------------------- | -------------------------- |
| `storage`                        | 웹훅 URL 및 사용자 ID 저장 |
| `webRequest`                     | Dreamhack API 호출 감지    |
| `host_permissions: dreamhack.io` | Dreamhack 사이트 접근      |

## 빌드 산출물

`bun run build` 실행 시 `dist/` 디렉토리 구조:

```
dist/
├── js/
│   ├── background.js
│   └── popup.js
├── images/
├── manifest.json
├── popup.html
└── popup.css
```
