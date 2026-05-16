# SpotHunt — 위치 기반 이벤트 보물찾기 앱 계획서

작성일: 2026-05-16  
기반 문서: 프로젝트시나리오.md

---

## 1. 프로젝트 요약

포켓몬GO 방식에서 영감을 받은 위치 기반 이벤트 앱.  
주최자가 이벤트 방을 만들고 지도 위에 아이템을 배치하면, 참여자가 실제 장소로 이동해 아이템을 획득하는 방식.

**핵심 차별점**
- IP 없이 주최자가 직접 아이템(캐릭터/보물/쿠폰 등)을 구성
- 모두획득형 / 경쟁형 두 가지 이벤트 방식
- 비밀번호 기반 입장으로 폐쇄형 이벤트 운영

---

## 2. 플랫폼 및 기술 스택 추천

### 추천 이유: 웹 앱 (모바일 X)

| 항목 | 모바일 앱 | 웹 앱 (추천) |
|------|-----------|-------------|
| 개발 난이도 | 높음 (앱스토어 등록 포함) | 낮음 |
| 배포 속도 | 느림 (심사 1~3일) | 빠름 (Vercel, 5분) |
| GPS 지원 | 완전 지원 | 브라우저 Geolocation API로 충분 |
| 비용 | 개발자 계정 $99/년 | 무료 |
| 업데이트 | 심사 필요 | 즉시 반영 |

> 야외 행사에서 QR코드 링크만 뿌리면 참여자가 앱 설치 없이 바로 접속 가능 — 실용적

### 기술 스택

```
Frontend:  Next.js 14 (App Router) + TypeScript
스타일:    Tailwind CSS + shadcn/ui (복사-붙여넣기 컴포넌트)
지도:      카카오맵 API (한국 지도 정확도 최고, 무료)
Backend:   Supabase (DB + 실시간 + 인증 + 스토리지 — 서버 코드 불필요)
배포:      Vercel (GitHub 연동, 무료, 자동 배포)
```

### 왜 이 스택인가

| 도구 | 이유 |
|------|------|
| **Next.js** | React 기반, 가장 많은 튜토리얼, Vercel과 찰떡 |
| **Supabase** | Firebase 대안, SQL 기반, Realtime 내장, 무료 티어 충분 |
| **카카오맵** | 국내 주소·건물 정확도 최고, 월 300만 콜 무료 |
| **Tailwind + shadcn/ui** | 디자인 초보도 빠르게 예쁜 UI 구성 가능 |
| **Vercel** | GitHub push 하면 자동 배포, 도메인 무료 제공 |

---

## 3. 완성된 데이터 모델

### EventRoom (이벤트 방)
```ts
{
  id: uuid (PK)
  room_name: string
  password_hash: string
  host_user_id: string (FK → profiles)

  mode: "ALL" | "COMPETITION"
  status: "WAITING" | "RUNNING" | "ENDED" | "CANCELLED"
  description: string | null

  center_lat: number
  center_lng: number
  boundary_radius_meter: number

  max_players: number | null
  created_at: timestamp
  started_at: timestamp | null
  ended_at: timestamp | null
}
```

### EventItem (아이템)
```ts
{
  id: uuid (PK)
  room_id: uuid (FK → event_rooms)

  name: string
  image_url: string | null
  score: number
  latitude: number
  longitude: number
  pickup_radius_meter: number  -- 기본 20
  max_winners: number | null   -- 경쟁형 전용
  collected_count: number      -- 기본 0

  created_at: timestamp
}
```

### Participant (참여자)
```ts
{
  id: uuid (PK)
  room_id: uuid (FK → event_rooms)
  nickname: string
  joined_at: timestamp
}
```

### CollectionRecord (획득 기록)
```ts
{
  id: uuid (PK)
  room_id: uuid (FK → event_rooms)
  participant_id: uuid (FK → participants)
  item_id: uuid (FK → event_items)
  collected_at: timestamp  -- 서버 도착 시간 (클라이언트 시간 무시)
}
```

### 유니크 제약
- `CollectionRecord`: `(participant_id, item_id)` 유니크 → 중복 획득 방지 (모두획득형)
- `Participant`: `(room_id, nickname)` 유니크 → 같은 방에 동일 닉네임 불가

---

## 4. 화면 구성 및 라우팅

```
/                       시작 화면 (주최자 / 참여자 선택)

/host
  /host/create          이벤트 방 만들기
  /host/[roomId]/zone   이벤트 구역 설정
  /host/[roomId]/items  아이템 등록
  /host/[roomId]/lobby  대기방 (참여자 입장 대기)
  /host/[roomId]/live   진행 현황

/join
  /join                 방 검색
  /join/[roomId]        비밀번호 입력
  /join/[roomId]/lobby  참여자 대기방
  /join/[roomId]/play   지도 플레이
  /join/[roomId]/score  점수판
```

---

## 5. 실시간 기능 설계

Supabase Realtime을 이용해 아래 이벤트를 처리합니다.

| 이벤트 | 구독 테이블 | 트리거 |
|--------|------------|--------|
| 참여자 입장 알림 | `participants` INSERT | 주최자 대기방 참여자 수 갱신 |
| 이벤트 시작 | `event_rooms` UPDATE (status → RUNNING) | 참여자 → 지도 화면 자동 이동 |
| 아이템 소진 | `event_items` UPDATE (collected_count) | 지도 마커 상태 갱신 |
| 점수 갱신 | `collection_records` INSERT | 점수판 실시간 업데이트 |
| 이벤트 종료 | `event_rooms` UPDATE (status → ENDED) | 참여자 → 결과 화면 이동 |

