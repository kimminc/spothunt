# SpotHunt Planning Document

> **Summary**: 주최자가 지도 위에 아이템을 배치하고 참여자가 실제 이동하여 GPS로 획득하는 위치 기반 이벤트 웹 앱
>
> **Project**: SpotHunt
> **Version**: 0.1.0
> **Author**: -
> **Date**: 2026-05-16
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 포켓몬GO 방식의 위치 기반 이벤트를 직접 운영하고 싶지만, 별도 IP나 복잡한 인프라 없이 쓸 수 있는 도구가 없다. |
| **Solution** | 주최자가 웹에서 이벤트 방을 만들고 지도 위에 아이템을 배치하면, 참여자는 QR코드/링크로 접속해 실제 장소로 이동하며 아이템을 수집한다. |
| **Function/UX Effect** | 앱 설치 없이 브라우저만으로 참여 가능. 주최자는 이벤트를 5분 안에 설정 가능. 참여자는 실시간 지도에서 아이템 위치를 확인하고 반경 내 진입 시 즉시 획득. |
| **Core Value** | IP 없이 누구나 위치 기반 보물찾기 이벤트를 쉽게 만들고 운영할 수 있는 플랫폼. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 소규모 이벤트(아파트 행사, 어린이 행사, 스탬프 투어)에서 위치 기반 체험을 쉽게 운영할 수단이 없음 |
| **WHO** | 주최자(이벤트 기획자/운영자) + 참여자(스마트폰 사용 가능한 행사 참가자) |
| **RISK** | GPS 정확도(실내 오차 20~50m), 경쟁형 동시 획득 레이스컨디션, 모바일 브라우저 위치 권한 거부 |
| **SUCCESS** | 주최자가 방 만들기~아이템 배치 5분 이내 완료 / 참여자가 앱 설치 없이 QR로 접속 후 아이템 획득 가능 |
| **SCOPE** | MVP: 방 생성·입장·지도 플레이·획득(모두획득형 우선) / v1.1: 경쟁형 / v2: 이미지 업로드, 다각형 구역 |

---

## 1. Overview

### 1.1 Purpose

포켓몬GO 방식의 위치 기반 보물찾기 이벤트를 누구나 직접 만들고 운영할 수 있는 웹 플랫폼.  
주최자는 지도에 아이템을 배치하고, 참여자는 실제 장소로 이동해 GPS로 아이템을 획득한다.

### 1.2 Background

- 아파트 행사, 어린이 이벤트, 스탬프 투어 등 오프라인 체험 행사에서 위치 기반 요소를 추가하고 싶은 수요가 있음
- 기존 포켓몬GO, Ingress 등은 IP 제한으로 커스텀 이벤트 운영 불가
- 앱 설치 없이 QR코드 하나로 참여 가능한 웹 기반 솔루션이 필요

### 1.3 Related Documents

- 시나리오: `프로젝트시나리오.md`
- 기존 계획서: `docs/plan.md`

---

## 2. Scope

### 2.1 In Scope (MVP v1.0)

**주최자**
- [ ] 게스트 방식으로 이벤트 방 생성 (이름, 비밀번호, 모드, 설명)
- [ ] 중심 좌표 + 반경(미터) 방식으로 이벤트 구역 설정
- [ ] 지도 클릭으로 아이템 위치 등록 (이름, 점수, 획득 반경, 기본 이미지 선택)
- [ ] 대기방에서 참여자 실시간 목록 확인
- [ ] 이벤트 시작 / 종료

**참여자**
- [ ] 방 이름 검색 + 비밀번호 + 닉네임으로 입장
- [ ] 대기방에서 이벤트 시작 대기 (자동 전환)
- [ ] 실시간 지도에서 내 위치 + 아이템 위치 확인
- [ ] 아이템 반경 진입 시 획득 버튼 활성화 → 서버 검증 후 획득
- [ ] 실시간 점수판

**이벤트 모드**
- [ ] 모두획득형: 각 참여자가 각 아이템 1회씩 획득
- [ ] 경쟁형: maxWinners 설정, 서버 도착 시간 기준 선착순

### 2.2 Out of Scope (v1.0 미포함)

