# SpotHunt Design Document

> **Summary**: 위치 기반 이벤트 보물찾기 웹 앱 — Feature Hooks 아키텍처 설계
>
> **Project**: SpotHunt
> **Version**: 0.1.0
> **Author**: -
> **Date**: 2026-05-16
> **Status**: Draft
> **Planning Doc**: [spothunt.plan.md](../01-plan/features/spothunt.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 소규모 이벤트(아파트 행사, 어린이 행사, 스탬프 투어)에서 위치 기반 체험을 쉽게 운영할 수단이 없음 |
| **WHO** | 주최자(이벤트 기획자/운영자) + 참여자(스마트폰 사용 가능한 행사 참가자) |
| **RISK** | GPS 정확도(실내 오차 20~50m), 경쟁형 동시 획득 레이스컨디션, 모바일 브라우저 위치 권한 거부 |
| **SUCCESS** | 주최자 방 생성~아이템 배치 5분 이내 / 참여자 QR 접속 후 아이템 획득 가능 |
| **SCOPE** | MVP: 방 생성·입장·지도 플레이·획득(모두획득형+경쟁형) / v2: 이미지 업로드, 다각형 구역 |

---

## 1. Overview

### 1.1 Design Goals

- 초보자가 이해하고 유지보수할 수 있는 Feature Hooks 아키텍처
- Supabase 하나로 DB + Realtime + RPC 처리 (별도 서버 코드 없음)
- 카카오맵 SDK를 React 컴포넌트로 래핑하여 재사용 가능하게 구성
- GPS 거리 계산은 클라이언트와 서버 양쪽에서 수행 (UX + 보안)

### 1.2 Design Principles

- **훅으로 로직 분리**: 페이지는 UI만, 비즈니스 로직은 custom hook으로
- **서버 검증 필수**: 아이템 획득은 클라이언트 우회 불가능하도록 DB Function으로만 처리
- **실시간 단일 채널**: Supabase Realtime 구독은 feature별 훅에서 관리

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Page-centric | Option B: Clean | **Option C: Feature Hooks** |
|----------|:-:|:-:|:-:|
| 신규 파일 수 | ~15 | ~40 | ~25 |
| 복잡도 | 낮음 | 높음 | 중간 |
| 유지보수성 | 낮음 | 높음 | 높음 |
| 초보자 적합도 | 낮음 | 낮음 | **높음** |

**Selected**: Option C — Feature Hooks  
**Rationale**: 페이지/훅/컴포넌트가 명확히 분리되어 초보자도 "이 파일이 뭘 하는지" 바로 알 수 있음. MVP 규모에 과도한 레이어 없이 확장성 확보.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                        │
│                                                             │
│  Pages (app/)                                               │
│    ↓ useCreateRoom / useJoinRoom / useCollectItem 등        │
│  Feature Hooks (features/)                                  │
│    ↓ supabase.from() / supabase.rpc() / supabase.channel()  │
│  lib/supabase.ts                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                    Supabase                                  │
│  PostgreSQL DB  │  Realtime  │  RPC Functions  │  Auth      │
└─────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Kakao Maps API                              │
│  (JavaScript SDK — 브라우저에서 직접 로드)                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**아이템 획득 흐름 (핵심)**
```
참여자 위치 갱신 (GPS watchPosition)
  → 클라이언트 거리 계산 (geo.ts)
  → 반경 이내 → 획득 버튼 활성화
  → 버튼 클릭 → useCollectItem hook
  → supabase.rpc('collect_item', { participant_id, item_id, lat, lng })
  → DB Function: 위치 재검증 + 중복 확인 + 수량 확인 + INSERT
  → 성공/실패 응답
  → Supabase Realtime → 다른 참여자 화면 갱신
```

**이벤트 시작 흐름**
```
주최자 시작 버튼
  → supabase.from('event_rooms').update({ status: 'RUNNING' })
  → Supabase Realtime 브로드캐스트
  → 모든 참여자의 useEventStatus 훅 감지
  → router.push('/join/[roomId]/play') 자동 이동
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Page components | Feature Hooks | UI 렌더링 |
| Feature Hooks | lib/supabase.ts | DB/Realtime 접근 |
| Feature Hooks | lib/geo.ts | 거리 계산 |
| KakaoMap component | window.kakao | 지도 렌더링 |
| lib/kakaomap.ts | Kakao Maps SDK | SDK 초기화 |

---

## 3. Data Model

### 3.1 Entity Relationships

```
EventRoom 1 ──── N EventItem
EventRoom 1 ──── N Participant
EventItem  1 ──── N CollectionRecord
Participant 1 ──── N CollectionRecord
```

### 3.2 Database Schema (Supabase PostgreSQL)

```sql
-- 이벤트 방
CREATE TABLE event_rooms (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name             TEXT NOT NULL,
  password_hash         TEXT NOT NULL,
  host_token            TEXT NOT NULL,          -- localStorage 저장용 (게스트 인증)
  mode                  TEXT NOT NULL CHECK (mode IN ('ALL', 'COMPETITION')),
  status                TEXT NOT NULL DEFAULT 'WAITING'
                          CHECK (status IN ('WAITING', 'RUNNING', 'ENDED', 'CANCELLED')),
  description           TEXT,
  center_lat            DOUBLE PRECISION NOT NULL,
  center_lng            DOUBLE PRECISION NOT NULL,
  boundary_radius_meter INTEGER NOT NULL DEFAULT 300,
  max_players           INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at            TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ
);

-- 아이템
CREATE TABLE event_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  image_key             TEXT NOT NULL DEFAULT 'treasure',  -- 기본 이미지 키
  score                 INTEGER NOT NULL DEFAULT 10,
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,
  pickup_radius_meter   INTEGER NOT NULL DEFAULT 20,
  max_winners           INTEGER,                           -- NULL이면 모두획득형
  collected_count       INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 참여자
CREATE TABLE participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  nickname              TEXT NOT NULL,
  session_token         TEXT NOT NULL,                     -- localStorage 저장용
  joined_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, nickname)
);

