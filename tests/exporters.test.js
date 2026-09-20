import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exportToCsv,
  exportToJsonLd,
  exportToMarkdown
} from '../src/analytics/exporter.js';
import { generateHtmlReport } from '../src/analytics/visualizer.js';

const mockDataset = {
  kinematics: {
    durationSeconds: 2.0,
    cumulativeDistanceCm: 25.4,
    meanSpeedCmS: 12.7,
    maxSpeedCmS: 32.1,
    meanAccelerationCmS2: 24.5,
    dwellEvents: [
      {
        target: 'YES',
        enterTime: 1000,
        exitTime: 1300,
        durationMs: 300,
        position: { x: 8.0, y: 3.5 },
        maxProbability: 0.92
      }
    ],
    transitionEvents: [
      {
        fromTarget: 'YES',
        toTarget: 'D',
        flightDurationMs: 150,
        distanceCm: 5.2,
        meanSpeedCmS: 34.6,
        peakSpeedCmS: 45.0,
        hesitationMs: 0
      }
    ],
    voidEvents: [
      {
        startTime: 1300,
        endTime: 1450,
        durationMs: 150,
        distanceCm: 5.2,
        meanSpeedCmS: 34.6,
        hesitationMs: 0,
        fromTarget: 'YES',
        toTarget: 'D'
      }
    ]
  },
  kinematicFrames: [
    {
      timestamp: 1000,
      dt: 0.05,
      x: 8.0,
      y: 3.5,
      vx: 0,
      vy: 0,
      speed: 0,
      ax: 0,
      ay: 0,
      acceleration: 0,
      jerk: 0,
      cumulativeDistance: 0,
      nearestTarget: 'YES',
      topCandidate: 'YES',
      topProbability: 0.92
    },
    {
      timestamp: 1050,
      dt: 0.05,
      x: 12.0,
      y: 6.0,
      vx: 80,
      vy: 50,
      speed: 94.34,
      ax: 1600,
      ay: 1000,
      acceleration: 1886.8,
      jerk: 120.5,
      cumulativeDistance: 4.72,
      nearestTarget: 'D',
      topCandidate: 'D',
      topProbability: 0.88
    }
  ],
  ambientSamples: [
    { noiseDb: 35.0, lightLux: 300.0, vibrationG: 0.01, motionPct: 0.0 },
    { noiseDb: 78.5, lightLux: 305.0, vibrationG: 0.02, motionPct: 5.0 }
  ],
  environment: {
    totalAnomalies: 1,
    events: [
      { timestamp: 1050, type: 'NOISE_SPIKE', value: 78.5, unit: 'dB' }
    ]
  },
  correlation: {
    isolationScore: 0.85,
    purityCategory: 'LIGHTLY_PERTURBED',
    coupledArtifactCount: 1,
    coupledIncidents: [
      {
        kinematicIncident: { timestamp: 1050, jerk: 120.5, nearestTarget: 'D' },
        ambientTriggers: [{ type: 'NOISE_SPIKE', value: 78.5 }],
        latencyMs: 50
      }
    ]
  },
  scientificSummary: {
    movementProfile: {
      totalDurationSeconds: 2.0,
      cumulativeDistanceCm: 25.4,
      meanSpeedCmS: 12.7,
      maxSpeedCmS: 32.1,
      tortuosityIndex: 1.25,
      logDimensionlessJerk: 4.12,
      motorControlClassification: 'DELIBERATE_SMOOTH'
    },
    symbolicProfile: {
      sequence: ['YES', 'D'],
      totalSymbolsDetected: 2,
      shannonEntropy: { entropyBits: 1.0, normalizedEntropy: 1.0 }
    },
    environmentalCoupling: {
      isolationScore: 0.85,
      purityCategory: 'LIGHTLY_PERTURBED',
      ambientSpikesDetected: 1,
      correlatedArtifacts: 1
    }
  }
};

test('Exporters: exportToCsv generates valid CSV data across types', () => {
  // Time-series CSV
  const tsCsv = exportToCsv(mockDataset, 'timeseries');
  assert.ok(tsCsv.startsWith('timestamp,dt_sec,x_cm,y_cm'));
  const lines = tsCsv.trim().split('\n');
  assert.equal(lines.length, 3); // 1 header + 2 frames
  assert.ok(lines[1].includes('YES'));
  assert.ok(lines[2].includes('78.5'));

  // Dwells CSV
  const dwellsCsv = exportToCsv(mockDataset, 'dwells');
  assert.ok(dwellsCsv.startsWith('target,enter_time,exit_time'));
  assert.ok(dwellsCsv.includes('"YES"'));

  // Correlation CSV
  const corrCsv = exportToCsv(mockDataset, 'correlation');
  assert.ok(corrCsv.startsWith('kinematic_time,jerk_value,nearest_target'));
  assert.ok(corrCsv.includes('NOISE_SPIKE'));

  // Transitions CSV
  const transCsv = exportToCsv(mockDataset, 'transitions');
  assert.ok(transCsv.startsWith('from_target,to_target,flight_duration_ms'));
  assert.ok(transCsv.includes('"YES","D",150'));

  // Voids CSV
  const voidsCsv = exportToCsv(mockDataset, 'voids');
  assert.ok(voidsCsv.startsWith('start_time,end_time,duration_ms'));
  assert.ok(voidsCsv.includes('1300,1450,150'));
});

test('Exporters: exportToJsonLd produces valid Schema.org Dataset structure', () => {
  const jsonStr = exportToJsonLd(mockDataset, { author: 'Dr. Turing', title: 'Ideomotor Test' });
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed['@context'], 'https://schema.org');
  assert.equal(parsed['@type'], 'Dataset');
  assert.equal(parsed.name, 'Ideomotor Test');
  assert.equal(parsed.creator.name, 'Dr. Turing');
  assert.equal(parsed.kinematicFramesCount, 2);
  assert.equal(parsed.ambientSamplesCount, 2);
  assert.ok(parsed.scientificSummary);
});

test('Exporters: exportToMarkdown produces clean human-readable markdown', () => {
  const md = exportToMarkdown(mockDataset);
  assert.ok(md.includes('# OuijaEcho Scientific Report'));
  assert.ok(md.includes('**Cumulative Distance:** 25.4 cm'));
  assert.ok(md.includes('**Isolation Score:** **0.85 / 1.0**'));
  assert.ok(md.includes('YES → D'));
});

test('Visualizer: generateHtmlReport produces complete standalone HTML/SVG', () => {
  const html = generateHtmlReport(mockDataset, { title: 'Lab Test Report' });
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('<title>Lab Test Report</title>'));
  assert.ok(html.includes('<svg viewBox="0 0 37 24"'));
  assert.ok(html.includes('class="trajectory-path"'));
  assert.ok(html.includes('YES → D'));
  assert.ok(html.includes('LIGHTLY_PERTURBED'));
});
