## 1. 서비스 목표

장애인 구직자에게 직무 적합성, 접근성, 지원 인프라를 반영한 실제 근속 가능한 일자리를 추천한다.

## 2. 시스템 역할 분리

### 1. Java Spring Backend
- 인증/회원/프로필/~~OCR/~~공공데이터 동기화/API 게이트웨이
- FastAPI 요청/응답 중계
- FastAPI에는 사용자 선택 프로필만 전달

### 2. FastAPI
- 스코어링 계산, 추천 순위 산출, LLM 설명 생성
- PostgreSQL 직접 조회(공고/공공데이터)

## 3. 수집 및 가공 데이터

1. 한국장애인고용공단_장애인 구인 실시간 현황  
   https://www.data.go.kr/data/15117692/openapi.do  
   + 지오코딩(네이버 NCP Geocoding API)

2. 한국장애인고용공단_장애인 고용직무분류  
   https://www.data.go.kr/data/15157071/openapi.do

3. 한국장애인고용공단_장애인 표준사업장 실시간 조회  
   https://www.data.go.kr/data/15119304/openapi.do

4. 한국장애인고용공단_근로지원인 수행기관 실시간 정보  
   https://www.data.go.kr/data/15131282/openapi.do  
   + 지오코딩(네이버 NCP Geocoding API)

5. 한국철도공사_편의시설정보  
   https://www.data.go.kr/data/15125774/openapi.do#/API%20%EB%AA%A9%EB%A1%9D/weekPersonFacilities

6. 서울교통공사_교통약자이용정보(휠체어리프트)  
   https://www.data.go.kr/data/15143843/openapi.do#/

7. 전국교통약자이동지원센터정보표준데이터  
   https://www.data.go.kr/tcs/dss/selectStdDataDetailView.do?publicDataPk=15028207

8. 국가철도공단_역사별 휠체어리프트 위치  
   https://data.kric.go.kr/rips/M_01_02/detail.do?id=205&service=vulnerableUserInfo&operation=stationWheelchairLiftLocation

9. 역사별 휠체어리프트 이동동선  
   https://data.kric.go.kr/rips/M_01_02/detail.do?id=209&service=vulnerableUserInfo&operation=stationWheelchairLiftMovement

10. 서울교통공사_휠체어리프트 설치현황  
    https://www.data.go.kr/data/15044262/fileData.do

11. 서울시 지하철 출입구 리프트 위치정보  
    https://data.seoul.go.kr/dataList/OA-21211/S/1/datasetView.do

12. 서울특별시_자치구별 도보 네트워크 공간정보  
    https://data.seoul.go.kr/dataList/OA-21208/S/1/datasetView.do

13. 국토교통부_전국 버스정류장 위치정보  
    https://www.data.go.kr/data/15067528/fileData.do#tab-layer-openapi

14. 전국신호등표준데이터  
    https://www.data.go.kr/data/15028198/standard.do#

15. 전국횡단보도표준데이터  
    https://www.data.go.kr/data/15028201/standard.do

16. 서울교통공사_휠체어경사로 설치 현황  
    https://data.seoul.go.kr/dataList/OA-13116/S/1/datasetView.do

17. 서울시 저상버스 도입 노선 및 노선별 보유율  
    https://data.seoul.go.kr/dataList/OA-22229/F/1/datasetView.do

18. 한국고용정보원_직업훈련_국민내일배움카드 훈련과정  
    https://www.work24.go.kr/cm/e/a/0110/selectOpenApiSvcInfo.do?apiSvcId=&upprApiSvcId=&fullApiSvcId=000000000000000000000000000004

19. 한국고용정보원_구직자취업역량 강화프로그램  
    https://www.work24.go.kr/cm/e/a/0110/selectOpenApiSvcInfo.do?apiSvcId=&upprApiSvcId=&fullApiSvcId=000000000000000000000000000098

## 4. 입력 정의

### 4-1. 가입 완료 입력(온보딩)

- 가입 완료 시 기본 프로필 1개를 반드시 생성한다.
- 또한 온보딩(가입 완료에 필요한 추가 정보 기입)은 4-2 프로필 입력에서의 필수 입력들만 진행.

### 4-2. 프로필 입력

가입 이탈을 줄이기 위해 스코어링 필수 최소 항목만 필수 유지. 스코어링 품질에 강한 영향이 있는 항목만 필수로 유지.

