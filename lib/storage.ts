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

// --- 通用 JSON 存取 ---
//
// 當遊戲需要保存結構化資料（戰績、偏好設定等），用這組 API。
// key 會自動加上專案 prefix，避免與其他網站的 localStorage 衝突。

export function readJSON<T>(key: string): T | null {
  return readKey<T>(key);
}

export function writeJSON<T>(key: string, value: T): void {
  writeKey(key, value);
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

// --- 最佳時間（越低越好）---
//
// 用於「完成越快越好」類型的遊戲（踩地雷等）。key 建議用 `game:variant`
// 例如 `minesweeper:easy`，讓同一款遊戲的不同難度各自獨立記錄。

export function getBestTime(key: string): number | null {
  const value = readKey<number>(`best-time:${key}`);
  return typeof value === 'number' ? value : null;
}

/** 只在新時間更短時寫入，回傳是否有更新 */
export function setBestTime(key: string, seconds: number): boolean {
  const current = getBestTime(key);
  if (current !== null && current <= seconds) return false;
  writeKey(`best-time:${key}`, seconds);
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
