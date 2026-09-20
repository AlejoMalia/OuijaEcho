import EventEmitter from 'node:events';
import { KinematicTracker } from './kinematics.js';
import { EnvironmentalMonitor } from '../ambient/environmental-monitor.js';
import { CorrelationAnalyzer } from '../ambient/correlation-analyzer.js';
import { generateScientificSummary } from '../analytics/metrics.js';
import { MultiUserAnalyzer } from '../analytics/multi-user.js';
import { LinguisticPrior } from '../analytics/linguistic-prior.js';

/**
 * OuijaSessionEngine: The central reactive orchestrator for OuijaEcho.
 * Synchronizes kinematic trajectory tracking with ambient environmental telemetry
 * and supports pluggable multimodal adapters (mouse, webcam, serial sensors, multi-user, linguistic).
 */
export class OuijaSessionEngine extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {number} [options.sampleRateHz=30] Polling or sampling rate in Hz (default 30 samples/sec)
   * @param {number} [options.minDwellTimeMs=200] Minimum target dwell time in ms
   * @param {number} [options.smoothingFactor=0.2] Kinematic exponential smoothing factor
   * @param {Object} [options.ambientConfig] Configuration for EnvironmentalMonitor thresholds
   * @param {Object} [options.correlationConfig] Configuration for CorrelationAnalyzer latency windows
   * @param {boolean} [options.enableMultiUser=false] Enable dual-participant dynamics
   * @param {boolean} [options.enableLinguisticPrior=false] Enable n-gram linguistic commitment analysis
   */
  constructor(options = {}) {
    super();

    this.sampleRateHz = options.sampleRateHz || 30;
    this.intervalMs = Math.round(1000 / this.sampleRateHz);

    this.kinematics = new KinematicTracker({
      minDwellTimeMs: options.minDwellTimeMs,
      smoothingFactor: options.smoothingFactor
    });

    this.environment = new EnvironmentalMonitor(options.ambientConfig || {});
    this.correlationAnalyzer = new CorrelationAnalyzer(options.correlationConfig || {});

    this.multiUser = options.enableMultiUser ? new MultiUserAnalyzer() : null;
    this.linguistic = options.enableLinguisticPrior ? new LinguisticPrior() : null;

    this.adapters = [];
    this.isRunning = false;
    this.timerId = null;
    this.startTime = null;
    this.lastDetectedTarget = null;
  }

  /**
   * Plugs in a multimodal input adapter (PointerAdapter, CameraAdapter, HardwareAdapter, etc.).
   * @param {BaseAdapter} adapter
   * @returns {OuijaSessionEngine} Fluent self-reference
   */
  use(adapter) {
    if (!adapter) return this;
    this.adapters.push(adapter);

    adapter.on('coords', ({ coords, timestamp }) => {
      this.feedFrame(coords, {}, timestamp);
    });

    adapter.on('ambient', ({ readings, timestamp }) => {
      this.environment.record(readings, timestamp);
    });

    this.emit('adapter_attached', { name: adapter.name });
    return this;
  }

  /**
   * Starts a continuous recording session.
   * 
   * @param {Function|{ x: number, y: number }} [coordsSource] - Optional coordinates object or getter function
   * @param {Function|Object} [ambientSource] - Optional ambient telemetry generator function
   * @returns {() => Object} Stop function that terminates session and returns full compiled research dataset
   */
  start(coordsSource, ambientSource) {
    if (this.isRunning) {
      throw new Error('Session is already running');
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.kinematics.reset();
    this.environment.reset();
    if (this.multiUser) this.multiUser.reset();
    this.lastDetectedTarget = null;

    this.emit('started', { timestamp: this.startTime });

    this.timerId = setInterval(() => {
      const now = Date.now();

      // If a synchronous coordinate source is provided, query it
      if (coordsSource) {
        const currentPos = typeof coordsSource === 'function' ? coordsSource() : coordsSource;
        const kFrame = this.kinematics.update(currentPos, now);

        let ambientReadings = {};
        if (typeof ambientSource === 'function') {
          ambientReadings = ambientSource();
        } else if (ambientSource && typeof ambientSource === 'object') {
          ambientReadings = ambientSource;
        }
        const aSample = this.environment.record(ambientReadings, now);

        this._checkTransitions(kFrame, now, currentPos);
        this.emit('frame', { kinematic: kFrame, ambient: aSample });
      }
    }, this.intervalMs);

    return () => this.stop();
  }

  /**
   * Manually feeds a single synchronized time frame.
   * 
   * @param {{ x: number, y: number }} pos
   * @param {Object} [ambientReadings]
   * @param {number} [timestamp]
   * @returns {{ kinematic: Object, ambient: Object }}
   */
  feedFrame(pos, ambientReadings = {}, timestamp = Date.now()) {
    const kFrame = this.kinematics.update(pos, timestamp);
    const aSample = this.environment.record(ambientReadings, timestamp);

    this._checkTransitions(kFrame, timestamp, pos);

    // If linguistic prior is active, check for semantic commitment
    if (this.linguistic && this.lastDetectedTarget && this.lastDetectedTarget !== 'Mute Zone') {
      const commitment = this.linguistic.detectSemanticCommitment(kFrame, this.lastDetectedTarget);
      if (commitment.hasPrecommitment) {
        this.emit('semantic_commitment', { ...commitment, timestamp });
      }
    }

    this.emit('frame', { kinematic: kFrame, ambient: aSample });
    return { kinematic: kFrame, ambient: aSample };
  }

  /**
   * Records a dual-participant frame when multi-user mode is enabled.
   */
  feedMultiUserFrame(sampleA, sampleB, timestamp = Date.now()) {
    if (!this.multiUser) {
      this.multiUser = new MultiUserAnalyzer();
    }
    const result = this.multiUser.recordFrame(sampleA, sampleB, timestamp);
    this.emit('multi_user_frame', { ...result, timestamp });
    return result;
  }

  _checkTransitions(kFrame, timestamp, pos) {
    const currentTarget = kFrame.isInsideTarget ? kFrame.nearestTarget : 'Mute Zone';
    if (currentTarget !== this.lastDetectedTarget) {
      this.emit('target_change', {
        previousTarget: this.lastDetectedTarget,
        currentTarget,
        timestamp,
        position: pos
      });
      this.lastDetectedTarget = currentTarget;
    }
  }

  /**
   * Stops the active session, runs final cross-correlation and returns the compiled dataset.
   * @returns {Object} Complete compiled session dataset
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;

    const summary = this.compileResults();
    this.emit('stopped', summary);
    return summary;
  }

  /**
   * Compiles and cross-references all session data.
   * @returns {Object}
   */
  compileResults() {
    const kinSummary = this.kinematics.finalize();
    const envSummary = this.environment.getSummary();
    const correlation = this.correlationAnalyzer.analyze(
      this.kinematics.history,
      this.environment.events
    );

    const compiled = {
      startTime: this.startTime || Date.now(),
      stopTime: Date.now(),
      kinematics: kinSummary,
      environment: envSummary,
      correlation,
      kinematicFrames: this.kinematics.history,
      ambientSamples: this.environment.samples
    };

    if (this.multiUser) {
      compiled.multiUser = this.multiUser.analyze();
    }

    compiled.scientificSummary = generateScientificSummary(compiled);

    return compiled;
  }
}