---

## 6. 경쟁형 선착순 처리 (핵심 로직)

클라이언트가 아닌 서버에서 처리해야 레이스 컨디션을 방지합니다.

```sql
-- Supabase Edge Function 또는 Database Function으로 처리
CREATE OR REPLACE FUNCTION collect_item(
  p_participant_id uuid,
  p_item_id uuid,
  p_lat float,
  p_lng float
) RETURNS json AS $$
DECLARE
  v_item event_items%ROWTYPE;
BEGIN
  -- 1. 아이템 조회 + 행 잠금
  SELECT * INTO v_item FROM event_items
  WHERE id = p_item_id FOR UPDATE;

  -- 2. 위치 검증 (서버에서 거리 계산)
  IF ST_Distance(
    ST_Point(v_item.longitude, v_item.latitude)::geography,
    ST_Point(p_lng, p_lat)::geography
  ) > v_item.pickup_radius_meter THEN
    RETURN json_build_object('success', false, 'reason', 'OUT_OF_RANGE');
  END IF;

  -- 3. 경쟁형: 수량 검증
  IF v_item.max_winners IS NOT NULL
     AND v_item.collected_count >= v_item.max_winners THEN
    RETURN json_build_object('success', false, 'reason', 'SOLD_OUT');
  END IF;

  -- 4. 중복 획득 검증
  IF EXISTS (
    SELECT 1 FROM collection_records
    WHERE participant_id = p_participant_id AND item_id = p_item_id
  ) THEN
    RETURN json_build_object('success', false, 'reason', 'ALREADY_COLLECTED');
  END IF;

  -- 5. 획득 처리
  INSERT INTO collection_records (participant_id, item_id, room_id, collected_at)
  SELECT p_participant_id, p_item_id, v_item.room_id, NOW();

  UPDATE event_items SET collected_count = collected_count + 1 WHERE id = p_item_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

---

## 7. GPS 정확도 고려사항

| 환경 | GPS 오차 | 대응 |
|------|---------|------|
| 야외 탁 트인 곳 | 3~5m | 기본 20m 반경으로 충분 |
| 건물 밀집 지역 | 10~20m | 반경 30m 이상 권장 |
| 실내 | 20~50m | 사용 불가 → 실내 미지원 안내 |

**주최자 가이드라인**: 아이템 등록 시 "권장 반경은 30m 이상입니다" 안내 문구 표시

---

## 8. 구현 단계 (Phase)

### Phase 1 — 기반 세팅 (1~2일)
- [ ] Next.js 14 프로젝트 생성
- [ ] Supabase 프로젝트 생성 및 테이블 스키마 적용
- [ ] Tailwind CSS + shadcn/ui 설정
- [ ] Vercel 연동 + 자동 배포 확인

### Phase 2 — 방 생성 / 입장 (2~3일)
- [ ] 주최자: 방 만들기 폼 (이름, 비밀번호, 모드, 설명)
- [ ] 참여자: 방 검색 + 비밀번호 입력 + 닉네임 설정
- [ ] 대기방 실시간 참여자 목록 (Supabase Realtime)

### Phase 3 — 지도 + 아이템 배치 (3~4일)
- [ ] 카카오맵 SDK 연동
- [ ] 주최자: 구역 설정 (중심 + 반경)
- [ ] 주최자: 지도 클릭으로 아이템 위치 등록
- [ ] 아이템 마커 렌더링

### Phase 4 — 플레이 화면 (3~4일)
- [ ] 참여자: 실시간 내 위치 표시 (Geolocation API)
- [ ] 아이템 반경 진입 감지
- [ ] 획득 버튼 활성화 / 획득 처리 (서버 함수 호출)
- [ ] 획득 상태 실시간 갱신

### Phase 5 — 점수 및 결과 (1~2일)
- [ ] 실시간 점수판
- [ ] 이벤트 종료 처리
- [ ] 결과 화면 (랭킹, 획득 목록)

### Phase 6 — 마무리 (1~2일)
- [ ] 아이템 이미지 업로드 (Supabase Storage)
- [ ] 모바일 반응형 UI 최적화
- [ ] 배포 및 도메인 연결

**총 예상 기간: 2~3주 (하루 3~4시간 기준)**

---

## 9. 무료 사용 한도 (비용 없이 운영 가능)

| 서비스 | 무료 한도 | 충분 여부 |
|--------|----------|---------|
| Supabase | DB 500MB, 실시간 200 동시 접속, 스토리지 1GB | 소규모 이벤트 충분 |
| 카카오맵 | 월 300만 API 호출 | 충분 |
| Vercel | 월 100GB 대역폭, 무제한 배포 | 충분 |

---

## 10. 구현 전 준비사항

1. **카카오 개발자 계정** 생성 → 앱 키 발급 (카카오맵 API)  
   https://developers.kakao.com

2. **Supabase 계정** 생성 → 새 프로젝트 생성  
   https://supabase.com

3. **Vercel 계정** 생성 → GitHub 연동  
   https://vercel.com

4. **Node.js 설치** (v20 이상 권장)

---

## 11. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| 실내 GPS 오작동 | 실외 전용 이벤트로 MVP 제한 |
| 경쟁형 동시 요청 충돌 | DB 트랜잭션 + FOR UPDATE 락으로 처리 |
| 카카오맵 로드 느림 | 지도 스켈레톤 UI 표시 |
| 참여자 위치 정보 거부 | 권한 요청 안내 화면 추가 |
