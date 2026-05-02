// 打地鼠 — 共用型別與場景常數

export const SLUG = 'whack-a-mole';

export const CFG = {
  /** 地洞數,3×3 */
  holes: 9,
  /** 一回合長度(秒) */
  roundSeconds: 30,

  /** 地鼠彈出間隔(ms);線性從 max → min(隨時間遞減) */
  spawnMaxMs: 800,
  spawnMinMs: 320,

  /** 地鼠停留時間(ms);線性從 max → min(隨時間遞減) */
  popMaxMs: 1000,
  popMinMs: 500,

  /** 計分 */
  hitScore: 10,
  /** 點空地的扣分;不會扣到負分 */
  missPenalty: 2,

  /** 被打中 / 自動消失後的視覺停留(ms);過後才回到 down */
  cooldownMs: 220,
} as const;

export type HoleState = 'down' | 'up' | 'whacked' | 'fled';

export type Hole = {
  state: HoleState;
  /** state='up' 時,自動下沉時間戳(ms) */
  popUntil: number;
  /** state='whacked'/'fled' 時的進入時間戳,用於 cooldown */
  changedAt: number;
};

export function makeHoles(): Hole[] {
  return Array.from({ length: CFG.holes }, () => ({
    state: 'down' as HoleState,
    popUntil: 0,
    changedAt: 0,
  }));
}
