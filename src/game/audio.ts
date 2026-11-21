// Procedural Web Audio Synthesizer for Syllabus Blitz: Observatory Defender

class GameAudioSynth {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playShoot() {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone(540 * jitter, 220 * jitter, 0.09, 'triangle', 0.09);
  }

  playMove() {
    const jitter = 0.95 + Math.random() * 0.1;
    this.playTone(300 * jitter, 380 * jitter, 0.045, 'sine', 0.045);
  }

  playHit(heavy = false) {
    const jitter = 0.92 + Math.random() * 0.16;
    if (heavy) {
      this.playTone(190 * jitter, 72, 0.18, 'sawtooth', 0.13);
      this.playTone(420 * jitter, 150, 0.12, 'triangle', 0.08);
    } else {
      this.playTone(460 * jitter, 260, 0.08, 'square', 0.06);
    }
  }

  playTelegraph() {
    this.playTone(320, 620, 0.22, 'sine', 0.075);
  }

  playShieldHurt() {
    this.playTone(150, 58, 0.26, 'sawtooth', 0.15);
    this.playTone(110, 48, 0.28, 'square', 0.09, 0.04);
  }

  playOverdriveSuccess() {
    this.playTone(440, 440, 0.14, 'triangle', 0.1, 0);
    this.playTone(554.37, 554.37, 0.14, 'triangle', 0.1, 0.07);
    this.playTone(659.25, 880, 0.26, 'triangle', 0.12, 0.14);
  }

  playWrongAnswer() {
    this.playTone(210, 140, 0.2, 'sawtooth', 0.1);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, n, 0.24, 'triangle', 0.11, idx * 0.1);
    });
  }

  playDefeat() {
    const notes = [330, 293.66, 246.94, 196];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 0.92, 0.22, 'sawtooth', 0.09, idx * 0.12);
    });
  }
}

export const gameAudio = new GameAudioSynth();
