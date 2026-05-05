'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { SwordDuelCanvas, type SwordDuelCanvasHandle } from './SwordDuelCanvas';
import { useSwordDuel } from './useSwordDuel';

export function SwordDuel() {
  const {
    status,
    result,
    playerHP,
    bossHP,
    stats,
    runId,
    onBossHPChange,
    onPlayerHPChange,
    onResultChange,
    restart,
  } = useSwordDuel();

  const canvasRef = useRef<SwordDuelCanvasHandle>(null);
  const isOver = status === 'gameOver';
  const total = stats.wins + stats.losses;

  return (
    <GameShell
      title="劍盾決鬥"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            {isOver ? '再來一局' : '重新開始'}
          </Button>
          <div className="ml-auto rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            W {stats.wins}・L {stats.losses}
            {total > 0 ? ` (${total})` : ''}
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>移動</strong>:鍵盤 ←→ / A D。
            <strong> 跳躍</strong>:↑ / W / Z(可跳過怪物的劍)。
            <strong> 揮劍</strong>:空白鍵 / J / K。觸控用底部虛擬按鍵。
          </li>
          <li>
            怪物會輪流<strong>舉盾防禦</strong>與<strong>揮劍攻擊</strong>。從正面打盾 = 0 傷害,
            被擋會冒「BLOCK」火星。
          </li>
          <li>
            <strong>怪物揮劍時 facing 鎖定</strong>:衝到牠背後砍可造成
            <strong> 1.5× 致命傷害</strong>(顯示「致命!」金字)。也可以跳起來避過劍。
          </li>
          <li>玩家 HP 100、怪物 HP 130。砍倒怪物即勝;HP 歸 0 即敗。</li>
        </ul>
      }
    >
      {isOver ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
            result === 'win'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {result === 'win' ? '🏆' : '💀'}
            </span>
            <span className="font-semibold">
              {result === 'win' ? '勝利!擊敗哥布林戰士' : '失敗⋯⋯被怪物砍倒了'}
            </span>
          </div>
          <Button size="sm" onClick={restart}>
            再來一局
          </Button>
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <span>HP 騎士 <strong>{playerHP}</strong> / 哥布林 <strong>{bossHP}</strong></span>
        </div>
      )}

      <SwordDuelCanvas
        ref={canvasRef}
        status={status}
        playerHP={playerHP}
        bossHP={bossHP}
        onBossHPChange={onBossHPChange}
        onPlayerHPChange={onPlayerHPChange}
        onResultChange={onResultChange}
        resetKey={runId}
      />

      {/* 虛擬按鍵 — 觸控/小螢幕用 */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <VirtualBtn
            label="←"
            onDown={() => canvasRef.current?.setMove(-1)}
            onUp={() => canvasRef.current?.setMove(0)}
          />
          <VirtualBtn
            label="→"
            onDown={() => canvasRef.current?.setMove(1)}
            onUp={() => canvasRef.current?.setMove(0)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              canvasRef.current?.triggerJump();
            }}
            onPointerUp={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* ignore */
              }
            }}
            className={cn(
              'h-14 rounded-lg px-5 text-base font-bold text-white shadow-md transition-transform',
              'bg-amber-500 hover:bg-amber-400 active:scale-95',
            )}
          >
            跳 ↑
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              canvasRef.current?.triggerAttack();
            }}
            onPointerUp={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* ignore */
              }
            }}
            className={cn(
              'h-14 rounded-lg px-6 text-base font-bold text-white shadow-md transition-transform',
              'bg-rose-600 hover:bg-rose-500 active:scale-95',
            )}
          >
            揮劍 ⚔️
          </button>
        </div>
      </div>
    </GameShell>
  );
}

function VirtualBtn({
  label,
  onDown,
  onUp,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={(e) => {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        onUp();
      }}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      className="h-14 w-16 rounded-lg bg-zinc-900 text-2xl font-bold text-white shadow-md transition-transform hover:bg-zinc-700 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      {label}
    </button>
  );
}
