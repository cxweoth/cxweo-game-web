// 俄羅斯方塊 — 型別與場景常數

export const SLUG = 'tetris';

export const COLS = 10;
export const ROWS = 20;

export const CFG = {
  cell: 28,
  /** 主場 */
  width: COLS * 28, // 280
  height: ROWS * 28, // 560
  /** 軟降速度倍率（按住下） */
  softDropMul: 12,
  /** 鎖定延遲：箭塊接觸地面後再給玩家這段時間調整位置（ms） */
  lockDelayMs: 350,
  /** 每 N 行升級 */
  linesPerLevel: 10,
} as const;

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Cell = PieceType | null;
export type Board = Cell[][];

export type Rotation = 0 | 1 | 2 | 3;

export type Piece = {
  type: PieceType;
  /** 包覆框左上角的 col / row（含負值；可以部分位於 -y 的隱藏出生區） */
  x: number;
  y: number;
  rotation: Rotation;
};
