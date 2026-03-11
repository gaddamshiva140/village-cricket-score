
class AudioManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('cricket_audio_enabled', String(enabled));
  }

  isEnabled(): boolean {
    const stored = localStorage.getItem('cricket_audio_enabled');
    if (stored !== null) this.enabled = stored === 'true';
    return this.enabled;
  }

  playFour() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    // Crowd cheer - ascending tones with noise
    this.playTone(ctx, 440, 0.15, 'square', 0.2);
    setTimeout(() => this.playTone(ctx, 554, 0.15, 'square', 0.2), 100);
    setTimeout(() => this.playTone(ctx, 659, 0.2, 'square', 0.25), 200);
    setTimeout(() => this.playNoise(ctx, 0.4, 0.15), 300);
  }

  playSix() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    // Bigger roar - deeper tones + louder noise
    this.playTone(ctx, 330, 0.2, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(ctx, 440, 0.2, 'sawtooth', 0.25), 100);
    setTimeout(() => this.playTone(ctx, 554, 0.25, 'sawtooth', 0.3), 200);
    setTimeout(() => this.playTone(ctx, 659, 0.3, 'sawtooth', 0.3), 300);
    setTimeout(() => this.playNoise(ctx, 0.6, 0.2), 350);
  }

  playWicket() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    // Dramatic descending tone
    this.playTone(ctx, 440, 0.3, 'triangle', 0.3);
    setTimeout(() => this.playTone(ctx, 330, 0.3, 'triangle', 0.25), 150);
    setTimeout(() => this.playTone(ctx, 220, 0.4, 'triangle', 0.2), 300);
  }

  playMatchTied() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    // Sustained dramatic chord
    this.playTone(ctx, 262, 1.5, 'sine', 0.15);
    this.playTone(ctx, 330, 1.5, 'sine', 0.15);
    this.playTone(ctx, 392, 1.5, 'sine', 0.15);
    setTimeout(() => {
      this.playTone(ctx, 247, 1.0, 'sine', 0.2);
      this.playTone(ctx, 311, 1.0, 'sine', 0.2);
      this.playTone(ctx, 370, 1.0, 'sine', 0.2);
    }, 1200);
  }

  playSuperOverIntro() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    // Epic sequence
    const notes = [330, 392, 440, 523, 587, 659];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(ctx, freq, 0.25, 'square', 0.2), i * 150);
    });
    setTimeout(() => this.playNoise(ctx, 0.5, 0.25), notes.length * 150);
  }

  private playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.2) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  private playNoise(ctx: AudioContext, duration: number, volume = 0.1) {
    try {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }
}

export const audioManager = new AudioManager();
