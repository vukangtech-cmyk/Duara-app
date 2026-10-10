// gameAudio.js — Pure Web Audio API Sound Engine for Duara Droo
// Generates rich, low-latency, modern arcade sound effects without external files.

class GameAudioManager {
  constructor() {
    this.ctx = null;
    this.muted = typeof window !== "undefined" ? localStorage.getItem("duara_game_sound_muted") === "true" : false;
    this.activeNodes = [];
  }

  getContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("duara_game_sound_muted", this.muted ? "true" : "false");
    }
    if (this.muted) {
      this.stopAll();
    }
    return this.muted;
  }

  setMuted(val) {
    this.muted = !!val;
    if (typeof window !== "undefined") {
      localStorage.setItem("duara_game_sound_muted", this.muted ? "true" : "false");
    }
    if (this.muted) this.stopAll();
  }

  stopAll() {
    for (const node of this.activeNodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    }
    this.activeNodes = [];
  }

  // 1. Crisp modern UI button click / tap
  playButtonClick() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // 2. Coin drop / Join round action (Crisp metallic jackpot token chime)
  playJoinRound() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Two harmonic oscillators for metallic bell sound
      const freqs = [1046.5, 2093]; // C6 & C7
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.18 + idx * 0.05);

        gain.gain.setValueAtTime(0.15, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28 + idx * 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + 0.3 + idx * 0.05);
      });
    } catch {}
  }

  // 3. Fast roulette / wheel peg ticking sound during spin
  playSpinTick(speedMultiplier = 1) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      // Shift pitch slightly based on speed
      const baseFreq = 420 * (0.8 + Math.random() * 0.4);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  // 4. Grand Modern Victory Fanfare (Celebration when someone wins)
  playWinFanfare() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Part A: Triumphant rising arpeggio (C5, E5, G5, B5, C6, E6, G6)
      const notes = [
        { f: 523.25, t: 0.00, d: 0.12 }, // C5
        { f: 659.25, t: 0.10, d: 0.12 }, // E5
        { f: 783.99, t: 0.20, d: 0.14 }, // G5
        { f: 987.77, t: 0.32, d: 0.14 }, // B5
        { f: 1046.50, t: 0.44, d: 0.35 }, // C6
        { f: 1318.51, t: 0.65, d: 0.35 }, // E6
        { f: 1567.98, t: 0.88, d: 0.85 }  // G6 Grand Finale
      ];

      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.22, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });

      // Part B: Shimmering brass chord on top of finale
      const chord = [1046.5, 1318.5, 1567.98, 2093.0];
      chord.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + 0.9);

        gain.gain.setValueAtTime(0.12, now + 0.9);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.9);
        osc.stop(now + 2.5);
      });

      // Part C: Cascading sparkling coins chime
      for (let i = 0; i < 9; i++) {
        const delay = 0.5 + i * 0.12;
        const chimeFreq = 2200 + Math.random() * 1800;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(chimeFreq, now + delay);

        gain.gain.setValueAtTime(0.08, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.2);
      }
    } catch {}
  }

  // 5. Modern Gentle Game-Over / Loss Audio (Sympathetic, encouraging retry)
  playLoseSound() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Descending mellow 3-note progression (F4 -> Eb4 -> Db4) with gentle warmth
      const notes = [
        { f: 349.23, t: 0.00, d: 0.28 }, // F4
        { f: 311.13, t: 0.22, d: 0.32 }, // Eb4
        { f: 277.18, t: 0.48, d: 0.65 }  // Db4
      ];

      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + t);
        // Slight downward pitch slide for cartoon "aww" warmth
        osc.frequency.exponentialRampToValueAtTime(f * 0.94, now + t + d);

        gain.gain.setValueAtTime(0.18, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d + 0.02);
      });
    } catch {}
  }

  // 6. Thrilling suspense drumroll / countdown before winner revealed
  playDrumRoll() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Series of accelerating snare/rattle pulses
      const pulses = 14;
      for (let i = 0; i < pulses; i++) {
        const t = now + (i * 0.12) * Math.pow(0.92, i);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(140 + i * 8, t);

        gain.gain.setValueAtTime(0.14 + (i / pulses) * 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.045);
      }
    } catch {}
  }
}

export const gameAudio = new GameAudioManager();
