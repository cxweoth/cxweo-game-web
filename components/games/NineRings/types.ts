// 九連環 — 共用型別與規則常數
//
// 規則(Baguenaudier):
//   N 個環編號 1..N(1 為最右、最自由);state 為長度 N 的 boolean 陣列。
//   state[k-1] = true 表示「環 k 套在桿上 (ON)」。
//
//   合法移動:
//     • 環 1 永遠可切換
//     • 環 k(k ≥ 2)可切換 ⇔ 環 k-1 為 ON 且 環 1..k-2 全為 OFF
//
//   目標:從全 ON 變成全 OFF(或反向)。最少步數遵循 Gray code:
//     N 為奇數:(2^(N+1) − 1) / 3
//     N 為偶數:(2^(N+1) − 2) / 3
//   N=9 時為 341 步。

export const SLUG = 'nine-rings';

/** 可選環數;預設 9 環("九"連環本名) */
export const RING_COUNTS = [3, 5, 7, 9] as const;
export type RingCount = (typeof RING_COUNTS)[number];

export const DEFAULT_COUNT: RingCount = 9;

/** 玩法目標:把所有環從桿上拆下、或把所有環放回桿上;雙向最少步數一致 */
export type Goal = 'take-off' | 'put-back';

export const DEFAULT_GOAL: Goal = 'take-off';

export type State = boolean[]; // length N

export function optimalSteps(n: number): number {
  // 全 ON ↔ 全 OFF 的最少步數;雙方向一致
  return n % 2 === 1 ? (Math.pow(2, n + 1) - 1) / 3 : (Math.pow(2, n + 1) - 2) / 3;
}
