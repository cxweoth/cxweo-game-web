'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { readJSON, writeJSON } from '@/lib/storage';
import { GomokuBoard } from './GomokuBoard';
import { useGomoku } from './useGomoku';
import {
  defaultPrefs,
  emptyStats,
  type Color,
  type GomokuPrefs,
  type Mode,
  type Stats,
} from './types';

const PREFS_KEY = 'gomoku:prefs';
const STATS_KEY = 'gomoku:stats';

function loadPrefs(): GomokuPrefs {
  const p = readJSON<Partial<GomokuPrefs>>(PREFS_KEY);
  if (!p) return defaultPrefs;
  return {
    mode: p.mode === 'ai' || p.mode === 'pvp' ? p.mode : defaultPrefs.mode,
    humanSide:
      p.humanSide === 'black' || p.humanSide === 'white'
        ? p.humanSide
        : defaultPrefs.humanSide,
  };
}

function loadStats(): Stats {
  const s = readJSON<Stats>(STATS_KEY);
  return { ...emptyStats, ...(s ?? {}) };
}

export function Gomoku() {
  // 初次掛載前用 defaultPrefs 避免 SSR/client 不一致；掛載後再讀 localStorage 重啟一次
  const { state, play, undo, restart, setMode, moveCursor } = useGomoku(defaultPrefs);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [hydrated, setHydrated] = useState(false);

  // 讀偏好 + 戰績
  useEffect(() => {
    const prefs = loadPrefs();
    setStats(loadStats());
    setHydrated(true);
    // 若偏好與當前不同，切過去（會重開一局）
    if (prefs.mode !== state.mode || prefs.humanSide !== state.humanSide) {
      setMode(prefs.mode, prefs.humanSide);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 結算時更新戰績（避免重複計算：用 state.winner 作 key，每局只寫一次）
  useEffect(() => {
    if (!hydrated || state.winner === null) return;
    const next = { ...stats };
    if (state.mode === 'pvp') {
      if (state.winner === 'black') next.pvpBlackWins++;
      else if (state.winner === 'white') next.pvpWhiteWins++;
      else next.pvpDraws++;
    } else {
      if (state.winner === 'draw') next.vsAiDraws++;
      else if (state.winner === state.humanSide) next.vsAiWins++;
      else next.vsAiLosses++;
    }
    setStats(next);
    writeJSON(STATS_KEY, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner]);

  // 偏好變更時寫回
  useEffect(() => {
    if (!hydrated) return;
    writeJSON<GomokuPrefs>(PREFS_KEY, {
      mode: state.mode,
      humanSide: state.humanSide,
    });
  }, [hydrated, state.mode, state.humanSide]);

  const lastMove = state.history[state.history.length - 1] ?? null;
  const turnLabel = state.turn === 'black' ? '黑方' : '白方';
  const aiTurn =
    state.mode === 'ai' &&
    state.winner === null &&
    state.turn !== state.humanSide;

  return (
    <GameShell
      title="五子棋"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <ModeSwitcher
            mode={state.mode}
            humanSide={state.humanSide}
            onChange={(mode, side) => setMode(mode, side)}
          />
          <Button variant="secondary" size="sm" onClick={() => restart()}>
            重新開始
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => undo()}
            disabled={state.history.length === 0 || state.winner !== null}
          >
            悔棋
          </Button>

          <div className="ml-auto flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <StoneDot color={state.turn} pulse={aiTurn} />
            <span>
              輪到 <strong>{aiTurn ? 'AI' : turnLabel}</strong>
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-600 dark:text-zinc-400">手數 {state.history.length}</span>
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>在交叉點落子；任一方向（橫/直/斜）連成 5 子即勝。</li>
          <li>
            <strong>落子</strong>：滑鼠點擊 / 觸控 / 鍵盤方向鍵移動十字游標 +{' '}
            <kbd>Enter</kbd> 或 <kbd>Space</kbd>
          </li>
          <li>
            <strong>悔棋</strong>：AI 模式一次悔 2 步（玩家 + AI）；PvP 一次 1 步
          </li>
          <li>模式切換 / AI 執色：會自動重開一局。未實作禁手規則（三三 / 四四 / 長連）。</li>
        </ul>
      }
    >
      {state.winner !== null ? (
        <WinBanner
          winner={state.winner}
          mode={state.mode}
          humanSide={state.humanSide}
          onRestart={() => restart()}
        />
      ) : null}

      <GomokuBoard
        board={state.board}
        lastMove={lastMove}
        winLine={state.winLine}
        cursor={state.cursor}
        disabled={state.winner !== null || aiTurn}
        onPlay={play}
        onMoveCursor={moveCursor}
      />

      <StatsCard stats={stats} mode={state.mode} />
    </GameShell>
  );
}

// --- 子元件 ---

function StoneDot({ color, pulse = false }: { color: Color; pulse?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-3 w-3 rounded-full border',
        color === 'black'
          ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-950'
          : 'bg-white border-zinc-400',
        pulse && 'animate-pulse',
      )}
    />
  );
}