-- 획득 기록
CREATE TABLE collection_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  participant_id        UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  item_id               UUID NOT NULL REFERENCES event_items(id) ON DELETE CASCADE,
  collected_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 서버 도착 시간
  UNIQUE (participant_id, item_id)                           -- 중복 획득 방지
);

-- 인덱스
CREATE INDEX idx_event_rooms_status ON event_rooms(status);
CREATE INDEX idx_event_items_room_id ON event_items(room_id);
CREATE INDEX idx_participants_room_id ON participants(room_id);
CREATE INDEX idx_collection_records_participant ON collection_records(participant_id);
CREATE INDEX idx_collection_records_item ON collection_records(item_id);
```

### 3.3 핵심 DB Function (아이템 획득 — 원자적 처리)

```sql
CREATE OR REPLACE FUNCTION collect_item(
  p_participant_id  UUID,
  p_item_id         UUID,
  p_lat             DOUBLE PRECISION,
  p_lng             DOUBLE PRECISION
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item    event_items%ROWTYPE;
  v_room    event_rooms%ROWTYPE;
  v_dist_m  DOUBLE PRECISION;
BEGIN
  -- 1. 아이템 + 방 조회 (FOR UPDATE: 동시 요청 직렬화)
  SELECT * INTO v_item FROM event_items WHERE id = p_item_id FOR UPDATE;
  SELECT * INTO v_room FROM event_rooms WHERE id = v_item.room_id;

  -- 2. 이벤트 상태 검증
  IF v_room.status != 'RUNNING' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'EVENT_NOT_RUNNING');
  END IF;

  -- 3. 서버 측 거리 계산 (단위: 미터)
  v_dist_m := ST_Distance(
    ST_Point(v_item.longitude, v_item.latitude)::geography,
    ST_Point(p_lng, p_lat)::geography
  );
  IF v_dist_m > v_item.pickup_radius_meter THEN
    RETURN jsonb_build_object('success', false, 'reason', 'OUT_OF_RANGE',
      'distance', ROUND(v_dist_m::numeric, 1));
  END IF;

  -- 4. 중복 획득 검증
  IF EXISTS (
    SELECT 1 FROM collection_records
    WHERE participant_id = p_participant_id AND item_id = p_item_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'ALREADY_COLLECTED');
  END IF;

  -- 5. 경쟁형: 수량 검증
  IF v_item.max_winners IS NOT NULL
     AND v_item.collected_count >= v_item.max_winners THEN
    RETURN jsonb_build_object('success', false, 'reason', 'SOLD_OUT');
  END IF;

  -- 6. 획득 처리
  INSERT INTO collection_records (participant_id, item_id, room_id)
  VALUES (p_participant_id, p_item_id, v_item.room_id);

  UPDATE event_items SET collected_count = collected_count + 1 WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true, 'score', v_item.score, 'item_name', v_item.name);
