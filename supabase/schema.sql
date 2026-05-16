-- SpotHunt Database Schema
-- Supabase SQL Editor에서 이 파일을 실행하세요.

-- PostGIS 확장 (거리 계산용)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================
-- Tables
-- =====================

CREATE TABLE event_rooms (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name             TEXT NOT NULL,
  password_hash         TEXT NOT NULL,
  host_token            TEXT NOT NULL,
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

CREATE TABLE event_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  image_key             TEXT NOT NULL DEFAULT 'treasure',
  score                 INTEGER NOT NULL DEFAULT 10,
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,
  pickup_radius_meter   INTEGER NOT NULL DEFAULT 20,
  max_winners           INTEGER,
  collected_count       INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  nickname              TEXT NOT NULL,
  session_token         TEXT NOT NULL,
  joined_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, nickname)
);

CREATE TABLE collection_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  participant_id        UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  item_id               UUID NOT NULL REFERENCES event_items(id) ON DELETE CASCADE,
  collected_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, item_id)
);

-- =====================
-- Indexes
-- =====================

CREATE INDEX idx_event_rooms_status ON event_rooms(status);
CREATE INDEX idx_event_items_room_id ON event_items(room_id);
CREATE INDEX idx_participants_room_id ON participants(room_id);
CREATE INDEX idx_collection_records_participant ON collection_records(participant_id);
CREATE INDEX idx_collection_records_item ON collection_records(item_id);

-- =====================
-- Core DB Function: collect_item
-- 아이템 획득 — 원자적 처리 (위치 검증 + 중복 방지 + 선착순)
-- =====================

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
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'ITEM_NOT_FOUND');
  END IF;

  SELECT * INTO v_room FROM event_rooms WHERE id = v_item.room_id;

  -- 2. 이벤트 상태 검증
  IF v_room.status != 'RUNNING' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'EVENT_NOT_RUNNING');
  END IF;

  -- 3. 서버 측 거리 계산 (미터)
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

  UPDATE event_items
  SET collected_count = collected_count + 1
  WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'score', v_item.score,
    'item_name', v_item.name
  );
END;
$$;

-- =====================
-- Row Level Security
-- =====================

ALTER TABLE event_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_records ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (방 검색 등)
CREATE POLICY "public_read_rooms" ON event_rooms FOR SELECT USING (true);
CREATE POLICY "public_read_items" ON event_items FOR SELECT USING (true);
CREATE POLICY "public_read_participants" ON participants FOR SELECT USING (true);
CREATE POLICY "public_read_records" ON collection_records FOR SELECT USING (true);

-- INSERT는 anon 허용 (게스트 방식)
CREATE POLICY "anon_insert_rooms" ON event_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_items" ON event_items FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_participants" ON participants FOR INSERT WITH CHECK (true);

-- UPDATE/DELETE는 서비스 롤만 (collect_item 함수가 SECURITY DEFINER로 처리)
CREATE POLICY "service_update_rooms" ON event_rooms FOR UPDATE USING (true);
CREATE POLICY "service_update_items" ON event_items FOR UPDATE USING (true);
CREATE POLICY "service_delete_rooms" ON event_rooms FOR DELETE USING (true);
