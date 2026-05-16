// Haversine formula — 두 좌표 사이의 거리(미터) 계산
export function getDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // 지구 반지름 (미터)
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function isWithinRadius(
  userLat: number, userLng: number,
  targetLat: number, targetLng: number,
  radiusMeters: number
): boolean {
  return getDistanceMeters(userLat, userLng, targetLat, targetLng) <= radiusMeters
}
