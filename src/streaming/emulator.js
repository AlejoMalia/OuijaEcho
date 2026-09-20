import EventEmitter from 'node:events';
import { PotentialLandscape } from './potential-landscape.js';
import { EventStreamPipeline } from './event-stream.js';
import { EmergentTopology } from './emergent-topology.js';
import { findNearestElement } from '../core/geometry.js';

/**
 * AutonomousEmulator: Simulates and decodes boardless projections and physical resonance in streaming.
 * 
 * Demonstrates:
 * 1. Autonomous Langevin particle movement across continuous potential wells.
 * 2. Stochastic resonance: ambient noise nudges the particle across energy barriers.
 * 3. Event Stream Reactive Pipeline: zero processing when motionless.
 * 4. Streaming Text Reader: directly yields decoded tokens as energy collapses occur.
 */
export class AutonomousEmulator extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {number} [options.timeStepSec=0.02] Simulation step dt (default 20ms / 50Hz)
   * @param {boolean} [options.boardlessMode=false] If true, uses EmergentTopology instead of fixed board
   * @param {number} [options.noiseMagnitude=0.35] Stochastic resonance excitation magnitude
   */
  constructor(options = {}) {
    super();

    this.dt = options.timeStepSec ?? 0.02;
    this.boardlessMode = Boolean(options.boardlessMode);
    this.noiseMagnitude = options.noiseMagnitude ?? 0.35;

    this.landscape = new PotentialLandscape();
    this.pipeline = new EventStreamPipeline();
    this.emergent = new EmergentTopology();

    this.particle = { x: 18.5, y: 12.0, vx: 0, vy: 0 }; // Start at board center
    this.timerId = null;
    this.isRunning = false;

    this.currentAttractor = null;
    this.dwellTicks = 0;
    this.streamedText = '';

    // Temporal & Void Analysis
    this.tokenHistory = [];
    this.lastTokenTimestamp = null;
    this.lastTokenName = null;
    this.totalDwellTimeMs = 0;
    this.totalVoidTimeMs = 0;
    this.voidDistanceCm = 0;
    this.voidHesitationMs = 0;
  }

  /**
   * Starts autonomous streaming emulation.
   * @param {Object} [externalBiases] Optional steering forces or ambient sources
   */
  start(externalBiases = {}) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.emit('started');

    this.timerId = setInterval(() => {
      // 1. Step continuous physics (Langevin Dynamics)
      const forces = {
        humanFx: externalBiases.humanFx || 0,
        humanFy: externalBiases.humanFy || 0,
        noiseMagnitude: this.noiseMagnitude
      };

      this.particle = this.landscape.step(this.particle, this.dt, forces);

      // Track temporal distribution: dwell vs. void
      if (this.currentAttractor) {
        this.totalDwellTimeMs += (this.dt * 1000);
      } else {
        this.totalVoidTimeMs += (this.dt * 1000);
        this.voidDistanceCm += (this.particle.speed * this.dt);
        if (this.particle.speed < 1.5) {
          this.voidHesitationMs += (this.dt * 1000);
        }
      }

      // 2. Feed to differential event stream pipeline (Zero-Copy)
      const dispatched = this.pipeline.push(this.particle);

      // 3. If boardless, update emergent topology
      if (this.boardlessMode) {
        this.emergent.feed(this.particle);
      }

      // 4. Streaming Symbol Reader: check energy collapse into attractor
      this._evaluateAttractorResonance(this.particle);

      if (dispatched) {
        this.emit('particle_state', this.particle);
      }
    }, this.dt * 1000);
  }

  _evaluateAttractorResonance(state) {
    const nearest = findNearestElement({ x: state.x, y: state.y });

    // Resonance condition: inside radius, low speed, and deep negative potential
    if (nearest.isInsideRadius && state.speed < 2.5 && state.potentialEnergy < -3.0) {
      const targetName = nearest.target.name;

      if (this.currentAttractor === targetName) {
        this.dwellTicks++;
        // If settled for >= 5 ticks (~100ms), confirm streaming token
        if (this.dwellTicks === 5) {
          const now = Date.now();
          const flightTime = this.lastTokenTimestamp ? Math.round(now - this.lastTokenTimestamp) : Math.round(this.totalVoidTimeMs);
          const tokenData = {
            character: targetName,
            timestamp: now,
            potential: state.potentialEnergy,
            speed: state.speed,
            dwellMs: Math.round(this.dwellTicks * this.dt * 1000),
            flightDurationMs: flightTime,
            voidDistanceCm: Number(this.voidDistanceCm.toFixed(2)),
            fromCharacter: this.lastTokenName
          };

          this.tokenHistory.push(tokenData);
          this.lastTokenTimestamp = now;
          this.lastTokenName = targetName;
          this.voidDistanceCm = 0;

          this.streamedText += targetName;
          this.emit('token', tokenData);
          this.pipeline.emitResonance('ATTRACTOR_COLLAPSE', {
            target: targetName,
            position: { x: state.x, y: state.y }
          });
        }

        // Subconscious release impulse once fixation saturates (~300ms)
        if (this.dwellTicks >= 15) {
          const angle = Math.random() * 2 * Math.PI;
          this.particle.vx += Math.cos(angle) * 4.0;
          this.particle.vy += Math.sin(angle) * 4.0;
          this.currentAttractor = null;
          this.dwellTicks = 0;
        }
      } else {
        this.currentAttractor = targetName;
        this.dwellTicks = 1;
      }
    } else {
      if (state.speed > 3.0) {
        this.currentAttractor = null;
        this.dwellTicks = 0;
      }
    }
  }

  /**
   * Injects an instantaneous impulse vector (e.g. user nudge or sudden vibration).
   * @param {number} fx
   * @param {number} fy
   */
  injectImpulse(fx, fy) {
    this.particle.vx += fx;
    this.particle.vy += fy;
    this.emit('impulse', { fx, fy });
  }

  /**
   * Stops the emulator.
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.pipeline.close();

    const totalTime = Math.max(1, this.totalDwellTimeMs + this.totalVoidTimeMs);
    const isis = this.tokenHistory.filter(t => t.flightDurationMs > 0).map(t => t.flightDurationMs);
    const meanISI = isis.length > 0 ? Number((isis.reduce((a, b) => a + b, 0) / isis.length).toFixed(1)) : 0;
    const timingStats = {
      totalDurationSeconds: Number((totalTime / 1000).toFixed(2)),
      totalTokens: this.tokenHistory.length,
      totalDwellTimeMs: Math.round(this.totalDwellTimeMs),
      totalVoidTimeMs: Math.round(this.totalVoidTimeMs),
      dwellRatioPercent: Number(((this.totalDwellTimeMs / totalTime) * 100).toFixed(1)),
      voidRatioPercent: Number(((this.totalVoidTimeMs / totalTime) * 100).toFixed(1)),
      meanInterSymbolIntervalMs: meanISI,
      totalVoidHesitationMs: Math.round(this.voidHesitationMs),
      tokenHistory: [...this.tokenHistory]
    };

    this.emit('stopped', { text: this.streamedText, timingStats });
    return {
      text: this.streamedText,
      emergentNodes: this.emergent.getAttractors(),
      timingStats
    };
  }
}
