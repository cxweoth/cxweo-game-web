// 邏輯神尺 — 純規則 + Gray code 工具
//
// 與 NineRings 同構:state[i]=true (vertical) ≡ ring ON。
// 為了讓 SpinOut 自成一個遊戲(不依賴 NineRings 的 module),這裡重複實作邏輯;
// 兩款共用「Gray code 一步差」這個數學模式,但語意 / 命名各自獨立。

import type { Goal, State } from './types';

export function createInitialState(n: number, goal: Goal = 'release'): State {
  // release:從全 V(vertical=true)解到全 H;lock 反向
  return new Array(n).fill(goal === 'release');
}

export function isAllVertical(state: State): boolean {
  for (const s of state) if (!s) return false;
  return true;
}
export function isAllHorizontal(state: State): boolean {
  for (const s of state) if (s) return false;
  return true;
}

/** 旋鈕 k(1-based)目前是否可旋轉 */
export function canRotate(state: State, k: number): boolean {
  if (k < 1 || k > state.length) return false;
  if (k === 1) return true;
  if (!state[k - 2]) return false; // 需 dial k-1 為 V
  for (let i = 0; i < k - 2; i++) {
    if (state[i]) return false; // 1..k-2 必須全 H
  }
  return true;
}

export function tryRotate(state: State, k: number): State | null {
  if (!canRotate(state, k)) return null;
  const next = state.slice();
  next[k - 1] = !next[k - 1];
  return next;
}

/** 把 state 視為 Gray code 還原為標準二進位整數 N(= 離全 H 還剩幾步) */
export function stateToStepsFromAllHoriz(state: State): number {
  let g = 0;
  for (let i = state.length - 1; i >= 0; i--) {
    g = (g << 1) | (state[i] ? 1 : 0);
  }
  let n = g;
  for (let s = 1; s < 32; s <<= 1) n ^= n >>> s;
  return n;
}

export function allVerticalStepsFromAllHoriz(n: number): number {
  const g = n >= 32 ? -1 >>> 0 : (1 << n) - 1;
  let r = g;
  for (let s = 1; s < 32; s <<= 1) r ^= r >>> s;
  return r;
}

function diffDial(curN: number, targetN: number): number | null {
  if (curN === targetN) return null;
  const gN = curN ^ (curN >>> 1);
  const gT = targetN ^ (targetN >>> 1);
  const diff = gN ^ gT;
  let k = 0;
  let x = diff;
  while ((x & 1) === 0 && k < 32) {
    x >>>= 1;
    k++;
  }
  return k + 1;
}

export function hintTowardAllHoriz(state: State): number | null {
  const n = stateToStepsFromAllHoriz(state);
  return diffDial(n, n - 1);
}

export function hintTowardAllVertical(state: State): number | null {
  const cur = stateToStepsFromAllHoriz(state);
  const target = allVerticalStepsFromAllHoriz(state.length);
  if (cur === target) return null;
  const next = cur < target ? cur + 1 : cur - 1;
  return diffDial(cur, next);
}

export function remainingToAllHoriz(state: State): number {
  return stateToStepsFromAllHoriz(state);
}
export function remainingToAllVertical(state: State): number {
  return Math.abs(allVerticalStepsFromAllHoriz(state.length) - stateToStepsFromAllHoriz(state));
}
