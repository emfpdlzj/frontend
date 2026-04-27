# BridgeWork Frontend

소셜 로그인(카카오/네이버)과 온보딩 프로필 입력을 담당하는 React 앱입니다.

## 실행

1. 환경변수 설정
```bash
cat <<'EOF' > .env.local
REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
REACT_APP_KAKAO_CLIENT_ID=0d5fffe82670b3aba1f9c1c2e551dbee
REACT_APP_KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback
REACT_APP_NAVER_CLIENT_ID=sk1Y_ivVnHWKz59glY0x
REACT_APP_NAVER_REDIRECT_URI=http://localhost:3000/auth/naver/callback
EOF
```

2. 패키지 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm start
```

## 주요 라우트

- `/login`: 소셜 로그인 시작
- `/auth/kakao/callback`: 카카오 콜백
- `/auth/naver/callback`: 네이버 콜백
- `/signup`: 최초 로그인 추가정보 입력
- `/onboarding`: 온보딩 프로필 작성/수정

## 보안 처리

- 네이버 OAuth `state` 생성/검증으로 CSRF 위험 완화
- 액세스 토큰 만료 시 리프레시 토큰 기반 자동 재발급
- 로그아웃 시 토큰/가입 세션 즉시 삭제
