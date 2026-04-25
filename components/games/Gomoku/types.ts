/** 五子棋棋盤尺寸（標準 15×15） */
export const BOARD_SIZE = 15;

/** 天元 + 四個 3-3 星位（交叉點座標） */
export const STAR_POINTS: ReadonlyArray<readonly [number, number]> = [
  [3, 3], [3, 11], [7, 7], [11, 3], [11, 11],
];

export type Color = 'black' | 'white';
export type Cell = Color | null;
export type Board = Cell[][];

export type Mode = 'pvp' | 'ai';

/** 一步棋的紀錄 */
export type Move = { r: number; c: number; color: Color };

/** 'draw' 表示和局（棋盤下滿）；null 表示尚未分勝負 */
export type Winner = Color | 'draw' | null;

export type GomokuState = {
  board: Board;
  history: Move[];
  /** 下一手該誰下 */
  turn: Color;
  mode: Mode;
  /** AI 模式下人類執的顏色（PvP 模式下忽略） */
  humanSide: Color;
  winner: Winner;
  /** 勝利連線的座標（高亮用）；未分勝負為 null */
  winLine: ReadonlyArray<readonly [number, number]> | null;
  /** 鍵盤游標 */
  cursor: { r: number; c: number };
};

export type Action =
  | { type: 'play'; r: number; c: number }
  | { type: 'undo' }
  | { type: 'restart' }
  | { type: 'setMode'; mode: Mode; humanSide?: Color }
  | { type: 'moveCursor'; dr: number; dc: number };

/** PvP / AI 戰績 */
export type Stats = {
  pvpBlackWins: number;
  pvpWhiteWins: number;
  pvpDraws: number;
  vsAiWins: number;
  vsAiLosses: number;
  vsAiDraws: number;
};

export const emptyStats: Stats = {
  pvpBlackWins: 0,
  pvpWhiteWins: 0,
  pvpDraws: 0,
  vsAiWins: 0,
  vsAiLosses: 0,
  vsAiDraws: 0,
};

/** 使用者偏好（上次模式 / AI 執色） */
export type GomokuPrefs = {
  mode: Mode;
  humanSide: Color;
};

export const defaultPrefs: GomokuPrefs = {
  mode: 'pvp',
  humanSide: 'black',
};
