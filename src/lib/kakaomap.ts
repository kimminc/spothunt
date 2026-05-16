/* eslint-disable */
declare global {
  interface Window { kakao: any }
}

let loadPromise: Promise<void> | null = null

export function loadKakaoMapScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.kakao?.maps?.Map) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!appkey) {
      reject(new Error('[KakaoMap] NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 없습니다'))
      return
    }

    // 10초 타임아웃 — kakao.maps.load() 콜백이 안 오면 도메인 문제로 간주
    const timer = setTimeout(() => {
      loadPromise = null
      reject(new Error(
        `도메인 미등록 의심: 카카오 개발자 콘솔 → 플랫폼 → Web → 사이트 도메인에 "http://localhost" 추가 필요`
      ))
    }, 10_000)

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false`

    script.onload = () => {
      try {
        window.kakao.maps.load(() => {
          clearTimeout(timer)
          resolve()
        })
      } catch (e) {
        clearTimeout(timer)
        loadPromise = null
        reject(new Error('카카오맵 초기화 실패: ' + (e as Error).message))
      }
    }

    script.onerror = () => {
      clearTimeout(timer)
      loadPromise = null
      reject(new Error('카카오맵 스크립트 로드 실패 (네트워크 오류)'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}
