'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, tickPhysics, type World } from './physics';

type Props = {
  status: 'playing' | 'gameOver';
  hp: number;
  score: number;
  best: number | null;
  onScore: (points: number) => void;
  onDamage: (amount: number) => void;
  resetKey: number;
};

export function StairsCanvas({
  status,
  hp,
  score,
  best,
  onScore,
  onDamage,
  resetKey,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());
  /** 滑鼠/觸控時的目標 X(畫布內座標),null = 不使用 */
  const mouseXRef = useRef<number | null>(null);

  const propsRef = useRef({ status, hp, score, best, onScore, onDamage });
  useEffect(() => {
    propsRef.current = { status, hp, score, best, onScore, onDamage };
  });

  useEffect(() => {
    worldRef.current = createWorld();
    keysRef.current.clear();
    mouseXRef.current = null;
    // 重玩 / 掛載 → 搶焦點，讓鍵盤馬上能用
    wrapperRef.current?.focus({ preventScroll: true });
  }, [resetKey]);

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
        p.onDamage,
        p.onScore,
      );

      const w = worldRef.current;
      drawScene(ctx, {
        char: w.char,
        stairs: w.stairs,
        hp: p.hp,
        score: p.score,
        best: p.best,
        time: totalTime,
        hurtFlashUntil: w.hurtFlashUntil,
        nowMs: now,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const setMouseFromClient = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    mouseXRef.current = clamp(
      ((clientX - rect.left) / rect.width) * CFG.width,
      CFG.charW / 2,
      CFG.width - CFG.charW / 2,
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
      mouseXRef.current = null; // 鍵盤接管
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
      aria-label="下樓梯"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[480px] touch-manipulation',
        'overflow-hidden rounded-lg shadow-md',
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
