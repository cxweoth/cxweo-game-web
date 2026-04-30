import type { GameStatus } from '@/types/game';

/** 2048 棋盤邊長(固定 4×4)。改值需同時調整 logic.ts 中相關邏輯。 */
export const GRID_SIZE = 4;

/**
 * 棋盤上的一顆 tile。row/col 是邏輯座標(0-based),由 Board 換算成像素位置。
 * id 是唯一鍵,讓 React 用 key 追蹤動畫;合併產生的新 tile 會拿到新 id。
 */
export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  /** 這回合剛 spawn 的新 tile,用 tile-pop 動畫漸入 */
  isNew?: boolean;
  /** 這回合由合併產生的 tile,用 tile-merge 動畫脈衝 */
  isMerged?: boolean;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Game2048State = {
  status: GameStatus;
  /** 棋盤上目前存在的「正規」tiles。游離的合併源 tile 在 vanishing 中。 */
  tiles: Tile[];
  /**
   * 動畫期間「正在被合併」的源 tile:已搬到目的格但即將消失。
   * 保留它們才能讓滑動動畫看起來連續(否則被合併的 tile 會瞬間消失)。
   * 動畫結束後由 hook 排程 cleanup 清空。
   */
  vanishing: Tile[];
  score: number;
  /** 已達成的最大方塊值;達成 2048 用來判斷勝利提示 */
  maxValue: number;
  /** 是否曾達成 2048;只用來控制「You Win」提示是否出現過 */
  reached2048: boolean;
  /** 玩家在 2048 達成後是否選擇繼續玩(關閉勝利提示) */
  continued: boolean;
  /** 累計步數,顯示在計分板上 */
  moves: number;
};
