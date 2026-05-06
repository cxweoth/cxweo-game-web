// 節奏方塊 — Web Audio procedural 配樂
//
// 4/4 BPM 145 EDM。每 16 分音符排程一次,用 lookahead scheduler
// (每 25ms 把未來 100ms 的事件排進 audioContext,避免 setTimeout 抖動)。
//
// 樂器:
//   - kick(每拍 1 顆)
//   - snare(每 4 拍的第 2、4 拍)
//   - hi-hat(每 16 分音符)
//   - bass(8 分音符律動,A 小調根音)
//   - lead(每拍 1 顆的 arpeggio,A C E G ...)

import { CFG } from './types';

const SIXTEENTH = 60 / CFG.bpm / 4;

const BASS_NOTES = [33, 33, 33, 33, 33, 33, 38, 38, 36, 36, 36, 36, 33, 33, 31, 31];
const LEAD_NOTES = [69, 72, 76, 72, 74, 77, 74, 72, 69, 72, 76, 79, 77, 74, 72, 69];

function freqFromMidi(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class GeoDashAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timerId: number | null = null;
  private nextNoteTime = 0;
  private currentNote = 0;
  private playing = false;
  private muted = false;

  /** 必須在使用者手勢內呼叫(autoplay 限制) */
  start(): void {
    if (this.playing) return;
    if (!this.ctx) {
      const Ctor =
        (window.AudioContext as typeof AudioContext | undefined) ??
        ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.32;
      this.masterGain.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.playing = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.currentNote = 0;
    this.scheduler();
  }

  stop(): void {
    this.playing = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.32;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private scheduler = (): void => {
    if (!this.playing || !this.ctx || !this.masterGain) return;
    const lookahead = 0.1;
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.scheduleNote(this.currentNote, this.nextNoteTime);
      this.nextNoteTime += SIXTEENTH;
      this.currentNote++;
    }
    this.timerId = window.setTimeout(this.scheduler, 25);
  };

  private scheduleNote(note: number, when: number): void {
    const inBeat = note % 4;
    const inBar = note % 16;
    const inPhrase = note % 64;

    // kick:每拍 1 顆
    if (inBeat === 0) this.kick(when);
    // snare:第 2、4 拍
    if (inBar === 4 || inBar === 12) this.snare(when);
    // hi-hat:每 16 分音符,第 1 顆強一點
    this.hihat(when, inBeat === 0 ? 0.3 : 0.18);
    // bass:8 分音符律動
    if (note % 2 === 0) {
      const idx = ((inPhrase / 2) | 0) % BASS_NOTES.length;
      this.bass(when, freqFromMidi(BASS_NOTES[idx]!));
    }
    // lead:每拍 1 顆 arpeggio
    if (inBeat === 0) {
      const idx = ((inPhrase / 4) | 0) % LEAD_NOTES.length;
      this.lead(when, freqFromMidi(LEAD_NOTES[idx]!));
    }
  }

  private kick(when: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.12);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(1.0, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
    osc.connect(g).connect(this.masterGain);
    osc.start(when);
    osc.stop(when + 0.2);
  }

  private snare(when: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.16);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.32;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1100;
    src.connect(hp).connect(g).connect(this.masterGain);
    src.start(when);
    src.stop(when + 0.18);
  }

  private hihat(when: number, vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol * 0.18;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    src.connect(hp).connect(g).connect(this.masterGain);
    src.start(when);
    src.stop(when + 0.06);
  }

  private bass(when: number, freq: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.45, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
    osc.connect(g).connect(this.masterGain);
    osc.start(when);
    osc.stop(when + 0.2);
  }

  private lead(when: number, freq: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, when);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.18, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.36);
    osc.connect(lp).connect(g).connect(this.masterGain);
    osc.start(when);
    osc.stop(when + 0.42);
  }
}
