import { getDistance, findNearestElement, calculateTargetProbabilities } from '../core/geometry.js';

/**
 * High-frequency kinematic tracker for Ouija planchette movement.
 * Computes 1st, 2nd, and 3rd order time derivatives:
 * - Velocity (vx, vy, speed)
 * - Acceleration (ax, ay, scalar a)
 * - Jerk (time rate of change of acceleration, essential for motor smoothness analysis)
 * Also tracks dwell times, cumulative path length, and spatial target probabilities.
 */
export class KinematicTracker {
  /**
   * @param {Object} [options]
   * @param {number} [options.minDwellTimeMs=200] Minimum hover duration to qualify as an intentional dwell/fixation
   * @param {number} [options.smoothingFactor=0.2] Exponential smoothing alpha (0 = raw, 1 = maximum smooth)
   */
  constructor(options = {}) {
    this.minDwellTimeMs = options.minDwellTimeMs ?? 200;
    this.smoothingAlpha = options.smoothingFactor ?? 0.2;

    this.reset();
  }

  /**
   * Resets tracker state.
   */
  reset() {
    this.history = []; // Array of processed kinematic frames
    this.dwellEvents = []; // Completed dwell records
    this.activeDwell = null; // Currently ongoing dwell { targetId, enterTime, startPos, maxProb }
    this.transitionEvents = []; // Inter-symbol flights: { fromTarget, toTarget, flightDurationMs, distanceCm, ... }
    this.voidEvents = []; // Void intervals in empty space
    this.activeVoid = null; // Currently ongoing void epoch
    this.lastExitedTarget = null; // Last exited target metadata
    this.cumulativeDistance = 0; // Total Euclidean path length in cm
    this.lastFrame = null;
  }

  /**
   * Processes an incoming coordinate point.
   * @param {{ x: number, y: number }} pos - Coordinates in cm
   * @param {number} [timestamp] - Millisecond timestamp (defaults to Date.now())
   * @returns {KinematicFrame}
   */
  update(pos, timestamp = Date.now()) {
    const prev = this.lastFrame;

    let vx = 0;
    let vy = 0;
    let speed = 0;
    let ax = 0;
    let ay = 0;
    let acceleration = 0;
    let jerk = 0;
    let dt = 0;

    if (prev) {
      dt = (timestamp - prev.timestamp) / 1000; // Convert to seconds

      if (dt > 0.0001) {
        // Raw derivatives
        const rawVx = (pos.x - prev.x) / dt;
        const rawVy = (pos.y - prev.y) / dt;

        // Exponential smoothing filter
        vx = prev.vx + (1 - this.smoothingAlpha) * (rawVx - prev.vx);
        vy = prev.vy + (1 - this.smoothingAlpha) * (rawVy - prev.vy);
        speed = Math.sqrt(vx * vx + vy * vy);

        const rawAx = (vx - prev.vx) / dt;
        const rawAy = (vy - prev.vy) / dt;
        ax = prev.ax + (1 - this.smoothingAlpha) * (rawAx - prev.ax);
        ay = prev.ay + (1 - this.smoothingAlpha) * (rawAy - prev.ay);
        acceleration = Math.sqrt(ax * ax + ay * ay);

        const dAx = ax - prev.ax;
        const dAy = ay - prev.ay;
        const rawJerk = Math.sqrt(dAx * dAx + dAy * dAy) / dt;
        jerk = prev.jerk + (1 - this.smoothingAlpha) * (rawJerk - prev.jerk);

        // Accumulate distance
        const stepDist = Math.sqrt((pos.x - prev.x) ** 2 + (pos.y - prev.y) ** 2);
        this.cumulativeDistance += stepDist;
      }
    }

    // Spatial attraction and target detection
    const nearest = findNearestElement(pos);
    const targetProbabilities = calculateTargetProbabilities(pos, 1.0);
    const topTarget = targetProbabilities[0] || null;

    const frame = {
      timestamp,
      dt,
      x: pos.x,
      y: pos.y,
      vx,
      vy,
      speed,
      ax,
      ay,
      acceleration,
      jerk,
      cumulativeDistance: this.cumulativeDistance,
      nearestTarget: nearest.target ? nearest.target.name : 'Mute Zone',
      nearestDistance: nearest.distance,
      isInsideTarget: nearest.isInsideRadius,
      topCandidate: topTarget ? topTarget.name : null,
      topProbability: topTarget ? topTarget.probability : 0,
      probabilities: targetProbabilities.slice(0, 5) // Top 5 candidates
    };

    // Dwell time management
    this._processDwell(frame);

    this.lastFrame = frame;
    this.history.push(frame);

    return frame;
  }

