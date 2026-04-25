import type { Metadata } from 'next';
import { Stairs } from '@/components/games/Stairs/Stairs';

export const metadata: Metadata = {
  title: '下樓梯',
  description: '踩著樓梯往下走，避開紅色尖刺與頭頂的尖刺天花板。',
};

export default function StairsPage() {
  return <Stairs />;
}
