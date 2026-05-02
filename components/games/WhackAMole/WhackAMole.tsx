'use client';

import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useWhackAMole } from './useWhackAMole';
import type { Hole as HoleT } from './types';
import { CFG } from './types';

export function WhackAMole() {
  const { status, score, hits, misses, timeLeft, holes, best, start, whack } =
    useWhackAMole();

  const isIdle = status === 'idle';
  const isOver = status === 'gameOver';
  const isBest = isOver && best !== null && best === score && score > 0;
  const accuracy =
    hits + misses === 0 ? 0 : Math.round((hits / (hits + misses)) * 100);

  return (
    <GameShell
      title="打地鼠"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={start}>
            {isIdle ? '開始遊戲' : '重玩'}
          </Button>
          <div className="ml-auto">
            <ScoreBoard
              score={score}
              best={best ?? 0}
              extras={[
                { label: 'TIME', value: `${timeLeft}s` },
                { label: 'HITS', value: hits },
                { label: 'ACC', value: `${accuracy}%` },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            地鼠會從 9 個地洞隨機冒出;<strong>{CFG.roundSeconds} 秒</strong>{' '}
            內盡量打越多越好。
          </li>
          <li>
            打中 +{CFG.hitScore} 分;打到空地 −{CFG.missPenalty} 分(不會到負分)。
          </li>
          <li>遊戲後段冒頭速度會加快、停留時間縮短,反應要更快。</li>
          <li>支援滑鼠 / 觸控點擊。</li>
        </ul>
      }
    >
      {isOver ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              🔨
            </span>
            <span className="font-semibold">時間到!</span>
            <span className="opacity-80">
              分數 {score} ・ 命中 {hits} / 失手 {misses} ・ 命中率 {accuracy}%
            </span>
            {isBest ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                🏆 刷新紀錄
              </span>
            ) : best !== null ? (
              <span className="opacity-80">最佳 {best}</span>
            ) : null}
          </div>
          <Button size="sm" onClick={start}>
            再玩一次
          </Button>
        </div>
      ) : null}

      {isIdle ? (
        <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          按「開始遊戲」開始 {CFG.roundSeconds} 秒倒數。
        </div>
      ) : null}

      <div className="mx-auto grid max-w-md grid-cols-3 gap-3 sm:gap-4">
        {holes.map((h, i) => (
          <Hole
            key={i}
            hole={h}
            disabled={status !== 'playing'}
            onWhack={() => whack(i)}
          />
        ))}
      </div>
    </GameShell>
  );
}

function Hole({
  hole,
  disabled,
  onWhack,
}: {
  hole: HoleT;
  disabled: boolean;
  onWhack: () => void;
}) {
  // mole 的 translateY:up 露出,whacked 微縮,fled / down 完全藏在洞裡
  const moleTransform =
    hole.state === 'up'
      ? 'translate-y-0 scale-100'
      : hole.state === 'whacked'
        ? 'translate-y-2 scale-90'
        : 'translate-y-full scale-100';

  const ariaLabel =
    hole.state === 'up'
      ? '地鼠出現,打它!'
      : hole.state === 'whacked'
        ? '已打中'
        : '空地洞';

  return (
    <button
      type="button"
      onClick={onWhack}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative aspect-square select-none overflow-hidden rounded-full',
        'bg-gradient-to-b from-amber-900 to-amber-950 dark:from-amber-950 dark:to-black',
        'shadow-inner ring-2 ring-amber-950/60 dark:ring-black/60',
        'transition-transform active:scale-95',
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-80',
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {/* mole 在地洞下方,根據 state translateY 上來 */}
      <div
        className={cn(
          'absolute inset-x-2 bottom-2 h-[80%] transition-transform duration-150 ease-out',
          moleTransform,
        )}
        aria-hidden
      >
        <Mole hit={hole.state === 'whacked'} />
      </div>

      {/* 洞口前緣:畫一片半圓土遮住 mole 下半身,做出「從洞裡冒出」的視覺 */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-[28%]',
          'rounded-t-[100%] bg-gradient-to-b from-amber-950 to-black dark:from-black dark:to-zinc-950',
          'shadow-[0_-4px_8px_rgba(0,0,0,0.4)_inset]',
        )}
      />
    </button>
  );
}

/** procedural mole svg;不需要圖檔 */
function Mole({ hit }: { hit: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      {/* 身體 */}
      <ellipse cx="50" cy="62" rx="32" ry="34" fill="#78350f" />
      {/* 肚子 */}
      <ellipse cx="50" cy="68" rx="22" ry="22" fill="#fcd34d" />
      {/* 兩隻手 */}
      <ellipse cx="22" cy="72" rx="8" ry="11" fill="#78350f" />
      <ellipse cx="78" cy="72" rx="8" ry="11" fill="#78350f" />
      {/* 眼睛 */}
      {hit ? (
        <>
          <line x1="38" y1="48" x2="46" y2="56" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="46" y1="48" x2="38" y2="56" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="54" y1="48" x2="62" y2="56" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="62" y1="48" x2="54" y2="56" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="42" cy="52" rx="3.5" ry="4" fill="#fff" />
          <ellipse cx="58" cy="52" rx="3.5" ry="4" fill="#fff" />
          <circle cx="42" cy="53" r="1.8" fill="#000" />
          <circle cx="58" cy="53" r="1.8" fill="#000" />
        </>
      )}
      {/* 鼻子 */}
      <ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#0f172a" />
      {/* 嘴 */}
      {hit ? (
        <ellipse cx="50" cy="70" rx="4" ry="3" fill="#0f172a" />
      ) : (
        <path d="M 46 67 Q 50 71 54 67" stroke="#0f172a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      {/* 兩顆牙齒 */}
      {!hit && (
        <>
          <rect x="47.5" y="66" width="1.6" height="3" fill="#fff" />
          <rect x="50.9" y="66" width="1.6" height="3" fill="#fff" />
        </>
      )}
    </svg>
  );
}
