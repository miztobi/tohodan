import * as turf from '@turf/turf';

/**
 * ルート上の進捗率（%）を計算します
 * @param currentCoords 現在の座標 [longitude, latitude]
 * @param routeCoords ルートを構成する座標の配列 [[lng, lat], ...]
 * @returns 進捗率 (0-100)
 */
export function calculateRouteProgress(
  currentCoords: [number, number],
  routeCoords: [number, number][]
): number {
  if (routeCoords.length < 2) return 0;

  const line = turf.lineString(routeCoords);
  const pt = turf.point(currentCoords);

  // 1. ルート全体の距離を計算
  const totalDistance = turf.length(line);
  if (totalDistance === 0) return 100;

  // 2. 現在地に最も近いルート上の点を取得
  const snapped = turf.nearestPointOnLine(line, pt);

  // 3. ルート開始点から最近接点までの距離を計算
  const startPoint = turf.point(routeCoords[0]);
  const sliced = turf.lineSlice(startPoint, snapped, line);
  const traveledDistance = turf.length(sliced);

  // 4. 進捗率を算出
  const progress = (traveledDistance / totalDistance) * 100;

  return Math.min(Math.max(progress, 0), 100);
}