- 프로필은 사용자당 최대 3개
- 기본 프로필 1개는 필수 보유(삭제 불가, 기본 변경 가능)
- 내정보에서 등록/수정/삭제

#### 필수 입력

- 기본
  - 이름
  - 성별
  - 연락처
  - 이메일
  - 생년월일
  - 거주지 상세 주소

- 학력/경력
  - 최종 학력(고졸 이하/고졸/전문대졸/대졸/석사/박사/기타)
  - 졸업 상태(졸업/졸업예정/재학/수료/중퇴/기타)
  - 주요 경력(없으면 신입 표기)

- 직무
  - 지원 직무
  - 보유 기술/역량

- 장애
  - 장애 유형(지체장애/뇌병변장애/시각장애/청각장애/언어장애/지적장애/자폐성장애/정신장애/신장장애/심장장애/호흡기장애/간장애/안면장애/장루·요루장애/뇌전증장애/기타)
  - 장애 정도(중증/중등도/경증)
  - 장애인 등록 여부

- 근무조건
  - 가능한 고용형태(정규직/계약직/무기계약직/시간제/일용직/인턴/파견·용역/재택·원격)

- 소개
  - 자기소개

#### 선택 입력

- 비상 연락처
- 전공, 세부 경력, 프로젝트, 공백 사유
- 자격증, 포트폴리오 URL/파일, 수상, 교육 이수
- 상세 장애 설명, 보조기기, 필요 지원사항
- 근무 가능 시점(즉시/2주 이내/1개월 이내/협의 가능)
- 희망 연봉
- 시간 선호(주간/오전/오후/야간/탄력근무/협의 가능)
- 재택 여부
- 이동 가능 범위
- 지원 동기, 직무 적합성 설명, 커리어 목표, 강점/약점
- 병역(군필/면제/해당없음/복무중)
- 국가유공자 여부
- SNS/개인 웹사이트

### 4-3. 화면 필터 입력 (기능2/3 공통, 저장 없음)

프론트에서 매 요청마다 선택. 모든 항목은 선택형(옵션)이며 중복 가능

- 희망 직무  
  (선택 목록은 Spring이 매일 스케줄러로 수집한 `한국장애인고용공단_장애인 고용직무분류` DB 데이터를 트리(대분류 > 중분류 > 소분류)로 별도 API를 통해 제공)

- 희망 근무지역(전국 17개 시/도)
  - 서울
  - 부산
  - 대구
  - 인천
  - 광주
  - 대전
  - 울산
  - 세종
  - 경기
  - 강원
  - 충북
  - 충남
  - 전북
  - 전남
  - 경북
  - 경남
  - 제주

- 고용형태
  - 정규직
  - 계약직
  - 무기계약직
  - 시간제
  - 일용직
  - 인턴
  - 파견/용역
  - 재택/원격

- 급여 방식
  - 월급
  - 연봉
  - 시급
  - 일급
  - 건별/성과급
  - 회사 내규에 따름
  - 면접 후 협의

## 5. 기능 정의

### 기능 0. 로그인/회원가입

- 카카오/네이버 로그인
- 최초 로그인 시 기본 프로필 필수 항목 입력 완료 후 가입 완료

### 기능 0-1. 홈/공지사항/관리자

- 홈은 현재 인기 공고와 공개 공지사항 요약을 보여준다.
- 공지사항 목록/상세는 비로그인 사용자도 읽을 수 있다.
- 관리자 계정은 일반 사용자 기능 접근을 막고 관리자 공지 관리 화면으로 이동한다.
- 관리자 공지 관리에서는 공지 생성/수정/삭제, 공개 여부, 상단 고정을 처리한다.

### 기능 1. 프로필 생성/관리

- 직접 입력 저장
- 또는 포트폴리오로 생성하기(2차)
  - 입력할 때 포트폴리오 파일 업로드 시 Spring OCR + LLM 기반 프로필 초안 생성 가능
- 프로필 최대 3개 관리
- 기본 프로필 지정/변경

### 기능 2. 퀵 맞춤 일자리 추천 (최신 + 직무 적합)

