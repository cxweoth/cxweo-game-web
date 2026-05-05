import type { Metadata } from 'next';
import { SwordDuel } from '@/components/games/SwordDuel/SwordDuel';

export const metadata: Metadata = {
  title: '劍盾決鬥',
  description: '玩家騎士 vs 盾劍哥布林的近身戰鬥;繞背可造成致命傷害,正面攻擊會被盾擋。',
};

export default function SwordDuelPage() {
  return <SwordDuel />;
}
