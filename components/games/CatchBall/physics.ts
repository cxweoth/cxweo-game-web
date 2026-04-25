// 每幀世界更新：籃子移動、生成球、移動球、碰撞、popup 老化。

import { clamp } from '@/lib/utils';
import { BALL_COLORS, CFG, GOLDEN_COLOR, type Ball, type Popup } from './types';

export type World = {
  paddleX: number;
  balls: Ball[];
  popups: Popup[];
  /** ms 倒數，<= 0 時生成新球 */
  spawnTimer: number;
  /** 累計接到的球（含金球，每球 +1）→ 控制難度 */
  totalCatches: number;
  /** 受擊閃光終點（ms）— 接到時短暫綠閃；漏球時短暫紅閃 */
  catchFlashUntil: number;
  missFlashUntil: number;
};

export function createWorld(): World {
  return {
    paddleX: CFG.width / 2,
    balls: [],
    popups: [],
    spawnTimer: CFG.spawnIntervalStart,
    totalCatches: 0,
    catchFlashUntil: 0,
    missFlashUntil: 0,
  };
}

function speedMul(catches: number): number {
  return 1 + Math.min(CFG.speedBoostMax, catches * CFG.speedBoostPerCatch);
}

function spawnInterval(catches: number): number {
  const f = Math.min(1, catches / CFG.spawnRampCatches);
  return CFG.spawnIntervalStart - (CFG.spawnIntervalStart - CFG.spawnIntervalMin) * f;
}

function createBall(): Ball {
  const isGolden = Math.random() < CFG.goldenChance;
  const colorList = BALL_COLORS;
  return {
    x: CFG.ballR + Math.random() * (CFG.width - 2 * CFG.ballR),
    y: -CFG.ballR,
    vy: CFG.baseVy + (Math.random() - 0.5) * 2 * CFG.vyVariance,
    r: isGolden ? CFG.ballR + 2 : CFG.ballR,
    color: isGolden ? GOLDEN_COLOR : colorList[Math.floor(Math.random() * colorList.length)]!,
    isGolden,
    spin: Math.random() * Math.PI * 2,
  };
}

/** 接到時的飄字 */
function pushCatchPopup(world: World, ball: Ball, points: number): void {
  world.popups.push({
    x: ball.x,
    y: CFG.paddleY,
    text: `+${points}`,
    color: ball.isGolden ? '#fbbf24' : '#22c55e',
    age: 0,
    ttl: 0.9,
  });
}

/** 漏球時的飄字 */
function pushMissPopup(world: World, ball: Ball): void {
  world.popups.push({
    x: ball.x,
    y: CFG.height - 20,
    text: '−1 ❤',
    color: '#ef4444',
    age: 0,
    ttl: 1.0,
  });
}

/**
 * 一幀的世界推進。callback 通知 React 同步分數 / 生命。
 * gameOver 時(alive=false)只更新 popup,不再生成 / 移動球。
 */
export function tickPhysics(
  world: World,
  dt: number,
  nowMs: number,
  alive: boolean,
  keys: ReadonlySet<string>,
  /** 滑鼠 / 觸控位置(畫布內 X);null 表示交給鍵盤 */
  mouseX: number | null,
  onCatch: (points: number) => void,
  onMiss: () => void,
): void {
  if (alive) {
    // 1) 滑鼠追蹤(若有);鍵盤再從這個基準微調
    if (mouseX !== null) {
      world.paddleX = mouseX;
    }
    if (keys.has('ArrowLeft') || keys.has('KeyA')) {
      world.paddleX -= CFG.paddleSpeedKey * dt;
    }
    if (keys.has('ArrowRight') || keys.has('KeyD')) {
      world.paddleX += CFG.paddleSpeedKey * dt;
    }
    world.paddleX = clamp(world.paddleX, CFG.paddleW / 2, CFG.width - CFG.paddleW / 2);

    // 生成新球
    world.spawnTimer -= dt * 1000;
    if (world.spawnTimer <= 0) {
      world.balls.push(createBall());
      world.spawnTimer = spawnInterval(world.totalCatches);
    }

    // 移動 + 結算每顆球
    const mul = speedMul(world.totalCatches);
    const remaining: Ball[] = [];
    const left = world.paddleX - CFG.paddleW / 2;
    const right = world.paddleX + CFG.paddleW / 2;
    for (const b of world.balls) {
      b.y += b.vy * mul * dt;
      b.spin += dt * CFG.spinSpeed;
      // 接到:球底接觸 paddle 頂面 + X 落在籃子寬度內
      if (b.y + b.r >= CFG.paddleY - CFG.paddleH / 2 && b.y - b.r <= CFG.paddleY + CFG.paddleH / 2) {
        if (b.x >= left && b.x <= right) {
          const pts = b.isGolden ? CFG.goldenScore : CFG.normalScore;
          world.totalCatches++;
          world.catchFlashUntil = nowMs + 160;
          pushCatchPopup(world, b, pts);
          onCatch(pts);
          continue;
        }
      }
      // 漏球:跌出畫面底
      if (b.y - b.r > CFG.height) {
        world.missFlashUntil = nowMs + 220;
        pushMissPopup(world, b);
        onMiss();
        continue;
      }
      remaining.push(b);
    }
    world.balls = remaining;
  }

  // popup 老化(即使 gameOver 也要繼續跑完)
  for (const p of world.popups) {
    p.age += dt;
    p.y -= 40 * dt; // 每秒上飄 40px
  }
  world.popups = world.popups.filter((p) => p.age < p.ttl);
}

/** 用於 HUD 顯示的「目前難度等級」(0..1,1 = 已最難) */
export function difficultyFraction(catches: number): number {
  return Math.min(1, catches / CFG.spawnRampCatches);
}
