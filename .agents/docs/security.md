# Security Policy

## 토큰 저장 정책

- 액세스 토큰은 메모리에만 보관한다.
- 리프레시 토큰은 현재 Spring Backend 응답 구조에 맞춰 `sessionStorage`에만 임시 보관한다.
- `localStorage`에는 인증 토큰을 저장하지 않는다. 기존 토큰 키가 발견되면 즉시 삭제한다.
- 최종 목표는 Spring Backend가 `HttpOnly`, `Secure`, `SameSite=Lax` 또는 `Strict` 쿠키로 리프레시 토큰을 내려주는 구조이다.

## 환경변수 정책

- 프론트엔드에 노출되는 값은 `REACT_APP_*` 또는 `VITE_*` 공개 변수만 허용한다.
- 서버 시크릿, OAuth client secret, 개인 API 키, JWT, 토큰은 프론트엔드 환경변수에 넣지 않는다.
- 개발 API URL은 `.env.development`, 운영 API URL은 `.env.production`으로 분리한다.
- Vite 설정은 민감해 보이는 클라이언트 환경변수 이름을 감지하면 빌드를 중단한다.

## 로그 정책

- `console.*`를 직접 사용하지 않고 `createLogger`를 사용한다.
- 토큰, Authorization, password, secret, API key, session, JWT 필드는 로그 출력 전에 마스킹한다.
- URL query에 포함된 `code`, `token`, `access_token`, `refresh_token` 값도 마스킹 대상이다.

## XSS 및 업로드 정책

- React 렌더링 기본 이스케이프를 사용하고 `dangerouslySetInnerHTML`을 사용하지 않는다.
- 지도 SDK 컨테이너 초기화처럼 HTML 삽입이 아닌 DOM 정리 목적 외에는 `innerHTML` 직접 조작을 금지한다.
- 파일 업로드는 `accept` 속성만 믿지 않고 확장자와 MIME type을 코드에서 검증한다.

## 관리자 라우트 정책

- 관리자 화면을 추가할 때는 `AuthRoute` 또는 `ProtectedRoute`에 `requiredRole="admin"`을 지정한다.
- 관리자 권한은 `ADMIN` 또는 `ROLE_ADMIN` 역할 값으로 판단한다.