function ModeSwitcher({
  mode,
  humanSide,
  onChange,
}: {
  mode: Mode;
  humanSide: Color;
  onChange: (mode: Mode, side: Color) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900"
        role="group"
        aria-label="模式選擇"
      >
        <ModeButton label="雙人" active={mode === 'pvp'} onClick={() => onChange('pvp', humanSide)} />
        <ModeButton
          label="對戰 AI"
          active={mode === 'ai'}
          onClick={() => onChange('ai', humanSide)}
        />
      </div>

      {mode === 'ai' ? (
        <div
          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900"
          role="group"
          aria-label="玩家執色"
        >
          <ModeButton
            label="我執黑"
            active={humanSide === 'black'}
            onClick={() => onChange('ai', 'black')}
          />
          <ModeButton
            label="我執白"
            active={humanSide === 'white'}
            onClick={() => onChange('ai', 'white')}
          />
        </div>
      ) : null}
    </div>
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800',
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function WinBanner({
  winner,
  mode,
  humanSide,
  onRestart,
}: {
  winner: NonNullable<ReturnType<typeof useGomoku>['state']['winner']>;
  mode: Mode;
  humanSide: Color;
  onRestart: () => void;
}) {
  const isDraw = winner === 'draw';
  const humanWon = mode === 'ai' && winner === humanSide;
  const humanLost = mode === 'ai' && winner !== 'draw' && winner !== humanSide;

  let emoji: string;
  let text: string;
  let tone: 'pos' | 'neg' | 'neu';
  if (isDraw) {
    emoji = '🤝';
    text = '和局';
    tone = 'neu';
  } else if (mode === 'ai') {
    if (humanWon) {
      emoji = '🎉';
      text = '你贏了！';
      tone = 'pos';
    } else if (humanLost) {
      emoji = '🤖';
      text = 'AI 勝';
      tone = 'neg';
    } else {
      emoji = '🎉';
      text = `${winner === 'black' ? '黑' : '白'}方勝`;
      tone = 'pos';
    }
  } else {
    emoji = '🎉';
    text = `${winner === 'black' ? '黑' : '白'}方勝`;
    tone = 'pos';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
        tone === 'pos' &&
          'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200',
        tone === 'neg' &&
          'border-red-300 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200',
        tone === 'neu' &&
          'border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          {emoji}
        </span>
        <span className="font-semibold">{text}</span>
      </div>
      <Button size="sm" onClick={onRestart}>
        再來一局
      </Button>
    </div>
  );
}

function StatsCard({ stats, mode }: { stats: Stats; mode: Mode }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
      <StatBox
        label="雙人・黑勝"
        value={stats.pvpBlackWins}
        active={mode === 'pvp'}
      />
      <StatBox label="雙人・白勝" value={stats.pvpWhiteWins} active={mode === 'pvp'} />
      <StatBox label="雙人・和" value={stats.pvpDraws} active={mode === 'pvp'} />
      <StatBox label="對 AI・勝" value={stats.vsAiWins} active={mode === 'ai'} />
      <StatBox label="對 AI・負" value={stats.vsAiLosses} active={mode === 'ai'} />
      <StatBox label="對 AI・和" value={stats.vsAiDraws} active={mode === 'ai'} />
    </div>
  );
}

function StatBox({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2',
        active
          ? 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
          : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500',
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
