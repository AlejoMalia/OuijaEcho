import test from 'node:test';
import assert from 'node:assert/strict';
import { MultiUserAnalyzer } from '../src/analytics/multi-user.js';

test('MultiUserAnalyzer: computes dominance and identifies User A dominance', () => {
  const mu = new MultiUserAnalyzer();
  const t0 = 1000;

  // Simulate User A exerting strong force (2.0N) while User B is passive (0.2N)
  for (let i = 0; i < 20; i++) {
    mu.recordFrame({ force: 2.0 }, { force: 0.2 }, t0 + i * 50);
  }

  const report = mu.analyze();
  assert.equal(report.sampleCount, 20);
  assert.ok(report.motorDominanceIndex < -0.5, `MDI was ${report.motorDominanceIndex}`);
  assert.equal(report.classification, 'USER_A_DOMINANT');
});

test('MultiUserAnalyzer: computes balanced swarm when forces are equal', () => {
  const mu = new MultiUserAnalyzer();
  const t0 = 1000;

  // Simulate symmetrical cooperative action
  for (let i = 0; i < 20; i++) {
    mu.recordFrame({ force: 1.0 }, { force: 1.0 }, t0 + i * 50);
  }

  const report = mu.analyze();
  assert.ok(Math.abs(report.motorDominanceIndex) < 0.1);
  assert.equal(report.classification, 'BALANCED_SWARM');
});