END;
$$;
```

### 3.4 TypeScript 타입 정의

```typescript
// src/types/index.ts

export type EventMode = 'ALL' | 'COMPETITION'
export type EventStatus = 'WAITING' | 'RUNNING' | 'ENDED' | 'CANCELLED'

export interface EventRoom {
  id: string
  room_name: string
  password_hash: string
  host_token: string
  mode: EventMode
  status: EventStatus
  description: string | null
  center_lat: number
  center_lng: number
  boundary_radius_meter: number
  max_players: number | null
  created_at: string
  started_at: string | null
  ended_at: string | null
}

export interface EventItem {
  id: string
  room_id: string
  name: string
  image_key: string
  score: number
  latitude: number
  longitude: number
  pickup_radius_meter: number
  max_winners: number | null
  collected_count: number
  created_at: string
}

export interface Participant {
  id: string
  room_id: string
  nickname: string
  session_token: string
  joined_at: string
}

export interface CollectionRecord {
  id: string
  room_id: string
  participant_id: string
  item_id: string
  collected_at: string
}

// 클라이언트 전용 상태 타입
export interface PlayerSession {
  participantId: string
  sessionToken: string
  nickname: string
  roomId: string
}

export interface HostSession {
  hostToken: string
  roomId: string
}

// 기본 제공 아이템 이미지
export const ITEM_IMAGES = {
  treasure: '🏆',
  cat: '🐱',
  dragon: '🐉',
  coupon: '🎫',
  mission: '📋',
  star: '⭐',
  gem: '💎',
  gift: '🎁',
} as const
export type ItemImageKey = keyof typeof ITEM_IMAGES
```

---

## 4. API Specification

Supabase를 직접 사용하므로 별도 API 서버 없음. 모든 데이터 접근은 Supabase Client SDK로 처리.

### 4.1 Supabase RPC (서버 함수)

| Function | Description | Auth |
|----------|-------------|------|
| `collect_item(participant_id, item_id, lat, lng)` | 아이템 획득 (원자적 처리) | session_token 검증 |

### 4.2 주요 Supabase 쿼리 패턴

```typescript
// 방 생성
const { data } = await supabase
  .from('event_rooms')
  .insert({ room_name, password_hash, host_token, mode, ... })
  .select().single()

// 방 검색
const { data } = await supabase
  .from('event_rooms')
  .select('id, room_name, mode, status')
  .ilike('room_name', `%${query}%`)
  .eq('status', 'WAITING')

// 아이템 목록 (실시간 구독)
supabase
  .channel('items')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'event_items',
      filter: `room_id=eq.${roomId}` }, handler)
  .subscribe()

