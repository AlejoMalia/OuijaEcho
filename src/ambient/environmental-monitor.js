/**
 * Environmental Compilation & Ambient Conditions Monitor for OuijaEcho.
 * Captures, compiles, and analyzes surrounding environmental signals in real time:
 * - Acoustic Pressure / Noise (dB)
 * - Ambient Light & Luminosity variations (Lux)
 * - Table Mechanical Surface Vibration (g-force)
 * - Peripheral Room Motion / Observer Movement (%)
 *
 * Maintains running baselines (mean, variance) and triggers calibrated anomaly events
 * when external environmental shocks occur.
 */
export class EnvironmentalMonitor {
  /**
   * @param {Object} [config]
   * @param {number} [config.noiseThresholdDb=65] Threshold for acoustic spike detection
   * @param {number} [config.vibrationThresholdG=0.08] Threshold for table mechanical tremor/bump
   * @param {number} [config.lightVarianceThresholdLux=80] Threshold for sudden lighting change
   * @param {number} [config.motionThresholdPct=15] Threshold for peripheral room movement
   * @param {number} [config.baselineWindowSize=50] Number of samples for adaptive running baseline
   */
  constructor(config = {}) {
    this.thresholds = {
      noiseDb: config.noiseThresholdDb ?? 65,
      vibrationG: config.vibrationThresholdG ?? 0.08,
      lightLuxDelta: config.lightVarianceThresholdLux ?? 80,
      motionPct: config.motionThresholdPct ?? 15
    };

    this.baselineWindowSize = config.baselineWindowSize ?? 50;
    this.reset();
  }

  /**
   * Resets internal buffers and state.
   */
  reset() {
    this.samples = []; // Complete environmental time-series
    this.events = []; // Detected environmental shocks/perturbations
    this.lastSample = null;
    this.runningStats = {
      noise: { sum: 0, sumSq: 0, count: 0 },
      light: { sum: 0, sumSq: 0, count: 0 },
      vibration: { sum: 0, sumSq: 0, count: 0 },
      motion: { sum: 0, sumSq: 0, count: 0 }
    };
  }

  /**
   * Records an environmental observation frame.
   * 
   * @param {Object} readings
   * @param {number} [readings.noiseDb=35] Ambient sound level in decibels (30-40dB = quiet room)
   * @param {number} [readings.lightLux=300] Ambient light level in lux (300-500 = normal room)
   * @param {number} [readings.vibrationG=0.01] Table mechanical vibration in g (0.01 = resting)
   * @param {number} [readings.motionPct=0] Peripheral movement detected outside board (0-100%)
   * @param {number} [timestamp]
   * @returns {EnvironmentalSample}
   */
  record(readings = {}, timestamp = Date.now()) {
    const noiseDb = readings.noiseDb ?? 35;
    const lightLux = readings.lightLux ?? 300;
    const vibrationG = readings.vibrationG ?? 0.01;
    const motionPct = readings.motionPct ?? 0;

    this._updateStats('noise', noiseDb);
    this._updateStats('light', lightLux);
    this._updateStats('vibration', vibrationG);
    this._updateStats('motion', motionPct);

    const detectedAnomalies = [];

    // Check Acoustic Spike
    if (noiseDb >= this.thresholds.noiseDb) {
      detectedAnomalies.push({
        type: 'NOISE_SPIKE',
        severity: (noiseDb - this.thresholds.noiseDb) / 20,
        value: noiseDb,
        unit: 'dB'
      });
    }

    // Check Table Vibration Shock
    if (vibrationG >= this.thresholds.vibrationG) {
      detectedAnomalies.push({
        type: 'TABLE_VIBRATION',
        severity: (vibrationG - this.thresholds.vibrationG) / 0.1,
        value: vibrationG,
        unit: 'g'
      });
    }

    // Check Light Flicker / Shadow Shock
    if (this.lastSample) {
      const dLux = Math.abs(lightLux - this.lastSample.lightLux);
      if (dLux >= this.thresholds.lightLuxDelta) {
        detectedAnomalies.push({
          type: 'LIGHT_FLICKER',
          severity: dLux / this.thresholds.lightLuxDelta,
          value: dLux,
          unit: 'lux_delta'
        });
      }
    }

