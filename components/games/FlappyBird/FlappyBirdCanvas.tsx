'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, flap, tickWorld, type World } from './game';

type Props = {
  status: 'idle' | 'playing' | 'gameOver';
  /** 第一次起飛時通知 hook 把 status 切到 playing */
  onStart: () => void;
  /** 通過一根水管 → +1 分 */
  onPass: () => void;
  /** 撞到 → gameOver */
  onDie: () => void;
  /** 重玩時 +1 → Canvas 重建 world */
  resetKey: number;
};

export function FlappyBirdCanvas({ status, onStart, onPass, onDie, resetKey }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const propsRef = useRef({ status, onStart, onPass, onDie });
  useEffect(() => {
    propsRef.current = { status, onStart, onPass, onDie };
  });

  // 重玩 → 重建世界 + 把焦點搶回來給鍵盤用
  useEffect(() => {
    worldRef.current = createWorld();
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

    const tick = (now: number) => {
      // 切回背景時的巨幅 dt 上限保護
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;

      const w = worldRef.current;
      const p = propsRef.current;

      // gameOver 狀態下仍 tick 以播完粒子 / 抖動,但不再 onDie
      const result = tickWorld(w, dt);
      if (result.passed > 0) {
        for (let i = 0; i < result.passed; i++) p.onPass();
      }
      if (result.died) p.onDie();

      drawScene(ctx, w);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- 操作 ---

  const tryFlap = () => {
    const w = worldRef.current;
    const p = propsRef.current;
    if (p.status === 'gameOver') return;
    const wasIdle = w.status === 'idle';
    flap(w);
    // idle → playing 時要通知 hook,讓 status state 也跟上
    if (wasIdle && w.status === 'playing') p.onStart();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 空白鍵 / ↑ / W 都當拍翅
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      tryFlap();
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    tryFlap();
    wrapperRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="跳跳鳥"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[480px] touch-none',
        'overflow-hidden rounded-lg shadow-sm',
        'select-none caret-transparent',
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        caretColor: 'transparent',
        touchAction: 'none',
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
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