- 홈이 아닌 별도 `/:locale/quick-jobs` 페이지에서 제공한다.
- 퀵공고 페이지에서 AI 직무 적합도 ON 상태로 검색할 때 Spring Backend가 추천 계산을 비동기로 시작한다.
- AI ON 추천 결과는 현재 유효 공고 전체를 한 번에 요청한다.
- 추천 task가 `PROCESSING`이면 프론트는 `/recommend/tasks/{requestId}`를 polling한다.
- `PROCESSING` 응답에 부분 `result`가 있으면 완료 전이라도 1개씩 목록에 반영한다.
- 계산 중에는 상단 로딩바에 현재 계산 진행률을 표시한다.
- 캐시된 추천 결과는 애니메이션 없이 즉시 반영한다.

#### 1. AI 직무 적합도 토글 ON

- 프론트에서 프로필 1개 선택(기본 프로필 최상단 노출)
- Spring → FastAPI: 사용자 선택 프로필만 전달
- FastAPI: DB 공고를 최신순 조회 후 직무 적합도만 계산
- FastAPI → Spring: 공고별 직무 적합도 포함 결과 반환
- Spring → 프론트: 비동기 task 상태와 부분/완료 결과 전달
- 프론트: 화면 필터 적용, 일정 점수 이상 공고 강조

#### 2. AI 직무 적합도 토글 OFF

- FastAPI 호출 없음
- Spring이 DB 공고 최신순 반환
- 프론트가 화면 필터 적용
- 서버 페이지네이션과 프론트 무한스크롤을 사용

### 기능 3. 지역 접근성 지도 추천 (종합 점수)

지도상에 공고 + 기업정보를 나타내며 추가로 근로지원인 수행기관 마커를 함께 표시(백엔드 API)

(근로지원인 수행기관 데이터는 점수 미반영, 지도 레이어 전용)

#### 1. AI 스코어링 토글 ON

- 프론트에서 프로필 1개 선택
- Spring → FastAPI: 사용자 선택 프로필만 전달
- FastAPI: DB 공고/공공데이터 직접 조회, 동일 비중 종합 점수 계산
- FastAPI → Spring: 항목별 점수 + 총점 + 내림차순 결과 반환
- Spring → 프론트: 비동기 task 상태와 부분/완료 결과 전달
- 프론트: 화면 필터 적용
- 현재 유효 공고 전체를 계산하고 부분 결과를 1개씩 반영한다.
- 계산 중에는 상단 로딩바에 현재 계산 진행률을 표시한다.
- 캐시된 추천 결과는 즉시 반영한다.

#### 2. AI 스코어링 토글 OFF

- FastAPI 호출 없음
- Spring이 DB 공고 반환
- 프론트가 화면 필터 적용
- 서버 페이지네이션과 프론트 무한스크롤을 사용

### 2차(현재 미포함)

#### 기능 4. 지원 인프라/체크리스트 안내(추가)

- 공고 상세에서 지원기관/편의정보/체크리스트 제공

#### 기능 5. 훈련 연계 추천(추가)

- 직무 격차 기반 훈련/프로그램 추천

## 6. FastAPI 스코어링 정의

### 6-1. 기능별 적용

- 기능2: 직무 적합도만 적용
- 기능3: 6개 항목 동일 비중 종합 점수 적용

### 6-2. 점수 항목별 사용 데이터/컬럼/프로필 항목

### 6-2. 점수 항목별 사용 데이터/컬럼/프로필 항목

