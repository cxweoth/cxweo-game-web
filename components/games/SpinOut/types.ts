// 邏輯神尺 (Spin-Out) — 共用型別
//
// 標準版 7 顆旋鈕(dial),每顆兩態:vertical / horizontal。
// 數學上與九連環(Baguenaudier)同構:vertical ≡ ON、horizontal ≡ OFF。
//
// 規則:
//   • 旋鈕 1(最右)永遠可旋轉
//   • 旋鈕 k(k ≥ 2)可旋轉 ⇔ 旋鈕 k−1 為 V 且旋鈕 1..k−2 全 H
//
// 玩法目標:
//   • 釋放(release):從全 V 變全 H,讓滑桿滑出。標準解
//   • 鎖回(lock):從全 H 變全 V,把滑桿鎖回。雙向最少步數對稱

export const SLUG = 'spin-out';

export const DIAL_COUNTS = [3, 5, 7] as const;
export type DialCount = (typeof DIAL_COUNTS)[number];

export const DEFAULT_COUNT: DialCount = 7;

export type Goal = 'release' | 'lock';

export const DEFAULT_GOAL: Goal = 'release';

/** state[i] = true 表示旋鈕 (i+1) 為 vertical(鎖住狀態) */
export type State = boolean[];

export function optimalSteps(n: number): number {
  return n % 2 === 1 ? (Math.pow(2, n + 1) - 1) / 3 : (Math.pow(2, n + 1) - 2) / 3;
}
