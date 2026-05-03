'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import { dropPiece, findWin, isDraw } from './logic';
import { chooseAiColumn } from './ai';
import {
  DEFAULT_PREFS,
  EMPTY_STATS,
  SLUG,
  opponent,
  type Board,
  type Player,
  type Prefs,
  type Stats,
} from './types';
import { createEmptyBoard } from './logic';

const PREFS_KEY = `${SLUG}:prefs`;
const STATS_KEY = `${SLUG}:stats`;

type Status = 'playing' | 'won' | 'draw';

export function useConnectFour() {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [turn, setTurn] = useState<Player>(1);
  const [status, setStatus] = useState<Status>('playing');
  const [winLine, setWinLine] = useState<number[]>([]);
  const [winner, setWinner] = useState<Player | 0>(0);
  /** 上一手剛落下的格子 index;用於高亮動畫 */
  const [lastDrop, setLastDrop] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const aiThinkingRef = useRef<boolean>(false);
  const aiTimerRef = useRef<number | null>(null);
  const settledRef = useRef<boolean>(false);

  useEffect(() => {
    const p = readJSON<Prefs>(PREFS_KEY);
    if (p) setPrefsState({ ...DEFAULT_PREFS, ...p });
    const s = readJSON<Stats>(STATS_KEY);
    if (s) setStats({ ...EMPTY_STATS, ...s });
  }, []);

  const inAiTurn = (t: Player, m: typeof prefs.mode, side: Player): boolean =>
    m === 'ai' && t !== side;

  const settle = useCallback(
    (b: Board, who: Player) => {
      if (settledRef.current) return;
      const w = findWin(b);
      if (w) {
        settledRef.current = true;
        setStatus('won');
        setWinLine(w.line);
        setWinner(w.winner);
        if (prefs.mode === 'ai') {
          const playerWon = w.winner === prefs.playerSide;
          const next: Stats = {
            wins: stats.wins + (playerWon ? 1 : 0),
            losses: stats.losses + (!playerWon ? 1 : 0),
            draws: stats.draws,
          };
          setStats(next);
          writeJSON(STATS_KEY, next);
        }
        return;
      }
      if (isDraw(b)) {
        settledRef.current = true;
        setStatus('draw');
        setWinner(0);
        if (prefs.mode === 'ai') {
          const next: Stats = { ...stats, draws: stats.draws + 1 };
          setStats(next);
          writeJSON(STATS_KEY, next);
        }
        return;
      }
      // 未結束 → 換人(who 已下完手)
      setTurn(opponent(who));
    },
    [prefs.mode, prefs.playerSide, stats],
  );

  const playColumn = useCallback(
    (col: number, who: Player) => {
      if (status !== 'playing') return false;
      const r = dropPiece(board, col, who);
      if (!r) return false;
      setBoard(r.board);
      setLastDrop(r.row * 7 + col);
      settle(r.board, who);
      return true;
    },
    [board, status, settle],
  );

  // 玩家點擊欄
  const clickColumn = useCallback(
    (col: number) => {
      if (status !== 'playing') return;
      if (aiThinkingRef.current) return;
      if (inAiTurn(turn, prefs.mode, prefs.playerSide)) return;
      playColumn(col, turn);
    },
    [status, turn, prefs.mode, prefs.playerSide, playColumn],
  );

  // AI 自動下
  useEffect(() => {
    if (status !== 'playing') return;
    if (!inAiTurn(turn, prefs.mode, prefs.playerSide)) return;
    aiThinkingRef.current = true;
    const tid = window.setTimeout(() => {
      const col = chooseAiColumn(board, turn, prefs.aiDepth);
      aiThinkingRef.current = false;
      if (col === -1) return;
      playColumn(col, turn);
    }, 360);
    aiTimerRef.current = tid;
    return () => {
      window.clearTimeout(tid);
      aiThinkingRef.current = false;
    };
  }, [board, turn, status, prefs.mode, prefs.playerSide, prefs.aiDepth, playColumn]);

  const restart = useCallback(() => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    settledRef.current = false;
    setBoard(createEmptyBoard());
    setTurn(1);
    setStatus('playing');
    setWinLine([]);
    setWinner(0);
    setLastDrop(null);
  }, []);

  const setPrefs = useCallback(
    (partial: Partial<Prefs>) => {
      const next = { ...prefs, ...partial };
      setPrefsState(next);
      writeJSON(PREFS_KEY, next);
      // 切模式或換邊都重開
      if (
        (partial.mode !== undefined && partial.mode !== prefs.mode) ||
        (partial.playerSide !== undefined && partial.playerSide !== prefs.playerSide)
      ) {
        if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
        settledRef.current = false;
        setBoard(createEmptyBoard());
        setTurn(1);
        setStatus('playing');
        setWinLine([]);
        setWinner(0);
        setLastDrop(null);
      }
    },
    [prefs],
  );

  const isAiThinking =
    status === 'playing' && inAiTurn(turn, prefs.mode, prefs.playerSide);

  return {
    board,
    turn,
    status,
    winLine,
    winner,
    lastDrop,
    prefs,
    stats,
    isAiThinking,
    clickColumn,
    restart,
    setPrefs,
  };
}
