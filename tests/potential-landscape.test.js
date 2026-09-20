import test from 'node:test';
import assert from 'node:assert/strict';
import { PotentialLandscape } from '../src/streaming/potential-landscape.js';

test('PotentialLandscape: potential energy is deepest at attractor centers', () => {
  const landscape = new PotentialLandscape();

  // YES is at (8.0, 3.5)
  const uCenter = landscape.getPotential({ x: 8.0, y: 3.5 });
  const uFar = landscape.getPotential({ x: 1.0, y: 1.0 });

  assert.ok(uCenter < uFar, `Center potential (${uCenter}) should be more negative than far point (${uFar})`);
});

test('PotentialLandscape: gradient force pulls particle toward attractor center', () => {
  const landscape = new PotentialLandscape();

  // Point to the left of YES: (6.5, 3.5). Attractive force fx should be POSITIVE (pulling right towards 8.0)
  const forceLeft = landscape.getAttractionForce({ x: 6.5, y: 3.5 });
  assert.ok(forceLeft.fx > 0, `Force fx should be positive towards YES, was ${forceLeft.fx}`);

  // Point to the right of YES: (9.5, 3.5). Attractive force fx should be NEGATIVE (pulling left towards 8.0)
  const forceRight = landscape.getAttractionForce({ x: 9.5, y: 3.5 });
  assert.ok(forceRight.fx < 0, `Force fx should be negative towards YES, was ${forceRight.fx}`);
});

test('PotentialLandscape: Langevin dynamics integrates velocity, damping, and boundaries', () => {
  const landscape = new PotentialLandscape({ damping: 4.0 });

  const initialState = { x: 10.0, y: 10.0, vx: 5.0, vy: 0.0 };
  const nextState = landscape.step(initialState, 0.05, { noiseMagnitude: 0 });

  assert.ok(nextState.x > 10.0);
  assert.ok(nextState.vx < 5.0, 'Damping should reduce velocity magnitude');
  assert.ok(nextState.potentialEnergy !== undefined);
  assert.ok(nextState.totalEnergy !== undefined);
});

test('PotentialLandscape: generates 2D vector field grid', () => {
  const landscape = new PotentialLandscape();
  const field = landscape.generateVectorField(5, 5);

  assert.ok(field.length >= 25);
  assert.ok(field[0].fx !== undefined);
  assert.ok(field[0].potential !== undefined);
});
