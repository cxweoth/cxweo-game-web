'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { computeShake } from './fx';
import { createWorld, tickPhysics, type World } from './physics';
import { drawScene } from './render';
import { CFG } from './types';

type Props = {
  status: 'playing' | 'gameOver';
  playerHP: number;
  bossHP: number;
  onBossHPChange: (hp: number) => void;
  onPlayerHPChange: (hp: number) => void;
  onResultChange: (r: 'win' | 'lose') => void;
  /** 重玩時 +1,通知 Canvas 重置 World */
  resetKey: number;
};

/** 暴露給父元件的命令(虛擬按鍵用) */
export type SwordDuelCanvasHandle = {
  setMove: (dir: -1 | 0 | 1) => void;
  triggerAttack: () => void;
  triggerJump: () => void;
};

export const SwordDuelCanvas = forwardRef<SwordDuelCanvasHandle, Props>(function SwordDuelCanvas(
  {
    status,
    playerHP,
    bossHP,
    onBossHPChange,
    onPlayerHPChange,
    onResultChange,
    resetKey,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());
  /** 一次性訊號:本幀按下了攻擊鍵 */
  const swingPressedRef = useRef<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const propsRef = useRef({
    status,
    playerHP,
    bossHP,
    onBossHPChange,
    onPlayerHPChange,
    onResultChange,
  });
  useEffect(() => {
    propsRef.current = {
      status,
      playerHP,
      bossHP,
      onBossHPChange,
      onPlayerHPChange,
      onResultChange,
    };
  });

  useImperativeHandle(
    ref,
    () => ({
      setMove: (dir) => {
        const k = keysRef.current;
        if (dir < 0) {
          k.add('ArrowLeft');
          k.delete('ArrowRight');
        } else if (dir > 0) {
          k.add('ArrowRight');
          k.delete('ArrowLeft');
        } else {
          k.delete('ArrowLeft');
          k.delete('ArrowRight');
        }
      },
      triggerAttack: () => {
        if (propsRef.current.status === 'playing') swingPressedRef.current = true;
      },
      triggerJump: () => {
        if (propsRef.current.status === 'playing') {
          // 模擬一次按下 ArrowUp;next tick 物理會看 keys 是否含 ArrowUp 來起跳
          keysRef.current.add('ArrowUp');
          // 短暫保留(讓 physics 看到一次),60ms 後移除避免持續按住
          setTimeout(() => keysRef.current.delete('ArrowUp'), 80);
        }
      },
    }),
    [],
  );

  // 重玩
  useEffect(() => {
    worldRef.current = createWorld();
    keysRef.current.clear();
    swingPressedRef.current = false;
  }, [resetKey]);

  // 主迴圈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let last = performance.now();
    let total = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      total += dt;

      const p = propsRef.current;
      const swung = swingPressedRef.current;
      swingPressedRef.current = false;

      tickPhysics(
        worldRef.current,
        dt,
        now,
        p.status === 'playing',
        keysRef.current,
        swung,
        p.onBossHPChange,
        p.onPlayerHPChange,
        p.onResultChange,
      );

      const w = worldRef.current;
      drawScene(ctx, {
        player: w.player,
        boss: w.boss,
        particles: w.particles,
        floatTexts: w.floatTexts,
        shake: computeShake(w.shake, now),
        playerHP: w.playerHP,
        bossHP: w.bossHP,
        time: total,
        nowMs: now,
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 自動聚焦,讓鍵盤直接可用
  useEffect(() => {
    wrapperRef.current?.focus();
  }, [resetKey]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    const blocked =
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'KeyA' ||
      e.code === 'KeyD' ||
      e.code === 'KeyW' ||
      e.code === 'KeyS' ||
      e.code === 'KeyZ' ||
      e.code === 'Space' ||
      e.code === 'KeyJ' ||
      e.code === 'KeyK';
    if (blocked) e.preventDefault();
    if (e.repeat) {
      // 移動鍵 repeat 沒意義(已加入 keysRef);攻擊鍵 repeat 不視為新按
      return;
    }
    keysRef.current.add(e.code);
    if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyK') {
      swingPressedRef.current = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="劍盾決鬥"
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
});