// 아이템 획득 호출
const { data } = await supabase.rpc('collect_item', {
  p_participant_id: participantId,
  p_item_id: itemId,
  p_lat: lat,
  p_lng: lng,
})
```

### 4.3 Realtime 구독 목록

| 구독 채널 | 이벤트 | 용도 |
|----------|--------|------|
| `event_rooms:id=eq.{roomId}` | UPDATE | 이벤트 상태 변경 감지 |
| `participants:room_id=eq.{roomId}` | INSERT | 참여자 입장 알림 |
| `event_items:room_id=eq.{roomId}` | UPDATE | 아이템 소진 상태 갱신 |
| `collection_records:room_id=eq.{roomId}` | INSERT | 점수판 실시간 갱신 |

---

## 5. UI/UX Design

### 5.1 화면별 라우팅

```
/                           시작 화면
/host/create                방 만들기
/host/[roomId]/zone         이벤트 구역 설정
/host/[roomId]/items        아이템 등록
/host/[roomId]/lobby        주최자 대기방
/host/[roomId]/live         진행 현황
/join                       방 검색
/join/[roomId]              비밀번호 + 닉네임 입력
/join/[roomId]/lobby        참여자 대기방
/join/[roomId]/play         지도 플레이 (핵심 화면)
/join/[roomId]/score        점수판
```

### 5.2 User Flow

```
주최자:
시작 화면 → 방 만들기 → 구역 설정 → 아이템 등록 → 대기방 → [참여자 입장] → 이벤트 시작 → 진행 현황 → 종료

참여자:
시작 화면 → 방 검색 → 비번+닉네임 입력 → 대기방 → [이벤트 시작] → 지도 플레이 → 아이템 획득 → 점수판
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `KakaoMap` | `components/map/kakao-map.tsx` | 카카오맵 SDK 래퍼, 마커/원 렌더링 |
| `ItemMarker` | `components/map/item-marker.tsx` | 아이템 위치 마커 (획득 상태 반영) |
| `EventZone` | `components/map/event-zone.tsx` | 이벤트 구역 원형 오버레이 |
| `MyLocation` | `components/map/my-location.tsx` | 내 현재 위치 마커 |
| `ItemCard` | `components/game/item-card.tsx` | 아이템 획득 팝업/카드 |
| `ScoreBoard` | `components/game/score-board.tsx` | 점수판 테이블 |
| `ParticipantList` | `components/game/participant-list.tsx` | 참여자 목록 |
| `CollectButton` | `components/game/collect-button.tsx` | 획득 버튼 (반경 내 활성화) |

### 5.4 Page UI Checklist

#### 시작 화면 (/)
- [ ] Button: "주최자로 시작하기" → `/host/create`
- [ ] Button: "참여자로 입장하기" → `/join`
- [ ] Text: 앱 이름 "SpotHunt"

#### 방 만들기 (/host/create)
- [ ] Input: 방 이름 (필수, 최대 30자)
- [ ] Input: 비밀번호 (필수, 최대 20자)
- [ ] Select: 이벤트 방식 — 모두획득형 / 경쟁형
- [ ] Textarea: 이벤트 설명 (선택)
- [ ] Input: 최대 참여자 수 (선택, 숫자)
- [ ] Button: "다음" (미입력 시 비활성화)

#### 이벤트 구역 설정 (/host/[roomId]/zone)
- [ ] Map: 카카오맵 전체화면
- [ ] Marker: 현재 위치 표시
- [ ] Input: 반경(m) 입력 (기본값 300)
- [ ] Circle overlay: 설정된 구역 표시
- [ ] Button: "지도를 클릭해 중심 위치를 설정하세요" 안내 문구
- [ ] Button: "다음" (중심 위치 선택 전 비활성화)

#### 아이템 등록 (/host/[roomId]/items)
- [ ] Map: 카카오맵 (이벤트 구역 표시)
- [ ] List: 등록된 아이템 목록
- [ ] Button: "아이템 추가" → 아이템 등록 폼 표시
- [ ] Form - Input: 아이템 이름
- [ ] Form - Select: 이미지 (기본 8종 이모지)
- [ ] Form - Input: 점수 (기본 10)
- [ ] Form - Input: 획득 반경(m) (기본 20)
- [ ] Form - Input: 최대 획득 수 (경쟁형일 때만 표시)
- [ ] Button: "이벤트 시작 대기" → 대기방 이동

#### 주최자 대기방 (/host/[roomId]/lobby)
- [ ] Text: 방 이름
- [ ] Text: 이벤트 방식 (모두획득형/경쟁형)
- [ ] Text: 참여자 수 (실시간)
- [ ] List: 참여자 닉네임 목록 (실시간)
- [ ] Text: 공유 링크 / QR코드 힌트
- [ ] Button: "이벤트 시작" (참여자 0명이면 비활성화)
- [ ] Button: "방 삭제"

