/**
 * Exporter module for OuijaEcho.
 * Generates research-ready data formats:
 * - Time-Series CSV (for Python / Pandas / R / SPSS)
 * - Dwell / Event CSV
 * - JSON-LD (Open Science reproducible schema)
 * - Markdown Summary Report
 */

/**
 * Exports data to CSV string format.
 * @param {Object} sessionData
 * @param {'timeseries'|'dwells'|'ambient'|'correlation'} [type='timeseries']
 * @returns {string}
 */
export function exportToCsv(sessionData = {}, type = 'timeseries') {
  if (type === 'timeseries') {
    const frames = sessionData.kinematicFrames || [];
    const ambientSamples = sessionData.ambientSamples || [];
    
    // Map by timestamp or index
    const headers = [
      'timestamp',
      'dt_sec',
      'x_cm',
      'y_cm',
      'vx_cms',
      'vy_cms',
      'speed_cms',
      'ax_cms2',
      'ay_cms2',
      'acceleration_cms2',
      'jerk_cms3',
      'cumulative_dist_cm',
      'nearest_target',
      'top_candidate',
      'top_probability',
      'ambient_noise_db',
      'ambient_light_lux',
      'table_vibration_g',
      'motion_pct'
    ];

    const rows = [headers.join(',')];

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const amb = ambientSamples[i] || {};

      rows.push([
        f.timestamp,
        f.dt ? f.dt.toFixed(4) : '0',
        f.x.toFixed(2),
        f.y.toFixed(2),
        f.vx.toFixed(2),
        f.vy.toFixed(2),
        f.speed.toFixed(2),
        f.ax.toFixed(2),
        f.ay.toFixed(2),
        f.acceleration.toFixed(2),
        f.jerk.toFixed(2),
        f.cumulativeDistance.toFixed(2),
        `"${f.nearestTarget}"`,
        `"${f.topCandidate || ''}"`,
        (f.topProbability || 0).toFixed(4),
        amb.noiseDb !== undefined ? amb.noiseDb : '',
        amb.lightLux !== undefined ? amb.lightLux : '',
        amb.vibrationG !== undefined ? amb.vibrationG : '',
        amb.motionPct !== undefined ? amb.motionPct : ''
      ].join(','));
    }

    return rows.join('\n');
  }

  if (type === 'dwells') {
    const dwells = (sessionData.kinematics && sessionData.kinematics.dwellEvents) || [];
    const headers = ['target', 'enter_time', 'exit_time', 'duration_ms', 'pos_x', 'pos_y', 'max_probability'];
    const rows = [headers.join(',')];

    for (const d of dwells) {
      rows.push([
        `"${d.target}"`,
        d.enterTime,
        d.exitTime,
        d.durationMs,
        d.position.x.toFixed(2),
        d.position.y.toFixed(2),
        (d.maxProbability || 0).toFixed(4)
      ].join(','));
    }

    return rows.join('\n');
  }

  if (type === 'correlation') {
    const coupled = (sessionData.correlation && sessionData.correlation.coupledIncidents) || [];
    const headers = ['kinematic_time', 'jerk_value', 'nearest_target', 'trigger_type', 'trigger_val', 'latency_ms'];
    const rows = [headers.join(',')];

    for (const c of coupled) {
      const kp = c.kinematicIncident;
      const trig = c.ambientTriggers[0] || {};
      rows.push([
        kp.timestamp,
        kp.jerk.toFixed(2),
        `"${kp.nearestTarget}"`,
        `"${trig.type || ''}"`,
        trig.value !== undefined ? trig.value : '',
        c.latencyMs
      ].join(','));
    }

    return rows.join('\n');
  }

  if (type === 'transitions') {
    const transitions = (sessionData.kinematics && sessionData.kinematics.transitionEvents) || [];
    const headers = ['from_target', 'to_target', 'flight_duration_ms', 'distance_cm', 'mean_speed_cms', 'peak_speed_cms', 'hesitation_ms'];
    const rows = [headers.join(',')];

    for (const t of transitions) {
      rows.push([
        `"${t.fromTarget || ''}"`,
        `"${t.toTarget || ''}"`,
        t.flightDurationMs,
        (t.distanceCm || 0).toFixed(2),
        (t.meanSpeedCmS || 0).toFixed(2),
        (t.peakSpeedCmS || 0).toFixed(2),
        t.hesitationMs || 0
      ].join(','));
    }

    return rows.join('\n');
  }

  if (type === 'voids') {
    const voids = (sessionData.kinematics && sessionData.kinematics.voidEvents) || [];
    const headers = ['start_time', 'end_time', 'duration_ms', 'distance_cm', 'mean_speed_cms', 'hesitation_ms', 'from_target', 'to_target'];
    const rows = [headers.join(',')];

    for (const v of voids) {
      rows.push([
        v.startTime,
        v.endTime || '',
        v.durationMs,
        (v.distanceCm || 0).toFixed(2),
        (v.meanSpeedCmS || 0).toFixed(2),
        v.hesitationMs || 0,
        `"${v.fromTarget || ''}"`,
        `"${v.toTarget || ''}"`
      ].join(','));
    }

    return rows.join('\n');
  }

  return '';
}

