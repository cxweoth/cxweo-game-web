'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { getBestTime, setBestTime } from '@/lib/storage';
import {
  DIFFICULTIES,
  SYMBOL_POOL,
  bestTimeKey,
  totalPairs,
  type Card,
  type Difficulty,
  type MemoryState,
} from './types';

let nextCardId = 1;
function newId(): number {
  return nextCardId++;
}

/** Fisher–Yates 就地洗牌 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function makeDeck(d: Difficulty): Card[] {
  const pairs = totalPairs(d);
  // 從 pool 取 pairs 種 symbol(先複製再洗,避免修改 pool)
  const pool = [...SYMBOL_POOL];
  shuffle(pool);
  const symbols = pool.slice(0, pairs);
  const cards: Card[] = [];
  for (const s of symbols) {
    cards.push({ id: newId(), symbol: s, state: 'down' });
    cards.push({ id: newId(), symbol: s, state: 'down' });
  }
  return shuffle(cards);
}

function init(difficulty: Difficulty): MemoryState {
  return {
    difficulty,
    status: 'playing',
    cards: makeDeck(difficulty),
    flippedIds: [],
    attempts: 0,
    matched: 0,
    startedAt: null,
    endedAt: null,
  };
}

type Action =
  | { type: 'flip'; id: number }
  | { type: 'unflip' }
  | { type: 'reset'; difficulty?: Difficulty };

function reducer(state: MemoryState, action: Action): MemoryState {
  switch (action.type) {
    case 'reset':
      return init(action.difficulty ?? state.difficulty);

    case 'flip': {
      if (state.status !== 'playing') return state;
      // 已經有兩張在等判定 → 忽略(useEffect 會排 unflip)
      if (state.flippedIds.length >= 2) return state;
      const idx = state.cards.findIndex((c) => c.id === action.id);
      if (idx < 0) return state;
      const card = state.cards[idx]!;
      if (card.state !== 'down') return state;

      const cards = state.cards.map((c) =>
        c.id === action.id ? { ...c, state: 'up' as const } : c,
      );
      const flippedIds = [...state.flippedIds, action.id];
      const startedAt = state.startedAt ?? Date.now();

      // 翻起第二張 → 立即判定
      if (flippedIds.length === 2) {
        const [aId, bId] = flippedIds as [number, number];
        const a = cards.find((c) => c.id === aId)!;
        const b = cards.find((c) => c.id === bId)!;
        if (a.symbol === b.symbol) {
          // 配對成功:兩張變 matched,清空 flippedIds,加 1 次嘗試
          const matchedCards = cards.map((c) =>
            c.id === aId || c.id === bId ? { ...c, state: 'matched' as const } : c,
          );
          const matched = state.matched + 1;
          const won = matched >= totalPairs(state.difficulty);
          return {
            ...state,
            cards: matchedCards,
            flippedIds: [],
            attempts: state.attempts + 1,
            matched,
            startedAt,
            status: won ? 'gameOver' : 'playing',
            endedAt: won ? Date.now() : null,
          };
        }
        // 不配對:保留兩張翻起;由 component 排 setTimeout 後 dispatch 'unflip'
        return { ...state, cards, flippedIds, startedAt };
      }
      return { ...state, cards, flippedIds, startedAt };
    }

    case 'unflip': {
      // 把所有 flippedIds 翻回 down,加 1 次嘗試
      if (state.flippedIds.length === 0) return state;
      const ids = new Set(state.flippedIds);
      const cards = state.cards.map((c) =>
        ids.has(c.id) ? { ...c, state: 'down' as const } : c,
      );
      return {
        ...state,
        cards,
        flippedIds: [],
        attempts: state.attempts + 1,
      };
    }
    default:
      return state;
  }
}

export function useMemory(initial: Difficulty = 'easy') {
  const [state, dispatch] = useReducer(reducer, initial, init);

  // UI 計時:playing 期間每 250ms tick 顯示秒數(同 Minesweeper 的 timer 模式;
  // 這不是動畫主迴圈,只是 HUD 顯示,所以 setInterval 是 OK 的)。
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (state.status !== 'playing' || state.startedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [state.status, state.startedAt]);

  // 兩張不配對 → 排程 unflip(700ms 讓玩家記住)
  useEffect(() => {
    if (state.flippedIds.length !== 2) return;
    const id = window.setTimeout(() => dispatch({ type: 'unflip' }), 700);
    return () => window.clearTimeout(id);
  }, [state.flippedIds]);

  // 最佳時間:每難度獨立記錄;勝利時嘗試刷新
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    setBest(getBestTime(bestTimeKey(state.difficulty)));
  }, [state.difficulty]);

  const elapsed = state.startedAt
    ? Math.floor(
        ((state.status === 'gameOver' && state.endedAt
          ? state.endedAt
          : now) -
          state.startedAt) /
          1000,
      )
    : 0;

  useEffect(() => {
    if (state.status !== 'gameOver' || state.endedAt === null) return;
    const total = Math.max(
      0,
      Math.floor((state.endedAt - (state.startedAt ?? state.endedAt)) / 1000),
    );
    const updated = setBestTime(bestTimeKey(state.difficulty), total);
    if (updated) setBest(total);
  }, [state.status, state.endedAt, state.difficulty, state.startedAt]);

  const flip = useCallback((id: number) => dispatch({ type: 'flip', id }), []);
  const reset = useCallback(
    (d?: Difficulty) => dispatch({ type: 'reset', difficulty: d }),
    [],
  );

  return {
    state,
    config: DIFFICULTIES[state.difficulty],
    elapsed,
    best,
    flip,
    reset,
  };
}
