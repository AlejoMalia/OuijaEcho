import { ouijaBoardMapping } from '../ouija-board-mapping.js';

/**
 * Common English & Spanish bigram transition frequency priors.
 * Approximated from natural language corpus statistics.
 */
const COMMON_BIGRAMS = {
  'T': { 'H': 0.35, 'O': 0.15, 'E': 0.12, 'A': 0.10, 'I': 0.08 },
  'H': { 'E': 0.45, 'A': 0.18, 'I': 0.15, 'O': 0.10, 'U': 0.05 },
  'E': { 'R': 0.18, 'S': 0.15, 'N': 0.14, 'D': 0.10, 'A': 0.08 },
  'Q': { 'U': 0.98 },
  'D': { 'E': 0.35, 'O': 0.20, 'A': 0.15, 'I': 0.12 },
  'M': { 'U': 0.20, 'E': 0.25, 'A': 0.25, 'O': 0.15 },
  'N': { 'O': 0.30, 'T': 0.18, 'D': 0.15, 'E': 0.12 },
  'Y': { 'E': 0.70, 'O': 0.20 }
};

/**
 * LinguisticPrior: Integrates natural language priors with planchette trajectory vectors.
 * Detects the subconscious "Semantic Collapse Point" — where hand momentum commits
 * to a word before conscious execution.
 */
export class LinguisticPrior {
  /**
   * @param {Object} [options]
   * @param {Record<string, Record<string, number>>} [options.customTransitions] Custom n-gram matrix
   */
  constructor(options = {}) {
    this.transitions = options.customTransitions || COMMON_BIGRAMS;
  }

  /**
   * Calculates the conditional probability of next character given previous character.
   * @param {string} prevChar
   * @param {string} nextChar
   * @returns {number} Probability (0.0 to 1.0)
   */
  getTransitionProbability(prevChar, nextChar) {
    if (!prevChar || !nextChar) return 0.038; // Default 1/26 uniform base
    const p = prevChar.toUpperCase();
    const n = nextChar.toUpperCase();

    if (this.transitions[p] && this.transitions[p][n] !== undefined) {
      return this.transitions[p][n];
    }
    return 0.02; // Base Laplace smoothing prior
  }

  /**
   * Computes Shannon Surprisal of an observed transition: S(x) = -log2(P(x))
   * Higher values indicate unexpected, erratic, or non-linguistic jumps.
   * 
   * @param {string} prevChar
   * @param {string} nextChar
   * @returns {number} Surprisal in bits
   */
  getSurprisalBits(prevChar, nextChar) {
    const p = Math.max(0.001, this.getTransitionProbability(prevChar, nextChar));
    return Number((-Math.log2(p)).toFixed(2));
  }

  /**
   * Predicts top candidate next letters given current string history.
   * @param {string} sequence
   * @param {number} [topN=3]
   * @returns {Array<{ letter: string, probability: number }>}
   */
  predictNextCandidates(sequence, topN = 3) {
    if (!sequence || sequence.length === 0) return [];
    const lastChar = sequence[sequence.length - 1].toUpperCase();
    const transitions = this.transitions[lastChar] || {};

    const candidates = Object.entries(transitions)
      .map(([letter, prob]) => ({ letter, probability: prob }))
      .sort((a, b) => b.probability - a.probability);

    return candidates.slice(0, topN);
  }

  /**
   * Evaluates if current planchette velocity vector (vx, vy) aligns with the vector
   * pointing towards a linguistically predicted candidate letter before arrival.
   * 
   * @param {{ x: number, y: number, vx: number, vy: number }} currentKinematics
   * @param {string} lastConfirmedLetter
   * @returns {{ hasPrecommitment: boolean, committedLetter: string|null, angularAlignment: number }}
   */
  detectSemanticCommitment(currentKinematics, lastConfirmedLetter) {
    const candidates = this.predictNextCandidates(lastConfirmedLetter, 2);
    if (candidates.length === 0) {
      return { hasPrecommitment: false, committedLetter: null, angularAlignment: 0 };
    }

    const { x, y, vx, vy } = currentKinematics;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 3.0) { // Below active movement threshold
      return { hasPrecommitment: false, committedLetter: null, angularAlignment: 0 };
    }

    for (const cand of candidates) {
      const targetObj = ouijaBoardMapping.letters.find(l => l.letter === cand.letter);
      if (!targetObj) continue;

      // Target vector
      const dx = targetObj.position.x - x;
      const dy = targetObj.position.y - y;
      const targetDist = Math.sqrt(dx * dx + dy * dy);

      if (targetDist > 1.5 && targetDist < 12.0) {
        // Compute cosine similarity between velocity vector and target direction
        const dot = (vx * dx + vy * dy);
        const cosSim = dot / (speed * targetDist);

        if (cosSim > 0.85) { // High directional alignment (> 85%)
          return {
            hasPrecommitment: true,
            committedLetter: cand.letter,
            angularAlignment: Number(cosSim.toFixed(3)),
            targetDistanceCm: Number(targetDist.toFixed(2)),
            linguisticPrior: cand.probability
          };
        }
      }
    }

    return { hasPrecommitment: false, committedLetter: null, angularAlignment: 0 };
  }
}
