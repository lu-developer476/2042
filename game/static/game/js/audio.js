/**
 * Sound design for 2042. All effects are generated locally with the Web Audio API:
 * no network request, tracking, or third-party audio licence is required.
 */
export const soundEngine = {
  context: null,
  masterGain: null,
  effectsGain: null,
  ambienceGain: null,
  musicGain: null,
  ambience: null,
  musicTimer: null,
  musicStep: 0,
  musicEnabled: localStorage.getItem('2042-music-muted') !== 'true',
  musicVolume: Number(localStorage.getItem('2042-music-volume') || 55) / 100,
  musicMix: localStorage.getItem('2042-music-mix') || 'cyberpunk',
  noiseBuffer: null,
  lastPlayed: {},
  enabled: localStorage.getItem('2042-audio-muted') !== 'true',
  volume: Number(localStorage.getItem('2042-audio-volume') || 70) / 100,

  setMuted(muted) {
    this.enabled = !muted;
    localStorage.setItem('2042-audio-muted', String(muted));
    if (!this.enabled) {
      this.stopAmbience();
      this.stopMusic();
    } else this.init();
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
      const music = audio.createGain();
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
      music.gain.value = this.musicEnabled ? this.musicVolume : 0;
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.18;
      effects.connect(compressor);
      ambience.connect(compressor);
      music.connect(compressor);
      effects.connect(reverb);
      reverb.connect(compressor);
      compressor.connect(master);
      master.connect(audio.destination);
      this.context = audio;
      this.masterGain = master;
      this.effectsGain = effects;
      this.ambienceGain = ambience;
      this.musicGain = music;
      this.noiseBuffer = this.createNoiseBuffer(1.2);
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  },

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    localStorage.setItem('2042-music-muted', String(!enabled));
    if (!enabled) this.stopMusic();
    else if (this.context) this.startMusic();
  },

  setMusicVolume(value) {
    this.musicVolume = Math.max(0, Math.min(1, Number(value) / 100));
    localStorage.setItem('2042-music-volume', String(Math.round(this.musicVolume * 100)));
    if (this.musicGain && this.context) this.musicGain.gain.setTargetAtTime(this.musicEnabled ? this.musicVolume : 0, this.context.currentTime, 0.04);
  },

  setMusicMix(mix) {
    if (!this.getMix(mix)) return;
    this.musicMix = mix;
    localStorage.setItem('2042-music-mix', mix);
    if (this.musicTimer) { this.stopMusic(); this.startMusic(); }
  },

  getMix(key = this.musicMix) {
    const mixes = {
      house: { bpm: 124, bass: [55, 55, 65, 55, 55, 73, 65, 55], hats: [2, 6, 10, 14], lead: [440, 0, 523, 0, 494, 0, 587, 0] },
      techno: { bpm: 136, bass: [49, 49, 49, 58, 49, 49, 65, 58], hats: [1, 3, 5, 7, 9, 11, 13, 15], lead: [0, 294, 0, 330, 0, 294, 370, 0] },
      phunk: { bpm: 142, bass: [46, 46, 0, 55, 46, 0, 62, 55], hats: [2, 7, 10, 15], lead: [0, 277, 0, 233, 0, 277, 311, 0] },
      cyberpunk: { bpm: 128, bass: [52, 52, 62, 52, 45, 45, 52, 62], hats: [2, 6, 10, 14], lead: [330, 0, 392, 0, 440, 0, 392, 0] },
      dubstep: { bpm: 140, bass: [39, 0, 39, 46, 0, 39, 52, 46], hats: [2, 6, 10, 14], lead: [0, 220, 0, 196, 0, 233, 0, 196] },
    };
    return mixes[key];
  },

  musicTone(frequency, start, duration, { type = 'sawtooth', volume = 0.035, cutoff = 900 } = {}) {
    const audio = this.context;
    if (!audio || !this.musicGain) return;
    const oscillator = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(cutoff, start);
    gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
    oscillator.start(start); oscillator.stop(start + duration + 0.03);
  },

  musicNoise(start, duration, volume, highpass = 4000) {
    const audio = this.context;
    if (!audio || !this.noiseBuffer || !this.musicGain) return;
    const source = audio.createBufferSource(); const filter = audio.createBiquadFilter(); const gain = audio.createGain();
    source.buffer = this.noiseBuffer; filter.type = 'highpass'; filter.frequency.value = highpass;
    gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.musicGain); source.start(start); source.stop(start + duration);
  },

  scheduleMusicStep() {
    const audio = this.context; const mix = this.getMix();
    if (!audio || !mix || !this.musicEnabled) return;
    const step = this.musicStep % 16; const beat = 60 / mix.bpm / 4; const start = audio.currentTime + 0.015;
    if (step % 4 === 0) this.musicTone(52, start, 0.16, { type: 'sine', volume: 0.13, cutoff: 180 });
    if (mix.hats.includes(step)) this.musicNoise(start, 0.035, 0.018, 5200);
    const bass = mix.bass[Math.floor(step / 2)];
    if (bass && step % 2 === 0) this.musicTone(bass, start, beat * 1.7, { type: this.musicMix === 'dubstep' ? 'square' : 'sawtooth', volume: 0.038, cutoff: this.musicMix === 'dubstep' ? 420 : 620 });
    const lead = mix.lead[Math.floor(step / 2)];
    if (lead && step % 2 === 0) this.musicTone(lead, start, beat * 1.45, { type: 'triangle', volume: 0.018, cutoff: 1800 });
    this.musicStep += 1;
  },

  startMusic() {
    const audio = this.init();
    if (!audio || !this.musicEnabled || this.musicTimer) return;
    this.musicGain.gain.setTargetAtTime(this.musicVolume, audio.currentTime, 0.04);
    this.musicStep = 0;
    const beat = 60000 / this.getMix().bpm / 4;
    this.scheduleMusicStep();
    this.musicTimer = window.setInterval(() => this.scheduleMusicStep(), beat);
  },

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicGain && this.context) this.musicGain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.035);
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
