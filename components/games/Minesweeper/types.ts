import type { GameStatus } from '@/types/game';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type DifficultyConfig = {
  label: string;
  rows: number;
  cols: number;
  mines: number;
};

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: '初級', rows: 9, cols: 9, mines: 10 },
  medium: { label: '中級', rows: 16, cols: 16, mines: 40 },
  hard: { label: '高級', rows: 16, cols: 30, mines: 99 },
};

export type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  /** 周圍 8 格的地雷數；0–8。尚未放雷前為 0 */
  adjacent: number;
  /** 標記「就是這一顆踩到的」，用來在結算畫面以紅色突顯 */
  isExploded: boolean;
};

export type Board = Cell[][];

export type MinesweeperState = {
  difficulty: Difficulty;
  status: GameStatus;
  board: Board;
  /** 已插旗數（用於計算剩餘雷數） */
  flags: number;
  /** 已翻開的非雷格子數；用來判定勝利 */
  revealed: number;
  /** 鍵盤游標位置 */
  cursor: { r: number; c: number };
  /** 首擊時間戳（ms），決定計時器起點；未開始為 null */
  startedAt: number | null;
  /** 結束時間戳，用於顯示定格時間 */
  endedAt: number | null;
  /** 地雷是否已布置；首擊那一次的 reveal 才會布雷 */
  mined: boolean;
};

export type Action =
  | { type: 'reveal'; r: number; c: number }
  | { type: 'flag'; r: number; c: number }
  | { type: 'moveCursor'; dr: number; dc: number }
  | { type: 'restart'; difficulty?: Difficulty };
