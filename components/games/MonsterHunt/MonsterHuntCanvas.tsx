'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { computeShake } from './fx';
import {
  createWorld,
  tickPhysics,
  triggerMonsterDeath,
  triggerPlayerDeath,
  tryShootArrow,
  type World,
} from './physics';

type Props = {
  status: 'playing' | 'gameOver';
  playerHP: number;
  monsterHP: number;
  onMonsterHit: () => void;
  onPlayerHit: () => void;
  /** 重玩時 +1，通知 Canvas 重置 World */
  resetKey: number;
};

/**
 * 物理 + 輸入 + rAF 整合層。所有「每幀變動」的東西在 worldRef 裡
 * （見 physics.ts），這裡只負責 React 整合：refs、事件、rAF 排程。
 */
export function MonsterHuntCanvas({
  status,
  playerHP,
  monsterHP,
  onMonsterHit,
  onPlayerHit,
  resetKey,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());
  const prevMonsterHPRef = useRef<number>(CFG.monsterHP);
  const prevPlayerHPRef = useRef<number>(CFG.playerHP);

  const propsRef = useRef({ status, playerHP, monsterHP, onMonsterHit, onPlayerHit });
  useEffect(() => {
    propsRef.current = { status, playerHP, monsterHP, onMonsterHit, onPlayerHit };
  });

  // 重玩：重建整個 World，HP 追蹤 ref 也歸零
  useEffect(() => {
    worldRef.current = createWorld();
    prevMonsterHPRef.current = CFG.monsterHP;
    prevPlayerHPRef.current = CFG.playerHP;
    keysRef.current.clear();
  }, [resetKey]);

  // HP 從 >0 → 0 的瞬間，觸發死亡特效
  useEffect(() => {
    const w = worldRef.current;
    const now = performance.now();
    if (prevMonsterHPRef.current > 0 && monsterHP === 0) triggerMonsterDeath(w, now);
    if (prevPlayerHPRef.current > 0 && playerHP === 0) triggerPlayerDeath(w, now);
    prevMonsterHPRef.current = monsterHP;
    prevPlayerHPRef.current = playerHP;
  }, [monsterHP, playerHP]);

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
        p.onMonsterHit,
        p.onPlayerHit,
      );

      const w = worldRef.current;
      drawScene(ctx, {
        playerY: w.playerY,
        monsterY: w.monsterY,
        arrows: w.arrows,
        fireballs: w.fireballs,
        particles: w.particles,
        monsterFlashUntil: w.monsterFlashUntil,
        playerFlashUntil: w.playerFlashUntil,
        monsterDeath: w.monsterDeath,
        playerDeath: w.playerDeath,
        shake: computeShake(w.shake, now),
        playerHP: p.playerHP,
        monsterHP: p.monsterHP,
        time: totalTime,
        nowMs: now,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // --- 輸入 ---

  const setPlayerYFromClient = (clientY: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const yInCanvas = ((clientY - rect.top) / rect.height) * CFG.height;
    worldRef.current.playerY = clamp(yInCanvas, CFG.playerYMin, CFG.playerYMax);
  };

  const shootIfPlaying = () => {
    if (propsRef.current.status === 'playing') {
      tryShootArrow(worldRef.current, performance.now());
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPlayerYFromClient(e.clientY);
    shootIfPlaying();
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    setPlayerYFromClient(e.clientY);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 已 release 過會丟錯，忽略
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    const blocked =
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'KeyW' ||
      e.code === 'KeyS' ||
      e.code === 'Space';
    if (blocked) e.preventDefault();
    if (e.repeat) return;
    keysRef.current.add(e.code);
    if (e.code === 'Space' || e.code === 'Enter') shootIfPlaying();
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
  };

  return (
    <div
      tabIndex={0}
      role="application"
      aria-label="弓手獵怪"
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
