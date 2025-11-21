# dreamcord-server

1. Discord에서 웹훅을 생성합니다.

<img src="https://github.com/user-attachments/assets/3472372e-1c61-46e2-b178-709afab00e63" width=600>
    
1. `bun install`로 Dependancy 설치
2. `bun run deploy`로 Cloudflare Worker 배포
3. `bun run set-webhook`로 Discord Webhook URL 설정

배포시 표시되는 URL 또는 Cloudflare Dashboard에서 연결한 URL을 Chrome 확장에 연결하면 됩니다.
