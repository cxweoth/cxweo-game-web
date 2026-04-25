'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import {
  Bag,
  clearLines,
  dropInterval,
  emptyBoard,
  ghostPiece,
  hardDrop,
  isValid,
  lineScore,
  lockIn,
  spawnPiece,
  tryMove,
  tryRotate,
} from './logic';
import { CFG, SLUG, type Board, type Piece, type PieceType } from './types';

type Status = 'playing' | 'paused' | 'gameOver';

/**
 * 俄羅斯方塊回合狀態。
 *
 * 為了讓 UI 即時看到 board 變化，所有可變狀態都走 React state；
 * 自動下落計時器透過 useEffect + setTimeout 推進。
 * 對 60 FPS 動畫不適用，但 Tetris 邏輯本身是離散的（每步格），
 * 改用 setTimeout 比 rAF 更直觀。
 */
export function useTetris() {
  const bagRef = useRef<Bag>(new Bag());
  const [board, setBoard] = useState<Board>(() => emptyBoard());
  const [piece, setPiece] = useState<Piece>(() => spawnPiece(bagRef.current.next()));
  const [next, setNext] = useState<PieceType>(() => bagRef.current.peek(1)[0]!);
  const [status, setStatus] = useState<Status>('playing');
  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [best, setBest] = useState<number | null>(null);
  /** 軟降中（按住 ↓） */
  const [softDrop, setSoftDrop] = useState<boolean>(false);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  // --- 動作 ---

  const advanceToNextPiece = useCallback(
    (b: Board) => {
      // 消行
      const { board: cleared, lines: cleared_n } = clearLines(b);
      setBoard(cleared);
      if (cleared_n > 0) {
        setLines((prev) => {
          const total = prev + cleared_n;
          const newLevel = Math.floor(total / CFG.linesPerLevel) + 1;
          setLevel(newLevel);
          setScore((s) => s + lineScore(cleared_n, newLevel));
          return total;
        });
      }
      // 抽下一個
      const incoming = bagRef.current.next();
      const newPiece = spawnPiece(incoming);
      setNext(bagRef.current.peek(1)[0]!);
      // 出生即撞 → game over
      if (!isValid(cleared, newPiece)) {
        setStatus('gameOver');
        // 寫入最佳分(用 functional setBest 避免 stale)
        setScore((s) => {
          if (setHighScore(SLUG, s)) setBest(s);
          return s;
        });
        return;
      }
      setPiece(newPiece);
    },
    [],
  );

  const move = useCallback(
    (dx: number, dy: number): boolean => {
      if (status !== 'playing') return false;
      const m = tryMove(board, piece, dx, dy);
      if (m) {
        setPiece(m);
        return true;
      }
      return false;
    },
    [board, piece, status],
  );

  const rotate = useCallback(() => {
    if (status !== 'playing') return;
    const r = tryRotate(board, piece, 1);
    if (r) setPiece(r);
  }, [board, piece, status]);

  /** 自動軟降(計時器驅動) — 撞到地時鎖定 */
  const softStep = useCallback(() => {
    if (status !== 'playing') return;
    const m = tryMove(board, piece, 0, 1);
    if (m) {
      setPiece(m);
    } else {
      // 鎖定 + 進下一塊
      advanceToNextPiece(lockIn(board, piece));
    }
  }, [board, piece, status, advanceToNextPiece]);

  const drop = useCallback(() => {
    if (status !== 'playing') return;
    const { piece: landed, cells } = hardDrop(board, piece);
    setScore((s) => s + cells * 2);
    advanceToNextPiece(lockIn(board, landed));
  }, [board, piece, status, advanceToNextPiece]);

  const togglePause = useCallback(() => {
    setStatus((s) => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));
  }, []);

  const restart = useCallback(() => {
    bagRef.current = new Bag();
    setBoard(emptyBoard());
    const incoming = bagRef.current.next();
    setPiece(spawnPiece(incoming));
    setNext(bagRef.current.peek(1)[0]!);
    setStatus('playing');
    setScore(0);
    setLines(0);
    setLevel(1);
    setSoftDrop(false);
  }, []);

  const setSoftDropActive = useCallback((on: boolean) => setSoftDrop(on), []);

  // --- 自動下落計時器 ---
  useEffect(() => {
    if (status !== 'playing') return;
    const interval = softDrop ? Math.max(40, dropInterval(level) / CFG.softDropMul) : dropInterval(level);
    const t = window.setTimeout(softStep, interval);
    return () => window.clearTimeout(t);
  }, [status, softDrop, level, softStep]);

  const ghost = ghostPiece(board, piece);

  return {
    board,
    piece,
    ghost,
    next,
    status,
    score,
    lines,
    level,
    best,
    move,
    rotate,
    drop,
    setSoftDropActive,
    togglePause,
    restart,
  };
}