/**
 * Exports complete session as an Open-Science JSON-LD compliant data object.
 * @param {Object} sessionData
 * @param {Object} [metadata]
 * @returns {string} JSON-LD formatted string
 */
export function exportToJsonLd(sessionData = {}, metadata = {}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: metadata.title || 'OuijaEcho Scientific & Ambient Session',
    description: 'Kinematic trajectory tracking and environmental multimodal recording of ideomotor movement.',
    dateCreated: new Date().toISOString(),
    creator: {
      '@type': 'Person',
      name: metadata.author || 'Alejo Malia'
    },
    variableMeasured: [
      'Planchette Cartesian Position (x, y)',
      'Planchette Velocity and Speed',
      'Planchette Acceleration and Jerk',
      'Target Dwell Times and Probabilities',
      'Ambient Acoustic Pressure (dB)',
      'Ambient Illuminance (Lux)',
      'Table Vibration (g)',
      'Surrounding Motion (%)'
    ],
    scientificSummary: sessionData.scientificSummary || {},
    kinematics: sessionData.kinematics || {},
    environment: sessionData.environment || {},
    correlation: sessionData.correlation || {},
    kinematicFramesCount: (sessionData.kinematicFrames || []).length,
    ambientSamplesCount: (sessionData.ambientSamples || []).length
  };

  return JSON.stringify(jsonLd, null, 2);
}

/**
 * Generates a clean Markdown executive summary of the session.
 * @param {Object} sessionData
 * @returns {string}
 */
export function exportToMarkdown(sessionData = {}) {
  const summary = sessionData.scientificSummary || {};
  const kin = summary.movementProfile || {};
  const sym = summary.symbolicProfile || {};
  const env = summary.environmentalCoupling || {};

  return `# OuijaEcho Scientific Report

## 1. Biomechanical & Motor Profile
- **Duration:** ${kin.totalDurationSeconds || 0} seconds
- **Cumulative Distance:** ${kin.cumulativeDistanceCm || 0} cm
- **Mean Speed:** ${kin.meanSpeedCmS || 0} cm/s (Max: ${kin.maxSpeedCmS || 0} cm/s)
- **Mean Acceleration:** ${kin.meanAccelerationCmS2 || 0} cm/s²
- **Tortuosity Index:** ${kin.tortuosityIndex || 1.0} *(1.0 = straight path; > 1.8 = hesitation/drift)*
- **Log Dimensionless Jerk:** ${kin.logDimensionlessJerk || 0}
- **Motor Classification:** \`${kin.motorControlClassification || 'N/A'}\`

## 2. Symbolic & Linguistic Sequence
- **Detected Characters:** ${sym.sequence && sym.sequence.length ? sym.sequence.join(' → ') : 'None'}
- **Total Characters:** ${sym.totalSymbolsDetected || 0}
- **Shannon Entropy:** ${sym.shannonEntropy ? sym.shannonEntropy.entropyBits : 0} bits (Normalized: ${sym.shannonEntropy ? sym.shannonEntropy.normalizedEntropy : 0})

## 3. Environmental Coupling & Ambient Context
- **Isolation Score:** **${env.isolationScore ?? 1.0} / 1.0**
- **Condition Purity:** \`${env.purityCategory || 'PRISTINE'}\`
- **Ambient Spikes Detected:** ${env.ambientSpikesDetected || 0}
- **Correlated Environmental Artifacts:** ${env.correlatedArtifacts || 0}
`;
}
