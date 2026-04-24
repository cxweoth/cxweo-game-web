// 共用遊戲型別

/** 遊戲階段狀態（所有遊戲都應沿用這組 type） */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameOver';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

/** 註冊表用來描述一款遊戲的靜態 metadata */
export type GameMeta = {
  /** URL slug，kebab-case；對應 /app/games/<slug>/page.tsx */
  slug: string;
  /** 顯示名稱（首頁卡片、遊戲頁標題） */
  name: string;
  /** 一句話描述（首頁卡片） */
  description: string;
  /** 圖示：暫以 emoji 當縮圖，未來可換 SVG/PNG 路徑 */
  emoji: string;
  /** 玩法標籤（顯示在卡片角落） */
  tags?: readonly string[];
  /** 難度（若遊戲本身可切換難度則留 undefined） */
  difficulty?: GameDifficulty;
  /** 是否已實作；false 時首頁卡片顯示 Coming Soon 並不可點擊 */
  implemented: boolean;
};
