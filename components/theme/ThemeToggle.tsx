'use client';

import { useEffect, useState } from 'react';
import { getSettings, setSettings, type AppTheme } from '@/lib/storage';
import { Button } from '@/components/ui/Button';

type Resolved = 'light' | 'dark';

function resolveTheme(theme: AppTheme): Resolved {
  if (theme === 'light' || theme === 'dark') return theme;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(resolved: Resolved) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.dataset.theme = resolved;
}

/**
 * 暗色模式切換：light → dark → system → light
 * - 設定寫入 localStorage
 * - system 模式下會跟隨 prefers-color-scheme 即時變化
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<AppTheme>('system');

  // 首次掛載：讀 localStorage 並套用
  useEffect(() => {
    const stored = getSettings().theme;
    setTheme(stored);
    applyTheme(resolveTheme(stored));
  }, []);

  // system 模式下跟隨 OS 變化
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const cycle = () => {
    const next: AppTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    setSettings({ theme: next });
    applyTheme(resolveTheme(next));
  };

  const label = theme === 'light' ? '☀️ 亮色' : theme === 'dark' ? '🌙 暗色' : '🖥️ 系統';

  return (
    <Button variant="ghost" size="sm" onClick={cycle} aria-label="切換主題">
      {label}
    </Button>
  );
}
