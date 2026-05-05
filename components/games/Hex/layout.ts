// 六貫棋 Hex — SVG 渲染所需的幾何計算
//
// pointy-top hex,axial(rhombus)座標。每格中心:
//   cx = padX + R + (col + row * 0.5) * hexW
//   cy = padY + R + row * 1.5 * R
// 其中 hexW = sqrt(3) * R,row 越大整體越往右下偏 → 棋盤呈平行四邊形。

const SQRT3 = Math.sqrt(3);

export type Layout = {
  n: number;
  R: number;
  hexW: number;
  pad: number;
  width: number;
  height: number;
};

export function makeLayout(n: number): Layout {
  // 三種規模 7 / 9 / 11 各自選個合適的半徑,讓 viewBox 都落在約 600 寬
  const R = n === 7 ? 36 : n === 9 ? 28 : 22;
  const hexW = SQRT3 * R;
  const pad = R * 1.4;
  const width = pad * 2 + hexW * 1.5 * (n - 1) + hexW;
  const height = pad * 2 + 1.5 * R * (n - 1) + 2 * R;
  return { n, R, hexW, pad, width, height };
}

export function center(layout: Layout, row: number, col: number): { cx: number; cy: number } {
  const { R, hexW, pad } = layout;
  const cx = pad + R + (col + row * 0.5) * hexW;
  const cy = pad + R + row * 1.5 * R;
  return { cx, cy };
}

/** 取 pointy-top hex 的 6 個頂點(順時鐘從 12 點開始)。 */
export function hexVertices(cx: number, cy: number, R: number): Array<[number, number]> {
  // 12, 2, 4, 6, 8, 10 點
  const half = R / 2;
  const wing = (SQRT3 / 2) * R;
  return [
    [cx, cy - R],
    [cx + wing, cy - half],
    [cx + wing, cy + half],
    [cx, cy + R],
    [cx - wing, cy + half],
    [cx - wing, cy - half],
  ];
}

export function hexPathD(verts: Array<[number, number]>): string {
  return `M ${verts[0]![0]} ${verts[0]![1]} ` + verts.slice(1).map(([x, y]) => `L ${x} ${y}`).join(' ') + ' Z';
}

/**
 * 對每格的 6 條邊判斷是否為棋盤外緣,以及該邊的染色:
 *   - 黑邊('B'):row=0 或 row=n-1 對應的「無鄰位」邊
 *   - 白邊('W'):col=0 或 col=n-1 對應的「無鄰位」邊
 *   - 衝突角(同時要求黑+白)取黑優先(row 邊蓋過 col 邊,角落視覺上仍清楚)
 *
 * 6 條邊與鄰位對應(pointy-top, axial):
 *   edge 0 (NE, vertex 0→1):缺鄰位 (r-1, c+1) ⇔ r=0 或 c=n-1 → 黑(r=0 優先)/ 白(c=n-1)
 *   edge 1 (E,  vertex 1→2):缺鄰位 (r,   c+1) ⇔ c=n-1 → 白
 *   edge 2 (SE, vertex 2→3):缺鄰位 (r+1, c)   ⇔ r=n-1 → 黑
 *   edge 3 (SW, vertex 3→4):缺鄰位 (r+1, c-1) ⇔ r=n-1 或 c=0 → 黑(r=n-1 優先)/ 白(c=0)
 *   edge 4 (W,  vertex 4→5):缺鄰位 (r,   c-1) ⇔ c=0 → 白
 *   edge 5 (NW, vertex 5→0):缺鄰位 (r-1, c)   ⇔ r=0 → 黑
 */
export function edgeColor(
  row: number,
  col: number,
  edgeIdx: number,
  n: number,
): 'B' | 'W' | null {
  switch (edgeIdx) {
    case 0:
      if (row === 0) return 'B';
      if (col === n - 1) return 'W';
      return null;
    case 1:
      return col === n - 1 ? 'W' : null;
    case 2:
      return row === n - 1 ? 'B' : null;
    case 3:
      if (row === n - 1) return 'B';
      if (col === 0) return 'W';
      return null;
    case 4:
      return col === 0 ? 'W' : null;
    case 5:
      return row === 0 ? 'B' : null;
    default:
      return null;
  }
}
