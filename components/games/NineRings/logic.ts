// 九連環 — 純規則 + Gray code 工具
//
// 關鍵觀察:每個合法狀態恰對應一個整數 N(0..2^n−1),Gray code 為「環狀態 bit map」;
// 一次合法操作恰把 N 加 1 或減 1。所以:
//   • 「最少剩餘步數」 = inverse-Gray(state)(若目標是 all-OFF)
//   • 「下一步往目標走」 = 比較 g(N) 與 g(N−1) 哪個 bit 不同 → 那個 bit 就是要切的環
//
// 程式上:state[i] 是 bit i(LSB = 環 1),Gray code 直接讀出來;
// inverse-Gray 用 N ^= N>>1 ^= N>>2 ^= ... 把 Gray 還原為標準二進位 N。

import type { Goal, State } from './types';

/** 依玩法目標決定起手:take-off 全 ON、put-back 全 OFF */
export function createInitialState(n: number, goal: Goal = 'take-off'): State {
  return new Array(n).fill(goal === 'take-off');
}

export function isAllOff(state: State): boolean {
  for (const s of state) if (s) return false;
  return true;
}

export function isAllOn(state: State): boolean {
  for (const s of state) if (!s) return false;
  return true;
}

/** 環 k(1-based)目前可否切換 */
export function canToggle(state: State, k: number): boolean {
  if (k < 1 || k > state.length) return false;
  if (k === 1) return true;
  // 需 ring k-1 為 ON 且 ring 1..k-2 全 OFF
  if (!state[k - 2]) return false;
  for (let i = 0; i < k - 2; i++) {
    if (state[i]) return false;
  }
  return true;
}

/** 嘗試切換;成功回新 state、失敗(不合法)回 null */
export function tryToggle(state: State, k: number): State | null {
  if (!canToggle(state, k)) return null;
  const next = state.slice();
  next[k - 1] = !next[k - 1];
  return next;
}

/**
 * 把 state 視為 Gray code(bit i = ring i+1)→ 還原標準二進位整數 N
 * N 即「從全 OFF 走到此 state 所需的步數」(也就是「離 all-OFF 還剩 N 步」)
 */
export function stateToStepsFromAllOff(state: State): number {
  let g = 0;
  for (let i = state.length - 1; i >= 0; i--) {
    g = (g << 1) | (state[i] ? 1 : 0);
  }
  // inverse Gray:n ^= n>>1 ^= n>>2 ...
  let n = g;
  for (let shift = 1; shift < 32; shift <<= 1) {
    n ^= n >>> shift;
  }
  return n;
}

/** 全 ON 狀態對應的線性步數 N(= inverse-Gray of 0b111..1) */
export function allOnStepsFromAllOff(n: number): number {
  const g = n >= 32 ? -1 >>> 0 : (1 << n) - 1;
  let r = g;
  for (let s = 1; s < 32; s <<= 1) r ^= r >>> s;
  return r;
}

/** 從 curN 找出「往 targetN 移動一步」要切的環編號(1..N);targetN === curN 回 null */
function diffRing(curN: number, targetN: number): number | null {
  if (curN === targetN) return null;
  const gN = curN ^ (curN >>> 1);
  const gT = targetN ^ (targetN >>> 1);
  const diff = gN ^ gT; // 恰一個 bit
  let k = 0;
  let x = diff;
  while ((x & 1) === 0 && k < 32) {
    x >>>= 1;
    k++;
  }
  return k + 1;
}

/** 下一步往「全 OFF」走;已達就回 null */
export function hintTowardAllOff(state: State): number | null {
  const n = stateToStepsFromAllOff(state);
  return diffRing(n, n - 1);
}

/** 下一步往「全 ON」走;已達就回 null */
export function hintTowardAllOn(state: State): number | null {
  const cur = stateToStepsFromAllOff(state);
  const target = allOnStepsFromAllOff(state.length);
  if (cur === target) return null;
  // 在 Gray code 線性序列上,直接朝 target 方向走 1 步
  const next = cur < target ? cur + 1 : cur - 1;
  return diffRing(cur, next);
}

/** 距離某目標的剩餘最少步數 */
export function remainingToAllOff(state: State): number {
  return stateToStepsFromAllOff(state);
}
export function remainingToAllOn(state: State): number {
  return Math.abs(allOnStepsFromAllOff(state.length) - stateToStepsFromAllOff(state));
}
