export const soundEngine = {
  context: null,
  masterGain: null,
  ambience: null,
  lastPlayed: {},
  enabled: localStorage.getItem('2042-audio-muted') !== 'true',
  volume: Number(localStorage.getItem('2042-audio-volume') || 70) / 100,
  setMuted(muted) {
    this.enabled = !muted;
    localStorage.setItem('2042-audio-muted', String(muted));
    if (!this.enabled) {
      this.stopAmbience();
    } else {
      this.init();
    }
  },
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) / 100));
    localStorage.setItem('2042-audio-volume', String(Math.round(this.volume * 100)));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.02);
    }
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
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  },
  getOutput() {
    const audio = this.init();
    if (!audio) return null;
    return this.masterGain || audio.destination;
  },
  tone(frequency, duration = 0.08, type = 'sine', volume = 0.04, delay = 0) {
    const audio = this.init();
    const output = this.getOutput();
    if (!audio || !output) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  },
  noise(duration = 0.08, volume = 0.035, delay = 0) {
    const audio = this.init();
    const output = this.getOutput();
    if (!audio || !output) return;
    const start = audio.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(gain);
    gain.connect(output);
    source.start(start);
    source.stop(start + duration);
  },
  startAmbience() {
    const audio = this.init();
    const output = this.getOutput();
    if (!audio || !output || this.ambience) return;
    const drone = audio.createOscillator();
    const pulse = audio.createOscillator();
    const droneGain = audio.createGain();
    const pulseGain = audio.createGain();
    const filter = audio.createBiquadFilter();
    drone.type = 'sawtooth';
    drone.frequency.value = 48;
    pulse.type = 'sine';
    pulse.frequency.value = 96;
    droneGain.gain.value = 0.012;
    pulseGain.gain.value = 0.006;
    filter.type = 'lowpass';
    filter.frequency.value = 360;
    drone.connect(droneGain);
    pulse.connect(pulseGain);
    droneGain.connect(filter);
    pulseGain.connect(filter);
    filter.connect(output);
    drone.start();
    pulse.start();
    this.ambience = { drone, pulse, gainNodes: [droneGain, pulseGain], filter };
  },
  stopAmbience() {
    if (!this.ambience || !this.context) return;
    const stopAt = this.context.currentTime + 0.08;
    this.ambience.gainNodes.forEach((gain) => gain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.03));
    this.ambience.drone.stop(stopAt);
    this.ambience.pulse.stop(stopAt);
    this.ambience = null;
  },
  play(name) {
    const now = performance.now();
    const cooldowns = { shoot: 70, hit: 180, kill: 70, ui: 35 };
    if (cooldowns[name] && now - (this.lastPlayed[name] || 0) < cooldowns[name]) return;
    this.lastPlayed[name] = now;

    const patterns = {
      ui: [[520, 0.05, 'triangle', 0.025]],
      start: [[320, 0.08, 'sawtooth', 0.035], [520, 0.1, 'triangle', 0.035, 0.06]],
      wave: [[180, 0.08, 'sawtooth', 0.04], [260, 0.11, 'sawtooth', 0.035, 0.07]],
      build: [[620, 0.06, 'square', 0.03], [840, 0.08, 'triangle', 0.025, 0.04]],
      spawn: [[110, 0.05, 'square', 0.018]],
      shoot: [[760, 0.035, 'square', 0.018]],
      zap: [[420, 0.04, 'sawtooth', 0.022], [900, 0.035, 'square', 0.014, 0.025]],
      hit: [[140, 0.09, 'sawtooth', 0.035]],
      kill: [[700, 0.05, 'triangle', 0.035], [960, 0.08, 'sine', 0.03, 0.04]],
      upgrade: [[500, 0.05, 'triangle', 0.026], [700, 0.06, 'triangle', 0.028, 0.04], [980, 0.08, 'sine', 0.026, 0.08]],
      ability: [[260, 0.08, 'square', 0.035], [520, 0.12, 'triangle', 0.032, 0.05]],
      fail: [[120, 0.12, 'sawtooth', 0.035]],
      end: [[180, 0.18, 'sawtooth', 0.035], [90, 0.24, 'sine', 0.03, 0.12]],
    };
    if (name === 'hit') this.noise(0.08, 0.026);
    if (name === 'kill') this.noise(0.12, 0.022, 0.02);
    (patterns[name] || patterns.ui).forEach(([frequency, duration, type, volume, delay = 0]) => {
      this.tone(frequency, duration, type, volume, delay);
    });
  },
};
