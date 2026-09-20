/**
 * Quantitative Scientific Metrics Suite for OuijaEcho.
 * Provides biomechanical, motor control, and information-theoretic evaluations:
 * 1. Path Tortuosity Index (Actual Distance / Euclidean Distance)
 * 2. Dimensionless / Normalized Jerk (Motor smoothness & involuntary movement index)
 * 3. Fitts's Law Index of Difficulty & Information Throughput
 * 4. Shannon Entropy of target sequences
 * 5. Complete Scientific Session Synthesis
 */

/**
 * Calculates the tortuosity (straightness index) of a movement trajectory.
 * Values near 1.0 indicate direct, ballistic movement.
 * High values indicate hesitation, subconscious wandering, or searching.
 * 
 * @param {number} actualDistance - Cumulative path length in cm
 * @param {number} euclideanDistance - Straight-line distance between start and end in cm
 * @returns {number} Tortuosity ratio (>= 1.0)
 */
export function calculateTortuosity(actualDistance, euclideanDistance) {
  if (euclideanDistance <= 0.001) return 1.0;
  return Number((actualDistance / euclideanDistance).toFixed(3));
}

/**
 * Calculates the Dimensionless Jerk metric (Teulings et al., 1997; Hogan & Sternad, 2009).
 * A standard in biomechanics to quantify motor smoothness independent of duration or scale.
 * 
 * DJ = - int(jerk^2 dt) * (duration^5 / distance^2)
 * 
 * Lower magnitude implies smoother, well-controlled voluntary movement.
 * Higher magnitude indicates tremors, sub-movements, or involuntary motor drift.
 * 
 * @param {Array<number>} jerkValues - Array of instantaneous jerk values (cm/s³)
 * @param {number} durationSec - Total movement duration in seconds
 * @param {number} distanceCm - Total distance in cm
 * @returns {number} Log dimensionless jerk (or normalized jerk score)
 */
export function calculateNormalizedJerk(jerkValues = [], durationSec = 1, distanceCm = 1) {
  if (jerkValues.length === 0 || durationSec <= 0 || distanceCm <= 0) return 0;

  const dt = durationSec / jerkValues.length;
  let jerkSquaredIntegral = 0;
  for (const j of jerkValues) {
    jerkSquaredIntegral += j * j * dt;
  }

  const factor = Math.pow(durationSec, 5) / Math.max(0.01, Math.pow(distanceCm, 2));
  const rawDimensionlessJerk = jerkSquaredIntegral * factor;

  // Logarithmic transformation for readable comparison
  return Number(Math.log10(Math.max(1, rawDimensionlessJerk)).toFixed(3));
}

/**
 * Calculates Fitts's Law parameters:
 * Index of Difficulty (ID) = log2(2 * Distance / TargetWidth)
 * Throughput (TP) = ID / MovementTime
 * 
 * @param {number} movementTimeSec
 * @param {number} distanceCm
 * @param {number} targetWidthCm
 * @returns {{ indexOfDifficultyBits: number, throughputBps: number }}
 */
export function calculateFittsMetrics(movementTimeSec, distanceCm, targetWidthCm) {
  const width = Math.max(0.1, targetWidthCm);
  const dist = Math.max(width, distanceCm);
  const id = Math.log2((2 * dist) / width);
  const tp = movementTimeSec > 0 ? id / movementTimeSec : 0;

  return {
    indexOfDifficultyBits: Number(id.toFixed(2)),
    throughputBps: Number(tp.toFixed(2))
  };
}

/**
 * Calculates Shannon Entropy of an observed symbolic sequence (letters/numbers/commands).
 * H(X) = - sum( p(x) * log2(p(x)) )
 * 
 * @param {Array<string>} sequence - Array of detected elements
 * @returns {{ entropyBits: number, maxEntropyBits: number, normalizedEntropy: number, vocabularySize: number }}
 */
export function calculateShannonEntropy(sequence = []) {
  if (sequence.length === 0) {
    return { entropyBits: 0, maxEntropyBits: 0, normalizedEntropy: 0, vocabularySize: 0 };
  }

  const counts = {};
  for (const item of sequence) {
    counts[item] = (counts[item] || 0) + 1;
  }

  const total = sequence.length;
  let entropy = 0;
  const vocabSize = Object.keys(counts).length;

  for (const key in counts) {
    const p = counts[key] / total;
    entropy -= p * Math.log2(p);
  }

  const maxEntropy = vocabSize > 1 ? Math.log2(vocabSize) : 1;
  const normalized = maxEntropy > 0 ? entropy / maxEntropy : 0;

  return {
    entropyBits: Number(entropy.toFixed(3)),
    maxEntropyBits: Number(maxEntropy.toFixed(3)),
    normalizedEntropy: Number(normalized.toFixed(3)),
    vocabularySize: vocabSize
  };
}

/**
 * Compiles a holistic scientific summary combining kinematics, metrics, and ambient factors.
 * 
 * @param {Object} sessionReport
 * @returns {Object}
 */
export function generateScientificSummary(sessionReport = {}) {
  const { kinematics = {}, environment = {}, correlation = {} } = sessionReport;

  const history = sessionReport.kinematicFrames || [];
  let tortuosity = 1.0;
  let logJerk = 0;

  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const euclideanDist = Math.sqrt(dx * dx + dy * dy);

    tortuosity = calculateTortuosity(kinematics.cumulativeDistanceCm || 0, euclideanDist);

    const jerkValues = history.map(h => h.jerk);
    logJerk = calculateNormalizedJerk(
      jerkValues,
      kinematics.durationSeconds || 1,
      kinematics.cumulativeDistanceCm || 1
    );
  }

  const detectedSequence = (kinematics.dwellEvents || []).map(e => e.target);
  const entropy = calculateShannonEntropy(detectedSequence);

  return {
    movementProfile: {
      totalDurationSeconds: kinematics.durationSeconds || 0,
      cumulativeDistanceCm: kinematics.cumulativeDistanceCm || 0,
      meanSpeedCmS: kinematics.meanSpeedCmS || 0,
      maxSpeedCmS: kinematics.maxSpeedCmS || 0,
      meanAccelerationCmS2: kinematics.meanAccelerationCmS2 || 0,
      tortuosityIndex: tortuosity,
      logDimensionlessJerk: logJerk,
      motorControlClassification: logJerk > 4.5 ? 'SUB-CONSCIOUS_OR_TREMOR' : 'DELIBERATE_SMOOTH'
    },
    symbolicProfile: {
      sequence: detectedSequence,
      totalSymbolsDetected: detectedSequence.length,
      shannonEntropy: entropy
    },
    environmentalCoupling: {
      isolationScore: correlation.isolationScore ?? 1.0,
      purityCategory: correlation.purityCategory ?? 'PRISTINE',
      ambientSpikesDetected: environment.totalAnomalies ?? 0,
      correlatedArtifacts: correlation.coupledArtifactCount ?? 0
    },
    temporalProfile: kinematics.timingAnalysis || {
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
