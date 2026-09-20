import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTortuosity,
  calculateNormalizedJerk,
  calculateFittsMetrics,
  calculateShannonEntropy,
  generateScientificSummary
} from '../src/analytics/metrics.js';

test('Metrics: calculateTortuosity computes accurate straightness ratios', () => {
  assert.equal(calculateTortuosity(15.5, 15.5), 1.0);
  assert.equal(calculateTortuosity(30.0, 10.0), 3.0);
  assert.equal(calculateTortuosity(10.0, 0), 1.0, 'Zero displacement returns base 1.0');
});

test('Metrics: calculateNormalizedJerk computes log dimensionless jerk', () => {
  // Smooth trajectory (low jerk)
  const lowJerkValues = [2.0, 2.1, 1.9, 2.0];
  const ldjLow = calculateNormalizedJerk(lowJerkValues, 1.0, 10.0);

  // Tremor or abrupt trajectory (high jerk)
  const highJerkValues = [50.0, 120.0, 85.0, 140.0];
  const ldjHigh = calculateNormalizedJerk(highJerkValues, 1.0, 10.0);

  assert.ok(ldjHigh > ldjLow, 'Higher jerk variance should produce higher dimensionless jerk score');
  assert.equal(calculateNormalizedJerk([], 1.0, 10.0), 0);
  assert.equal(calculateNormalizedJerk([10], 0, 10), 0);
});

test('Metrics: calculateFittsMetrics evaluates difficulty and throughput', () => {
  // Target width 3.0cm, distance 15cm
  const fitts = calculateFittsMetrics(0.8, 15.0, 3.0);
  // ID = log2(2 * 15 / 3) = log2(10) ~ 3.32 bits
  assert.ok(Math.abs(fitts.indexOfDifficultyBits - 3.32) < 0.1);
  // Throughput = 3.32 / 0.8 ~ 4.15 bits/sec
  assert.ok(Math.abs(fitts.throughputBps - 4.15) < 0.1);
});

test('Metrics: calculateShannonEntropy computes sequence uncertainty and normalized bits', () => {
  // Zero entropy (single symbol)
  const single = calculateShannonEntropy(['YES', 'YES', 'YES']);
  assert.equal(single.entropyBits, 0);
  assert.equal(single.normalizedEntropy, 0);
  assert.equal(single.vocabularySize, 1);

  // Maximum entropy uniform distribution of 4 symbols: log2(4) = 2.0 bits
  const uniform = calculateShannonEntropy(['A', 'B', 'C', 'D']);
  assert.equal(uniform.entropyBits, 2.0);
  assert.equal(uniform.normalizedEntropy, 1.0);
  assert.equal(uniform.vocabularySize, 4);

  // Empty sequence
  const empty = calculateShannonEntropy([]);
  assert.equal(empty.entropyBits, 0);
});

test('Metrics: generateScientificSummary creates unified research synthesis', () => {
  const mockSession = {
    kinematics: {
      durationSeconds: 3.5,
      cumulativeDistanceCm: 45.2,
      meanSpeedCmS: 12.9,
      maxSpeedCmS: 28.4,
      meanAccelerationCmS2: 45.0,
      dwellEvents: [{ target: 'H' }, { target: 'E' }, { target: 'L' }, { target: 'L' }, { target: 'O' }]
    },
    kinematicFrames: [
      { x: 5.0, y: 5.0, jerk: 10 },
      { x: 15.0, y: 15.0, jerk: 15 }
    ],
    environment: { totalAnomalies: 1 },
    correlation: { isolationScore: 0.9, purityCategory: 'LIGHTLY_PERTURBED', coupledArtifactCount: 0 }
  };

  const summary = generateScientificSummary(mockSession);
  assert.equal(summary.movementProfile.totalDurationSeconds, 3.5);
  assert.equal(summary.movementProfile.cumulativeDistanceCm, 45.2);
  assert.equal(summary.symbolicProfile.totalSymbolsDetected, 5);
  assert.deepEqual(summary.symbolicProfile.sequence, ['H', 'E', 'L', 'L', 'O']);
  assert.equal(summary.environmentalCoupling.isolationScore, 0.9);
  assert.equal(summary.environmentalCoupling.purityCategory, 'LIGHTLY_PERTURBED');
});
