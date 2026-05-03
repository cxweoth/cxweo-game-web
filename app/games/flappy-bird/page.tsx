import type { Metadata } from 'next';
import { FlappyBird } from '@/components/games/FlappyBird/FlappyBird';

export const metadata: Metadata = {
  title: '跳跳鳥',
  description: '點擊或空白鍵讓鳥拍翅,穿過水管得分;撞到任何東西就結束。',
};

export default function FlappyBirdPage() {
  return <FlappyBird />;
}
