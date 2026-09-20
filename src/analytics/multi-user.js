/**
 * Multi-User Dynamics & Motor Dominance Analyzer for OuijaEcho.
 * Investigates collective ideomotor dynamics and resolves the classic question:
 * "Who is steering the planchette?"
 * 
 * Computes lagged cross-correlation of forces/accelerations between Participant A and B:
 * - Motor Dominance Index (MDI) [-1.0 = User A leads, +1.0 = User B leads]
 * - Interpersonal Synchrony / Coherence
 * - Leadership Transitions
 */
export class MultiUserAnalyzer {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxLagMs=300] Maximum lag window to evaluate leader-follower dynamics
   */
  constructor(options = {}) {
    this.maxLagMs = options.maxLagMs ?? 300;
    this.reset();
  }

  reset() {
    this.userAFrames = []; // { timestamp, x, y, ax, ay, force }
    this.userBFrames = [];
    this.dominanceTimeline = [];
  }

  /**
   * Records a time-synchronized frame of both participants.
   * 
   * @param {Object} sampleA - { x, y, ax, ay, force }
   * @param {Object} sampleB - { x, y, ax, ay, force }
   * @param {number} [timestamp]
   */
  recordFrame(sampleA, sampleB, timestamp = Date.now()) {
    const frameA = { timestamp, ...sampleA };
    const frameB = { timestamp, ...sampleB };

    this.userAFrames.push(frameA);
    this.userBFrames.push(frameB);

    // Compute instantaneous acceleration magnitudes or force
    const magA = sampleA.force !== undefined ? sampleA.force : Math.sqrt((sampleA.ax || 0)**2 + (sampleA.ay || 0)**2);
    const magB = sampleB.force !== undefined ? sampleB.force : Math.sqrt((sampleB.ax || 0)**2 + (sampleB.ay || 0)**2);

    const diff = magB - magA;
    const total = magA + magB + 1e-6;
    const instantaneousDominance = Number((diff / total).toFixed(3)); // -1 (A) to +1 (B)

    this.dominanceTimeline.push({
      timestamp,
      magA,
      magB,
      instantaneousDominance
    });

    return { instantaneousDominance };
  }

  /**
   * Computes lagged cross-correlation between signals A and B.
   * A negative optimal lag means User A leads User B; positive means User B leads User A.
   * 
   * @param {Array<number>} signalA
   * @param {Array<number>} signalB
   * @param {number} maxLag
   * @returns {{ optimalLag: number, maxCorrelation: number }}
   */
  computeLaggedCorrelation(signalA, signalB, maxLag = 10) {
    const n = Math.min(signalA.length, signalB.length);
    if (n < 5) return { optimalLag: 0, maxCorrelation: 0 };

    // Mean-center signals
    const meanA = signalA.reduce((s, v) => s + v, 0) / n;
    const meanB = signalB.reduce((s, v) => s + v, 0) / n;

    const stdA = Math.sqrt(signalA.reduce((s, v) => s + (v - meanA)**2, 0) / n) || 1e-6;
    const stdB = Math.sqrt(signalB.reduce((s, v) => s + (v - meanB)**2, 0) / n) || 1e-6;

    let bestLag = 0;
    let maxCorr = -Infinity;

    for (let lag = -maxLag; lag <= maxLag; lag++) {
      let crossSum = 0;
      let count = 0;

      for (let i = 0; i < n; i++) {
        const j = i + lag;
        if (j >= 0 && j < n) {
          crossSum += (signalA[i] - meanA) * (signalB[j] - meanB);
          count++;
        }
      }

      const r = count > 0 ? crossSum / (count * stdA * stdB) : 0;
      if (r > maxCorr) {
        maxCorr = r;
        bestLag = lag;
      }
    }

    return {
      optimalLag: bestLag,
      maxCorrelation: Number(maxCorr.toFixed(3))
    };
  }

  /**
   * Generates a complete synthesis of multi-user interaction dynamics.
   * @returns {Object} Multi-user report
   */
  analyze() {
    const n = this.dominanceTimeline.length;
    if (n === 0) {
      return {
        sampleCount: 0,
        motorDominanceIndex: 0,
        classification: 'NO_DATA',
        interpersonalSynchrony: 0,
        leadershipTransitions: 0
      };
    }

    const signalA = this.dominanceTimeline.map(d => d.magA);
    const signalB = this.dominanceTimeline.map(d => d.magB);

    const { optimalLag, maxCorrelation } = this.computeLaggedCorrelation(signalA, signalB, 15);

    let sumDominance = 0;
    let transitions = 0;
    let prevSign = 0;

    for (const d of this.dominanceTimeline) {
      sumDominance += d.instantaneousDominance;
      const currentSign = Math.sign(d.instantaneousDominance);
      if (prevSign !== 0 && currentSign !== 0 && currentSign !== prevSign) {
        transitions++;
      }
      if (currentSign !== 0) prevSign = currentSign;
    }

    const meanDominance = Number((sumDominance / n).toFixed(3));

    let classification = 'BALANCED_SWARM';
    if (meanDominance <= -0.3) classification = 'USER_A_DOMINANT';
    else if (meanDominance >= 0.3) classification = 'USER_B_DOMINANT';
    else if (transitions > 5) classification = 'DYNAMIC_NEGOTIATION';

    return {
      sampleCount: n,
      motorDominanceIndex: meanDominance, // -1.0 to +1.0
      optimalLagFrames: optimalLag,
      interpersonalSynchrony: Math.max(0, maxCorrelation),
      leadershipTransitions: transitions,
      classification,
      interpretation: optimalLag < 0 
        ? 'User A initiates movement vectors ahead of User B'
        : optimalLag > 0
          ? 'User B initiates movement vectors ahead of User A'
          : 'Symmetric synchronous co-action'
    };
  }
}
