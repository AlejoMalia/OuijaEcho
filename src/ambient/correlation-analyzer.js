/**
 * Correlation Analyzer for OuijaEcho.
 * Synchronizes and cross-references planchette kinematic dynamics against
 * surrounding environmental disturbances.
 * 
 * Determines whether trajectory disruptions, sudden jerk spikes, or target
 * departures were exogenously induced by ambient shocks (startle reflex, table bump, noise)
 * or represent purely endogenous ideomotor movement.
 */
export class CorrelationAnalyzer {
  /**
   * @param {Object} [options]
   * @param {number} [options.reflexWindowMinMs=30] Minimum biological latency for motor reaction (ms)
   * @param {number} [options.reflexWindowMaxMs=450] Maximum window for stimulus-response coupling (ms)
   * @param {number} [options.jerkSpikeThreshold=80] Jerk threshold in cm/s³ indicating abrupt motor perturbation
   */
  constructor(options = {}) {
    this.reflexWindowMinMs = options.reflexWindowMinMs ?? 30;
    this.reflexWindowMaxMs = options.reflexWindowMaxMs ?? 450;
    this.jerkSpikeThreshold = options.jerkSpikeThreshold ?? 80;
  }

  /**
   * Analyzes synchronized kinematic history and environmental events.
   * 
   * @param {Array<Object>} kinematicFrames
   * @param {Array<Object>} environmentalEvents
   * @returns {Object} Comprehensive correlation report
   */
  analyze(kinematicFrames = [], environmentalEvents = []) {
    if (kinematicFrames.length === 0) {
      return {
        totalKinematicFrames: 0,
        totalEnvironmentalEvents: 0,
        correlatedIncidents: [],
        environmentalCouplingIndex: 0,
        isolationScore: 1.0,
        purityCategory: 'EMPTY'
      };
    }

    // Identify kinematic jerk/perturbation incidents
    const kinematicPerturbations = [];
    for (let i = 1; i < kinematicFrames.length; i++) {
      const f = kinematicFrames[i];
      if (f.jerk >= this.jerkSpikeThreshold) {
        kinematicPerturbations.push({
          timestamp: f.timestamp,
          frameIndex: i,
          jerk: f.jerk,
          speed: f.speed,
          nearestTarget: f.nearestTarget,
          x: f.x,
          y: f.y
        });
      }
    }

    // Match each kinematic perturbation against preceding environmental events
    const coupledIncidents = [];
    const endogenousPerturbations = [];

    for (const kp of kinematicPerturbations) {
      // Find candidate ambient event in the reflex window [kp.timestamp - max, kp.timestamp - min]
      const matchingEnvEvents = environmentalEvents.filter(ev => {
        const delta = kp.timestamp - ev.timestamp;
        return delta >= this.reflexWindowMinMs && delta <= this.reflexWindowMaxMs;
      });

      if (matchingEnvEvents.length > 0) {
        coupledIncidents.push({
          kinematicIncident: kp,
          ambientTriggers: matchingEnvEvents,
          latencyMs: kp.timestamp - matchingEnvEvents[0].timestamp,
          classification: 'ENVIRONMENTAL_ARTIFACT'
        });
      } else {
        endogenousPerturbations.push({
          kinematicIncident: kp,
          classification: 'ENDOGENOUS_IDEOMOTOR'
        });
      }
    }

    // Calculate Isolation Score & Coupling Index
    const totalPerturbations = kinematicPerturbations.length;
    const coupledCount = coupledIncidents.length;
    const couplingIndex = totalPerturbations > 0 ? Number((coupledCount / totalPerturbations).toFixed(3)) : 0;
    const isolationScore = Number((1 - couplingIndex).toFixed(3));

    let purityCategory = 'PRISTINE';
    if (couplingIndex > 0.6) purityCategory = 'HEAVILY_DISTURBED';
    else if (couplingIndex > 0.3) purityCategory = 'MODERATELY_COUPLED';
    else if (couplingIndex > 0.05) purityCategory = 'LIGHTLY_PERTURBED';

    return {
      totalKinematicFrames: kinematicFrames.length,
      totalEnvironmentalEvents: environmentalEvents.length,
      totalKinematicPerturbations: totalPerturbations,
      coupledArtifactCount: coupledCount,
      endogenousPerturbationCount: endogenousPerturbations.length,
      environmentalCouplingIndex: couplingIndex,
      isolationScore: isolationScore,
      purityCategory,
      coupledIncidents,
      endogenousPerturbations: endogenousPerturbations.slice(0, 10) // Top 10 for inspectability
    };
  }
}
