/**
 * SoundManager handles real-time procedural audio synthesis using the Web Audio API.
 * Synthesizes all sound effects and ambient soundtracks on-the-fly without asset requests.
 */
export class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this._volume = 0.3;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('[SoundManager] Web Audio not available');
      this.enabled = false;
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v) {
    this._volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  // ── Utility oscillator helpers ──

  _osc(type, freq, duration, gainVal = 0.3, detune = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.masterGain);
    o.start(t);
    o.stop(t + duration);
  }

  _noise(duration, gainVal = 0.15) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(g);
    g.connect(this.masterGain);
    src.start(t);
  }

  _sweep(type, startFreq, endFreq, duration, gainVal = 0.25) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(startFreq, t);
    o.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.masterGain);
    o.start(t);
    o.stop(t + duration);
  }

  // ── Sound Effects ──

  playerAttack() {
    this._sweep('sawtooth', 800, 200, 0.12, 0.2);
    this._noise(0.06, 0.1);
  }

  projectileFire() {
    this._sweep('sine', 600, 1200, 0.1, 0.15);
  }

  enemyHit() {
    this._osc('square', 220, 0.08, 0.2);
    this._noise(0.05, 0.12);
  }

  enemyDie() {
    this._sweep('square', 400, 80, 0.25, 0.2);
    this._noise(0.15, 0.1);
  }

  playerHit() {
    this._sweep('sawtooth', 150, 60, 0.2, 0.25);
    this._osc('square', 100, 0.15, 0.15);
  }

  playerDie() {
    this._sweep('sawtooth', 300, 30, 0.6, 0.3);
    setTimeout(() => this._osc('sine', 80, 0.4, 0.15), 200);
  }

  cardPickup() {
    this._osc('sine', 523, 0.1, 0.2);
    setTimeout(() => this._osc('sine', 659, 0.1, 0.2), 80);
    setTimeout(() => this._osc('sine', 784, 0.15, 0.25), 160);
  }

  lorePickup() {
    this._osc('triangle', 440, 0.12, 0.15);
    setTimeout(() => this._osc('triangle', 554, 0.12, 0.15), 100);
    setTimeout(() => this._osc('triangle', 659, 0.2, 0.2), 200);
  }

  portalEnter() {
    this._sweep('sine', 200, 800, 0.4, 0.2);
    this._sweep('triangle', 300, 1200, 0.5, 0.1);
  }

  portalHum() {
    this._osc('sine', 120, 0.6, 0.06);
    this._osc('sine', 180, 0.6, 0.04, 5);
  }

  bossRoar() {
    this._sweep('sawtooth', 80, 40, 0.5, 0.3);
    this._noise(0.3, 0.15);
    setTimeout(() => this._sweep('square', 60, 30, 0.4, 0.2), 200);
  }

  bossDefeat() {
    this._sweep('sine', 300, 600, 0.2, 0.2);
    setTimeout(() => this._sweep('sine', 400, 800, 0.2, 0.2), 150);
    setTimeout(() => this._sweep('sine', 500, 1000, 0.3, 0.25), 300);
    setTimeout(() => {
      this._osc('sine', 784, 0.3, 0.2);
      this._osc('sine', 988, 0.3, 0.15);
      this._osc('sine', 1175, 0.4, 0.2);
    }, 500);
  }

  shieldBlock() {
    this._osc('triangle', 800, 0.06, 0.2);
    this._osc('sine', 1200, 0.08, 0.1);
  }

  shieldBreak() {
    this._noise(0.12, 0.2);
    this._sweep('square', 600, 100, 0.15, 0.2);
  }

  chargerDash() {
    this._sweep('sawtooth', 150, 400, 0.3, 0.15);
  }

  enemyShoot() {
    this._sweep('triangle', 400, 800, 0.08, 0.12);
  }

  menuSelect() {
    this._osc('sine', 440, 0.08, 0.15);
    setTimeout(() => this._osc('sine', 660, 0.1, 0.15), 60);
  }

  menuNav() {
    this._osc('sine', 330, 0.05, 0.1);
  }

  heal() {
    this._osc('sine', 523, 0.12, 0.15);
    setTimeout(() => this._osc('sine', 659, 0.12, 0.15), 100);
    setTimeout(() => this._osc('sine', 784, 0.15, 0.18), 200);
    setTimeout(() => this._osc('sine', 1047, 0.2, 0.12), 320);
  }

  explosion() {
    this._noise(0.3, 0.25);
    this._sweep('sawtooth', 200, 40, 0.3, 0.2);
  }

  freeze() {
    this._sweep('sine', 2000, 400, 0.3, 0.12);
    this._osc('triangle', 1400, 0.1, 0.08);
  }

  lightning() {
    this._noise(0.08, 0.2);
    this._osc('square', 800, 0.04, 0.2);
    setTimeout(() => {
      this._noise(0.06, 0.15);
      this._osc('square', 1000, 0.03, 0.15);
    }, 80);
  }

  dialogOpen() {
    this._osc('triangle', 400, 0.06, 0.1);
    setTimeout(() => this._osc('triangle', 500, 0.06, 0.1), 50);
  }

  dialogTick() {
    this._osc('square', 600 + Math.random() * 200, 0.02, 0.04);
  }

  ambientWind() {
    this._noise(2.0, 0.03);
  }

  ambientDrip() {
    this._sweep('sine', 1800, 600, 0.15, 0.05);
  }

  ambientHumLoop() {
    this._osc('sine', 60, 2.0, 0.02);
    this._osc('sine', 90, 2.0, 0.015);
  }
}
