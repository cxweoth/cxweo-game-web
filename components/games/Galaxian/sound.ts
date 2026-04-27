// Web Audio API procedural 音效:射擊、命中、爆炸、過關。
// 第一次 user gesture(pointerdown / keydown)後 unlockAudio() 才會建 ctx。

import type { SoundKind } from './types';

let ctx: AudioContext | null = null;
let unlocked = false;

export function unlockAudio(): void {
  if (unlocked) return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    unlocked = true;
  } catch {
    // 不支援就靜音
  }
}

export function playSound(kind: SoundKind): void {
  if (!ctx) return;
  switch (kind) {
    case 'shoot':
      blip(880, 0.06, 'square', 0.08);
      break;
    case 'hit':
      noise(0.18, 0.18);
      break;
    case 'explode':
      noise(0.25, 0.22);
      blip(180, 0.18, 'sawtooth', 0.12);
      break;
    case 'wave':
      blip(660, 0.12, 'square', 0.1);
      setTimeout(() => blip(990, 0.12, 'square', 0.1), 100);
      setTimeout(() => blip(1320, 0.18, 'square', 0.1), 200);
      break;
  }
}

function blip(freq: number, dur: number, type: OscillatorType, gain: number): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function noise(dur: number, gain: number): void {
  if (!ctx) return;
  const sampleRate = ctx.sampleRate;
  const buf = ctx.createBuffer(1, sampleRate * dur, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length); // 衰減白噪
  }
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  src.buffer = buf;
  g.gain.value = gain;
  src.connect(g).connect(ctx.destination);
  src.start();
}
