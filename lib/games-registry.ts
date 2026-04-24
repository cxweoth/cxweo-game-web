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
    implemented: false,
  },
  {
    slug: 'gomoku',
    name: '五子棋',
    description: '15×15 棋盤，先連五子者勝。支援雙人對戰與簡易 AI。',
    emoji: '⚫',
    tags: ['策略', '雙人'],
    implemented: false,
  },
  {
    slug: 'catch-ball',
    name: '接球',
    description: '左右移動接住從天而降的球，漏太多就結束。',
    emoji: '🏀',
    tags: ['敏捷'],
    implemented: false,
  },
  {
    slug: 'tetris',
    name: '俄羅斯方塊',
    description: '堆疊方塊消除整行，速度會隨等級加快。',
    emoji: '🟦',
    tags: ['經典', '反應'],
    implemented: false,
  },
  {
    slug: 'stairs',
    name: '下樓梯',
    description: '踩著台階往下，避開天花板與刺。',
    emoji: '🪜',
    tags: ['敏捷'],
    implemented: false,
  },
  {
    slug: 'bubble-shooter',
    name: '泡泡龍',
    description: '射出同色泡泡消除，不讓泡泡堆到底線。',
    emoji: '🫧',
    tags: ['益智'],
    implemented: false,
  },
];

export function getGameBySlug(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}
