'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { getHighScore, setHighScore } from '@/lib/storage';
import { Board2048 } from './Board2048';
import { useGame2048 } from './useGame2048';

const SLUG = '2048';

export function Game2048() {
  const { state, move, reset, continueGame } = useGame2048();

  // 最高分:首次 mount 後讀;之後僅在 setHighScore 寫入成功時才 setBestState。
  const [best, setBest] = useState<number | null>(null);
  // 用 ref 記錄「這場是否曾刷新紀錄」,避免 best === score 但其實是平手的誤判。
  const recordBrokenRef = useRef<boolean>(false);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  // 每次分數變動嘗試刷新最高分。重置(moves=0)時清掉 recordBrokenRef。
  useEffect(() => {
    if (state.moves === 0) {
      recordBrokenRef.current = false;
      return;
    }
    if (state.score <= 0) return;
    const updated = setHighScore(SLUG, state.score);
    if (updated) {
      setBest(state.score);
      recordBrokenRef.current = true;
    }
  }, [state.score, state.moves]);

  const isOver = state.status === 'gameOver';
  // 達成 2048 但還沒按過「繼續玩」,且還沒結束 → 顯示勝利提示
  const showWin = state.reached2048 && !state.continued && !isOver;
  const justBroke = recordBrokenRef.current;

  return (
    <GameShell
      title="2048"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={reset}>
            重新開始
          </Button>
          <div className="ml-auto">
            <ScoreBoard
              score={state.score}
              best={best ?? 0}
              extras={[
                { label: 'MAX', value: state.maxValue || '—' },
                { label: 'MOVES', value: state.moves },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>滑動</strong>:方向鍵 <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd>{' '}
            <kbd>→</kbd> 或 <kbd>WASD</kbd>;手機可在棋盤上滑動。
          </li>
          <li>每次滑動後,所有方塊往該方向擠;相鄰且同值的方塊會合併,值翻倍。</li>
          <li>
            每回合會在隨機空格生成 <strong>2</strong>(90%)或 <strong>4</strong>(10%)。
          </li>
          <li>
            合併出 <strong>2048</strong> 即勝利,但你可以選擇繼續挑戰更大的數字。
          </li>
          <li>無法再合併且沒有空格時遊戲結束;分數為所有合併值的總和。</li>
        </ul>
      }
    >
      {showWin ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              🏆
            </span>
            <span className="font-semibold">恭喜!達成 2048!</span>
            <span className="opacity-80">繼續挑戰看能堆到多大。</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={continueGame}>
              繼續玩
            </Button>
            <Button size="sm" variant="secondary" onClick={reset}>
              重新開始
            </Button>
          </div>
        </div>
      ) : null}

      {isOver ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              💥
            </span>
            <span className="font-semibold">遊戲結束</span>
            <span className="opacity-80">
              最終分數 {state.score} ・ 最大方塊 {state.maxValue}
            </span>
            {justBroke ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                🏆 刷新紀錄
              </span>
            ) : best !== null ? (
              <span className="opacity-80">目前最佳 {best}</span>
            ) : null}
          </div>
          <Button size="sm" onClick={reset}>
            再玩一次
          </Button>
        </div>
      ) : null}

      <div className="flex justify-center">
        <Board2048
          tiles={state.tiles}
          vanishing={state.vanishing}
          onMove={move}
          disabled={isOver}
        />
      </div>
    </GameShell>
  );
}
