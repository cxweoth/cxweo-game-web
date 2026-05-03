'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useSudoku } from './useSudoku';
import { DIFF_LABEL, SIZE, type Difficulty } from './types';

function formatTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Sudoku() {
  const {
    diff,
    givens,
    values,
    notes,
    selected,
    notesMode,
    highlightConflicts,
    status,
    generating,
    best,
    elapsedSec,
    conflicts,
    setSelected,
    setNotesMode,
    setHighlightConflicts,
    setNumber,
    eraseCell,
    undo,
    newPuzzle,
    canUndo,
  } = useSudoku();

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    wrapperRef.current?.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (selected === null) return;
      // 數字鍵:1..9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        setNumber(selected, Number(e.key));
        return;
      }
      if (
        e.code === 'Backspace' ||
        e.code === 'Delete' ||
        e.code === 'Digit0' ||
        e.code === 'Numpad0'
      ) {
        e.preventDefault();
        eraseCell(selected);
        return;
      }
      const r = Math.floor(selected / SIZE);
      const c = selected % SIZE;
      let nr = r;
      let nc = c;
      if (e.code === 'ArrowUp') nr = (r + SIZE - 1) % SIZE;
      else if (e.code === 'ArrowDown') nr = (r + 1) % SIZE;
      else if (e.code === 'ArrowLeft') nc = (c + SIZE - 1) % SIZE;
      else if (e.code === 'ArrowRight') nc = (c + 1) % SIZE;
      else if (e.code === 'KeyN') {
        e.preventDefault();
        setNotesMode(!notesMode);
        return;
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
        return;
      } else {
        return;
      }
      e.preventDefault();
      setSelected(nr * SIZE + nc);
    },
    [selected, setNumber, eraseCell, undo, notesMode, setNotesMode, setSelected],
  );

  const isSolved = status === 'solved';
  const selectedVal = selected !== null ? values[selected] : null;
  const selectedRow = selected === null ? -1 : Math.floor(selected / SIZE);
  const selectedCol = selected === null ? -1 : selected % SIZE;
  const selectedBox =
    selected === null
      ? -1
      : Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3);

  // 數字殘餘表:每個數字剩多少格沒填
  const remainingByDigit: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) {
    let placed = 0;
    for (const v of values) if (v === n) placed++;
    remainingByDigit[n] = Math.max(0, 9 - placed);
  }

  return (
    <GameShell
      title="數獨"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => newPuzzle(d)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  diff === d
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                )}
              >
                {DIFF_LABEL[d]}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={() => newPuzzle()} disabled={generating}>
            {generating ? '生成中…' : '新題目'}
          </Button>
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
            復原
          </Button>

          <label className="ml-2 inline-flex cursor-pointer items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              className="cursor-pointer"
              checked={highlightConflicts}
              onChange={(e) => setHighlightConflicts(e.target.checked)}
            />
            顯示衝突
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Field label="TIME" value={formatTime(elapsedSec)} />
            <Field
              label="BEST"
              value={best[diff] === null ? '—' : formatTime(best[diff]!)}
            />
            <Field label="難度" value={DIFF_LABEL[diff]} />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            標準 9×9 數獨:每列、每欄、每 3×3 宮各填入 <strong>1–9</strong>{' '}
            不重複。
          </li>
          <li>
            選格:點擊或方向鍵 <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd>;
            填數字:<kbd>1</kbd>–<kbd>9</kbd>;清除:<kbd>Del</kbd> / <kbd>0</kbd> /{' '}
            <kbd>Backspace</kbd>。
          </li>
          <li>
            <strong>筆記模式</strong>:按 <kbd>N</kbd> 切換或點下方筆記鈕;此時填數字會
            標記成候選;Ctrl+Z 復原。
          </li>
          <li>
            <strong>新題目自動生成</strong>:每次按「新題目」都會即時生成保證唯一解的盤面;
            難度切換也會立刻換題。
          </li>
        </ul>
      }
    >
      {isSolved ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              🎉
            </span>
            <span className="font-semibold">完成!</span>
            <span className="opacity-80">
              {DIFF_LABEL[diff]} ・ {formatTime(elapsedSec)}
              {best[diff] !== null && Math.abs(best[diff]! - elapsedSec) < 0.5
                ? ' ・ 🏆 最佳'
                : ''}
            </span>
          </div>
          <Button size="sm" onClick={() => newPuzzle()}>
            下一題
          </Button>
        </div>
      ) : null}

      <div
        ref={wrapperRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="application"
        aria-label="數獨"
        className={cn(
          'no-focus-ring',
          'mx-auto flex max-w-md flex-col gap-3 select-none caret-transparent',
        )}
        style={{ caretColor: 'transparent' }}
      >
        <Grid
          values={values}
          givens={givens}
          notes={notes}
          conflicts={conflicts}
          selected={selected}
          selectedVal={selectedVal ?? null}
          selectedRow={selectedRow}
          selectedCol={selectedCol}
          selectedBox={selectedBox}
          onSelect={setSelected}
          disabled={isSolved || generating}
        />

        <NumberPad
          notesMode={notesMode}
          onToggleNotes={() => setNotesMode(!notesMode)}
          onPick={(n) => {
            if (selected !== null) setNumber(selected, n);
          }}
          onErase={() => {
            if (selected !== null) eraseCell(selected);
          }}
          remaining={remainingByDigit}
        />
      </div>
    </GameShell>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Grid({
  values,
  givens,
  notes,
  conflicts,
  selected,
  selectedVal,
  selectedRow,
  selectedCol,
  selectedBox,
  onSelect,
  disabled,
}: {
  values: number[];
  givens: boolean[];
  notes: number[];
  conflicts: Set<number>;
  selected: number | null;
  selectedVal: number | null;
  selectedRow: number;
  selectedCol: number;
  selectedBox: number;
  onSelect: (i: number) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={cn(
        'grid aspect-square w-full overflow-hidden rounded-lg',
        'bg-zinc-900 dark:bg-zinc-700',
        'gap-px',
      )}
      style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}
    >
      {Array.from({ length: 81 }).map((_, i) => {
        const r = Math.floor(i / SIZE);
        const c = i % SIZE;
        const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const v = values[i] ?? 0;
        const isGiven = givens[i] ?? false;
        const isSelected = selected === i;
        const inSelectedScope =
          selected !== null && (r === selectedRow || c === selectedCol || box === selectedBox);
        const sameNumber = !!selectedVal && v === selectedVal;
        const isConflict = conflicts.has(i);

        // 3×3 邊框加粗:每格的右/下加 1px 較深邊;每 3 格再加一 + 偏移
        // 為了簡潔,用內部 border 控制
        const borderClass = cn(
          // 右側每 3 格加深邊
          c % 3 === 2 && c !== 8 ? 'mr-px' : '',
          r % 3 === 2 && r !== 8 ? 'mb-px' : '',
        );

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(i)}
            aria-label={`第 ${r + 1} 列 ${c + 1} 欄${v ? `,值 ${v}` : ',空'}`}
            className={cn(
              'relative flex aspect-square items-center justify-center text-lg font-semibold sm:text-2xl',
              'transition-colors',
              borderClass,
              // 預設背景
              isGiven
                ? 'bg-zinc-100 dark:bg-zinc-800'
                : 'bg-white dark:bg-zinc-900',
              // 同列 / 同欄 / 同宮高亮
              inSelectedScope && !isSelected
                ? 'bg-amber-50 dark:bg-amber-950/30'
                : '',
              // 同數字高亮
              sameNumber && !isSelected
                ? 'bg-amber-200/70 dark:bg-amber-700/30'
                : '',
              // 選中
              isSelected ? 'bg-amber-300 dark:bg-amber-600/50' : '',
              // 顏色
              isConflict
                ? 'text-red-600 dark:text-red-400'
                : isGiven
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-blue-600 dark:text-blue-400',
            )}
          >
            {v ? (
              <span>{v}</span>
            ) : notes[i] ? (
              <NotesView mask={notes[i]!} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function NotesView({ mask }: { mask: number }) {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5 text-[8px] leading-none text-zinc-500 dark:text-zinc-400 sm:text-[10px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="flex items-center justify-center">
          {mask & (1 << i) ? i + 1 : ''}
        </span>
      ))}
    </div>
  );
}

function NumberPad({
  notesMode,
  onToggleNotes,
  onPick,
  onErase,
  remaining,
}: {
  notesMode: boolean;
  onToggleNotes: () => void;
  onPick: (n: number) => void;
  onErase: () => void;
  remaining: Record<number, number>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-9 gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => {
          const n = i + 1;
          const left = remaining[n] ?? 0;
          const done = left === 0;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              disabled={done && !notesMode}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-md text-xl font-semibold tabular-nums shadow-sm transition-colors',
                done
                  ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
                  : notesMode
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60'
                    : 'bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800',
              )}
            >
              {n}
              {!done ? (
                <span className="absolute right-0.5 top-0.5 text-[8px] font-normal text-zinc-400 sm:text-[9px]">
                  {left}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onToggleNotes}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors shadow-sm',
            notesMode
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
          )}
        >
          ✏️ 筆記模式 {notesMode ? '開' : '關'}
        </button>
        <button
          type="button"
          onClick={onErase}
          className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          ⌫ 清除
        </button>
      </div>
    </div>
  );
}