  /**
   * Internal logic to track dwell times on targets, inter-symbol transitions, and voids.
   * @private
   */
  _processDwell(frame) {
    const currentTargetId = frame.isInsideTarget ? frame.nearestTarget : null;
    const prevPos = this.lastFrame ? { x: this.lastFrame.x, y: this.lastFrame.y } : { x: frame.x, y: frame.y };
    const stepDist = Math.sqrt(Math.pow(frame.x - prevPos.x, 2) + Math.pow(frame.y - prevPos.y, 2));

    // 1. Dwell (fixation) tracking
    if (this.activeDwell) {
      if (this.activeDwell.targetId === currentTargetId) {
        // Still inside the same target
        this.activeDwell.duration = frame.timestamp - this.activeDwell.enterTime;
        if (frame.topProbability > this.activeDwell.maxProb) {
          this.activeDwell.maxProb = frame.topProbability;
        }
      } else {
        // Exited target
        const dwellDuration = frame.timestamp - this.activeDwell.enterTime;
        if (dwellDuration >= this.minDwellTimeMs) {
          this.dwellEvents.push({
            target: this.activeDwell.targetId,
            enterTime: this.activeDwell.enterTime,
            exitTime: frame.timestamp,
            durationMs: dwellDuration,
            position: { x: frame.x, y: frame.y },
            maxProbability: this.activeDwell.maxProb
          });
        }
        this.lastExitedTarget = {
          targetId: this.activeDwell.targetId,
          timestamp: frame.timestamp,
          pos: { x: frame.x, y: frame.y }
        };
        this.activeDwell = null;

        // Directly transitioned to another target without an intermediate empty sample
        if (currentTargetId && currentTargetId !== this.lastExitedTarget.targetId) {
          this.transitionEvents.push({
            fromTarget: this.lastExitedTarget.targetId,
            toTarget: currentTargetId,
            flightDurationMs: 0,
            distanceCm: Number(stepDist.toFixed(2)),
            meanSpeedCmS: Number(frame.speed.toFixed(2)),
            peakSpeedCmS: Number(frame.speed.toFixed(2)),
            hesitationMs: 0
          });
        }
      }
    }

    if (!this.activeDwell && currentTargetId) {
      // Entered new target
      this.activeDwell = {
        targetId: currentTargetId,
        enterTime: frame.timestamp,
        duration: 0,
        startPos: { x: frame.x, y: frame.y },
        maxProb: frame.topProbability
      };
    }

    // 2. Void (neutral / empty space) tracking
    if (!currentTargetId) {
      if (!this.activeVoid) {
        this.activeVoid = {
          fromTarget: this.lastExitedTarget ? this.lastExitedTarget.targetId : null,
          startTime: frame.timestamp,
          startPos: { x: frame.x, y: frame.y },
          distanceCm: stepDist,
          hesitationMs: frame.speed < 1.5 ? (frame.dt * 1000) : 0,
          speedSum: frame.speed,
          peakSpeed: frame.speed,
          count: 1
        };
      } else {
        this.activeVoid.distanceCm += stepDist;
        this.activeVoid.speedSum += frame.speed;
        if (frame.speed > this.activeVoid.peakSpeed) this.activeVoid.peakSpeed = frame.speed;
        if (frame.speed < 1.5) this.activeVoid.hesitationMs += (frame.dt * 1000);
        this.activeVoid.count++;
      }
    } else {
      if (this.activeVoid) {
        this.activeVoid.distanceCm += stepDist;
        this.activeVoid.speedSum += frame.speed;
        this.activeVoid.count++;
        if (frame.speed > this.activeVoid.peakSpeed) this.activeVoid.peakSpeed = frame.speed;

        const voidDuration = frame.timestamp - this.activeVoid.startTime;
        const meanSpeed = this.activeVoid.count > 0 ? (this.activeVoid.speedSum / this.activeVoid.count) : 0;

        const completedVoid = {
          fromTarget: this.activeVoid.fromTarget,
          toTarget: currentTargetId,
          startTime: this.activeVoid.startTime,
          endTime: frame.timestamp,
          durationMs: voidDuration,
          distanceCm: Number(this.activeVoid.distanceCm.toFixed(2)),
          meanSpeedCmS: Number(meanSpeed.toFixed(2)),
          peakSpeedCmS: Number(this.activeVoid.peakSpeed.toFixed(2)),
          hesitationMs: Math.round(this.activeVoid.hesitationMs)
        };
        this.voidEvents.push(completedVoid);

        if (this.activeVoid.fromTarget && this.activeVoid.fromTarget !== currentTargetId) {
          this.transitionEvents.push({
            fromTarget: this.activeVoid.fromTarget,
            toTarget: currentTargetId,
            flightDurationMs: voidDuration,
            distanceCm: completedVoid.distanceCm,
            meanSpeedCmS: completedVoid.meanSpeedCmS,
            peakSpeedCmS: completedVoid.peakSpeedCmS,
            hesitationMs: completedVoid.hesitationMs
          });
        }

        this.activeVoid = null;
      }
    }
  }

