// Tetris Canvas 繪圖。

import { PIECE_COLORS, PIECE_SHAPES } from './pieces';
import { CFG, COLS, ROWS, type Board, type Piece } from './types';

type DrawState = {
  board: Board;
  piece: Piece;
  ghost: Piece;
  paused: boolean;
};

export function drawBoard(ctx: CanvasRenderingContext2D, s: DrawState): void {
  const W = CFG.width;
  const H = CFG.height;
  // 底色
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // 棋盤格線
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CFG.cell, 0);
    ctx.lineTo(i * CFG.cell, H);
    ctx.stroke();
  }
  for (let j = 1; j < ROWS; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * CFG.cell);
    ctx.lineTo(W, j * CFG.cell);
    ctx.stroke();
  }

  // 已固定方塊
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = s.board[r]![c];
      if (t) drawCell(ctx, c, r, PIECE_COLORS[t]);
    }
  }

  // 鬼影
  drawPiece(ctx, s.ghost, PIECE_COLORS[s.ghost.type], 0.22);
  // 當前方塊
  drawPiece(ctx, s.piece, PIECE_COLORS[s.piece.type], 1);

  if (s.paused) drawPauseOverlay(ctx, W, H);
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  color: string,
  alpha: number,
): void {
  const shape = PIECE_SHAPES[piece.type][piece.rotation]!;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const [dx, dy] of shape) {
    const c = piece.x + dx;
    const r = piece.y + dy;
    if (r < 0) continue; // 上方隱藏區不畫
    drawCell(ctx, c, r, color);
  }
  ctx.restore();
}

function drawCell(ctx: CanvasRenderingContext2D, col: number, row: number, color: string): void {
  const x = col * CFG.cell;
  const y = row * CFG.cell;
  const s = CFG.cell;
  // 主體 + 漸層光澤
  const grd = ctx.createLinearGradient(x, y, x, y + s);
  grd.addColorStop(0, color);
  grd.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = grd;
  ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x + 2, y + 2, s - 4, 2);
  // 邊框
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
}

/** 把 16 進位顏色變暗或變亮 amount ∈ [-1, 1] */
function shade(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1]!, 16);
  const g = parseInt(m[2]!, 16);
  const b = parseInt(m[3]!, 16);
  const adj = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? 255 - v : v) * amount)));
  const hh = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hh(adj(r))}${hh(adj(g))}${hh(adj(b))}`;
}

function drawPauseOverlay(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px ui-sans-serif, system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('暫停', W / 2, H / 2);
  ctx.font = '14px ui-sans-serif, system-ui';
  ctx.fillText('按 P / Esc 繼續', W / 2, H / 2 + 24);
  ctx.restore();
}

/** 旁邊的「下一塊」預覽小畫布 */
export function drawNextPreview(
  ctx: CanvasRenderingContext2D,
  type: Piece['type'],
  size: number,
): void {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);
  const shape = PIECE_SHAPES[type][0]!;
  // 找包覆框居中
  const minC = Math.min(...shape.map(([c]) => c));
  const maxC = Math.max(...shape.map(([c]) => c));
  const minR = Math.min(...shape.map(([, r]) => r));
  const maxR = Math.max(...shape.map(([, r]) => r));
  const w = maxC - minC + 1;
  const h = maxR - minR + 1;
  const cell = Math.floor(size / Math.max(w, h, 4));
  const offsetX = (size - cell * w) / 2 - cell * minC;
  const offsetY = (size - cell * h) / 2 - cell * minR;
  ctx.save();
  for (const [c, r] of shape) {
    const x = offsetX + c * cell;
    const y = offsetY + r * cell;
    const grd = ctx.createLinearGradient(x, y, x, y + cell);
    grd.addColorStop(0, PIECE_COLORS[type]);
    grd.addColorStop(1, shade(PIECE_COLORS[type], -0.25));
    ctx.fillStyle = grd;
    ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
  }
  ctx.restore();
}