| 점수 항목 | 공공데이터 | 사용 컬럼 | 사용자 프로필 사용 항목 |
| --- | --- | --- | --- |
| 직무 적합도 | 한국장애인고용공단_장애인 구인 실시간 현황<br>https://www.data.go.kr/data/15117692/openapi.do | `jobNm` 모집직종<br>`reqCareer` 요구경력<br>`reqEduc` 요구학력<br>`reqMajor` 요구전공<br>`reqLicens` 요구자격증<br>`envHandWork` 손작업<br>`envLiftPower` 드는힘<br>`envStndWalk` 서거나 걷기 | 필수: 지원 직무, 보유 기술/역량, 최종 학력, 주요 경력<br><br>선택: 전공, 자격증, 직무 적합성 설명 |
| 근무조건 적합도 | 한국장애인고용공단_장애인 구인 실시간 현황<br>https://www.data.go.kr/data/15117692/openapi.do | `empType` 고용형태<br>`enterType` 입사형태<br>`salaryType` 임금형태<br>`salary` 임금<br>`termDate` 모집기간 | 필수: 가능한 고용형태<br><br>선택: 근무 가능 시점, 희망 연봉, 시간 선호, 재택 여부 |
| 장애 지원 적합도 | 한국장애인고용공단_장애인 표준사업장 실시간 조회<br>https://www.data.go.kr/data/15119304/openapi.do<br><br>한국장애인고용공단_장애인 구인 실시간 현황<br>https://www.data.go.kr/data/15117692/openapi.do | 표준사업장: `compName`, `compBizNo`, `compRegNo`, `compTypeNm`, `authDate`, `cancelDate`, `compCert`<br><br>공고: `enterType`, `jobNm`, `compAddr` | 필수: 장애 유형, 장애 정도, 장애인 등록 여부<br><br>선택: 필요 지원사항, 상세 장애 설명, 보조기기 |
| 업무환경 적합도 | 한국장애인고용공단_장애인 구인 실시간 현황<br>https://www.data.go.kr/data/15117692/openapi.do | `envBothHands` 양손사용<br>`envEyesight` 시력<br>`envLstnTalk` 듣고말하기<br>`envHandWork` 손작업<br>`envLiftPower` 드는힘<br>`envStndWalk` 서거나걷기<br>`jobNm` 직종 | 필수: 장애 유형, 장애 정도<br><br>선택: 상세 장애 설명, 보조기기, 이동 가능 범위 |
| 기업 안정성/채용 친화도 | 한국장애인고용공단_장애인 표준사업장 실시간 조회<br>https://www.data.go.kr/data/15119304/openapi.do<br><br>한국장애인고용공단_장애인 구인 실시간 현황<br>https://www.data.go.kr/data/15117692/openapi.do | 표준사업장: `compName`, `compBizNo`, `authDate`, `cancelDate`, `compTypeNm`<br><br>공고: `busplaName`, `compAddr`, `regagnName`, `offerregDt`, `regDt` | 사용 없음 |
| 접근성 요약 점수 | 전국교통약자이동지원센터정보표준데이터<br>국가철도공단_역사별 휠체어리프트 위치<br>역사별 휠체어리프트 이동동선<br>서울교통공사_휠체어리프트 설치현황<br>서울교통공사_교통약자이용정보<br>서울시 지하철 출입구 리프트 위치정보<br>서울특별시_자치구별 도보 네트워크 공간정보<br>국토교통부_전국 버스정류장 위치정보<br>전국신호등표준데이터<br>전국횡단보도표준데이터<br>한국철도공사_편의시설정보<br>서울교통공사_휠체어경사로 설치 현황<br>서울시 저상버스 도입 노선 및 노선별 보유율 | 이동지원센터: `latitude`, `longitude`, `liftVhcleCo`, `slopeVhcleCo`, `insideOpratArea`<br><br>KRIC 위치: `railOprIsttCd`, `lnCd`, `stinCd`, `exitNo`, `dtlLoc`, `runStinFlorFr`, `runStinFlorTo`, `len`, `wd`, `bndWgt`, `LN_NM`, `STIN_NM`<br><br>KRIC 동선: `mvPathDvNm`, `mvDst`, `mvContDtl`, `LN_NM`, `STIN_NM`<br><br>교통약자이용정보: `stnNm`, `lineNm`, `vcntEntrcNo`, `bgngFlr`, `endFlr`, `limitWht`, `oprtngSitu`<br><br>도보네트워크: `LNKG_LEN`, `CRSWK`, `OVRP`, `TNL`, `BRG`, `BLDG`<br><br>버스정류장: 정류장명, 위도, 경도, 도시명<br><br>신호등: `latitude`, `longitude`, `fnctngSgngnrYn`, `sondSgngnrYn`, `remndrIdctYn`<br><br>횡단보도: `latitude`, `longitude`, `ftpthLowerYn`, `brllBlckYn`, `sondSgngnrYn`, `tfclghtYn`<br><br>코레일 편의시설: `stn_nm`, `pwdbs_slwy_estnc`, `pwdbs_tolt_estnc`, `whlch_liftt_cnt`<br><br>경사로: 호선, 역명, 구분, 위치<br><br>저상버스: 노선번호, 저상버스 대수, 저상보유율 | 필수: 거주지 상세주소, 장애 유형, 장애 정도<br><br>선택: 이동 가능 범위, 보조기기, 필요 지원사항 |

