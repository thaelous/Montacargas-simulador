/**
 * Industrial Forklift Audio Synthesizer via Web Audio API.
 * Synthesizes realistic combustion engine (idle rumble & revving),
 * hydraulic pump whine, backup alarm beeper, dual-tone horn,
 * and mechanical impacts without external assets.
 */

class ForkliftAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Engine audio nodes (combustion modulation)
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineLFO: OscillatorNode | null = null;
  private engineLFOGain: GainNode | null = null;

  // Hydraulics audio nodes
  private hydraulicGain: GainNode | null = null;
  private hydraulicOsc: OscillatorNode | null = null;
  private hydraulicFilter: BiquadFilterNode | null = null;

  // Backup beeper
  private beeperTimer: number | null = null;
  private isBeeping: boolean = false;

  // Horn
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  public init() {
    if (this.isInitialized) {
      this.resume();
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.setupEngine();
      this.setupHydraulics();
      this.setupHorn();
      this.isInitialized = true;
    } catch {
      // AudioContext waiting for user gesture
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupEngine() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Master engine gain
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.12, now);

    // Warm low-pass filter to simulate engine block & exhaust muffler
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, now);
    this.engineFilter.Q.setValueAtTime(1.8, now);

    // Primary combustion sub-frequency (4-cylinder pulse)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(26, now); // 750 RPM idle

    // Secondary cylinder firing harmonic
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(52, now);

    // LFO for rhythmic idle throbbing / modulation
    this.engineLFO = this.ctx.createOscillator();
    this.engineLFO.type = 'sine';
    this.engineLFO.frequency.setValueAtTime(12.5, now);

    this.engineLFOGain = this.ctx.createGain();
    this.engineLFOGain.gain.setValueAtTime(0.04, now);

    this.engineLFO.connect(this.engineLFOGain);
    this.engineLFOGain.connect(this.engineGain.gain);

    // Connections
    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineLFO.start();
  }

  private setupHydraulics() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.hydraulicGain = this.ctx.createGain();
    this.hydraulicGain.gain.setValueAtTime(0.0001, now);

    // Narrow band-pass to simulate high-pressure gear pump whine
    this.hydraulicFilter = this.ctx.createBiquadFilter();
    this.hydraulicFilter.type = 'bandpass';
    this.hydraulicFilter.frequency.setValueAtTime(420, now);
    this.hydraulicFilter.Q.setValueAtTime(4.2, now);

    this.hydraulicOsc = this.ctx.createOscillator();
    this.hydraulicOsc.type = 'triangle';
    this.hydraulicOsc.frequency.setValueAtTime(360, now);

    this.hydraulicOsc.connect(this.hydraulicFilter);
    this.hydraulicFilter.connect(this.hydraulicGain);
    this.hydraulicGain.connect(this.ctx.destination);

    this.hydraulicOsc.start();
  }

  private setupHorn() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.0001, now);

    // Industrial dual-tone horn (392 Hz G4 + 466 Hz Bb4)
    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'sawtooth';
    this.hornOsc1.frequency.setValueAtTime(392, now);

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'sawtooth';
    this.hornOsc2.frequency.setValueAtTime(466, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    this.hornOsc1.connect(filter);
    this.hornOsc2.connect(filter);
    filter.connect(this.hornGain);
    this.hornGain.connect(this.ctx.destination);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  /**
   * Updates dynamic sounds based on current forklift state
   */
  public update(rpm: number, isHydraulicActive: boolean, isReversing: boolean) {
    if (!this.isInitialized) {
      return;
    }
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Engine Combustion Modulation (RPM pitch & volume)
    if (this.engineOsc1 && this.engineOsc2 && this.engineFilter && this.engineGain) {
      // 750 RPM -> 25 Hz fundamental (low rumble)
      // 2400 RPM -> 78 Hz fundamental (revving engine)
      const normRpm = Math.max(0, Math.min(1, (rpm - 750) / 1650));
      const targetHz = 25 + normRpm * 55;
      this.engineOsc1.frequency.setTargetAtTime(targetHz, now, 0.06);
      this.engineOsc2.frequency.setTargetAtTime(targetHz * 2, now, 0.06);

      // Open lowpass filter on throttle
      const targetFilter = 140 + normRpm * 420;
      this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.06);

      // Volume increases with acceleration
      const targetGain = 0.11 + normRpm * 0.14;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.06);

      // LFO rate speeds up with engine speed
      if (this.engineLFO) {
        this.engineLFO.frequency.setTargetAtTime(12 + normRpm * 28, now, 0.06);
      }
    }

    // 2. Hydraulic Pump Sound
    if (this.hydraulicGain && this.hydraulicOsc && this.hydraulicFilter) {
      const targetGain = isHydraulicActive ? 0.085 : 0.0001;
      this.hydraulicGain.gain.setTargetAtTime(targetGain, now, 0.06);
      if (isHydraulicActive) {
        this.hydraulicOsc.frequency.setTargetAtTime(360 + Math.random() * 25, now, 0.04);
        this.hydraulicFilter.frequency.setTargetAtTime(450 + Math.random() * 40, now, 0.04);
      }
    }

    // 3. Backup Safety Beeper (in reverse)
    if (isReversing && !this.isBeeping) {
      this.startBackupBeeper();
    } else if (!isReversing && this.isBeeping) {
      this.stopBackupBeeper();
    }
  }

  public setHorn(active: boolean) {
    if (!this.isInitialized) {
      if (active) this.init();
      return;
    }
    if (this.isMuted || !this.ctx || !this.hornGain) return;
    this.resume();
    const target = active ? 0.24 : 0.0001;
    this.hornGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
  }

  public playClunk() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  public playCrash() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    try {
      // Metallic heavy impact thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);

      // Noise scrape burst for metal cage scraping on concrete floor
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(950, now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch {
      // Audio fallback
    }
  }

  public playEngineStart() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    try {
      // Starter crank motor pulse
      const crankOsc = this.ctx.createOscillator();
      const crankGain = this.ctx.createGain();
      crankOsc.type = 'sawtooth';
      crankOsc.frequency.setValueAtTime(45, now);
      crankOsc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
      crankGain.gain.setValueAtTime(0.2, now);
      crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      crankOsc.connect(crankGain);
      crankGain.connect(this.ctx.destination);
      crankOsc.start(now);
      crankOsc.stop(now + 0.25);

      // Ignition catch roar settling into idle
      const ignOsc = this.ctx.createOscillator();
      const ignGain = this.ctx.createGain();
      ignOsc.type = 'sawtooth';
      ignOsc.frequency.setValueAtTime(110, now + 0.15);
      ignOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
      ignGain.gain.setValueAtTime(0.001, now);
      ignGain.gain.setValueAtTime(0.25, now + 0.16);
      ignGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      ignOsc.connect(ignGain);
      ignGain.connect(this.ctx.destination);
      ignOsc.start(now + 0.15);
      ignOsc.stop(now + 0.55);
    } catch {
      // Audio fallback
    }
  }

  private startBackupBeeper() {
    this.isBeeping = true;
    const beep = () => {
      if (!this.isBeeping || !this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + 0.18);
      gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);

      this.beeperTimer = window.setTimeout(beep, 600);
    };
    beep();
  }

  private stopBackupBeeper() {
    this.isBeeping = false;
    if (this.beeperTimer) {
      clearTimeout(this.beeperTimer);
      this.beeperTimer = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopBackupBeeper();
    }
    return this.isMuted;
  }

  public isSoundMuted() {
    return this.isMuted;
  }
}

export const forkliftAudio = new ForkliftAudioSystem();
