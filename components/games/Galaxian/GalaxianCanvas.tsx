'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, tickPhysics, type World } from './game';
import { playSound, unlockAudio } from './sound';
import { GalaxianControls } from './GalaxianControls';

type Props = {
  status: 'playing' | 'gameOver';
  score: number;
  best: number | null;
  lives: number;
  wave: number;
  onScore: (delta: number) => void;
  onDamage: () => void;
  onWaveCleared: () => void;
  resetKey: number;
  /** 結算面板等浮動內容,只蓋 canvas 不蓋虛擬按鍵 */
  children?: ReactNode;
};

export function GalaxianCanvas({
  status,
  score,
  best,
  lives,
  wave,
  onScore,
  onDamage,
  onWaveCleared,
  resetKey,
  children,
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
  const propsRef = useRef({ status, score, best, lives, wave, onScore, onDamage, onWaveCleared });
  useEffect(() => {
    propsRef.current = { status, score, best, lives, wave, onScore, onDamage, onWaveCleared };
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
      const playing = p.status === 'playing';
      // Auto-fire:遊戲進行中飛機持續射擊,玩家專心閃避。
      // 0.18s 冷卻 + 4 發上限會自動限制射速。鍵盤 Space / ↑ / W 仍可接受
      // (ORed in for redundancy),但因為 auto-fire 永遠是 true,這條路徑只是 no-op。
      tickPhysics(
        w,
        dt,
        playing,
        keysRef.current,
        pointerXRef.current,
        playing || shootHeldRef.current,
        p.onScore,
        p.onDamage,
        p.onWaveCleared,
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
    unlockAudio();
    // 注意:不再 auto-shoot。手機上「拖拉移動」和「射擊」要分開,
    // 否則玩家想閃避時會被迫一直開火 → 這就是手機操作不順的主因之一。
    // 想射擊請按右側 🔫 鍵或鍵盤 Space / ↑ / W。
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
    // 抬起手 → 取消游標目標,飛機停下來。沒清掉的話「最後一次手指位置」會繼續拉著走。
    pointerXRef.current = null;
  };

  // 虛擬方向鍵 — 直接操作 keysRef,等同按住鍵盤箭頭。
  // (Auto-fire 處理射擊,所以這裡不需要 shoot handler。)
  const handleDirPress = (dir: -1 | 1) => {
    pointerXRef.current = null;
    keysRef.current.add(dir === -1 ? 'ArrowLeft' : 'ArrowRight');
    unlockAudio();
  };
  const handleDirRelease = (dir: -1 | 1) => {
    keysRef.current.delete(dir === -1 ? 'ArrowLeft' : 'ArrowRight');
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
    <div className="relative mx-auto w-full max-w-[480px]">
      <div
        ref={wrapperRef}
        tabIndex={0}
        role="application"
        aria-label="小蜜蜂"
        className={cn(
          'no-focus-ring',
          'block w-full touch-manipulation',
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
      {/* 懸浮虛擬按鍵 — absolute 在 canvas 左下 / 右下角,不會被擠出視窗 */}
      <GalaxianControls
        disabled={status !== 'playing'}
        onPressDir={handleDirPress}
        onReleaseDir={handleDirRelease}
      />
      {/* result panel 用 absolute inset-0 蓋住整個 .relative 容器,
          會把按鍵也一併遮罩 — 配合 disabled,玩家專心點「再來一次」 */}
      {children}
    </div>
  );
}
