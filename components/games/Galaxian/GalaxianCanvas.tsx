'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, tickPhysics, type World } from './game';
import { playSound, unlockAudio } from './sound';

type Props = {
  status: 'playing' | 'gameOver';
  score: number;
  best: number | null;
  lives: number;
  wave: number;
  onScore: (delta: number) => void;
  onDamage: () => void;
  resetKey: number;
};

export function GalaxianCanvas({
  status,
  score,
  best,
  lives,
  wave,
  onScore,
  onDamage,
  resetKey,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());
  /** 滑鼠 / 觸控目標 X(畫布內);null = 鍵盤接管 */
  const pointerXRef = useRef<number | null>(null);
  /** 滑鼠按住或空白鍵按住時連續射擊 */
  const shootHeldRef = useRef(false);

  // props 鏡射(避免 rAF closure 抓到舊值)
  const propsRef = useRef({ status, score, best, lives, wave, onScore, onDamage });
  useEffect(() => {
    propsRef.current = { status, score, best, lives, wave, onScore, onDamage };
  });

  // 重玩 / 掛載 → 重置 World + 搶焦點
  useEffect(() => {
    worldRef.current = createWorld();
    keysRef.current.clear();
    pointerXRef.current = null;
    shootHeldRef.current = false;
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
      const w = worldRef.current;
      tickPhysics(
        w,
        dt,
        p.status === 'playing',
        keysRef.current,
        pointerXRef.current,
        shootHeldRef.current,
        p.onScore,
        p.onDamage,
        playSound,
      );

      drawScene(ctx, {
        ship: w.ship,
        bees: w.bees,
        bullets: w.bullets,
        bombs: w.bombs,
        score: p.score,
        best: p.best,
        lives: p.lives,
        wave: p.wave,
        totalTime,
        dt,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const setPointerFromClient = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    pointerXRef.current = clamp(
      ((clientX - rect.left) / rect.width) * CFG.width,
      CFG.shipW / 2,
      CFG.width - CFG.shipW / 2,
    );
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPointerFromClient(e.clientX);
    shootHeldRef.current = true;
    unlockAudio();
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    setPointerFromClient(e.clientX);
  };
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    shootHeldRef.current = false;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    unlockAudio();
    const blocked =
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'KeyA' ||
      e.code === 'KeyD' ||
      e.code === 'Space' ||
      e.code === 'KeyW' ||
      e.code === 'ArrowUp';
    if (blocked) {
      e.preventDefault();
      pointerXRef.current = null;
    }
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      shootHeldRef.current = true;
    }
    if (e.repeat) return;
    keysRef.current.add(e.code);
  };
  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      shootHeldRef.current = false;
    }
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="小蜜蜂"
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
