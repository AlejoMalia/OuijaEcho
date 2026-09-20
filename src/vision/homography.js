/**
 * Projective Geometry & Planar Homography Module for OuijaEcho.
 * Enables optical perspective correction from any camera viewpoint to the
 * standard metric Ouija board coordinate system (37.0 x 24.0 cm).
 * 
 * Uses Direct Linear Transformation (DLT) to solve the 3x3 homography matrix H:
 * [x']     [h11 h12 h13] [x]
 * [y']  =  [h21 h22 h23] [y]
 * [ 1]     [h31 h32 h33] [1]
 */

import { ouijaBoardMapping } from '../ouija-board-mapping.js';

/**
 * Solves an 8x8 linear system A * h = b using Gaussian elimination with partial pivoting.
 * @private
 */
function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    [M[i], M[maxRow]] = [M[maxRow], M[i]];

    if (Math.abs(M[i][i]) < 1e-12) {
      throw new Error('Singular matrix in homography calculation: collinear points provided');
    }

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        M[k][j] -= factor * M[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}

/**
 * Computes the 3x3 homography matrix H from 4 source points to 4 destination points.
 * 
 * @param {Array<{ x: number, y: number }>} srcPoints - 4 camera/pixel coordinates in order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
 * @param {Array<{ x: number, y: number }>} [dstPoints] - 4 destination coordinates in cm. Defaults to standard board corners.
 * @returns {Array<Array<number>>} 3x3 transformation matrix
 */
export function computeHomography(srcPoints, dstPoints) {
  if (!srcPoints || srcPoints.length !== 4) {
    throw new Error('Exactly 4 source points required to compute homography');
  }

  const { width, height } = ouijaBoardMapping.boardSize;
  const dst = dstPoints || [
    { x: 0, y: 0 },          // Top-Left
    { x: width, y: 0 },      // Top-Right
    { x: width, y: height }, // Bottom-Right
    { x: 0, y: height }      // Bottom-Left
  ];

  if (dst.length !== 4) {
    throw new Error('Exactly 4 destination points required');
  }

  // Construct 8 linear equations for 8 unknowns (setting h33 = 1)
  const A = [];
  const b = [];

  for (let i = 0; i < 4; i++) {
    const sx = srcPoints[i].x;
    const sy = srcPoints[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    // x-row: [sx, sy, 1, 0, 0, 0, -dx*sx, -dx*sy] * h = dx
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    b.push(dx);

    // y-row: [0, 0, 0, sx, sy, 1, -dy*sx, -dy*sy] * h = dy
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dy);
  }

  const h = solveLinearSystem(A, b);

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1.0]
  ];
}

/**
 * Projects a 2D camera point into metric board space using the homography matrix H.
 * 
 * @param {{ x: number, y: number }} point - Camera/Pixel point (px)
 * @param {Array<Array<number>>} H - 3x3 Homography matrix
 * @returns {{ x: number, y: number }} Metric board point (cm)
 */
export function projectPoint(point, H) {
  const x = point.x;
  const y = point.y;

  const wx = H[0][0] * x + H[0][1] * y + H[0][2];
  const wy = H[1][0] * x + H[1][1] * y + H[1][2];
  const w  = H[2][0] * x + H[2][1] * y + H[2][2];

  if (Math.abs(w) < 1e-12) {
    return { x: 0, y: 0 };
  }

  return {
    x: Number((wx / w).toFixed(3)),
    y: Number((wy / w).toFixed(3))
  };
}

/**
 * Inverts a 3x3 matrix.
 * @param {Array<Array<number>>} M
 * @returns {Array<Array<number>>}
 */
export function invertMatrix3x3(M) {
  const det =
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);

  if (Math.abs(det) < 1e-12) {
    throw new Error('Homography matrix is non-invertible');
  }

  const invDet = 1.0 / det;

  return [
    [
      (M[1][1] * M[2][2] - M[1][2] * M[2][1]) * invDet,
      (M[0][2] * M[2][1] - M[0][1] * M[2][2]) * invDet,
      (M[0][1] * M[1][2] - M[0][2] * M[1][1]) * invDet
    ],
    [
      (M[1][2] * M[2][0] - M[1][0] * M[2][2]) * invDet,
      (M[0][0] * M[2][2] - M[0][2] * M[2][0]) * invDet,
      (M[0][2] * M[1][0] - M[0][0] * M[1][2]) * invDet
    ],
    [
      (M[1][0] * M[2][1] - M[1][1] * M[2][0]) * invDet,
      (M[0][1] * M[2][0] - M[0][0] * M[2][1]) * invDet,
      (M[0][0] * M[1][1] - M[0][1] * M[1][0]) * invDet
    ]
  ];
}