#### 진행 현황 (/host/[roomId]/live)
- [ ] Text: 현재 참여자 수
- [ ] Text: 총 아이템 수 / 획득된 아이템 수
- [ ] List: 참여자별 점수 (실시간)
- [ ] Button: "이벤트 종료"

#### 방 검색 (/join)
- [ ] Input: 방 이름 검색
- [ ] List: 검색 결과 (방 이름, 이벤트 방식, 상태 뱃지)
- [ ] Badge: 상태 — 대기중(green) / 진행중(blue) / 종료됨(gray)
- [ ] 대기중인 방만 클릭 가능

#### 비밀번호 + 닉네임 입력 (/join/[roomId])
- [ ] Text: 방 이름
- [ ] Input: 비밀번호
- [ ] Input: 닉네임
- [ ] Button: "입장하기"
- [ ] Text: 오류 메시지 (비밀번호 틀림, 닉네임 중복)

#### 참여자 대기방 (/join/[roomId]/lobby)
- [ ] Text: 방 이름
- [ ] Text: 이벤트 방식
- [ ] Text: 현재 참여자 수
- [ ] Text: "주최자가 이벤트를 시작할 때까지 기다려주세요"
- [ ] 이벤트 RUNNING 시 자동 `/play` 이동

#### 지도 플레이 (/join/[roomId]/play) — 핵심 화면
- [ ] Map: 카카오맵 전체화면
- [ ] Marker: 내 현재 위치 (파란 점)
- [ ] Circle: 이벤트 구역 경계
- [ ] Markers: 아이템 위치 (이모지 마커)
- [ ] Marker style: 획득 완료 아이템 — 흐린 처리
- [ ] Marker style: 소진된 아이템 — "획득 완료" 텍스트
- [ ] Panel: 반경 내 진입 시 아이템 카드 팝업
- [ ] Card - Text: 아이템 이름, 점수
- [ ] Card - Text: 남은 수량 (경쟁형)
- [ ] Card - Button: "획득하기" (반경 내 활성화)
- [ ] Toast: 획득 성공/실패 메시지
- [ ] Button: "점수판 보기" (우상단)

#### 점수판 (/join/[roomId]/score)
- [ ] Text: 내 점수 (강조)
- [ ] List: 내 획득 아이템 목록 (이름, 점수)
- [ ] Table: 전체 랭킹 (닉네임, 점수, 순위)
- [ ] 이벤트 ENDED 시 "이벤트가 종료되었습니다" 배너

---

## 6. Error Handling

### 6.1 에러 코드 정의

| Code | 상황 | 클라이언트 처리 |
|------|------|----------------|
| `OUT_OF_RANGE` | 아이템 반경 밖에서 획득 시도 | "아직 너무 멀어요. 조금 더 가까이 가세요." |
| `ALREADY_COLLECTED` | 이미 획득한 아이템 재시도 | "이미 획득한 아이템입니다." |
| `SOLD_OUT` | 경쟁형 수량 소진 | "아쉽게도 이미 다른 사람이 가져갔어요." |
| `EVENT_NOT_RUNNING` | 이벤트 미시작/종료 상태 | "이벤트가 진행 중이 아닙니다." |
| `WRONG_PASSWORD` | 비밀번호 불일치 | "비밀번호가 맞지 않습니다." |
| `NICKNAME_TAKEN` | 닉네임 중복 | "이미 사용 중인 닉네임입니다." |
| `LOCATION_DENIED` | GPS 권한 거부 | "위치 권한이 필요합니다. 브라우저 설정에서 허용해주세요." |

### 6.2 GPS 권한 거부 처리

```
위치 권한 요청 → 거부됨
  → 안내 화면 표시: "이 앱은 GPS가 필요합니다"
  → [다시 허용하기] 버튼 → 브라우저 설정 안내
  → 플레이 화면 진입 불가 (블로킹)
```

---

## 7. Security Considerations

