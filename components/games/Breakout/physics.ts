// 物理層:World、tick、發球、磚塊產生、碰撞處理。純資料,不畫圖、不碰 React。

import { clamp } from '@/lib/utils';
import { CFG, type Ball, type Brick, type Particle, type TickResult } from './types';

export type World = {
  paddleX: number;
  paddleW: number;
  ball: Ball;
  /** 'sticky' = 黏在板上等發球;'launched' = 飛行中 */
  ballState: 'sticky' | 'launched';
  /** sticky 期間進入時間;tick 時用來判定 autoLaunch 觸發 */
  stickySince: number;
  /** 發球初速(隨關卡升級加快) */
  serveSpeed: number;
  bricks: Brick[];
  bricksAlive: number;
  particles: Particle[];
  shakeUntil: number;
  level: number;
};

export function createWorld(level = 1): World {
  const paddleW = Math.max(CFG.paddleWMin, CFG.paddleW0 - (level - 1) * 6);
  const serveSpeed = Math.min(
    CFG.ballSpeedMax,
    CFG.ballSpeed0 * (1 + CFG.speedPerLevel * (level - 1)),
  );
  return {
    paddleX: CFG.width / 2,
    paddleW,
    ball: {
      x: CFG.width / 2,
      y: CFG.paddleY - CFG.paddleH / 2 - CFG.ballR,
      vx: 0,
      vy: 0,
      r: CFG.ballR,
    },
    ballState: 'sticky',
    stickySince: 0,
    serveSpeed,
    bricks: makeBricks(),
    bricksAlive: CFG.brickRows * CFG.brickCols,
    particles: [],
    shakeUntil: 0,
    level,
  };
}

function makeBricks(): Brick[] {
  const bricks: Brick[] = [];
  const cellW =
    (CFG.width - 2 * CFG.brickSideMargin - (CFG.brickCols - 1) * CFG.brickGap) /
    CFG.brickCols;
  for (let r = 0; r < CFG.brickRows; r++) {
    for (let c = 0; c < CFG.brickCols; c++) {
      const x = CFG.brickSideMargin + c * (cellW + CFG.brickGap);
      const y = CFG.brickTop + r * (CFG.brickH + CFG.brickGap);
      bricks.push({
        x,
        y,
        w: cellW,
        h: CFG.brickH,
        alive: true,
        color: CFG.brickRowColors[r] ?? '#fff',
        points: CFG.brickRowScores[r] ?? 10,
      });
    }
  }
  return bricks;
}

/** sticky → launched;隨機角度 −60° ~ −120°(往上扇形) */
function launchBall(world: World): void {
  if (world.ballState !== 'sticky') return;
  const angleDeg = -60 - Math.random() * 60;
  const a = (angleDeg * Math.PI) / 180;
  world.ball.vx = Math.cos(a) * world.serveSpeed;
  world.ball.vy = Math.sin(a) * world.serveSpeed;
  world.ballState = 'launched';
}

/** 失球後叫:把球擺回板子上方變 sticky;stickySince=0 讓下次 tick 重新開始計時 */
export function resetBall(world: World): void {
  world.ball.x = world.paddleX;
  world.ball.y = CFG.paddleY - CFG.paddleH / 2 - CFG.ballR;
  world.ball.vx = 0;
  world.ball.vy = 0;
  world.ballState = 'sticky';
  world.stickySince = 0;
}

function spawnBrickParticles(world: World, brick: Brick): void {
  const cx = brick.x + brick.w / 2;
  const cy = brick.y + brick.h / 2;
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 120;
    world.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: 0,
      ttl: 0.55 + Math.random() * 0.25,
      color: brick.color,
      size: 2 + Math.random() * 2,
    });
  }
}

/**
 * 一幀世界推進。
 * - 板子由 pointerX(優先)或鍵盤控制
 * - sticky:球跟著板;達 autoLaunchMs 自動發球
 * - launched:子步進防穿透 + 牆 / 板 / 磚塊碰撞
 */