    // Check Peripheral Motion
    if (motionPct >= this.thresholds.motionPct) {
      detectedAnomalies.push({
        type: 'PERIPHERAL_MOTION',
        severity: (motionPct - this.thresholds.motionPct) / 30,
        value: motionPct,
        unit: '%'
      });
    }

    const sample = {
      timestamp,
      noiseDb,
      lightLux,
      vibrationG,
      motionPct,
      hasAnomaly: detectedAnomalies.length > 0,
      anomalies: detectedAnomalies
    };

    this.samples.push(sample);
    this.lastSample = sample;

    if (detectedAnomalies.length > 0) {
      for (const anom of detectedAnomalies) {
        this.events.push({
          timestamp,
          ...anom
        });
      }
    }

    return sample;
  }

  /**
   * Helper to generate a realistic simulated ambient frame with stochastic fluctuations
   * and optional injected perturbations.
   * 
   * @param {Object} [options]
   * @param {boolean} [options.injectSpike=false] Force an ambient shock event
   * @param {'noise'|'vibration'|'light'|'motion'} [options.spikeType='noise']
   * @returns {Object} Ambient readings
   */
  generateSimulatedFrame(options = {}) {
    // Baseline white noise fluctuations
    const baseNoise = 38 + (Math.random() - 0.5) * 4;
    const baseLight = 320 + (Math.random() - 0.5) * 10;
    const baseVib = 0.012 + (Math.random() - 0.5) * 0.005;
    const baseMotion = Math.max(0, (Math.random() - 0.7) * 4);

    if (!options.injectSpike) {
      return {
        noiseDb: Number(baseNoise.toFixed(1)),
        lightLux: Number(baseLight.toFixed(1)),
        vibrationG: Number(baseVib.toFixed(4)),
        motionPct: Number(baseMotion.toFixed(1))
      };
    }

    const type = options.spikeType || 'noise';
    return {
      noiseDb: type === 'noise' ? 78 + Math.random() * 15 : Number(baseNoise.toFixed(1)),
      lightLux: type === 'light' ? 120 : Number(baseLight.toFixed(1)), // sudden shadow
      vibrationG: type === 'vibration' ? 0.22 + Math.random() * 0.1 : Number(baseVib.toFixed(4)),
      motionPct: type === 'motion' ? 65 + Math.random() * 20 : Number(baseMotion.toFixed(1))
    };
  }

  _updateStats(channel, val) {
    const s = this.runningStats[channel];
    s.count++;
    s.sum += val;
    s.sumSq += val * val;
  }

  /**
   * Calculates summary statistics across all ambient channels.
   * @returns {Object}
   */
  getSummary() {
    const calcChannel = (ch) => {
      const s = this.runningStats[ch];
      if (s.count === 0) return { mean: 0, stdDev: 0 };
      const mean = s.sum / s.count;
      const variance = Math.max(0, (s.sumSq / s.count) - (mean * mean));
      return {
        mean: Number(mean.toFixed(2)),
        stdDev: Number(Math.sqrt(variance).toFixed(2))
      };
    };

    return {
      sampleCount: this.samples.length,
      totalAnomalies: this.events.length,
      acousticBaseline: calcChannel('noise'),
      opticalBaseline: calcChannel('light'),
      vibrationalBaseline: calcChannel('vibration'),
      motionBaseline: calcChannel('motion'),
      eventBreakdown: {
        noiseSpikes: this.events.filter(e => e.type === 'NOISE_SPIKE').length,
        vibrationShocks: this.events.filter(e => e.type === 'TABLE_VIBRATION').length,
        lightFlickers: this.events.filter(e => e.type === 'LIGHT_FLICKER').length,
        peripheralMotions: this.events.filter(e => e.type === 'PERIPHERAL_MOTION').length
      },
      events: [...this.events]
    };
  }
}
