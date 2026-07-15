export const soundEngine = {
  context: null,
  enabled: localStorage.getItem('2042-audio-muted') !== 'true',
  volume: Number(localStorage.getItem('2042-audio-volume') || 70) / 100,
  setMuted(muted) {
    this.enabled = !muted;
    localStorage.setItem('2042-audio-muted', String(muted));
  },
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) / 100));
    localStorage.setItem('2042-audio-volume', String(Math.round(this.volume * 100)));
  },
  init() {
    if (!this.enabled) return null;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.enabled = false;
        return null;
      }
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  },
  tone(frequency, duration = 0.08, type = 'sine', volume = 0.04, delay = 0) {
    const audio = this.init();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume * this.volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  },
  play(name) {
    const patterns = {
      ui: [[520, 0.05, 'triangle', 0.025]],
      start: [[320, 0.08, 'sawtooth', 0.035], [520, 0.1, 'triangle', 0.035, 0.06]],
      wave: [[180, 0.08, 'sawtooth', 0.04], [260, 0.11, 'sawtooth', 0.035, 0.07]],
      build: [[620, 0.06, 'square', 0.03], [840, 0.08, 'triangle', 0.025, 0.04]],
      hit: [[140, 0.09, 'sawtooth', 0.035]],
      kill: [[700, 0.05, 'triangle', 0.035], [960, 0.08, 'sine', 0.03, 0.04]],
      ability: [[260, 0.08, 'square', 0.035], [520, 0.12, 'triangle', 0.032, 0.05]],
      fail: [[120, 0.12, 'sawtooth', 0.035]],
      end: [[180, 0.18, 'sawtooth', 0.035], [90, 0.24, 'sine', 0.03, 0.12]],
    };
    (patterns[name] || patterns.ui).forEach(([frequency, duration, type, volume, delay = 0]) => {
      this.tone(frequency, duration, type, volume, delay);
    });
  },
};
