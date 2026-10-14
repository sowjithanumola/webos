/**
 * WebOS Sound Service using browser Web Audio API.
 * 100% offline, zero external sound files required.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5; // 0 to 1
  private isMuted: boolean = false;
  private activeMusicSource: { stop: () => void } | null = null;

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

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playClick(): void {
    if (this.isMuted || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay may be restricted until user interaction
    }
  }

  public playNotification(): void {
    if (this.isMuted || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [587.33, 880]; // D5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // Audio autoplay may be restricted
    }
  }

  public playAlarm(): void {
    if (this.isMuted || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
      for (let repeat = 0; repeat < 2; repeat++) {
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = ctx.currentTime + repeat * 0.45 + i * 0.08;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(this.volume * 0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.2);
        });
      }
    } catch {
      // Audio error
    }
  }

  public playSynthesizedTrack(trackName: 'ambient' | 'synthwave' | 'chime', onEnd?: () => void): { stop: () => void } {
    this.stopSynthesizedMusic();
    const ctx = this.getContext();
    if (!ctx) return { stop: () => {} };

    let isStopped = false;
    const oscillators: OscillatorNode[] = [];
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (trackName === 'ambient') {
      // Gentle ambient chords: Cmaj9 chord notes
      const chords = [
        [261.63, 329.63, 392.00, 493.88], // C E G B
        [220.00, 261.63, 329.63, 392.00], // A C E G
        [174.61, 220.00, 261.63, 329.63], // F A C E
        [196.00, 246.94, 293.66, 392.00], // G B D G
      ];

      chords.forEach((chord, chordIdx) => {
        const chordStartTime = now + chordIdx * 3;
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, chordStartTime);

          gain.gain.setValueAtTime(0, chordStartTime);
          gain.gain.linearRampToValueAtTime(0.06, chordStartTime + 0.8);
          gain.gain.linearRampToValueAtTime(0.04, chordStartTime + 2.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, chordStartTime + 3.0);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(chordStartTime);
          osc.stop(chordStartTime + 3.0);
          oscillators.push(osc);
        });
      });

      const totalDuration = 12;
      const timer = setTimeout(() => {
        if (!isStopped && onEnd) onEnd();
      }, totalDuration * 1000);

      const controller = {
        stop: () => {
          isStopped = true;
          clearTimeout(timer);
          oscillators.forEach((o) => {
            try { o.stop(); } catch {}
          });
        },
      };
      this.activeMusicSource = controller;
      return controller;
    } else {
      // Synthwave arpeggio
      const notes = [220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63];
      const loops = 4;
      const noteDuration = 0.22;

      for (let l = 0; l < loops; l++) {
        notes.forEach((freq, idx) => {
          const startTime = now + (l * notes.length + idx) * noteDuration;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.05, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 0.9);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + noteDuration);
          oscillators.push(osc);
        });
      }

      const totalDuration = loops * notes.length * noteDuration;
      const timer = setTimeout(() => {
        if (!isStopped && onEnd) onEnd();
      }, totalDuration * 1000);

      const controller = {
        stop: () => {
          isStopped = true;
          clearTimeout(timer);
          oscillators.forEach((o) => {
            try { o.stop(); } catch {}
          });
        },
      };
      this.activeMusicSource = controller;
      return controller;
    }
  }

  public stopSynthesizedMusic(): void {
    if (this.activeMusicSource) {
      this.activeMusicSource.stop();
      this.activeMusicSource = null;
    }
  }
}

export const sound = new SoundService();
