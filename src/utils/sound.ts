// Simple Web Audio API sound generator for Wordle actions

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public playKeyPop() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Ignore audio errors
    }
  }

  public playDelete() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore audio errors
    }
  }

  public playFlip(delayMs: number = 0) {
    if (!this.soundEnabled) return;
    setTimeout(() => {
      const ctx = this.getContext();
      if (!ctx) return;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch {
        // Ignore
      }
    }, delayMs);
  }

  public playShake() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }

  public playWin() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } catch {
          // Ignore
        }
      }, idx * 100);
    });
  }
}

export const sounds = new SoundManager();

export function playVictoryAudioFeedback(
  config: {
    victoryAudioType?: 'none' | 'tts' | 'custom';
    ttsLanguage?: 'pt-BR' | 'en-US';
    customAudioUrl?: string;
    targetWord?: string;
  },
  onEnd?: () => void
) {
  let finished = false;
  const finish = () => {
    if (!finished) {
      finished = true;
      if (onEnd) onEnd();
    }
  };

  if (config.victoryAudioType === 'tts' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const textToSpeak = config.targetWord || '';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = config.ttsLanguage || 'pt-BR';
      utterance.rate = 0.95;

      utterance.onend = () => finish();
      utterance.onerror = () => finish();

      window.speechSynthesis.speak(utterance);

      // Fallback timeout in case onend event is swallowed by browser
      const fallbackMs = Math.max(1500, textToSpeak.length * 200);
      setTimeout(finish, fallbackMs);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
      finish();
    }
  } else if (config.victoryAudioType === 'custom' && config.customAudioUrl) {
    try {
      const audio = new Audio(config.customAudioUrl);
      audio.onended = () => finish();
      audio.onerror = () => finish();

      audio.play().then(() => {
        setTimeout(finish, 4000);
      }).catch((err) => {
        console.warn('Custom audio playback failed:', err);
        finish();
      });
    } catch (e) {
      console.warn('Audio element error:', e);
      finish();
    }
  } else {
    finish();
  }
}
