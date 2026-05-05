'use client';

import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { HexBoard } from './HexBoard';
import { useHex } from './useHex';
import { SIZES, type Size } from './types';

export function Hex() {
  const {
    board,
    turn,
    status,
    winner,
    winPath,
    lastMove,
    prefs,
    stats,
    canSwap,
    swapNotice,
    isAiThinking,
    clickCell,
    performSwap,
    restart,
    setPrefs,
  } = useHex();

  const isOver = status === 'gameOver';
  const totalGames = stats.wins + stats.losses;
  const winSet = new Set(winPath);
  // AI 思考中或對手回合 → 不顯示提示游標
  const legalEnabled = status === 'playing' && !isAiThinking;

  return (
    <GameShell
      title="六貫棋"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Group>
            <ToggleBtn active={prefs.mode === 'pvp'} onClick={() => setPrefs({ mode: 'pvp' })}>
              雙人
            </ToggleBtn>
            <ToggleBtn active={prefs.mode === 'ai'} onClick={() => setPrefs({ mode: 'ai' })}>
              對 AI
            </ToggleBtn>
          </Group>

          {prefs.mode === 'ai' ? (
            <Group>
              <ToggleBtn
                active={prefs.playerSide === 1}
                onClick={() => setPrefs({ playerSide: 1 })}
              >
                我執黑
              </ToggleBtn>
              <ToggleBtn
                active={prefs.playerSide === 2}
                onClick={() => setPrefs({ playerSide: 2 })}
              >
                我執白
              </ToggleBtn>
            </Group>
          ) : null}

          <Group>
            {SIZES.map((s) => (
              <ToggleBtn
                key={s}
                active={prefs.size === s}
                onClick={() => setPrefs({ size: s as Size })}
              >
                {s}×{s}
              </ToggleBtn>
            ))}
          </Group>

          <Group>
            <ToggleBtn active={prefs.pieRule} onClick={() => setPrefs({ pieRule: !prefs.pieRule })}>
              Pie 規則 {prefs.pieRule ? '開' : '關'}
            </ToggleBtn>
          </Group>

          <Button variant="secondary" size="sm" onClick={restart}>
            新局
          </Button>

          {prefs.mode === 'ai' ? (
            <div className="ml-auto flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              W {stats.wins}・L {stats.losses}
              {totalGames > 0 ? ` (${totalGames})` : ''}
            </div>
          ) : null}
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            點擊六邊形落子。<strong>黑方</strong>連通<strong>上下兩邊</strong>勝;
            <strong>白方</strong>連通<strong>左右兩邊</strong>勝(灰色邊框)。
          </li>
          <li>
            鄰接方向有 6 個(六邊形 6 鄰位),數學上保證一定有人贏、不會平局。
          </li>
          <li>
            <strong>Pie 規則</strong>:黑方第一手後,白方可選擇按下「Swap」把那一手換成自己的色,
            以平衡先手優勢;不想換則直接落子。
          </li>
          <li>戰績只在 AI 模式累計,PvP 不算分。</li>
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
              🏁
            </span>
            <span className="font-semibold">
              {winner === 1 ? '黑方勝(連通上下)' : winner === 2 ? '白方勝(連通左右)' : '結束'}
            </span>
          </div>
          <Button size="sm" onClick={restart}>
            再來一局
          </Button>
        </div>
      ) : (
        <>
          {swapNotice ? (
            <div
              role="status"
              aria-live="polite"
              className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <span aria-hidden>🔄</span>
              <span className="font-semibold">
                {swapNotice.by === 'ai' ? 'AI 行使 Pie 規則 Swap' : '已 Swap'}
              </span>
              <span className="opacity-80">
                {swapNotice.by === 'ai'
                  ? '你的第一手太強(在中央區),AI 把它換成自己的白色 — 換你下黑色第二手。'
                  : '把對手的第一手換成你的色,輪到對手下第二手。'}
              </span>
            </div>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
            <span className="font-semibold">輪到</span>
            <span
              className={cn(
                'inline-block h-3 w-3 rounded-full ring-1 ring-black/30',
                turn === 1 ? 'bg-zinc-900' : 'bg-zinc-50',
              )}
              aria-hidden
            />
            <span>{turn === 1 ? '黑方(連通上下)' : '白方(連通左右)'}</span>
            {isAiThinking ? (
              <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">(AI 思考中…)</span>
            ) : null}
            {canSwap ? (
              <Button size="sm" variant="primary" className="ml-auto" onClick={performSwap}>
                Swap(把第一手改成我的)
              </Button>
            ) : null}
          </div>
        </>
      )}

      {/* 棋盤外加左右一點留白,讓平行四邊形不會頂滿邊 */}
      <div className="mx-auto w-full max-w-[680px]">
        <HexBoard
          board={board}
          n={prefs.size}
          turn={turn}
          legalEnabled={legalEnabled}
          lastMove={lastMove}
          winSet={winSet}
          onClick={clickCell}
        />
      </div>
    </GameShell>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
      )}
    >
      {children}
    </button>
  );
}
