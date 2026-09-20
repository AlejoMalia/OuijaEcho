import test from 'node:test';
import assert from 'node:assert/strict';
import { LinguisticPrior } from '../src/analytics/linguistic-prior.js';

test('LinguisticPrior: transition probabilities and candidate prediction', () => {
  const lp = new LinguisticPrior();

  // 'Q' -> 'U' has high conditional probability (~0.98)
  const pQU = lp.getTransitionProbability('Q', 'U');
  assert.ok(pQU > 0.9);

  // 'Q' -> 'X' has low conditional probability
  const pQX = lp.getTransitionProbability('Q', 'X');
  assert.ok(pQX < 0.05);

  // Surprisal: log2(1 / p)
  const surprisalQU = lp.getSurprisalBits('Q', 'U');
  const surprisalQX = lp.getSurprisalBits('Q', 'X');
  assert.ok(surprisalQX > surprisalQU);

  // Predict candidates
  const cands = lp.predictNextCandidates('Q', 2);
  assert.equal(cands[0].letter, 'U');
});

test('LinguisticPrior: detects semantic commitment vector alignment', () => {
  const lp = new LinguisticPrior();

  // Target 'E' is at (14.5, 5.5). Planchette is at (10.0, 5.5) moving right at vx = +10 cm/s
  // Previous letter was 'H' (which strongly predicts 'E')
  const currentKinematics = {
    x: 10.0,
    y: 5.5,
    vx: 10.0,
    vy: 0.0
  };

  const commitment = lp.detectSemanticCommitment(currentKinematics, 'H');
  assert.equal(commitment.hasPrecommitment, true);
  assert.equal(commitment.committedLetter, 'E');
  assert.ok(commitment.angularAlignment > 0.9);
});
