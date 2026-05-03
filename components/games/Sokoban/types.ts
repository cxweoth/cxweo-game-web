// 推箱子 — 共用型別
//
// 用「字串網格 + 動態箱/玩家位置」分離靜態與動態部分:
//   static: 牆 / 地板 / 目標(永久不變)
//   dynamic: 玩家 (px, py) + 箱子集合(set of "r,c")
//
// 這樣 undo/reset 都很簡單,只要還原 dynamic state。

export const SLUG = 'sokoban';

export type StaticCell = 'wall' | 'floor' | 'goal' | 'void';

/** 解析後的關卡靜態地圖(永遠不變);0,0 在左上 */
export type LevelStatic = {
  rows: number;
  cols: number;
  cells: StaticCell[]; // length = rows * cols
  initialPlayer: { r: number; c: number };
  /** key = "r,c"  */
  initialBoxes: Set<string>;
  /** key = "r,c"  */
  goals: Set<string>;
};

export type Dynamic = {
  player: { r: number; c: number };
  /** key "r,c" */
  boxes: Set<string>;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type LevelMeta = {
  name: string;
  /** 字串地圖,每行一個 string,使用 # _ . $ * @ + 規範:
   *   #=牆 _ 或 ' '=floor (在最外圈以外的空格視為 void)
   *   .=goal 空地    $=box on floor    *=box on goal
   *   @=player on floor   +=player on goal
   *
   * 記憶法:大寫 = 在 goal 上;@/+ 是 player;$/* 是 box;.=goal;#=wall。
   */
  map: string;
};

export const KEY = (r: number, c: number) => `${r},${c}`;
