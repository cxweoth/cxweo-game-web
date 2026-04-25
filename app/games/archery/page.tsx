import type { Metadata } from 'next';
import { Archery } from '@/components/games/Archery/Archery';

export const metadata: Metadata = {
  title: '射箭',
  description: '蓄力瞄準射 10 環標靶,5 箭一輪,風向影響軌跡。',
};

export default function ArcheryPage() {
  return <Archery />;
}
