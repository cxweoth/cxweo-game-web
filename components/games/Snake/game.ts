// 純邏輯:世界建立、step、輸入入隊。
// 沒有任何渲染或 React;這層只在 SnakeCanvas 的 rAF 迴圈裡被呼叫。

import { CFG, type Dir, type Popup, type Vec } from './types';

export type World = {
  /** 蛇身,index 0 = 頭 */
  cells: Vec[];
  /** 上一個 step 結束時各 segment 的位置;render 時用 (prev → cur) lerp */
  prevCells: Vec[];
  /** 當前移動方向 */
  dir: Dir;
  /** 輸入緩衝(最多兩個);step 時消耗一個。允許玩家在一格內連續轉兩次。 */
  nextDirs: Dir[];
  food: Vec;
  /** 上一次 step 的 ms 時間戳;0 表尚未開始計時 */
  lastStepAt: number;
  stepInterval: number;
  /** 等待延長身體的步數;每次 step 若 >0 則本格不縮尾並 -1 */
  growBy: number;
  popups: Popup[];
  /** 蛇頭脈衝環(吃到食物)結束時間;> nowMs 才畫 */
  headPulseUntil: number;
  /** 螢幕震動結束時間(死亡瞬間) */
  screenShakeUntil: number;
};

export function createWorld(): World {
  const cells: Vec[] = [];
  for (let i = 0; i < CFG.initialLength; i++) {
    cells.push({ x: CFG.initialHeadX - i, y: CFG.initialHeadY });
  }
  const food = randomFood(cells);
  return {
    cells,
    prevCells: cells.map((c) => ({ ...c })),
    dir: { dx: CFG.initialDx, dy: CFG.initialDy },
    nextDirs: [],
    food,
    lastStepAt: 0,
    stepInterval: CFG.stepStartMs,
    growBy: 0,
    popups: [],
    headPulseUntil: 0,
    screenShakeUntil: 0,
  };
}

/** 在所有空格中隨機選一格放食物。棋盤填滿時(理論上)回 (0,0) 不會發生 */
function randomFood(cells: ReadonlyArray<Vec>): Vec {
  const occ = new Set<number>();
  for (const c of cells) occ.add(c.y * CFG.gridW + c.x);
  const empties: Vec[] = [];
  for (let y = 0; y < CFG.gridH; y++) {
    for (let x = 0; x < CFG.gridW; x++) {
      if (!occ.has(y * CFG.gridW + x)) empties.push({ x, y });
    }
  }
  if (empties.length === 0) return { x: 0, y: 0 };
  return empties[Math.floor(Math.random() * empties.length)]!;
}

/**
 * 嘗試把新方向加入 buffer。規則:
 * - 不可 180° 反向(蛇會撞到自己)
 * - 不重複(相同方向不入隊)
 * - buffer 最多 2 格,塞滿就忽略
 *
 * 比對對象是「buffer 末端」(若空則用當前 dir),這樣連按兩個方向(例 right→up→left)
 * 時第二個是與 up 比較,不會被 right 卡住。
 */
export function queueDir(world: World, newDir: Dir): void {
  const last = world.nextDirs[world.nextDirs.length - 1] ?? world.dir;
  if (last.dx === -newDir.dx && last.dy === -newDir.dy) return; // 180°
  if (last.dx === newDir.dx && last.dy === newDir.dy) return;   // 同向
  if (world.nextDirs.length >= 2) return;
  world.nextDirs.push(newDir);
}

export type StepResult = { ate: boolean; dead: boolean };

/** 推進一格(包含撞牆 / 撞自己 / 吃食物判定);純資料計算,不觸發 popup / sfx */
function step(world: World): StepResult {
  if (world.nextDirs.length > 0) {
    world.dir = world.nextDirs.shift()!;
  }
  const oldHead = world.cells[0]!;
  const newHead: Vec = { x: oldHead.x + world.dir.dx, y: oldHead.y + world.dir.dy };

  // 撞牆
  if (
    newHead.x < 0 ||
    newHead.x >= CFG.gridW ||
    newHead.y < 0 ||
    newHead.y >= CFG.gridH
  ) {
    return { ate: false, dead: true };
  }

  // 撞自己:尾巴若這格會離開(沒成長),不算撞
  const willDropTail = world.growBy === 0;
  const ateFood = newHead.x === world.food.x && newHead.y === world.food.y;
  // 吃食物時不縮尾 → 整條身體都還在,要全部判定
  const willActuallyDropTail = willDropTail && !ateFood;
  for (let i = 0; i < world.cells.length; i++) {
    if (i === world.cells.length - 1 && willActuallyDropTail) continue;
    const c = world.cells[i]!;
    if (c.x === newHead.x && c.y === newHead.y) {
      return { ate: false, dead: true };
    }
  }

  // 推進 cells 並設置 prevCells(供插值)
  const oldCells = world.cells;
  if (ateFood) {
    world.cells = [newHead, ...oldCells];
    // 成長:除頭外其餘 segment 不動。prev 設成自己(零位移)
    world.prevCells = world.cells.map((c, i) => (i === 0 ? oldHead : { ...c }));
  } else if (world.growBy > 0) {
    world.growBy--;
    world.cells = [newHead, ...oldCells];
    world.prevCells = world.cells.map((c, i) => (i === 0 ? oldHead : { ...c }));
  } else {
    world.cells = [newHead, ...oldCells.slice(0, -1)];
    // 一般 step:每個 segment 從原本位置滑到下一格,prev = oldCells(同 index)
    world.prevCells = oldCells.map((c) => ({ ...c }));
  }

  return { ate: ateFood, dead: false };
}

/**
 * rAF 主迴圈每幀呼叫。回傳本幀是否吃到食物 / 死亡(由 hook 同步 React state)。
 *
 * 用「累計時間 ≥ stepInterval 就 step」推進,允許一幀內補多步(在切回背景頁回來
 * 時可能會發生,但 dt 在 SnakeCanvas 已被 clamp 到 50ms 上限,不會爆炸)。
 */
export function tickWorld(world: World, nowMs: number): StepResult {
  const result: StepResult = { ate: false, dead: false };
  if (world.lastStepAt === 0) {
    world.lastStepAt = nowMs;
    return result;
  }
  while (nowMs - world.lastStepAt >= world.stepInterval) {
    world.lastStepAt += world.stepInterval;
    const r = step(world);
    if (r.ate) {
      result.ate = true;
      world.stepInterval = Math.max(
        CFG.stepMinMs,
        world.stepInterval - CFG.stepDecPerFood,
      );
      world.headPulseUntil = nowMs + 250;
      const head = world.cells[0]!;
      world.popups.push({
        x: head.x * CFG.cellPx + CFG.cellPx / 2,
        y: head.y * CFG.cellPx + CFG.cellPx / 2,
        text: `+${CFG.foodScore}`,
        color: '#fbbf24',
        age: 0,
        ttl: 0.8,
      });
      world.food = randomFood(world.cells);
    }
    if (r.dead) {
      result.dead = true;
      world.screenShakeUntil = nowMs + 320;
      return result;
    }
  }
  return result;
}
