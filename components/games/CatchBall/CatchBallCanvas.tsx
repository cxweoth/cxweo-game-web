'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, tickPhysics, type World } from './physics';

type Props = {
  status: 'playing' | 'gameOver';
  score: number;
  lives: number;
  best: number | null;
  onCatch: (points: number) => void;
  onMiss: () => void;
  /** 重玩時 +1，通知 Canvas 重置 World */
  resetKey: number;
};

export function CatchBallCanvas({
  status,
  score,
  lives,
  best,
  onCatch,
  onMiss,
  resetKey,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());
  /** 滑鼠 / 觸控 X(畫布內);null = 鍵盤接管 */
  const mouseXRef = useRef<number | null>(null);

  const propsRef = useRef({ status, score, lives, best, onCatch, onMiss });
  useEffect(() => {
    propsRef.current = { status, score, lives, best, onCatch, onMiss };
  });

  // 掛載 / 重玩 → 重建 World 並把焦點搶到 wrapper,讓鍵盤馬上能用
  useEffect(() => {
    worldRef.current = createWorld();
    keysRef.current.clear();
    mouseXRef.current = null;
    wrapperRef.current?.focus({ preventScroll: true });
  }, [resetKey]);

  // rAF 主迴圈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let totalTime = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      totalTime += dt;

      const p = propsRef.current;
      tickPhysics(
        worldRef.current,
        dt,
        now,
        p.status === 'playing',
        keysRef.current,
        mouseXRef.current,
        p.onCatch,
        p.onMiss,
      );

      const w = worldRef.current;
      drawScene(ctx, {
        paddleX: w.paddleX,
        balls: w.balls,
        popups: w.popups,
        score: p.score,
        lives: p.lives,
        best: p.best,
        time: totalTime,
        catchFlashUntil: w.catchFlashUntil,
        missFlashUntil: w.missFlashUntil,
        nowMs: now,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // --- 輸入 ---

  const setMouseFromClient = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    mouseXRef.current = clamp(
      ((clientX - rect.left) / rect.width) * CFG.width,
      CFG.paddleW / 2,
      CFG.width - CFG.paddleW / 2,
    );
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setMouseFromClient(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    setMouseFromClient(e.clientX);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    const blocked =
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'KeyA' ||
      e.code === 'KeyD';
    if (blocked) {
      e.preventDefault();
      // 鍵盤一按 → 解除滑鼠追蹤,讓鍵盤可以從當前位置微調
      mouseXRef.current = null;
    }
    if (e.repeat) return;
    keysRef.current.add(e.code);
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="接球"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[800px] touch-manipulation',
        'overflow-hidden rounded-lg shadow-sm',
        'select-none caret-transparent',
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        caretColor: 'transparent',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <canvas
        ref={canvasRef}
        width={CFG.width}
        height={CFG.height}
        aria-hidden
        className="block w-full"
        style={{ aspectRatio: `${CFG.width} / ${CFG.height}` }}
      />
    </div>
  );
}
