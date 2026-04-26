// Web Audio 8-bit 風格音效。
// 用 OscillatorNode + 噪音 buffer 合成,不需外部音效檔。
//
// AudioContext 必須在使用者互動後才能 resume,因此 StairsCanvas 要在第一次
// pointerdown / keydown 呼叫 unlockAudio() 一次。

import type { SoundKind } from './types';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/** 在使用者首次互動時呼叫,讓 AudioContext 從 suspended 狀態恢復 */
export function unlockAudio(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume();
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

function sweep(from: number, to: number, dur: number, type: OscillatorType, vol: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

function noise(dur: number, hpFreq: number, vol: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = hpFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

const players: Record<SoundKind, () => void> = {
  spring: () => sweep(280, 1100, 0.18, 'sine', 0.18),
  spike: () => {
    tone(160, 0.12, 'square', 0.18);
    setTimeout(() => tone(110, 0.1, 'square', 0.14), 30);
  },
  crumble: () => noise(0.32, 700, 0.16),
  flip: () => sweep(820, 220, 0.22, 'triangle', 0.16),
  ceiling: () => {
    tone(90, 0.08, 'sawtooth', 0.18);
    setTimeout(() => tone(70, 0.06, 'sawtooth', 0.14), 40);
  },
};

export function playSound(kind: SoundKind): void {
  const fn = players[kind];
  if (!fn) return;
  try {
    fn();
  } catch {
    // 忽略播放錯誤(例如 context 被釋放)
  }
}
