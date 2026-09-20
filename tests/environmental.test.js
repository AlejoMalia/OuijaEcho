import test from 'node:test';
import assert from 'node:assert/strict';
import { EnvironmentalMonitor } from '../src/ambient/environmental-monitor.js';
import { CorrelationAnalyzer } from '../src/ambient/correlation-analyzer.js';

test('EnvironmentalMonitor: baseline tracking and anomaly detection', () => {
  const monitor = new EnvironmentalMonitor({
    noiseThresholdDb: 60,
    vibrationThresholdG: 0.05
  });

  const t0 = 10000;

  // Normal room baseline
  const s1 = monitor.record({ noiseDb: 35, lightLux: 300, vibrationG: 0.01, motionPct: 0 }, t0);
  assert.equal(s1.hasAnomaly, false);

  // Sudden loud noise spike
  const s2 = monitor.record({ noiseDb: 82, lightLux: 300, vibrationG: 0.01, motionPct: 0 }, t0 + 100);
  assert.equal(s2.hasAnomaly, true);
  assert.equal(s2.anomalies[0].type, 'NOISE_SPIKE');

  // Table bump vibration
  const s3 = monitor.record({ noiseDb: 35, lightLux: 300, vibrationG: 0.15, motionPct: 0 }, t0 + 200);
  assert.equal(s3.hasAnomaly, true);
  assert.equal(s3.anomalies[0].type, 'TABLE_VIBRATION');

  const summary = monitor.getSummary();
  assert.equal(summary.totalAnomalies, 2);
  assert.equal(summary.eventBreakdown.noiseSpikes, 1);
  assert.equal(summary.eventBreakdown.vibrationShocks, 1);
});

test('CorrelationAnalyzer: links environmental shocks with motor jerk spikes in reflex window', () => {
  const analyzer = new CorrelationAnalyzer({
    reflexWindowMinMs: 30,
    reflexWindowMaxMs: 400,
    jerkSpikeThreshold: 50
  });

  const ambientEvents = [
    { timestamp: 1000, type: 'NOISE_SPIKE', value: 85, unit: 'dB' }
  ];

  const kinematicFrames = [
    { timestamp: 900, jerk: 5, speed: 2, nearestTarget: 'A', x: 4.5, y: 7.5 },
    { timestamp: 1000, jerk: 8, speed: 2, nearestTarget: 'A', x: 4.5, y: 7.5 },
    // Reflex reaction 150ms after noise spike (1150ms): Jerk explodes
    { timestamp: 1150, jerk: 95, speed: 12, nearestTarget: 'B', x: 7.0, y: 7.0 },
    // Later endogenous jerk at 3000ms with no ambient cause
    { timestamp: 3000, jerk: 70, speed: 8, nearestTarget: 'C', x: 9.5, y: 6.5 }
  ];

  const report = analyzer.analyze(kinematicFrames, ambientEvents);

  assert.equal(report.totalKinematicPerturbations, 2);
  assert.equal(report.coupledArtifactCount, 1);
  assert.equal(report.endogenousPerturbationCount, 1);
  assert.equal(report.coupledIncidents[0].latencyMs, 150);
  assert.equal(report.environmentalCouplingIndex, 0.5);
  assert.equal(report.isolationScore, 0.5);
});