- 아이템 이미지 직접 업로드 (기본 제공 이미지만)
- 다각형 이벤트 구역 (원형만)
- 회원가입 / 소셜 로그인
- 이벤트 방 수정 (생성 후 아이템 추가/삭제는 대기중 상태에서만)
- 푸시 알림
- 어드민 대시보드

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 주최자가 방 이름, 비밀번호, 이벤트 모드를 입력해 이벤트 방 생성 | High | Pending |
| FR-02 | 카카오맵에서 중심 위치 클릭 + 반경(m) 입력으로 이벤트 구역 설정 | High | Pending |
| FR-03 | 지도 클릭으로 아이템 위치 등록 (이름, 점수, 반경, 기본 이미지 선택) | High | Pending |
| FR-04 | 참여자가 방 이름으로 검색 후 비밀번호 + 닉네임 입력하여 입장 | High | Pending |
| FR-05 | 주최자 대기방: 실시간 참여자 목록, 참여자 1명 이상 시 시작 버튼 활성화 | High | Pending |
| FR-06 | 이벤트 상태가 RUNNING으로 변경 시 참여자 화면 자동 전환 (Realtime) | High | Pending |
| FR-07 | 참여자 지도 화면: 내 실시간 위치, 아이템 마커, 이벤트 구역 표시 | High | Pending |
| FR-08 | GPS로 아이템 반경(기본 20m) 진입 감지 → 획득 버튼 활성화 | High | Pending |
| FR-09 | 서버 측 획득 처리: 위치·이벤트 상태·중복·수량 검증 후 성공/실패 응답 | High | Pending |
| FR-10 | 모두획득형: participant+item 조합 유니크 제약으로 중복 방지 | High | Pending |
| FR-11 | 경쟁형: 서버 도착 시간 기준, DB 트랜잭션으로 선착순 maxWinners 처리 | High | Pending |
| FR-12 | 실시간 점수판: 내 점수, 획득 목록, 전체 랭킹 | Medium | Pending |
| FR-13 | 획득한 아이템은 지도에서 흐리게 표시 / 소진된 아이템은 "획득 완료" 표시 | Medium | Pending |
| FR-14 | 주최자 진행 현황: 참여자 수, 총 아이템 수, 획득된 아이템 수 | Medium | Pending |
| FR-15 | 이벤트 종료 시 참여자 화면 자동 결과 화면 전환 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 아이템 획득 API 응답 < 500ms | 브라우저 네트워크 탭 |
| GPS Accuracy | 야외 스마트폰 기준 오차 < 15m | 실제 테스트 |
| Realtime Latency | 이벤트 상태 변경 전파 < 2초 | Supabase Realtime 모니터링 |
| Compatibility | 최신 Chrome/Safari 모바일 지원 | 직접 테스트 |
| Security | 획득 요청 서버 검증 필수 (클라이언트 우회 불가) | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 주최자가 방 생성 → 아이템 배치까지 5분 이내 완료 가능
- [ ] 참여자가 QR/링크로 접속 → 닉네임 입력 → 대기방 입장까지 1분 이내
- [ ] 이벤트 시작 후 참여자 지도 화면에 아이템 마커 정상 표시
- [ ] 아이템 반경 20m 진입 시 획득 버튼 활성화 (야외 테스트 기준)
- [ ] 경쟁형에서 동시 요청 시 maxWinners 초과 획득 없음
- [ ] 모든 주요 화면 모바일(375px) 레이아웃 정상

### 4.2 Quality Criteria

- [ ] TypeScript 타입 에러 0
- [ ] Lint 에러 0
- [ ] Vercel 빌드 성공
- [ ] Supabase RLS 정책 적용 (획득 API 서버 함수로만 처리)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 실내/GPS 오차로 획득 불가 | High | Medium | 야외 전용 안내, 반경 최소 30m 권장 문구 표시 |
| 경쟁형 동시 요청 레이스컨디션 | High | Medium | Supabase DB Function + FOR UPDATE 락 |
| 모바일 위치 권한 거부 | Medium | Medium | 권한 요청 안내 화면, 허용 안 하면 플레이 불가 명시 |
| Supabase Realtime 연결 끊김 | Medium | Low | 재연결 로직 + 폴링 fallback |
| 카카오맵 API 콜 한도 초과 | Low | Low | 무료 월 300만 콜, MVP 규모에서 초과 불가 |
| 주최자 세션 만료로 방 관리 불가 | Medium | Medium | 게스트 방식 + roomId + hostToken을 localStorage에 저장 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| EventRoom | DB Model | 신규 생성 |
| EventItem | DB Model | 신규 생성 |
| Participant | DB Model | 신규 생성 |
| CollectionRecord | DB Model | 신규 생성 |
| collect_item() | DB Function | 신규 생성 (원자적 획득 처리) |

### 6.2 Current Consumers

신규 프로젝트로 기존 소비자 없음.