- [ ] `collect_item` DB Function은 `SECURITY DEFINER`로 RLS 우회 방지
- [ ] 비밀번호는 bcrypt 해시 저장 (서버에서 비교)
- [ ] `host_token`, `session_token`은 UUID v4로 생성, localStorage 저장
- [ ] Supabase RLS: `event_rooms` 테이블은 SELECT만 허용, INSERT/UPDATE/DELETE는 서버 함수로만
- [ ] 아이템 좌표는 클라이언트에서 읽기 가능하나, 획득 검증은 반드시 서버에서 재확인

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| L1: DB Function | collect_item 각 케이스 | Supabase SQL Editor |
| L2: UI Action | 방 생성, 입장, 획득 버튼 | 브라우저 직접 테스트 |
| L3: E2E | 주최자~참여자 전체 시나리오 | 2대 기기 테스트 |

### 8.2 L1: DB Function 테스트

| # | 테스트 | 예상 결과 |
|---|--------|---------|
| 1 | 정상 위치에서 첫 획득 | `{ success: true, score: 10 }` |
| 2 | 반경 밖 위치에서 획득 시도 | `{ success: false, reason: 'OUT_OF_RANGE' }` |
| 3 | 같은 아이템 2번 획득 시도 | `{ success: false, reason: 'ALREADY_COLLECTED' }` |
| 4 | maxWinners=1 아이템 2명 동시 요청 | 1명만 성공, 나머지 `SOLD_OUT` |
| 5 | WAITING 상태 방에서 획득 시도 | `{ success: false, reason: 'EVENT_NOT_RUNNING' }` |

### 8.3 L2: UI Action 테스트

| # | 페이지 | 액션 | 예상 결과 |
|---|--------|------|---------|
| 1 | /host/create | 방 이름 비워두고 제출 | 다음 버튼 비활성화 |
| 2 | /host/[id]/lobby | 0명 상태 | 시작 버튼 비활성화 |
| 3 | /join/[id] | 틀린 비밀번호 입력 | 오류 메시지 표시 |
| 4 | /join/[id]/play | 아이템 반경 진입 시뮬 | 획득 버튼 활성화 |

### 8.4 L3: E2E 시나리오

| # | 시나리오 | 성공 기준 |
|---|----------|---------|
| 1 | 주최자 전체 플로우 | 방 생성 → 구역 → 아이템 3개 등록 → 대기방 표시 |
| 2 | 참여자 입장 | 방 검색 → 비번 입력 → 대기방 진입 → 주최자 화면에 참여자 표시 |
| 3 | 이벤트 시작 자동 전환 | 주최자 시작 → 참여자 화면 자동 /play 이동 |
| 4 | 아이템 획득 | 아이템 근처 이동 → 획득 버튼 활성화 → 획득 → 점수 증가 |
| 5 | 경쟁형 선착순 | maxWinners=1 아이템 → 2명 동시 시도 → 1명만 성공 |

---

## 9. Clean Architecture (Feature Hooks)

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Page (Presentation)** | UI 렌더링, 훅 호출 | `src/app/` |
| **Feature Hooks (Application)** | 비즈니스 로직, Supabase 호출 | `src/features/` |
| **Types (Domain)** | 공통 타입, 상수 | `src/types/` |
| **Lib (Infrastructure)** | Supabase 클라이언트, 지도 유틸 | `src/lib/` |

### 9.2 Feature Hooks 목록

```typescript
// 주최자 훅
features/host/
  useCreateRoom.ts        // 방 생성
  useRoomItems.ts         // 아이템 CRUD
  useHostLobby.ts         // 대기방 Realtime
  useHostLive.ts          // 진행 현황 Realtime

// 참여자 훅
features/player/
  useJoinRoom.ts          // 방 입장
  useEventStatus.ts       // 이벤트 상태 구독 (자동 화면 전환)
  usePlayerLobby.ts       // 참여자 대기방
  useGameMap.ts           // 지도 + GPS + 아이템 목록
  useCollectItem.ts       // 아이템 획득
  useScoreBoard.ts        // 점수판 Realtime

// 공통 훅
features/shared/
  useGeolocation.ts       // GPS watchPosition 래퍼
```

