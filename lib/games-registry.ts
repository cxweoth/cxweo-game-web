import type { GameMeta } from '@/types/game';

/**
 * 遊戲註冊表 — 首頁與遊戲頁都從這裡讀。
 *
 * 新增一款遊戲時：
 *   1. 把 implemented 從 false 改為 true
 *   2. 確認 /app/games/<slug>/page.tsx 已建立
 *   3. 如需更新 emoji / description 請在此調整
 */
export const GAMES: readonly GameMeta[] = [
  {
    slug: 'minesweeper',
    name: '踩地雷',
    description: '翻開所有非地雷的格子；數字提示周圍地雷數。',
    emoji: '💣',
    tags: ['邏輯', '經典'],
    implemented: true,
  },
  {
    slug: 'gomoku',
    name: '五子棋',
    description: '15×15 棋盤，先連五子者勝。支援雙人對戰與簡易 AI。',
    emoji: '⚫',
    tags: ['策略', '雙人'],
    implemented: true,
  },
  {
    slug: 'archery',
    name: '射箭',
    description: '蓄力瞄準射 10 環標靶，5 箭一輪。風向影響軌跡。',
    emoji: '🏹',
    tags: ['敏捷', '物理'],
    implemented: true,
  },
  {
    slug: 'monster-hunt',
    name: '弓手獵怪',
    description: '對怪物射箭，邊射邊閃避火球。命中 5 次勝、被擊中 10 次敗。',
    emoji: '👹',
    tags: ['敏捷', '反射'],
    implemented: true,
  },
  {
    slug: 'catch-ball',
    name: '接球',
    description: '左右移動接住從天而降的球，漏太多就結束。',
    emoji: '🧺',
    tags: ['敏捷'],
    implemented: true,
  },
  {
    slug: 'tetris',
    name: '俄羅斯方塊',
    description: '堆疊方塊消除整行，速度會隨等級加快。',
    emoji: '🟦',
    tags: ['經典', '反應'],
    implemented: true,
  },
  {
    slug: 'stairs',
    name: '小朋友下樓梯',
    description: '踩著台階往下，避開天花板與刺。',
    emoji: '🪜',
    tags: ['敏捷'],
    implemented: true,
  },
  {
    slug: 'bubble-shooter',
    name: '泡泡連消',
    description: '射出同色泡泡消除，不讓泡泡堆到底線。',
    emoji: '🫧',
    tags: ['益智'],
    implemented: true,
  },
  {
    slug: 'galaxian',
    name: '小蜜蜂',
    description: '經典 Galaxian 風格射擊；消滅蜜蜂方陣，閃避俯衝攻擊。',
    emoji: '🐝',
    tags: ['射擊', '經典'],
    implemented: true,
  },
  {
    slug: '2048',
    name: '2048',
    description: '滑動合併相同數字，挑戰合出 2048。簡單上手、難以放下。',
    emoji: '🔢',
    tags: ['益智', '經典'],
    implemented: true,
  },
  {
    slug: 'snake',
    name: '貪食蛇',
    description: '經典 Snake；吃蘋果加長加速，撞牆或自己即結束。',
    emoji: '🐍',
    tags: ['經典', '反應'],
    implemented: true,
  },
  {
    slug: 'whack-a-mole',
    name: '打地鼠',
    description: '30 秒內打越多地鼠越好；打到空地會扣分，反應要快。',
    emoji: '🔨',
    tags: ['反應', '休閒'],
    implemented: true,
  },
  {
    slug: 'memory',
    name: '記憶翻牌',
    description: '翻開兩張卡，圖案相同就配對成功。三難度，挑戰最短時間。',
    emoji: '🧠',
    tags: ['益智', '記憶'],
    implemented: true,
  },
  {
    slug: 'breakout',
    name: '打磚塊',
    description: '經典 Breakout；移動板子接球反彈，清光磚塊進下一關。',
    emoji: '🧱',
    tags: ['經典', '物理'],
    implemented: true,
  },
];

export function getGameBySlug(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}
