import test from 'node:test';
import assert from 'node:assert/strict';
import { KinematicTracker } from '../src/engine/kinematics.js';
import { calculateTargetProbabilities, findNearestElement, getDistance } from '../src/core/geometry.js';
import { calculateTortuosity, calculateShannonEntropy, calculateFittsMetrics } from '../src/analytics/metrics.js';

test('Core Geometry: Euclidean distance and target probabilities', () => {
  const d = getDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
  assert.equal(d, 5);

  const nearest = findNearestElement({ x: 8.0, y: 3.5 }); // YES center
  assert.equal(nearest.target.name, 'YES');
  assert.equal(nearest.distance, 0);
  assert.equal(nearest.isInsideRadius, true);

  const probs = calculateTargetProbabilities({ x: 8.0, y: 3.5 });
  const totalProb = probs.reduce((acc, curr) => acc + curr.probability, 0);
  assert.ok(Math.abs(totalProb - 1.0) < 0.001, 'Probabilities should sum to 1.0');
  assert.equal(probs[0].id, 'YES');
  assert.ok(probs[0].probability > 0.5, 'YES should have dominant probability at its center');
});

test('KinematicTracker: velocity, acceleration, jerk, and dwell times', () => {
  const tracker = new KinematicTracker({ minDwellTimeMs: 150 });
  const t0 = 1000;

  // Frame 0: Start at YES
  const f0 = tracker.update({ x: 8.0, y: 3.5 }, t0);
  assert.equal(f0.speed, 0);

  // Frame 1: Move right at constant velocity
  const f1 = tracker.update({ x: 10.0, y: 3.5 }, t0 + 100);
  assert.ok(f1.speed > 0, 'Speed should be positive after movement');
  assert.equal(f1.dt, 0.1);

  // Frame 2: Stay on D (12.0, 6.0) for 300ms
  tracker.update({ x: 12.0, y: 6.0 }, t0 + 200);
  tracker.update({ x: 12.0, y: 6.0 }, t0 + 500);

  // Frame 3: Move away to Mute Zone
  tracker.update({ x: 1.0, y: 1.0 }, t0 + 600);

  const summary = tracker.finalize();
  assert.ok(summary.sampleCount >= 4);
  assert.ok(summary.cumulativeDistanceCm > 5);
  const dEvent = summary.dwellEvents.find(e => e.target === 'D');
  assert.ok(dEvent, 'Should find dwell event for target D');
  assert.ok(dEvent.durationMs >= 300);
});

test('Scientific Metrics: Tortuosity, Shannon Entropy, and Fitts', () => {
  // Straight line
  const straight = calculateTortuosity(10, 10);
  assert.equal(straight, 1.0);

  // Wandering path
  const wandering = calculateTortuosity(25, 10);
  assert.equal(wandering, 2.5);

  // Shannon Entropy
  const repeated = calculateShannonEntropy(['A', 'A', 'A']);
  assert.equal(repeated.entropyBits, 0);

  const diverse = calculateShannonEntropy(['A', 'B', 'C', 'D']);
  assert.equal(diverse.entropyBits, 2.0);

  // Fitts metrics
  const fitts = calculateFittsMetrics(0.5, 20, 2);
  assert.ok(fitts.indexOfDifficultyBits > 4);
  assert.ok(fitts.throughputBps > 8);
});

test('KinematicTracker: tracks inter-symbol flight latency, transitions, and void epochs', () => {
  const tracker = new KinematicTracker({ minDwellTimeMs: 150 });
  const t0 = 1000;

  // 1. Enter and dwell on 'YES' (8.0, 3.5)
  tracker.update({ x: 8.0, y: 3.5 }, t0);
  tracker.update({ x: 8.0, y: 3.5 }, t0 + 200);

  // 2. Travel through VOID (empty space) between YES and NO
  tracker.update({ x: 18.0, y: 3.5 }, t0 + 350); // Mid-point void transit

  // 3. Enter and dwell on 'NO' (29.0, 3.5)
  tracker.update({ x: 29.0, y: 3.5 }, t0 + 500);
  tracker.update({ x: 29.0, y: 3.5 }, t0 + 750);

  const summary = tracker.finalize();

  assert.equal(summary.dwellCount, 2);
  assert.equal(summary.transitionCount, 1);
  const transition = summary.transitionEvents[0];
  assert.equal(transition.fromTarget, 'YES');
  assert.equal(transition.toTarget, 'NO');
  assert.equal(transition.flightDurationMs, 150); // 1500 - 1350 ms
  assert.ok(transition.distanceCm > 15);

  assert.ok(summary.voidCount >= 1);
  const voidEvent = summary.voidEvents.find(v => v.fromTarget === 'YES' && v.toTarget === 'NO');
  assert.ok(voidEvent, 'Should identify void event between YES and NO');
  assert.equal(voidEvent.durationMs, 150);

  // Timing analysis
  assert.ok(summary.timingAnalysis);
  assert.ok(summary.timingAnalysis.dwellRatioPercent > 0);
  assert.ok(summary.timingAnalysis.voidRatioPercent > 0);
  assert.equal(summary.timingAnalysis.meanInterSymbolIntervalMs, 150);
});