---

## 10. Coding Convention Reference

### 10.1 파일 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 페이지 | `page.tsx` (Next.js 고정) | `app/host/create/page.tsx` |
| 컴포넌트 | `kebab-case.tsx` | `kakao-map.tsx`, `item-card.tsx` |
| 훅 | `camelCase.ts` (use 접두사) | `useCreateRoom.ts` |
| 유틸 | `camelCase.ts` | `geo.ts`, `kakaomap.ts` |
| 타입 | `index.ts` | `types/index.ts` |

### 10.2 환경변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
NEXT_PUBLIC_KAKAO_MAP_KEY=xxxxxxxxxx
```

---

## 11. Implementation Guide

### 11.1 전체 파일 구조

```
src/
├── app/
│   ├── page.tsx
│   ├── host/
│   │   ├── create/page.tsx
│   │   └── [roomId]/
│   │       ├── zone/page.tsx
│   │       ├── items/page.tsx
│   │       ├── lobby/page.tsx
│   │       └── live/page.tsx
│   └── join/
│       ├── page.tsx
│       └── [roomId]/
│           ├── page.tsx
│           ├── lobby/page.tsx
│           ├── play/page.tsx
│           └── score/page.tsx
├── components/
│   ├── map/
│   │   ├── kakao-map.tsx
│   │   ├── item-marker.tsx
│   │   ├── event-zone.tsx
│   │   └── my-location.tsx
│   ├── game/
│   │   ├── item-card.tsx
│   │   ├── score-board.tsx
│   │   ├── participant-list.tsx
│   │   └── collect-button.tsx
│   └── ui/               # shadcn/ui 컴포넌트
├── features/
│   ├── host/
│   │   ├── useCreateRoom.ts
│   │   ├── useRoomItems.ts
│   │   ├── useHostLobby.ts
│   │   └── useHostLive.ts
│   ├── player/
│   │   ├── useJoinRoom.ts
│   │   ├── useEventStatus.ts
│   │   ├── usePlayerLobby.ts
│   │   ├── useGameMap.ts
│   │   ├── useCollectItem.ts
│   │   └── useScoreBoard.ts
│   └── shared/
│       └── useGeolocation.ts
├── lib/
│   ├── supabase.ts
│   ├── kakaomap.ts
│   └── geo.ts
└── types/
    └── index.ts
```

### 11.2 구현 순서

1. [ ] Module 1: 프로젝트 세팅 + DB 스키마
2. [ ] Module 2: 방 생성 + 입장 + 대기방
3. [ ] Module 3: 카카오맵 + 아이템 배치
4. [ ] Module 4: 지도 플레이 + GPS + 획득
5. [ ] Module 5: 점수판 + 종료 + 배포

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | 내용 | 예상 턴 |
|--------|-----------|------|:------:|
| 프로젝트 세팅 + DB | `module-1` | Next.js 초기화, Supabase 스키마, 환경변수 | 15~20 |
| 방 생성 + 입장 | `module-2` | 방 만들기, 검색, 비번 입력, 대기방 Realtime | 25~30 |
| 카카오맵 + 아이템 배치 | `module-3` | 맵 컴포넌트, 구역 설정, 아이템 등록 | 20~25 |
| 지도 플레이 + 획득 | `module-4` | GPS 훅, 획득 처리, Realtime 갱신 | 25~30 |
| 점수판 + 배포 | `module-5` | 점수판, 이벤트 종료, Vercel 배포 | 15~20 |

#### Recommended Session Plan

| Session | 작업 | Scope |
|---------|------|-------|
| Session 1 (오늘) | Plan + Design | 완료 |
| Session 2 | 프로젝트 세팅 + DB | `--scope module-1` |
| Session 3 | 방 생성 + 입장 | `--scope module-2` |
| Session 4 | 카카오맵 + 아이템 | `--scope module-3` |
| Session 5 | 지도 플레이 + 획득 | `--scope module-4` |
| Session 6 | 점수판 + 배포 | `--scope module-5` |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-16 | Initial draft — Option C (Feature Hooks) 선택 | - |
