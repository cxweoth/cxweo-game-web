// 15 Puzzle — 4×4 數字推盤
//
// Board 用長度 16 的陣列表示;value=0 表示空格,1..15 為磚塊。
// index 0..15 對應位置(row=Math.floor(i/4), col=i%4)。

export const SLUG = 'fifteen';

export const CFG = {
  size: 4,
  cells: 16,
  /** 洗牌走幾步隨機合法移動;dir 不會立刻反向以避免抵銷 */
  shuffleSteps: 240,
} as const;

export type Board = number[];

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * 動畫用 tile 描述。每塊 tile 有穩定 id(它的目標數字 1..15),
 * pos 為當前所在 grid index。React key 用 id,讓 tile 在格子間移動時用
 * CSS transition 平滑過渡(如果 key 用 pos,React 會以為是不同 tile 互換內容)。
 */
export type Tile = {
  id: number; // 1..15
  row: number;
  col: number;
};
