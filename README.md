# BridgeWork Frontend

소셜 로그인(카카오/네이버)과 온보딩 프로필 입력을 담당하는 React 앱입니다.

## 실행



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
