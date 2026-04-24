// localStorage 封裝：SSR safe，自動處理 JSON、錯誤吞掉
//
// 用法：
//   const best = getHighScore('tetris') ?? 0;
//   setHighScore('tetris', score);
//
//   const settings = getSettings();
//   setSettings({ theme: 'dark' });

const PREFIX = 'cxweo-game-web';

/** 是否在瀏覽器環境；SSR / Server Component 時為 false */
function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readKey<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeKey<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    // 忽略 QuotaExceededError 或隱私瀏覽器不允許寫入的情況
  }
}

// --- 最高分 ---

export function getHighScore(slug: string): number | null {
  const value = readKey<number>(`highscore:${slug}`);
  return typeof value === 'number' ? value : null;
}

/** 只在新分數更高時寫入，回傳是否有更新 */
export function setHighScore(slug: string, score: number): boolean {
  const current = getHighScore(slug);
  if (current !== null && current >= score) return false;
  writeKey(`highscore:${slug}`, score);
  return true;
}

// --- 全域設定 ---

export type AppTheme = 'light' | 'dark' | 'system';

export type AppSettings = {
  theme: AppTheme;
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
};

export function getSettings(): AppSettings {
  const stored = readKey<Partial<AppSettings>>('settings');
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...partial };
  writeKey('settings', next);
  return next;
}