  /**
   * Finalizes tracking, closing any open dwell event or void epoch.
   * @returns {Object} Kinematic session summary
   */
  finalize() {
    if (this.activeDwell && this.lastFrame) {
      const dwellDuration = this.lastFrame.timestamp - this.activeDwell.enterTime;
      if (dwellDuration >= this.minDwellTimeMs) {
        this.dwellEvents.push({
          target: this.activeDwell.targetId,
          enterTime: this.activeDwell.enterTime,
          exitTime: this.lastFrame.timestamp,
          durationMs: dwellDuration,
          position: { x: this.lastFrame.x, y: this.lastFrame.y },
          maxProbability: this.activeDwell.maxProb
        });
      }
      this.activeDwell = null;
    }

    if (this.activeVoid && this.lastFrame) {
      const voidDuration = this.lastFrame.timestamp - this.activeVoid.startTime;
      const meanSpeed = this.activeVoid.count > 0 ? (this.activeVoid.speedSum / this.activeVoid.count) : 0;
      this.voidEvents.push({
        fromTarget: this.activeVoid.fromTarget,
        toTarget: null,
        startTime: this.activeVoid.startTime,
        endTime: this.lastFrame.timestamp,
        durationMs: voidDuration,
        distanceCm: Number(this.activeVoid.distanceCm.toFixed(2)),
        meanSpeedCmS: Number(meanSpeed.toFixed(2)),
        peakSpeedCmS: Number(this.activeVoid.peakSpeed.toFixed(2)),
        hesitationMs: Math.round(this.activeVoid.hesitationMs)
      });
      this.activeVoid = null;
    }

    return this.getSummary();
  }

