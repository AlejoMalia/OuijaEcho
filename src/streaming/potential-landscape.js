import { ouijaBoardMapping } from '../ouija-board-mapping.js';
import { getAllBoardTargets } from '../core/geometry.js';

/**
 * PotentialLandscape: Models the Ouija space as a continuous energy landscape U(x, y).
 * 
 * Instead of computing artificial collisions, board elements act as gravitational/potential wells.
 * The planchette moves under Langevin dynamics:
 * 
 *   m * d^2x/dt^2 = - gamma * v - grad(U(x)) + xi_human(t) + xi_ambient(t)
 * 
 * The system operates autonomously: the particle naturally decants and resonates
 * in the attractor well of lowest energy.
 */
export class PotentialLandscape {
  /**
   * @param {Object} [options]
   * @param {number} [options.damping=3.5] Friction coefficient (gamma)
   * @param {number} [options.wellDepth=8.0] Attraction depth for targets (w_i)
   * @param {Array<Object>} [options.customAttractors] Custom attractor wells { id, name, position: {x, y}, radius }
   */
  constructor(options = {}) {
    this.damping = options.damping ?? 3.5;
    this.wellDepth = options.wellDepth ?? 8.0;
    this.attractors = options.customAttractors || getAllBoardTargets();
    this.boardWidth = ouijaBoardMapping.boardSize.width;   // 37.0 cm
    this.boardHeight = ouijaBoardMapping.boardSize.height; // 24.0 cm
  }

  /**
   * Calculates the continuous scalar potential energy U(x, y) at any coordinate.
   * U(x) = - sum_i w_i * exp( - ||x - c_i||^2 / (2 * sigma_i^2) )
   * 
   * @param {{ x: number, y: number }} pos
   * @returns {number} Potential energy value
   */
  getPotential(pos) {
    let u = 0;
    for (const att of this.attractors) {
      const dx = pos.x - att.position.x;
      const dy = pos.y - att.position.y;
      const distSq = dx * dx + dy * dy;
      const sigma = att.radius || 1.5;
      const gaussian = Math.exp(-distSq / (2 * sigma * sigma));
      u -= this.wellDepth * gaussian;
    }
    return Number(u.toFixed(4));
  }

  /**
   * Calculates the analytical gradient vector -grad(U(x, y)) = (-dU/dx, -dU/dy).
   * Represents the natural physical attraction force pulling the planchette into the nearest well.
   * 
   * -dU/dx = - sum_i [ w_i * exp(-dist^2 / 2*sigma^2) * ((x - c_x) / sigma^2) ]
   * 
   * @param {{ x: number, y: number }} pos
   * @returns {{ fx: number, fy: number, magnitude: number }} Attractive force vector
   */
  getAttractionForce(pos) {
    let fx = 0;
    let fy = 0;

    for (const att of this.attractors) {
      const dx = pos.x - att.position.x;
      const dy = pos.y - att.position.y;
      const distSq = dx * dx + dy * dy;
      const sigma = att.radius || 1.5;
      const sigmaSq = sigma * sigma;
      const gaussian = Math.exp(-distSq / (2 * sigmaSq));

      // Gradient of Gaussian well pulls inward towards attractor center
      const factor = (this.wellDepth / sigmaSq) * gaussian;
      fx -= factor * dx;
      fy -= factor * dy;
    }

    const magnitude = Math.sqrt(fx * fx + fy * fy);
    return {
      fx: Number(fx.toFixed(4)),
      fy: Number(fy.toFixed(4)),
      magnitude: Number(magnitude.toFixed(4))
    };
  }

  /**
   * Simulates a single time step dt of Langevin Dynamics:
   * dx/dt = v
   * dv/dt = -gamma * v - grad(U(x)) + xi(t)
   * 
   * @param {Object} state - Current particle state { x, y, vx, vy }
   * @param {number} [dt=0.016] - Time delta in seconds (default 16ms / 60Hz)
   * @param {Object} [externalForces] - { humanFx, humanFy, noiseMagnitude }
   * @returns {Object} Updated physical state
   */
  step(state, dt = 0.016, externalForces = {}) {
    const { x, y, vx = 0, vy = 0 } = state;
    const humanFx = externalForces.humanFx || 0;
    const humanFy = externalForces.humanFy || 0;
    const noiseMag = externalForces.noiseMagnitude || 0.2; // Stochastic brownian tremor

    // Natural landscape force
    const landscapeForce = this.getAttractionForce({ x, y });

    // Stochastic brownian noise (Stochastic Resonance)
    const noiseX = (Math.random() - 0.5) * 2 * noiseMag;
    const noiseY = (Math.random() - 0.5) * 2 * noiseMag;

    // Net acceleration: a = F_landscape + F_human + Noise - Friction * v
    const ax = landscapeForce.fx + humanFx + noiseX - this.damping * vx;
    const ay = landscapeForce.fy + humanFy + noiseY - this.damping * vy;

    // Semi-implicit Euler integration
    let newVx = vx + ax * dt;
    let newVy = vy + ay * dt;
    let newX = x + newVx * dt;
    let newY = y + newVy * dt;

    // Board physical boundary collision (elastic bounce)
    if (newX < 0) { newX = 0; newVx = -newVx * 0.3; }
    if (newX > this.boardWidth) { newX = this.boardWidth; newVx = -newVx * 0.3; }
    if (newY < 0) { newY = 0; newVy = -newVy * 0.3; }
    if (newY > this.boardHeight) { newY = this.boardHeight; newVy = -newVy * 0.3; }

    const speed = Math.sqrt(newVx * newVx + newVy * newVy);
    const potential = this.getPotential({ x: newX, y: newY });
    const kineticEnergy = 0.5 * speed * speed;
    const totalEnergy = kineticEnergy + potential;

    return {
      x: Number(newX.toFixed(3)),
      y: Number(newY.toFixed(3)),
      vx: Number(newVx.toFixed(3)),
      vy: Number(newVy.toFixed(3)),
      speed: Number(speed.toFixed(3)),
      potentialEnergy: potential,
      kineticEnergy: Number(kineticEnergy.toFixed(3)),
      totalEnergy: Number(totalEnergy.toFixed(3)),
      landscapeForce
    };
  }

  /**
   * Generates a 2D grid matrix of the vector field for real-time visualization.
   * 
   * @param {number} [gridCols=15]
   * @param {number} [gridRows=10]
   * @returns {Array<{ x: number, y: number, fx: number, fy: number, potential: number }>}
   */
  generateVectorField(gridCols = 15, gridRows = 10) {
    const field = [];
    const stepX = this.boardWidth / gridCols;
    const stepY = this.boardHeight / gridRows;

    for (let r = 0; r <= gridRows; r++) {
      for (let c = 0; c <= gridCols; c++) {
        const x = Number((c * stepX).toFixed(2));
        const y = Number((r * stepY).toFixed(2));
        const force = this.getAttractionForce({ x, y });
        const potential = this.getPotential({ x, y });
        field.push({ x, y, fx: force.fx, fy: force.fy, potential });
      }
    }

    return field;
  }
}
