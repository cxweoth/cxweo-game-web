import type { Metadata } from 'next';
import { DoodleJump } from '@/components/games/DoodleJump/DoodleJump';

export const metadata: Metadata = {
  title: '跳躍王',
  description: '左右移動踩平台往上跳;碎平台、移動平台、彈簧三種變化。挑戰跳更高。',
};

export default function DoodleJumpPage() {
  return <DoodleJump />;
}
