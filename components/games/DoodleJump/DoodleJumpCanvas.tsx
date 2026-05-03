'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, score, tickWorld, type World } from './game';

type Props = {
  status: 'playing' | 'gameOver';
  onScore: (s: number) => void;
  onDie: () => void;
  resetKey: number;
};

export function DoodleJumpCanvas({ status, onScore, onDie, resetKey }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const propsRef = useRef({ status, onScore, onDie });
  useEffect(() => {
    propsRef.current = { status, onScore, onDie };
  });

  /** 鍵盤狀態:左 / 右(支援同時按) */
  const inputRef = useRef({ left: false, right: false });
  /** 觸控:當前指 x */
  const touchRef = useRef<{ id: number } | null>(null);

  // 重玩 → 重建世界
  useEffect(() => {
    worldRef.current = createWorld();
    inputRef.current = { left: false, right: false };
    wrapperRef.current?.focus({ preventScroll: true });
  }, [resetKey]);

  // rAF 主迴圈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let lastNow = performance.now();
    let lastReportedScore = 0;
    let diedReported = false;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      const w = worldRef.current;
      const p = propsRef.current;

      // 套用輸入到玩家速度(只在 playing)
      if (p.status === 'playing' && w.alive) {
        let vx = 0;
        if (inputRef.current.left) vx -= CFG.moveVx;
        if (inputRef.current.right) vx += CFG.moveVx;
        w.pvx = vx;
      } else {
        w.pvx = 0;
      }

      tickWorld(w, dt);

      // 分數通報(節流 — 整數變動才更新)
      const s = score(w);
      if (s !== lastReportedScore) {
        lastReportedScore = s;
        p.onScore(s);
      }

      // 死亡通報(只觸發一次)
      if (!w.alive && !diedReported && p.status === 'playing') {
        diedReported = true;
        p.onDie();
      }
      if (w.alive) diedReported = false;

      drawScene(ctx, w);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- 鍵盤 ---
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      inputRef.current.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      inputRef.current.right = true;
    }
  };
  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputRef.current.left = false;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRef.current.right = false;
  };

  // --- 觸控:依手指 x 相對 canvas 中央決定方向(連續觸控就持續移動) ---
  const updateFromTouch = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const local = clientX - rect.left;
    const relative = local / rect.width;
    inputRef.current.left = relative < 0.45;
    inputRef.current.right = relative > 0.55;
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') {
      touchRef.current = { id: e.pointerId };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // 忽略已 capture
      }
      updateFromTouch(e.clientX);
    }
    wrapperRef.current?.focus({ preventScroll: true });
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (touchRef.current?.id === e.pointerId) updateFromTouch(e.clientX);
  };
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (touchRef.current?.id === e.pointerId) {
      touchRef.current = null;
      inputRef.current.left = false;
      inputRef.current.right = false;
    }
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="跳躍王"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[360px] touch-none',
        'overflow-hidden rounded-lg shadow-sm',
        'select-none caret-transparent',
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        caretColor: 'transparent',
        touchAction: 'none',
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