export function tickWorld(
  world: World,
  dt: number,
  nowMs: number,
  keys: ReadonlySet<string>,
  pointerX: number | null,
): TickResult {
  // 板子位置
  if (pointerX !== null) {
    world.paddleX = clamp(
      pointerX,
      world.paddleW / 2,
      CFG.width - world.paddleW / 2,
    );
  }
  if (keys.has('ArrowLeft') || keys.has('KeyA')) {
    world.paddleX = Math.max(
      world.paddleW / 2,
      world.paddleX - CFG.paddleSpeedKey * dt,
    );
  }
  if (keys.has('ArrowRight') || keys.has('KeyD')) {
    world.paddleX = Math.min(
      CFG.width - world.paddleW / 2,
      world.paddleX + CFG.paddleSpeedKey * dt,
    );
  }

  // 粒子(無條件老化,死亡時也要看到)
  for (const p of world.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 600 * dt;
    p.vx *= 0.98;
  }
  world.particles = world.particles.filter((p) => p.life < p.ttl);

  if (world.bricksAlive === 0) {
    return { brickScore: 0, lifeLost: false };
  }

  if (world.ballState === 'sticky') {
    world.ball.x = world.paddleX;
    if (world.stickySince === 0) world.stickySince = nowMs;
    if (nowMs - world.stickySince >= CFG.autoLaunchMs) launchBall(world);
    return { brickScore: 0, lifeLost: false };
  }

  // launched:子步進
  const ball = world.ball;
  const speed = Math.hypot(ball.vx, ball.vy);
  // 子步上限:每步移動 ≤ ball 半徑的 80%,避免穿過磚塊
  const steps = Math.max(1, Math.ceil((speed * dt) / (ball.r * 0.8)));
  let brickScore = 0;
  let lifeLost = false;

  for (let s = 0; s < steps; s++) {
    const ddt = dt / steps;
    ball.x += ball.vx * ddt;
    ball.y += ball.vy * ddt;

    // 牆壁
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = -ball.vx;
    } else if (ball.x + ball.r > CFG.width) {
      ball.x = CFG.width - ball.r;
      ball.vx = -ball.vx;
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = -ball.vy;
    }

    // 板子(僅向下時判定,避免從下面 punch through)
    if (
      ball.vy > 0 &&
      ball.y + ball.r >= CFG.paddleY - CFG.paddleH / 2 &&
      ball.y - ball.r <= CFG.paddleY + CFG.paddleH / 2 &&
      ball.x >= world.paddleX - world.paddleW / 2 - ball.r &&
      ball.x <= world.paddleX + world.paddleW / 2 + ball.r
    ) {
      // 反彈角度:命中位置 → −90° ± 75°(中間直上、邊緣最斜)
      const offset = clamp(
        (ball.x - world.paddleX) / (world.paddleW / 2),
        -1,
        1,
      );
      const angleDeg = -90 + offset * 75;
      const a = (angleDeg * Math.PI) / 180;
      const newSpeed = Math.min(CFG.ballSpeedMax, Math.hypot(ball.vx, ball.vy));
      ball.vx = Math.cos(a) * newSpeed;
      ball.vy = Math.sin(a) * newSpeed;
      ball.y = CFG.paddleY - CFG.paddleH / 2 - ball.r - 0.1;
    }

    // 磚塊(circle vs AABB)
    for (const brick of world.bricks) {
      if (!brick.alive) continue;
      const cx = clamp(ball.x, brick.x, brick.x + brick.w);
      const cy = clamp(ball.y, brick.y, brick.y + brick.h);
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 >= ball.r * ball.r) continue;

      brick.alive = false;
      world.bricksAlive--;
      brickScore += brick.points;
      world.shakeUntil = nowMs + 80;
      spawnBrickParticles(world, brick);

      // 反彈方向:用最近邊緣的法向量反射;dist2=0(穿入正中)時直接翻 vy
      if (dist2 === 0) {
        ball.vy = -ball.vy;
      } else {
        const len = Math.sqrt(dist2);
        const nx = dx / len;
        const ny = dy / len;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx = ball.vx - 2 * dot * nx;
        ball.vy = ball.vy - 2 * dot * ny;
        // 推出磚塊,避免下幀重複碰撞
        const push = ball.r - len + 0.5;
        ball.x += nx * push;
        ball.y += ny * push;
      }

      // 加速:速度 ×(1 + speedPerBrick),封底 ballSpeedMax
      const oldS = Math.hypot(ball.vx, ball.vy);
      const newS = Math.min(CFG.ballSpeedMax, oldS * (1 + CFG.speedPerBrick));
      if (oldS > 0 && newS !== oldS) {
        const f = newS / oldS;
        ball.vx *= f;
        ball.vy *= f;
      }
      // 一個子步只處理一塊磚,避免連鎖反彈方向錯亂
      break;
    }

    // 失球
    if (ball.y - ball.r > CFG.height) {
      lifeLost = true;
      world.shakeUntil = nowMs + 250;
      break;
    }
  }

  return { brickScore, lifeLost };
}
