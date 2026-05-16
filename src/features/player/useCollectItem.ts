import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getPlayerSession } from '@/lib/session'

export interface CollectResult {
  success: boolean
  reason?: string
  score?: number
  item_name?: string
}

const REASON_MSG: Record<string, string> = {
  OUT_OF_RANGE:      '아직 너무 멀어요. 조금 더 가까이 가세요.',
  ALREADY_COLLECTED: '이미 획득한 아이템입니다.',
  SOLD_OUT:          '아쉽게도 이미 다른 사람이 가져갔어요.',
  EVENT_NOT_RUNNING: '이벤트가 진행 중이 아닙니다.',
  ITEM_NOT_FOUND:    '아이템을 찾을 수 없습니다.',
}

export function useCollectItem() {
  const [collecting, setCollecting] = useState(false)
  const [result, setResult] = useState<CollectResult | null>(null)

  async function collect(itemId: string, lat: number, lng: number): Promise<CollectResult | null> {
    const session = getPlayerSession()
    if (!session) return null

    setCollecting(true)
    setResult(null)

    const { data, error } = await supabase.rpc('collect_item', {
      p_participant_id: session.participantId,
      p_item_id: itemId,
      p_lat: lat,
      p_lng: lng,
    })

    setCollecting(false)
    const res: CollectResult = error
      ? { success: false, reason: error.message }
      : (data as CollectResult)

    setResult(res)
    setTimeout(() => setResult(null), 3000)
    return res
  }

  function getResultMessage(): string | null {
    if (!result) return null
    if (result.success) return `🎉 ${result.item_name} 획득! (+${result.score}점)`
    return REASON_MSG[result.reason ?? ''] ?? result.reason ?? '획득 실패'
  }

  return { collect, collecting, result, getResultMessage }
}
