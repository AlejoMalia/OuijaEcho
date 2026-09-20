import { ouijaBoardMapping } from '../ouija-board-mapping.js';

/**
 * Calculates Euclidean distance between two 2D points.
 * @param {{ x: number, y: number }} pos1
 * @param {{ x: number, y: number }} pos2
 * @returns {number} Distance in coordinates unit (cm)
 */
export function getDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Flattens all valid targets from the board mapping into a single searchable array.
 * @returns {Array<{ id: string, name: string, category: string, position: { x: number, y: number }, radius: number }>}
 */
export function getAllBoardTargets() {
  const targets = [];

  // Affirmation
  targets.push({
    id: 'YES',
    name: ouijaBoardMapping.affirmation.element,
    category: 'affirmation',
    position: ouijaBoardMapping.affirmation.position,
    radius: ouijaBoardMapping.affirmation.radius
  });

  // Negation
  targets.push({
    id: 'NO',
    name: ouijaBoardMapping.negation.element,
    category: 'negation',
    position: ouijaBoardMapping.negation.position,
    radius: ouijaBoardMapping.negation.radius
  });

  // Letters
  for (const item of ouijaBoardMapping.letters) {
    targets.push({
      id: item.letter,
      name: item.letter,
      category: 'letter',
      position: item.position,
      radius: item.radius
    });
  }

  // Numbers
  for (const item of ouijaBoardMapping.numbers) {
    targets.push({
      id: String(item.number),
      name: String(item.number),
      category: 'number',
      position: item.position,
      radius: item.radius
    });
  }

  // Farewell
  targets.push({
    id: 'GOOD_BYE',
    name: ouijaBoardMapping.farewell.element,
    category: 'farewell',
    position: ouijaBoardMapping.farewell.position,
    radius: ouijaBoardMapping.farewell.radius
  });

  return targets;
}

/**
 * Finds the nearest element to given coordinates, regardless of whether it's inside the radius.
 * @param {{ x: number, y: number }} pos
 * @returns {{ target: Object, distance: number, isInsideRadius: boolean }}
 */
export function findNearestElement(pos) {
  const targets = getAllBoardTargets();
  let minDistance = Infinity;
  let nearestTarget = null;

  for (const target of targets) {
    const dist = getDistance(pos, target.position);
    if (dist < minDistance) {
      minDistance = dist;
      nearestTarget = target;
    }
  }

  return {
    target: nearestTarget,
    distance: minDistance,
    isInsideRadius: nearestTarget ? minDistance <= nearestTarget.radius : false
  };
}

/**
 * Calculates continuous spatial attraction probabilities across all board targets
 * using a Gaussian radial basis function and Softmax normalization.
 * 
 * P(target_i | x, y) = exp( - d(pos, pos_i)^2 / (2 * (sigma * radius_i)^2) ) / Z
 * 
 * @param {{ x: number, y: number }} pos - Coordinates in cm
 * @param {number} [temperature=1.0] - Softmax temperature parameter (lower = sharper decision, higher = softer distribution)
 * @returns {Array<{ id: string, name: string, category: string, probability: number, distance: number }>}
 */
export function calculateTargetProbabilities(pos, temperature = 1.0) {
  const targets = getAllBoardTargets();
  const rawWeights = [];
  let sumWeights = 0;

  const temp = Math.max(0.05, temperature);

  for (const target of targets) {
    const distance = getDistance(pos, target.position);
    // Scale sigma by target radius so larger zones have appropriate attraction basins
    const sigma = (target.radius || 1.5) * temp;
    const exponent = - (distance * distance) / (2 * sigma * sigma);
    // Numerical stability clamp
    const weight = Math.exp(Math.max(-50, exponent));
    rawWeights.push({ target, distance, weight });
    sumWeights += weight;
  }

  return rawWeights.map(item => ({
    id: item.target.id,
    name: item.target.name,
    category: item.target.category,
    probability: sumWeights > 0 ? item.weight / sumWeights : 0,
    distance: item.distance
  })).sort((a, b) => b.probability - a.probability);
}

/**
 * Checks if coordinates are within the physical boundaries of the board.
 * @param {{ x: number, y: number }} pos
 * @returns {boolean}
 */
export function isWithinBoard(pos) {
  const { width, height } = ouijaBoardMapping.boardSize;
  return pos.x >= 0 && pos.x <= width && pos.y >= 0 && pos.y <= height;
}