## 7. 접근성 원칙

- WCAG 2.2 AA 준수
- 스크린리더 라벨 제공
- 키보드 탐색 가능
- 색상 단독 상태표현 금지
- 지도 정보 목록 대체 제공
- 용어 설명 제공
- 구체적 오류 메시지 제공
- 단계형 온보딩

---

# 자바 스프링 API 구현 리스트

## 1. 인증/회원

- `POST /api/v1/auth/social/login`
- `POST /api/v1/auth/social/signup/complete`
- `POST /api/v1/auth/token/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## 2. 프로필 관리(최대 3개, 기본 프로필 1개 필수)

- `GET /api/v1/profiles`
- `POST /api/v1/profiles`
- `GET /api/v1/profiles/{profileId}`
- `PUT /api/v1/profiles/{profileId}`
- `DELETE /api/v1/profiles/{profileId}`
- `PATCH /api/v1/profiles/{profileId}/set-default`

## 3. OCR

- `POST /api/v1/profiles/ocr/extract`

## 4. 화면 필터 옵션

- `GET /api/v1/options/job-categories/tree`  
  설명: 스케줄러가 동기화한 `한국장애인고용공단_장애인 고용직무분류` DB 데이터 기반 트리 반환

- `GET /api/v1/options/regions`
- `GET /api/v1/options/employment-types`
- `GET /api/v1/options/salary-types`

## 5. 게이트웨이

- `POST /api/v1/recommend/quick`
- `POST /api/v1/recommend/map`
- `GET /api/v1/recommend/tasks/{requestId}`
- `POST /api/v1/recommend/explain`

### 동작 규칙

- `aiEnabled=true`: FastAPI 호출
- `aiEnabled=false`: Spring이 DB 공고 반환
- 프론트 필터는 프론트에서 적용
- AI ON 추천은 `PROCESSING`/`COMPLETED`/`FAILED` task 상태를 반환한다.
- `PROCESSING` 응답에 부분 `result`가 있으면 프론트는 즉시 목록에 반영한다.
- 완료 캐시가 있으면 `cached=true`와 `result`를 함께 반환한다.

## 6. 한국장애인고용공단_근로지원인 수행기관 실시간 정보(DB 저장본) 지도 레이어 조회

- `GET /api/v1/map/support-agencies`

## 7. 공지사항

- `GET /api/v1/notices`
- `GET /api/v1/notices/{noticeId}`
- `GET /api/v1/admin/notices`
- `GET /api/v1/admin/notices/{noticeId}`
- `POST /api/v1/admin/notices`
- `PUT /api/v1/admin/notices/{noticeId}`
- `DELETE /api/v1/admin/notices/{noticeId}`

## 8. 공공데이터 동기화/조회

- `POST /api/v1/admin/sync/public-data/run`
- `GET /api/v1/admin/sync/public-data/logs`
- `DELETE /api/v1/admin/sync/public-data/logs`
- `GET /api/v1/admin/sync/public-data/sources`
- `GET /api/v1/admin/public-data/records`
- `GET /api/v1/admin/public-data/records/{recordId}`

---

# FastAPI 구현 리스트

## 1. 스코어링 API

### `POST /api/v1/score/quick`

- 입력: 선택 프로필 1개
- 처리: 최신 공고 조회 + 직무 적합도 계산
- 출력: 공고 + `job_fit_score` + 근거

### `POST /api/v1/score/map`

- 입력: 선택 프로필 1개
- 처리: 공고/공공데이터 조회 + 6항목 동일비중 종합점수 계산
- 출력: 공고 + 항목별 점수 + 총점 + 근거

## 2. 설명 생성 API(선택)

### `POST /api/v1/explain/recommendation`

- 입력: 공고/점수/프로필
- 출력: 추천 사유/주의사항/체크리스트

## 3. 내부 모듈

- 직무 유사도 모듈
- 공고 텍스트 정규화 모듈
- 접근성 점수 집계 모듈
- 동일비중 종합 점수 모듈
- 응답 포맷터(항목별 점수/총점)

## 4. 데이터 접근

- PostgreSQL 직접 접근
- 공고/공공데이터 테이블 조회
- 필요 시 스코어링 결과 캐시 저장 (선택)
