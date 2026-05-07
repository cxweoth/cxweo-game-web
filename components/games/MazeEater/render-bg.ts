// 迷宮繪製:藍色牆 + 黑色背景 + 豆子 + 大力丸閃爍

import { cellAt } from './maze';
import { CANVAS_W, CFG, FRUIT_EMOJI, type CellKind, type Fruit } from './types';

export function drawMaze(
  ctx: CanvasRenderingContext2D,
  cells: CellKind[],
  time: number,
): void {
  // 黑底
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CFG.rows * CFG.cell);

  // 牆 — 藍色矩形 + 內白邊(經典感)
  for (let r = 0; r < CFG.rows; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      const k = cellAt(cells, c, r);
      if (k !== 'wall') continue;
      drawWallCell(ctx, c, r, cells);
    }
  }

  // 鬼屋門 — 粉色橫線
  for (let r = 0; r < CFG.rows; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      if (cellAt(cells, c, r) !== 'door') continue;
      const x = c * CFG.cell;
      const y = r * CFG.cell;
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(x + 2, y + CFG.cell / 2 - 2, CFG.cell - 4, 4);
    }
  }

  // 豆子 + 大力丸
  for (let r = 0; r < CFG.rows; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      const k = cellAt(cells, c, r);
      if (k === 'pellet') {
        const cx = (c + 0.5) * CFG.cell;
        const cy = (r + 0.5) * CFG.cell;
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (k === 'power') {
        const cx = (c + 0.5) * CFG.cell;
        const cy = (r + 0.5) * CFG.cell;
        const blink = Math.sin(time * 6) > 0;
        ctx.fillStyle = blink ? '#fef3c7' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** 水果(emoji)+ 即將消失時閃爍 */
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  fruit: Fruit,
  time: number,
): void {
  const cx = (fruit.col + 0.5) * CFG.cell;
  const cy = (fruit.row + 0.5) * CFG.cell;
  const flashing = fruit.ttl < 3;
  if (flashing && Math.sin(time * 10) < 0) return;
  ctx.font = `${Math.floor(CFG.cell * 1.05)}px "Segoe UI Emoji", "Apple Color Emoji", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(FRUIT_EMOJI[fruit.kind], cx, cy + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** 繪製單一牆 cell — 看 4 邊鄰居決定是否要畫該邊邊框 */
function drawWallCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  cells: CellKind[],
): void {
  const x = col * CFG.cell;
  const y = row * CFG.cell;
  const s = CFG.cell;

  // 主體深藍
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(x, y, s, s);

  // 鄰居判斷 — 邊上是「非牆」就畫亮藍邊
  const upWall = cellAt(cells, col, row - 1) === 'wall';
  const downWall = cellAt(cells, col, row + 1) === 'wall';
  const leftWall = cellAt(cells, col - 1, row) === 'wall';
  const rightWall = cellAt(cells, col + 1, row) === 'wall';

  ctx.fillStyle = '#3b82f6';
  const t = 2; // 邊框粗
  if (!upWall) ctx.fillRect(x, y, s, t);
  if (!downWall) ctx.fillRect(x, y + s - t, s, t);
  if (!leftWall) ctx.fillRect(x, y, t, s);
  if (!rightWall) ctx.fillRect(x + s - t, y, t, s);

  // 內角圓潤(用更亮一點的色塊)— 簡化:對角缺鄰居時畫小方塊
  ctx.fillStyle = '#60a5fa';
  if (!upWall && !leftWall) ctx.fillRect(x, y, t + 1, t + 1);
  if (!upWall && !rightWall) ctx.fillRect(x + s - t - 1, y, t + 1, t + 1);
  if (!downWall && !leftWall) ctx.fillRect(x, y + s - t - 1, t + 1, t + 1);
  if (!downWall && !rightWall) ctx.fillRect(x + s - t - 1, y + s - t - 1, t + 1, t + 1);
}
