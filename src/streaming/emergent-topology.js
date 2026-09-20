/**
 * EmergentTopology: Self-Organizing Attractor Topology for Boardless Projections.
 * 
 * Enables OuijaEcho to operate WITHOUT a predefined board layout.
 * Uses online competitive Hebbian learning (inspired by Kohonen Self-Organizing Maps):
 * - Identifies natural stabilization basins where human kinetic energy drops towards zero.
 * - Clusters emergent attractors dynamically in streaming.
 * - Discovers the symbolic geometry organically from the interaction flow.
 */
export class EmergentTopology {
  /**
   * @param {Object} [options]
   * @param {number} [options.learningRate=0.15] Hebbian update factor eta
   * @param {number} [options.mergeRadiusCm=2.2] Minimum separation between distinct emergent attractors
   * @param {number} [options.speedThresholdCmS=3.0] Velocity threshold below which movement qualifies as stabilization
   */
  constructor(options = {}) {
    this.learningRate = options.learningRate ?? 0.15;
    this.mergeRadius = options.mergeRadiusCm ?? 2.2;
    this.speedThreshold = options.speedThresholdCmS ?? 3.0;

    this.nodes = []; // Array of emergent attractors { id, x, y, weight, hits }
  }

  /**
   * Ingests a streaming kinematic data point and updates emergent attractor nodes.
   * 
   * @param {{ x: number, y: number, speed: number }} point
   * @returns {{ nearestNode: Object|null, isNewAttractor: boolean }}
   */
  feed(point) {
    if (point.speed > this.speedThreshold) {
      // In high-velocity transit: does not reinforce attractors
      return { nearestNode: null, isNewAttractor: false };
    }

    const { x, y } = point;

    // Find closest existing node
    let bestNode = null;
    let minDist = Infinity;

    for (const node of this.nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        bestNode = node;
      }
    }

    // If within merge radius, update node position towards the new point (Hebbian plasticity)
    if (bestNode && minDist <= this.mergeRadius) {
      bestNode.x = Number((bestNode.x + this.learningRate * (x - bestNode.x)).toFixed(3));
      bestNode.y = Number((bestNode.y + this.learningRate * (y - bestNode.y)).toFixed(3));
      bestNode.hits++;
      bestNode.weight = Number((bestNode.weight + 0.1).toFixed(2));

      return { nearestNode: bestNode, isNewAttractor: false };
    }

    // Otherwise, create a new emergent attractor node
    const newNodeId = `ATTRACTOR_${this.nodes.length + 1}`;
    const newNode = {
      id: newNodeId,
      name: newNodeId,
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      weight: 1.0,
      hits: 1
    };

    this.nodes.push(newNode);
    return { nearestNode: newNode, isNewAttractor: true };
  }

  /**
   * Returns all discovered emergent attractor coordinates sorted by stability/hits.
   * @returns {Array<Object>}
   */
  getAttractors() {
    return [...this.nodes].sort((a, b) => b.hits - a.hits);
  }

  /**
   * Clears emergent topology.
   */
  reset() {
    this.nodes = [];
  }
}