### 6.3 Verification

- [ ] 신규 프로젝트 — 기존 코드 영향 없음
- [ ] Supabase RLS 정책으로 클라이언트 직접 INSERT 차단 확인 필요

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| Starter | 정적 사이트, 백엔드 없음 | ☐ |
| **Dynamic** | BaaS 연동, 풀스택 웹앱 | ☑ |
| Enterprise | 마이크로서비스, 대규모 시스템 | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Framework | Next.js 14 (App Router) | 가장 많은 튜토리얼, Vercel 최적화 |
| Backend | Supabase | DB + Realtime + 인증 통합, 서버 코드 불필요 |
| 지도 | 카카오맵 JavaScript SDK | 국내 주소 정확도 최고, 무료 |
| 실시간 | Supabase Realtime | WebSocket 내장, 별도 서버 불필요 |
| 획득 처리 | Supabase DB Function (RPC) | 원자적 트랜잭션, 클라이언트 우회 방지 |
| State Management | Zustand | 경량, 보일러플레이트 최소 |
| 스타일 | Tailwind CSS + shadcn/ui | 초보자도 빠르게 예쁜 UI 구성 |
| 배포 | Vercel | GitHub push → 자동 배포, 무료 |

### 7.3 폴더 구조 (Dynamic Level)

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # 시작 화면 (/)
│   ├── host/
│   │   ├── create/page.tsx     # 방 만들기
│   │   └── [roomId]/
│   │       ├── zone/page.tsx   # 구역 설정
│   │       ├── items/page.tsx  # 아이템 등록
│   │       ├── lobby/page.tsx  # 대기방
│   │       └── live/page.tsx   # 진행 현황
│   └── join/
│       ├── page.tsx            # 방 검색
│       └── [roomId]/
│           ├── page.tsx        # 비밀번호 입력
│           ├── lobby/page.tsx  # 참여자 대기방
│           ├── play/page.tsx   # 지도 플레이
│           └── score/page.tsx  # 점수판
├── components/
│   ├── map/                    # 카카오맵 컴포넌트
│   ├── ui/                     # shadcn/ui 컴포넌트
│   └── game/                   # 게임 전용 컴포넌트
├── features/
│   ├── host/                   # 주최자 비즈니스 로직
│   ├── player/                 # 참여자 비즈니스 로직
│   └── realtime/               # Supabase Realtime 훅
├── lib/
│   ├── supabase.ts             # Supabase 클라이언트
│   ├── kakaomap.ts             # 카카오맵 유틸
│   └── geo.ts                  # 거리 계산 유틸
└── types/
    └── index.ts                # 공통 타입 정의
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

신규 프로젝트 — 모든 컨벤션을 새로 정의.

### 8.2 Conventions to Define

| Category | Rule |
|----------|------|
| 파일 네이밍 | `kebab-case` (컴포넌트 포함) |
| 컴포넌트 | React FC, Named export |
| 타입 | `interface` 우선, `I` 접두사 없음 |
| 환경변수 | 클라이언트: `NEXT_PUBLIC_` 접두사 필수 |
| API 호출 | Supabase client 직접 사용 (별도 레이어 불필요) |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Client |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오맵 JavaScript 앱 키 | Client |

---

## 9. 구현 단계 (Phase Roadmap)

| Phase | 내용 | 예상 소요 |
|-------|------|---------|
| Phase 1 | 프로젝트 세팅 (Next.js + Supabase + Tailwind + 카카오맵) | 1~2일 |
| Phase 2 | DB 스키마 + Supabase 테이블/함수 생성 | 1일 |
| Phase 3 | 방 생성 / 검색 / 입장 / 대기방 (Realtime) | 2~3일 |
| Phase 4 | 카카오맵 연동 + 아이템 배치 (주최자) | 2일 |
| Phase 5 | 지도 플레이 화면 + GPS 위치 추적 + 획득 처리 | 3~4일 |
| Phase 6 | 점수판 + 이벤트 종료 + 결과 화면 | 1~2일 |
| Phase 7 | 모바일 UI 최적화 + 배포 | 1~2일 |

**총 예상: 2~3주 (하루 3~4시간 기준)**

---

## 10. Next Steps

1. [ ] `/pdca design spothunt` — 설계 문서 작성 (DB 스키마, API, 컴포넌트 설계)
2. [ ] Supabase 프로젝트 생성
3. [ ] 카카오 개발자 센터 앱 등록 및 키 발급
4. [ ] Vercel + GitHub 연동

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-16 | Initial draft | - |
