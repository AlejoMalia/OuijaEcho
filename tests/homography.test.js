import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHomography,
  projectPoint,
  invertMatrix3x3
} from '../src/vision/homography.js';

test('Homography: solves 3x3 projective matrix and maps camera corners to metric board', () => {
  // Simulated camera perspective: trapezoid distortion of the 37x24 board
  const cameraCorners = [
    { x: 100, y: 80 },   // Top-Left
    { x: 700, y: 70 },   // Top-Right
    { x: 780, y: 520 },  // Bottom-Right
    { x: 40,  y: 540 }   // Bottom-Left
  ];

  const H = computeHomography(cameraCorners);
  assert.equal(H.length, 3);
  assert.equal(H[0].length, 3);

  // Corner 0 should project to (0, 0)
  const p0 = projectPoint(cameraCorners[0], H);
  assert.ok(Math.abs(p0.x - 0.0) < 0.05, `p0.x was ${p0.x}`);
  assert.ok(Math.abs(p0.y - 0.0) < 0.05, `p0.y was ${p0.y}`);

  // Corner 1 should project to (37.0, 0.0)
  const p1 = projectPoint(cameraCorners[1], H);
  assert.ok(Math.abs(p1.x - 37.0) < 0.05, `p1.x was ${p1.x}`);
  assert.ok(Math.abs(p1.y - 0.0) < 0.05, `p1.y was ${p1.y}`);

  // Corner 2 should project to (37.0, 24.0)
  const p2 = projectPoint(cameraCorners[2], H);
  assert.ok(Math.abs(p2.x - 37.0) < 0.05, `p2.x was ${p2.x}`);
  assert.ok(Math.abs(p2.y - 24.0) < 0.05, `p2.y was ${p2.y}`);

  // Corner 3 should project to (0.0, 24.0)
  const p3 = projectPoint(cameraCorners[3], H);
  assert.ok(Math.abs(p3.x - 0.0) < 0.05, `p3.x was ${p3.x}`);
  assert.ok(Math.abs(p3.y - 24.0) < 0.05, `p3.y was ${p3.y}`);
});

test('Homography: inverts 3x3 matrix accurately', () => {
  const M = [
    [2, 1, 0],
    [1, 3, 1],
    [0, 1, 2]
  ];

  const invM = invertMatrix3x3(M);
  assert.equal(invM.length, 3);

  // M * invM should be Identity matrix
  const id00 = M[0][0] * invM[0][0] + M[0][1] * invM[1][0] + M[0][2] * invM[2][0];
  assert.ok(Math.abs(id00 - 1.0) < 1e-4);
});
