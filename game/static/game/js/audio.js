/**
 * Sound design for 2042. All effects are generated locally with the Web Audio API:
 * no network request, tracking, or third-party audio licence is required.
 */
export const soundEngine = {
  context: null,
  masterGain: null,
  effectsGain: null,
  ambienceGain: null,
  ambience: null,
  noiseBuffer: null,
  lastPlayed: {},
  enabled: localStorage.getItem('2042-audio-muted') !== 'true',
  volume: Number(localStorage.getItem('2042-audio-volume') || 70) / 100,

  setMuted(muted) {
    this.enabled = !muted;
    localStorage.setItem('2042-audio-muted', String(muted));
    if (!this.enabled) this.stopAmbience();
    else this.init();
  },

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) / 100));
    localStorage.setItem('2042-audio-volume', String(Math.round(this.volume * 100)));
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.04);
    }
  },

  init() {
    if (!this.enabled) return null;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      const audio = new AudioContext();
      const master = audio.createGain();
      const compressor = audio.createDynamicsCompressor();
      const effects = audio.createGain();
      const ambience = audio.createGain();
      const reverb = audio.createConvolver();
      const impulse = audio.createBuffer(2, Math.floor(audio.sampleRate * 0.42), audio.sampleRate);

      for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
        }
      }
      reverb.buffer = impulse;
      master.gain.value = this.volume;
      effects.gain.value = 0.9;
      ambience.gain.value = 0.45;
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.18;
      effects.connect(compressor);
      ambience.connect(compressor);
      effects.connect(reverb);
      reverb.connect(compressor);
      compressor.connect(master);
      master.connect(audio.destination);
      this.context = audio;
      this.masterGain = master;
      this.effectsGain = effects;
      this.ambienceGain = ambience;
      this.noiseBuffer = this.createNoiseBuffer(1.2);
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  },

  createNoiseBuffer(duration) {
    const length = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      // A little correlation turns harsh white noise into a more natural transient.
      last = last * 0.72 + (Math.random() * 2 - 1) * 0.28;
      data[i] = last;
    }
    return buffer;
  },

  tone({ frequency, endFrequency = frequency, duration = 0.1, type = 'sine', volume = 0.04, delay = 0, bus = 'effects' }) {
    const audio = this.init();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(bus === 'ambience' ? this.ambienceGain : this.effectsGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  },

  noise({ duration = 0.08, volume = 0.03, delay = 0, highpass = 0, lowpass = 12000 }) {
    const audio = this.init();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const source = audio.createBufferSource();
    const high = audio.createBiquadFilter();
    const low = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = this.noiseBuffer;
    high.type = 'highpass'; high.frequency.value = highpass;
    low.type = 'lowpass'; low.frequency.value = lowpass;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(high); high.connect(low); low.connect(gain); gain.connect(this.effectsGain);
    source.start(start);
    source.stop(start + duration);
  },

  startAmbience() {
    const audio = this.init();
    if (!audio || this.ambience) return;
    const output = this.ambienceGain;
    const drone = audio.createOscillator();
    const shimmer = audio.createOscillator();
    const droneFilter = audio.createBiquadFilter();
    const droneGain = audio.createGain();
    const shimmerGain = audio.createGain();
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    drone.type = 'sawtooth'; drone.frequency.value = 42;
    shimmer.type = 'sine'; shimmer.frequency.value = 126;
    droneFilter.type = 'lowpass'; droneFilter.frequency.value = 210;
    droneGain.gain.value = 0.026; shimmerGain.gain.value = 0.006;
    lfo.frequency.value = 0.12; lfoGain.gain.value = 0.012;
    drone.connect(droneFilter); droneFilter.connect(droneGain); droneGain.connect(output);
    shimmer.connect(shimmerGain); shimmerGain.connect(output);
    lfo.connect(lfoGain); lfoGain.connect(droneGain.gain);
    drone.start(); shimmer.start(); lfo.start();
    this.ambience = { drone, shimmer, lfo, gains: [droneGain, shimmerGain] };
  },

  stopAmbience() {
    if (!this.ambience || !this.context) return;
    const now = this.context.currentTime;
    this.ambience.gains.forEach((gain) => gain.gain.setTargetAtTime(0.0001, now, 0.035));
    [this.ambience.drone, this.ambience.shimmer, this.ambience.lfo].forEach((source) => source.stop(now + 0.16));
    this.ambience = null;
  },

  play(name) {
    const cooldowns = { shoot: 55, zap: 70, hit: 120, kill: 80, spawn: 80, ui: 40 };
    const now = performance.now();
    if (cooldowns[name] && now - (this.lastPlayed[name] || 0) < cooldowns[name]) return;
    this.lastPlayed[name] = now;

    const sounds = {
      ui: () => this.tone({ frequency: 720, endFrequency: 980, duration: 0.055, type: 'triangle', volume: 0.025 }),
      start: () => [[180, 330, 0], [330, 520, 0.09], [520, 780, 0.18]].forEach(([f, end, delay]) => this.tone({ frequency: f, endFrequency: end, duration: 0.15, type: 'triangle', volume: 0.035, delay })),
      wave: () => { this.noise({ duration: 0.13, volume: 0.032, highpass: 350, lowpass: 2800 }); this.tone({ frequency: 120, endFrequency: 230, duration: 0.2, type: 'sawtooth', volume: 0.035, delay: 0.02 }); },
      build: () => { this.tone({ frequency: 420, endFrequency: 760, duration: 0.09, type: 'square', volume: 0.025 }); this.tone({ frequency: 940, duration: 0.12, type: 'sine', volume: 0.022, delay: 0.08 }); },
      spawn: () => this.tone({ frequency: 145, endFrequency: 92, duration: 0.11, type: 'sine', volume: 0.025 }),
      shoot: () => { this.noise({ duration: 0.035, volume: 0.03, highpass: 1900 }); this.tone({ frequency: 950, endFrequency: 190, duration: 0.055, type: 'square', volume: 0.022 }); },
      zap: () => { this.noise({ duration: 0.075, volume: 0.026, highpass: 1200, lowpass: 7000 }); this.tone({ frequency: 180, endFrequency: 1440, duration: 0.09, type: 'sawtooth', volume: 0.018 }); },
      hit: () => { this.noise({ duration: 0.085, volume: 0.038, highpass: 160, lowpass: 1800 }); this.tone({ frequency: 155, endFrequency: 62, duration: 0.09, type: 'triangle', volume: 0.032 }); },
      kill: () => { this.noise({ duration: 0.1, volume: 0.03, highpass: 600, lowpass: 4200 }); this.tone({ frequency: 420, endFrequency: 880, duration: 0.11, type: 'sine', volume: 0.032, delay: 0.025 }); },
      upgrade: () => [440, 620, 820].forEach((frequency, index) => this.tone({ frequency, duration: 0.1, type: 'triangle', volume: 0.03, delay: index * 0.065 })),
      ability: () => { this.noise({ duration: 0.22, volume: 0.034, highpass: 380, lowpass: 5500 }); this.tone({ frequency: 95, endFrequency: 680, duration: 0.3, type: 'sawtooth', volume: 0.04 }); },
      fail: () => this.tone({ frequency: 180, endFrequency: 72, duration: 0.18, type: 'sawtooth', volume: 0.04 }),
      end: () => { this.noise({ duration: 0.25, volume: 0.03, lowpass: 1300 }); this.tone({ frequency: 210, endFrequency: 52, duration: 0.32, type: 'sawtooth', volume: 0.04 }); },
    };
    (sounds[name] || sounds.ui)();
  },
};
