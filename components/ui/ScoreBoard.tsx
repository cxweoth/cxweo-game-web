import { cn } from '@/lib/utils';

type ScoreBoardProps = {
  /** 目前分數 */
  score: number;
  /** 最高分；null 表示尚未建立最高分 */
  best?: number | null;
  /** 額外欄位，例如等級、剩餘生命 */
  extras?: ReadonlyArray<{ label: string; value: string | number }>;
  className?: string;
};

/** 遊戲頁共用計分板：Score / Best / 自訂欄位 */
export function ScoreBoard({ score, best, extras, className }: ScoreBoardProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-2',
        'dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Field label="SCORE" value={score} />
      {typeof best === 'number' ? <Field label="BEST" value={best} /> : null}
      {extras?.map((e) => <Field key={e.label} label={e.label} value={e.value} />)}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-base font-mono font-semibold tabular-nums">{value}</span>
    </div>
  );
}
