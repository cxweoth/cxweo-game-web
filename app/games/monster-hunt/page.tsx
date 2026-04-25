import type { Metadata } from 'next';
import { MonsterHunt } from '@/components/games/MonsterHunt/MonsterHunt';

export const metadata: Metadata = {
  title: '弓手獵怪',
  description: '對怪物射箭,邊射邊閃避火球。命中怪物 5 次獲勝,被擊中 10 次失敗。',
};

export default function MonsterHuntPage() {
  return <MonsterHunt />;
}
