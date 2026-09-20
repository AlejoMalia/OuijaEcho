import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDistance,
  getAllBoardTargets,
  findNearestElement,
  calculateTargetProbabilities,
  isWithinBoard
} from '../src/core/geometry.js';
import { ouijaBoardMapping } from '../src/ouija-board-mapping.js';

test('Geometry: getDistance computes accurate Euclidean 2D distance', () => {
  assert.equal(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(getDistance({ x: 10, y: 10 }, { x: 10, y: 10 }), 0);
  assert.ok(Math.abs(getDistance({ x: 1, y: 1 }, { x: 2, y: 2 }) - Math.SQRT2) < 1e-6);
});

test('Geometry: getAllBoardTargets aggregates all standard targets', () => {
  const targets = getAllBoardTargets();
  // 1 affirmation + 1 negation + 26 letters + 10 numbers + 1 farewell = 39 targets
  assert.equal(targets.length, 39);

  const ids = targets.map(t => t.id);
  assert.ok(ids.includes('YES'));
  assert.ok(ids.includes('NO'));
  assert.ok(ids.includes('A'));
  assert.ok(ids.includes('Z'));
  assert.ok(ids.includes('0'));
  assert.ok(ids.includes('9'));
  assert.ok(ids.includes('GOOD_BYE'));
});

test('Geometry: isWithinBoard validates boundary coordinates', () => {
  const { width, height } = ouijaBoardMapping.boardSize;
  assert.equal(isWithinBoard({ x: 0, y: 0 }), true);
  assert.equal(isWithinBoard({ x: width, y: height }), true);
  assert.equal(isWithinBoard({ x: width / 2, y: height / 2 }), true);
  assert.equal(isWithinBoard({ x: -1, y: 5 }), false);
  assert.equal(isWithinBoard({ x: 5, y: -0.1 }), false);
  assert.equal(isWithinBoard({ x: width + 0.1, y: 10 }), false);
  assert.equal(isWithinBoard({ x: 10, y: height + 0.5 }), false);
});

test('Geometry: findNearestElement identifies exact target and proximity status', () => {
  // Center of YES is (8.0, 3.5), radius 2.5
  const exactYes = findNearestElement({ x: 8.0, y: 3.5 });
  assert.equal(exactYes.target.name, 'YES');
  assert.equal(exactYes.distance, 0);
  assert.equal(exactYes.isInsideRadius, true);

  // Near YES within radius (radius is 2.5)
  const nearYes = findNearestElement({ x: 9.0, y: 3.5 });
  assert.equal(nearYes.target.name, 'YES');
  assert.equal(nearYes.distance, 1.0);
  assert.equal(nearYes.isInsideRadius, true);

  // Center of letter 'M' is (35.0, 8.0), radius 1.5
  const nearM = findNearestElement({ x: 35.0, y: 8.0 });
  assert.equal(nearM.target.name, 'M');
  assert.equal(nearM.distance, 0);
  assert.equal(nearM.isInsideRadius, true);

  // Distant point outside any radius
  const distant = findNearestElement({ x: 0.5, y: 0.5 });
  assert.equal(distant.isInsideRadius, false);
  assert.ok(distant.distance > 0);
});

test('Geometry: calculateTargetProbabilities applies Gaussian Softmax scaling and temperature', () => {
  // Test probability distribution at YES center
  const probsDefault = calculateTargetProbabilities({ x: 8.0, y: 3.5 }, 1.0);
  assert.equal(probsDefault.length, 39);

  const sumProbs = probsDefault.reduce((acc, p) => acc + p.probability, 0);
  assert.ok(Math.abs(sumProbs - 1.0) < 1e-4, 'Probabilities must sum to 1.0');
  assert.equal(probsDefault[0].id, 'YES');
  assert.ok(probsDefault[0].probability > 0.4);

  // Test with sharp temperature (low temperature = concentrated probability)
  const probsSharp = calculateTargetProbabilities({ x: 8.0, y: 3.5 }, 0.2);
  assert.ok(probsSharp[0].probability > probsDefault[0].probability, 'Lower temperature should increase peak confidence');

  // Test with diffuse temperature (high temperature = flatter distribution)
  const probsDiffuse = calculateTargetProbabilities({ x: 8.0, y: 3.5 }, 5.0);
  assert.ok(probsDiffuse[0].probability < probsDefault[0].probability, 'Higher temperature should flatten distribution');
});
