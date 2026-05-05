// 劍盾決鬥 — 怪物 AI 狀態機
//
// 狀態:approach / guard / swing / hurt / dead
// 切換規則(簡化):
//   approach:朝玩家移動;dist 進入交戰範圍 → 切 guard
//   guard  :phaseT 超過 phaseDur(800~1500ms,隨機)→ 60% 再 guard / 40% swing;
//            若距離拉開太遠 → 回 approach
//   swing  :phaseT 超過 phaseDur(bossSwingDur)→ 60% guard / 40% swing;
//            距離拉開太遠 → approach
//   hurt   :phaseT 超過 phaseDur(bossHurtMs)→ 切 guard(防禦反擊心態)
//   dead   :停止所有 AI
//
// 怪物 facing:不在 swing/hurt 期間時,持續轉向玩家。

import { CFG, type BossPhase, type BossState, type Facing, type PlayerState } from './types';

function pickNextAfterClose(): BossPhase {
  return Math.random() < 0.6 ? 'guard' : 'swing';
}

function startPhase(boss: BossState, phase: BossPhase): void {
  boss.phase = phase;
  boss.phaseT = 0;
  boss.hitThisSwing = false;
  switch (phase) {
    case 'guard':
      boss.phaseDur =
        (CFG.bossGuardMinMs + Math.random() * (CFG.bossGuardMaxMs - CFG.bossGuardMinMs)) /
        1000;
      break;
    case 'swing':
      boss.phaseDur = CFG.bossSwingDur;
      break;
    case 'hurt':
      boss.phaseDur = CFG.bossHurtMs / 1000;
      break;
    case 'approach':
      boss.phaseDur = 0; // approach 不靠時間結束
      break;
    case 'dead':
      boss.phaseDur = 0;
      break;
  }
}

/** Boss 收到傷害時切 hurt(由外部 physics 呼叫) */
export function bossEnterHurt(boss: BossState): void {
  startPhase(boss, 'hurt');
}

export function bossEnterDead(boss: BossState): void {
  startPhase(boss, 'dead');
}

/** Boss 被打飛時可能略後退一點(視覺反饋) */
export function bossKnockback(boss: BossState, fromLeft: boolean): void {
  // 往遠離玩家方向後退 8px
  boss.x += fromLeft ? 8 : -8;
}

/**
 * 一幀 AI tick;直接 mutate boss。physics 在外層處理 hitbox / damage,
 * 然後呼叫這個 advance 來移動與切換狀態。
 */
export function advanceAi(
  boss: BossState,
  player: PlayerState,
  dt: number,
): void {
  if (boss.phase === 'dead') return;

  const distX = player.x - boss.x;
  const dist = Math.abs(distX);

  // facing:不在 swing/hurt 期間時跟著玩家
  if (boss.phase !== 'swing' && boss.phase !== 'hurt') {
    boss.facing = (distX >= 0 ? 1 : -1) as Facing;
  }

  boss.phaseT += dt;

  switch (boss.phase) {
    case 'approach': {
      // 朝玩家移動,但保留一點安全距離(不要直接重疊)
      const stopAt = CFG.bossEngageDist - 4;
      if (dist > stopAt) {
        boss.x += Math.sign(distX) * CFG.bossSpeed * dt;
      } else {
        startPhase(boss, pickNextAfterClose());
      }
      break;
    }
    case 'guard': {
      if (boss.phaseT >= boss.phaseDur) {
        if (dist > CFG.bossEngageDist + 18) {
          startPhase(boss, 'approach');
        } else {
          startPhase(boss, pickNextAfterClose());
        }
      }
      break;
    }
    case 'swing': {
      // 揮劍期間 facing 鎖定 — 給玩家繞背的機會
      if (boss.phaseT >= boss.phaseDur) {
        if (dist > CFG.bossEngageDist + 18) startPhase(boss, 'approach');
        else startPhase(boss, pickNextAfterClose());
      }
      break;
    }
    case 'hurt': {
      if (boss.phaseT >= boss.phaseDur) {
        // 受擊後優先 guard,看玩家動作再應變
        startPhase(boss, 'guard');
      }
      break;
    }
  }
}

export function createBoss(): BossState {
  const boss: BossState = {
    x: CFG.bossStartX,
    facing: -1,
    phase: 'approach',
    phaseT: 0,
    phaseDur: 0,
    gapT: 0,
    flashUntil: 0,
    invulUntil: 0,
    hitThisSwing: false,
  };
  startPhase(boss, 'approach');
  return boss;
}

/** 揮劍 hitbox 是否處於 active 階段 */
export function bossSwingActive(boss: BossState): boolean {
  if (boss.phase !== 'swing') return false;
  return boss.phaseT >= CFG.bossHitFrom && boss.phaseT <= CFG.bossHitTo;
}

/** Boss 是否處於有效防禦(舉盾)狀態 */
export function bossIsGuarding(boss: BossState): boolean {
  return boss.phase === 'guard';
}