  /**
   * Calculates kinematic statistics for the recorded session.
   * @returns {Object}
   */
  getSummary() {
    if (this.history.length === 0) {
      return {
        sampleCount: 0,
        durationMs: 0,
        cumulativeDistanceCm: 0,
        maxSpeedCmS: 0,
        meanSpeedCmS: 0,
        maxAccelerationCmS2: 0,
        meanAccelerationCmS2: 0,
        maxJerkCmS3: 0,
        meanJerkCmS3: 0,
        dwellCount: 0,
        dwellEvents: [],
        transitionCount: 0,
        transitionEvents: [],
        voidCount: 0,
        voidEvents: [],
        timingAnalysis: {
          totalDwellTimeMs: 0,
          totalVoidTimeMs: 0,
          dwellRatioPercent: 0,
          voidRatioPercent: 0,
          meanInterSymbolIntervalMs: 0,
          meanDwellTimeMs: 0,
          totalHesitationInVoidMs: 0,
          cognitiveHesitationRatio: 0
        }
      };
    }

    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    const durationMs = last.timestamp - first.timestamp;

    let sumSpeed = 0;
    let maxSpeed = 0;
    let sumAcc = 0;
    let maxAcc = 0;
    let sumJerk = 0;
    let maxJerk = 0;

    for (const f of this.history) {
      sumSpeed += f.speed;
      if (f.speed > maxSpeed) maxSpeed = f.speed;

      sumAcc += f.acceleration;
      if (f.acceleration > maxAcc) maxAcc = f.acceleration;

      sumJerk += f.jerk;
      if (f.jerk > maxJerk) maxJerk = f.jerk;
    }

    const n = this.history.length;

    const totalDwellTimeMs = this.dwellEvents.reduce((acc, d) => acc + d.durationMs, 0);
    const totalVoidTimeMs = this.voidEvents.reduce((acc, v) => acc + v.durationMs, 0);
    const effectiveTotalMs = Math.max(1, totalDwellTimeMs + totalVoidTimeMs);
    const meanISI = this.transitionEvents.length > 0 
      ? Number((this.transitionEvents.reduce((acc, t) => acc + t.flightDurationMs, 0) / this.transitionEvents.length).toFixed(1))
      : 0;
    const meanDwell = this.dwellEvents.length > 0
      ? Number((totalDwellTimeMs / this.dwellEvents.length).toFixed(1))
      : 0;
    const totalHesitationMs = this.voidEvents.reduce((acc, v) => acc + (v.hesitationMs || 0), 0);

    return {
      sampleCount: n,
      durationMs,
      durationSeconds: durationMs / 1000,
      cumulativeDistanceCm: Number(this.cumulativeDistance.toFixed(2)),
      maxSpeedCmS: Number(maxSpeed.toFixed(2)),
      meanSpeedCmS: Number((sumSpeed / n).toFixed(2)),
      maxAccelerationCmS2: Number(maxAcc.toFixed(2)),
      meanAccelerationCmS2: Number((sumAcc / n).toFixed(2)),
      maxJerkCmS3: Number(maxJerk.toFixed(2)),
      meanJerkCmS3: Number((sumJerk / n).toFixed(2)),
      dwellCount: this.dwellEvents.length,
      dwellEvents: [...this.dwellEvents],
      transitionCount: this.transitionEvents.length,
      transitionEvents: [...this.transitionEvents],
      voidCount: this.voidEvents.length,
      voidEvents: [...this.voidEvents],
      timingAnalysis: {
        totalDwellTimeMs,
        totalVoidTimeMs,
        dwellRatioPercent: Number(((totalDwellTimeMs / effectiveTotalMs) * 100).toFixed(1)),
        voidRatioPercent: Number(((totalVoidTimeMs / effectiveTotalMs) * 100).toFixed(1)),
        meanInterSymbolIntervalMs: meanISI,
        meanDwellTimeMs: meanDwell,
        totalHesitationInVoidMs: Math.round(totalHesitationMs),
        cognitiveHesitationRatio: Number((totalHesitationMs / Math.max(1, totalVoidTimeMs)).toFixed(3))
      }
    };
  }
}
