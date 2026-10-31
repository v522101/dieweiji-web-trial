export class Sound {
  constructor() {
    this.ctx = null;
    this.fx = 0.35;
    this.music = 0.15;
    this.beat = 0;
    this.timer = 0;
  }
  init() {
    if (!this.ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return;
      this.ctx = new A();
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }
  tone(freq, time = 0.15, gain = 0.12, type = "sine", delay = 0) {
    if (!this.ctx || !gain) return;
    const c = this.ctx,
      o = c.createOscillator(),
      v = c.createGain(),
      t = c.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    v.gain.setValueAtTime(0, t);
    v.gain.linearRampToValueAtTime(gain, t + 0.012);
    v.gain.exponentialRampToValueAtTime(0.001, t + time);
    o.connect(v);
    v.connect(c.destination);
    o.start(t);
    o.stop(t + time + 0.02);
  }
  play(kind) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - (this.last || -1) < 0.055) return;
    this.last = now;
    const v = this.fx * 0.25;
    if (kind === "hit") {
      this.tone(85, 0.13, v, "triangle");
      this.tone(180, 0.06, v * 0.4, "square");
    } else if (["produce", "quest", "victory", "pack"].includes(kind)) {
      const a =
        kind === "victory" ? [261.6, 329.6, 392, 523.2] : [392, 493.9, 587.3];
      a.forEach((f, i) => this.tone(f, 0.35, v, "sine", i * 0.08));
    } else if (kind === "night") {
      this.tone(196, 0.7, v * 0.5);
      this.tone(293.7, 0.9, v * 0.4, "sine", 0.12);
    } else {
      this.tone(kind === "sell" ? 700 : 360, 0.08, v * 0.5, "triangle");
    }
  }
  tick(dt, active) {
    if (!active || !this.ctx || !this.music) {
      this.timer = 0;
      return;
    }
    this.timer += dt;
    if (this.timer < 0.46) return;
    this.timer = 0;
    const notes = [
      261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66, 220, 261.63,
      329.63, 392, 349.23, 329.63, 293.66, 196,
    ];
    const i = this.beat++ % notes.length;
    this.tone(notes[i], 1.25, this.music * 0.055);
    if (i % 4 === 0)
      this.tone(notes[i] / 2, 1.7, this.music * 0.05, "triangle");
  }
}
