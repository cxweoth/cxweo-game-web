'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import {
  applyMove,
  checkWinner,
  countStones,
  createInitialBoard,
  legalAt,
  legalMoves,
  nextTurn,
} from './logic';
import { chooseAiMove } from './ai';
import {
  DEFAULT_PREFS,
  EMPTY_STATS,
  SLUG,
  opponent,
  type Board,
  type Mode,
  type Player,
  type Prefs,
  type Stats,
} from './types';

const PREFS_KEY = `${SLUG}:prefs`;
const STATS_KEY = `${SLUG}:stats`;

type Status = 'playing' | 'gameOver';

/**
 * 黑白棋 hook
 *
 * 棋盤狀態用 React state(每步都要 re-render),AI 模式 thinking 期間用 ref 防止
 * 玩家在 AI 思考中再點。AI 動作以 setTimeout 模擬「思考延遲」,讓玩家看清楚翻片。
 */
export function useReversi() {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [turn, setTurn] = useState<Player>(1);
  const [status, setStatus] = useState<Status>('playing');
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  /** 記下對方上一手剛被翻的格子,渲染時可加翻片動畫(目前沒用上,但留作 hook) */
  const [lastFlips, setLastFlips] = useState<number[]>([]);

  const aiThinkingRef = useRef<boolean>(false);
  const aiTimerRef = useRef<number | null>(null);
  const settledRef = useRef<boolean>(false);

  // 初始載入偏好 / 戰績
  useEffect(() => {
    const p = readJSON<Prefs>(PREFS_KEY);
    if (p) setPrefsState({ ...DEFAULT_PREFS, ...p });
    const s = readJSON<Stats>(STATS_KEY);
    if (s) setStats({ ...EMPTY_STATS, ...s });
  }, []);

  const inAiTurn = (t: Player, m: Mode, side: Player): boolean =>
    m === 'ai' && t !== side;

  // 計算合法步(只在 PvP 玩家或 AI 玩家持有時提示)
  const myLegalSet = (() => {
    if (status !== 'playing') return new Set<number>();
    if (inAiTurn(turn, prefs.mode, prefs.playerSide)) return new Set<number>();
    return new Set(legalMoves(board, turn).map((m) => m.index));
  })();

  /** 結算 → 寫入戰績一次性 */
  const settle = useCallback(
    (b: Board) => {
      if (settledRef.current) return;
      const r = checkWinner(b);
      if (!r.gameOver) return;
      settledRef.current = true;
      setStatus('gameOver');
      setWinner(r.winner);
      // PvP 不更新戰績(避免相互練功時亂數)
      if (prefs.mode === 'ai') {
        const playerWon =
          r.winner === prefs.playerSide ||
          // 對方無子全翻則我方贏:已包含於 winner
          false;
        const next: Stats = {
          wins: stats.wins + (playerWon ? 1 : 0),
          losses: stats.losses + (r.winner !== 0 && !playerWon ? 1 : 0),
          draws: stats.draws + (r.winner === 0 ? 1 : 0),
        };
        setStats(next);
        writeJSON(STATS_KEY, next);
      }
    },
    [prefs.mode, prefs.playerSide, stats],
  );

  // 一手主流程:把 move 套到 board,再算下一輪該誰
  const playMove = useCallback(
    (idx: number, who: Player) => {
      const flips = legalAt(board, idx, who);
      if (flips.length === 0) return false;
      const move = { index: idx, flips };
      const next = applyMove(board, move, who);
      setBoard(next);
      setLastFlips(flips);

      const t = nextTurn(next, who);
      if (t === null) {
        // 雙方都無步 → 結束
        settle(next);
      } else {
        setTurn(t);
      }
      return true;
    },
    [board, settle],
  );

  // 玩家點擊 → 落子
  const clickCell = useCallback(
    (idx: number) => {
      if (status !== 'playing') return;
      if (aiThinkingRef.current) return;
      if (inAiTurn(turn, prefs.mode, prefs.playerSide)) return;
      playMove(idx, turn);
    },
    [status, turn, prefs.mode, prefs.playerSide, playMove],
  );

  // AI 自動下:每當輪到 AI 時觸發
  useEffect(() => {
    if (status !== 'playing') return;
    if (!inAiTurn(turn, prefs.mode, prefs.playerSide)) return;
    aiThinkingRef.current = true;
    const tid = window.setTimeout(() => {
      const move = chooseAiMove(board, turn);
      aiThinkingRef.current = false;
      if (!move) {
        // AI 無步 → 換人
        const t = nextTurn(board, turn);
        if (t === null) settle(board);
        else setTurn(t);
        return;
      }
      const next = applyMove(board, move, turn);
      setBoard(next);
      setLastFlips(move.flips);
      const t = nextTurn(next, turn);
      if (t === null) settle(next);
      else setTurn(t);
    }, 380);
    aiTimerRef.current = tid;
    return () => {
      window.clearTimeout(tid);
      aiThinkingRef.current = false;
    };
  }, [board, turn, status, prefs.mode, prefs.playerSide, settle]);

  const restart = useCallback(() => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    settledRef.current = false;
    setBoard(createInitialBoard());
    setTurn(1);
    setStatus('playing');
    setWinner(0);
    setLastFlips([]);
  }, []);

  const setPrefs = useCallback(
    (partial: Partial<Prefs>) => {
      const next = { ...prefs, ...partial };
      setPrefsState(next);
      writeJSON(PREFS_KEY, next);
      // 改變模式 / 換邊都重新開局
      if (
        partial.mode !== undefined && partial.mode !== prefs.mode ||
        partial.playerSide !== undefined && partial.playerSide !== prefs.playerSide
      ) {
        if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
        settledRef.current = false;
        setBoard(createInitialBoard());
        setTurn(1);
        setStatus('playing');
        setWinner(0);
        setLastFlips([]);
      }
    },
    [prefs],
  );

  const counts = countStones(board);
  const isAiThinking =
    status === 'playing' && inAiTurn(turn, prefs.mode, prefs.playerSide);

  return {
    board,
    turn,
    status,
    winner,
    prefs,
    stats,
    counts,
    legalSet: myLegalSet,
    lastFlips,
    isAiThinking,
    clickCell,
    restart,
    setPrefs,
    opponent,
  };
}
