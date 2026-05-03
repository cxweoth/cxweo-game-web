'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useConnectFour } from './useConnectFour';
import { COLS, ROWS, type Player } from './types';
import { lowestEmptyRow } from './logic';

const VIEW_W = 560;
const PAD = 16;
const CELL = (VIEW_W - PAD * 2) / COLS;
const VIEW_H = PAD * 2 + CELL * ROWS + 24; // 上方多留 24 給 hover 提示

export function ConnectFour() {
  const {
    board,
    turn,
    status,
    winLine,
    winner,
    lastDrop,
    prefs,
    stats,
    isAiThinking,
    clickColumn,
    restart,
    setPrefs,
  } = useConnectFour();

  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const isOver = status !== 'playing';
  const winSet = new Set(winLine);
  const totalGames = stats.wins + stats.losses + stats.draws;
  const myTurn = !isAiThinking && status === 'playing';

  return (
    <GameShell
      title="連線四子"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <ModeButton active={prefs.mode === 'pvp'} onClick={() => setPrefs({ mode: 'pvp' })}>
              雙人
            </ModeButton>
            <ModeButton active={prefs.mode === 'ai'} onClick={() => setPrefs({ mode: 'ai' })}>
              對 AI
            </ModeButton>
          </div>

          {prefs.mode === 'ai' ? (
            <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <ModeButton
                active={prefs.playerSide === 1}
                onClick={() => setPrefs({ playerSide: 1 })}
              >
                我執紅
              </ModeButton>
              <ModeButton
                active={prefs.playerSide === 2}
                onClick={() => setPrefs({ playerSide: 2 })}
              >
                我執黃
              </ModeButton>
            </div>
          ) : null}

          <Button variant="secondary" size="sm" onClick={restart}>
            新局
          </Button>

          {prefs.mode === 'ai' ? (
            <span className="ml-auto rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              W {stats.wins}・L {stats.losses}・D {stats.draws}
              {totalGames > 0 ? ` (${totalGames})` : ''}
            </span>
          ) : null}
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            點擊任一欄,棋子會落到該欄最底空格;率先連成 <strong>4 子</strong>
            (橫 / 直 / 斜)即勝。
          </li>
          <li>
            <strong>雙人</strong>:紅先黃後;<strong>對 AI</strong>:可選執紅(先手)或執黃。
          </li>
          <li>AI 用 minimax + alpha-beta 搜深度 5;會優先擋你的一步致勝。</li>
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
              {status === 'draw'
                ? '和局'
                : winner === 1
                  ? '紅方勝'
                  : winner === 2
                    ? '黃方勝'
                    : ''}
            </span>
          </div>
          <Button size="sm" onClick={restart}>
            再來一局
          </Button>
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <span className="font-semibold">輪到</span>
          <span
            className={cn(
              'inline-block h-3 w-3 rounded-full ring-1 ring-black/30',
              turn === 1 ? 'bg-rose-500' : 'bg-amber-400',
            )}
            aria-hidden
          />
          <span>{turn === 1 ? '紅方' : '黃方'}</span>
          {isAiThinking ? (
            <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
              (AI 思考中…)
            </span>
          ) : null}
        </div>
      )}

      <div className="mx-auto w-full max-w-[560px]">
        <div
          className={cn(
            'no-focus-ring rounded-lg shadow-sm select-none caret-transparent',
            'overflow-hidden',
          )}
          style={{ caretColor: 'transparent' }}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="block w-full"
            style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
            role="application"
            aria-label="連線四子"
            onMouseLeave={() => setHoverCol(null)}
          >
            {/* 欄 hover 區(畫上方提示棋子) */}
            {Array.from({ length: COLS }).map((_, c) => {
              const x = PAD + c * CELL;
              const isLandable = lowestEmptyRow(board, c) !== -1;
              return (
                <rect
                  key={`hit-${c}`}
                  x={x}
                  y={0}
                  width={CELL}
                  height={VIEW_H}
                  fill="transparent"
                  onMouseEnter={() => setHoverCol(c)}
                  onClick={() => clickColumn(c)}
                  style={{
                    cursor: myTurn && isLandable ? 'pointer' : 'default',
                  }}
                />
              );
            })}

            {/* 上方提示棋子 */}
            {hoverCol !== null && myTurn && lowestEmptyRow(board, hoverCol) !== -1 ? (
              <circle
                cx={PAD + (hoverCol + 0.5) * CELL}
                cy={12 + 4}
                r={CELL * 0.32}
                fill={turn === 1 ? '#f43f5e' : '#fbbf24'}
                opacity={0.7}
                style={{ pointerEvents: 'none' }}
              />
            ) : null}

            {/* 棋盤底色 */}
            <rect
              x={PAD - 4}
              y={28}
              width={VIEW_W - PAD * 2 + 8}
              height={CELL * ROWS + 8}
              fill="#1e3a8a"
              rx={10}
            />

            {/* 格子(用「藍底挖洞」呈現) */}
            {Array.from({ length: ROWS * COLS }).map((_, idx) => {
              const r = Math.floor(idx / COLS);
              const c = idx % COLS;
              const cx = PAD + (c + 0.5) * CELL;
              const cy = 28 + 4 + (r + 0.5) * CELL;
              const cell = board[idx];
              const isWinCell = winSet.has(idx);
              const isLastDrop = lastDrop === idx;
              return (
                <g key={idx} style={{ pointerEvents: 'none' }}>
                  {/* 洞:預設背景色 */}
                  <circle cx={cx} cy={cy} r={CELL * 0.4} fill="#0f172a" />
                  {cell !== 0 ? (
                    <Disc
                      cx={cx}
                      cy={cy}
                      color={cell === 1 ? 'red' : 'yellow'}
                      highlight={isWinCell}
                      pop={isLastDrop}
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </GameShell>
  );
}

function ModeButton({
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

function Disc({
  cx,
  cy,
  color,
  highlight,
  pop,
}: {
  cx: number;
  cy: number;
  color: 'red' | 'yellow';
  highlight: boolean;
  pop: boolean;
}) {
  const r = CELL * 0.4;
  const main = color === 'red' ? '#f43f5e' : '#fbbf24';
  const dark = color === 'red' ? '#9f1239' : '#b45309';
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={main} stroke={dark} strokeWidth={2} />
      <ellipse
        cx={cx - r * 0.3}
        cy={cy - r * 0.4}
        rx={r * 0.4}
        ry={r * 0.22}
        fill="rgba(255,255,255,0.55)"
      />
      {highlight ? (
        <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#22d3ee" strokeWidth={3} />
      ) : null}
      {pop ? <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke="#fff" strokeWidth={2} /> : null}
    </g>
  );
}

export type { Player };
