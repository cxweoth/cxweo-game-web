'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { applyMove, createInitialState } from './logic';
import type { Direction, Game2048State } from './types';

type Action =
  | { type: 'move'; dir: Direction }
  | { type: 'reset' }
  | { type: 'continue' }
  | { type: 'cleanupVanishing' };

function reducer(state: Game2048State, action: Action): Game2048State {
  switch (action.type) {
    case 'move':
      return applyMove(state, action.dir);
    case 'cleanupVanishing':
      return state.vanishing.length === 0 ? state : { ...state, vanishing: [] };
    case 'reset':
      return createInitialState();
    case 'continue':
      return state.continued ? state : { ...state, continued: true };
    default:
      return state;
  }
}

/** 與 CSS 內 transition-duration 對齊;略長一些以蓋掉 isMerged 動畫尾巴 */
const VANISH_CLEANUP_MS = 220;

export function useGame2048() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const move = useCallback((dir: Direction) => dispatch({ type: 'move', dir }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const continueGame = useCallback(() => dispatch({ type: 'continue' }), []);

  // 鍵盤:全域監聽。輸入框被 focus 時跳過,避免干擾(本站目前沒輸入框,但未來可能有)。
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ae = document.activeElement;
      if (
        ae instanceof HTMLInputElement ||
        ae instanceof HTMLTextAreaElement ||
        (ae instanceof HTMLElement && ae.isContentEditable)
      ) {
        return;
      }
      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dir = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dir = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dir = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dir = 'right';
          break;
      }
      if (!dir) return;
      e.preventDefault();
      dispatch({ type: 'move', dir });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 動畫尾巴:vanishing 不為空時排程清空,讓滑動 + 合併動畫播完
  useEffect(() => {
    if (state.vanishing.length === 0) return;
    const id = window.setTimeout(
      () => dispatch({ type: 'cleanupVanishing' }),
      VANISH_CLEANUP_MS,
    );
    return () => window.clearTimeout(id);
  }, [state.vanishing]);

  return { state, move, reset, continueGame };
}
