import { ouijaBoardMapping } from '../ouija-board-mapping.js';

/**
 * Visualizer module for OuijaEcho.
 * Generates an interactive, standalone HTML + SVG dashboard
 * visualizing kinematics, spatial trajectory, dwell fixations, and ambient disturbances.
 */
export function generateHtmlReport(sessionData = {}, options = {}) {
  const title = options.title || 'OuijaEcho Scientific Session Visualizer';
  const board = ouijaBoardMapping.boardSize;
  const frames = sessionData.kinematicFrames || [];
  const dwells = (sessionData.kinematics && sessionData.kinematics.dwellEvents) || [];
  const ambientEvents = (sessionData.environment && sessionData.environment.events) || [];
  const summary = sessionData.scientificSummary || {};

  // Build SVG path points for trajectory
  const pathPoints = frames.map(f => `${f.x},${f.y}`).join(' ');

  // Build SVG circles for all board targets
  const targetElementsSvg = [];

  // Affirmation & Negation
  const aff = ouijaBoardMapping.affirmation;
  targetElementsSvg.push(`<circle cx="${aff.position.x}" cy="${aff.position.y}" r="${aff.radius}" class="board-target target-cmd" />`);
  targetElementsSvg.push(`<text x="${aff.position.x}" y="${aff.position.y + 0.4}" class="board-label">${aff.element}</text>`);

  const neg = ouijaBoardMapping.negation;
  targetElementsSvg.push(`<circle cx="${neg.position.x}" cy="${neg.position.y}" r="${neg.radius}" class="board-target target-cmd" />`);
  targetElementsSvg.push(`<text x="${neg.position.x}" y="${neg.position.y + 0.4}" class="board-label">${neg.element}</text>`);

  // Letters
  for (const l of ouijaBoardMapping.letters) {
    targetElementsSvg.push(`<circle cx="${l.position.x}" cy="${l.position.y}" r="${l.radius}" class="board-target target-letter" />`);
    targetElementsSvg.push(`<text x="${l.position.x}" y="${l.position.y + 0.4}" class="board-label">${l.letter}</text>`);
  }

  // Numbers
  for (const n of ouijaBoardMapping.numbers) {
    targetElementsSvg.push(`<circle cx="${n.position.x}" cy="${n.position.y}" r="${n.radius}" class="board-target target-number" />`);
    targetElementsSvg.push(`<text x="${n.position.x}" y="${n.position.y + 0.4}" class="board-label">${n.number}</text>`);
  }

  // Farewell
  const fare = ouijaBoardMapping.farewell;
  targetElementsSvg.push(`<circle cx="${fare.position.x}" cy="${fare.position.y}" r="${fare.radius}" class="board-target target-cmd" />`);
  targetElementsSvg.push(`<text x="${fare.position.x}" y="${fare.position.y + 0.5}" class="board-label">${fare.element}</text>`);

  // Fixation Dwells SVG
  const dwellSvg = dwells.map(d => {
    const r = Math.min(3.5, 0.8 + (d.durationMs / 500));
    return `<circle cx="${d.position.x}" cy="${d.position.y}" r="${r}" class="dwell-marker" />
            <title>Target: ${d.target} (${d.durationMs}ms)</title>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.2);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --warning: #f59e0b;
      --danger: #ef4444;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
    h1 { font-size: 1.8rem; color: var(--accent); display: flex; align-items: center; gap: 8px; }
    .subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    .card { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border); padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .card-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: var(--accent); }
    .svg-container { width: 100%; border-radius: 8px; background: #020617; border: 1px solid var(--border); overflow: hidden; }
    svg { width: 100%; height: auto; display: block; }
    .board-bg { fill: #090d16; stroke: #1e293b; stroke-width: 0.2; }
    .board-target { fill: #1e293b; stroke: #475569; stroke-width: 0.15; opacity: 0.8; }
    .target-cmd { fill: #1e1b4b; stroke: #6366f1; }
    .board-label { fill: #cbd5e1; font-size: 0.9px; text-anchor: middle; font-weight: bold; pointer-events: none; }
    .trajectory-path { fill: none; stroke: var(--accent); stroke-width: 0.25; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 1px var(--accent)); }
    .dwell-marker { fill: rgba(245, 158, 11, 0.4); stroke: #f59e0b; stroke-width: 0.1; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .metric-box { background: #0f172a; border-radius: 8px; padding: 12px; border: 1px solid var(--border); }
    .metric-val { font-size: 1.3rem; font-weight: 700; color: var(--text); }
    .metric-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
    .badge-pristine { background: rgba(16, 185, 129, 0.2); color: var(--success); }
    .badge-disturbed { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .table-container { margin-top: 16px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🧿 ${title}</h1>
      <p class="subtitle">Computational Ideomotor Kinematics & Ambient Disturbance Synthesis</p>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-title">Planchette Trajectory & Spatial Attraction Basins</div>
        <div class="svg-container">
          <svg viewBox="0 0 ${board.width} ${board.height}" preserveAspectRatio="xMidYMid meet">
            <rect x="0" y="0" width="${board.width}" height="${board.height}" class="board-bg" />
            ${targetElementsSvg.join('\n')}
            <polyline points="${pathPoints}" class="trajectory-path" />
            ${dwellSvg}
          </svg>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Scientific Telemetry & Ambient Score</div>
        <div class="metric-grid">
          <div class="metric-box">
            <div class="metric-val">${summary.movementProfile?.tortuosityIndex || '1.0'}</div>
            <div class="metric-label">Tortuosity Index</div>
          </div>
          <div class="metric-box">
            <div class="metric-val">${summary.movementProfile?.logDimensionlessJerk || '0'}</div>
            <div class="metric-label">Log Norm. Jerk</div>
          </div>
          <div class="metric-box">
            <div class="metric-val">${summary.movementProfile?.meanSpeedCmS || '0'} cm/s</div>
            <div class="metric-label">Mean Velocity</div>
          </div>
          <div class="metric-box">
            <div class="metric-val">${summary.environmentalCoupling?.isolationScore ?? '1.0'}</div>
            <div class="metric-label">Isolation Score</div>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">Purity Assessment:</div>
          <span class="badge ${summary.environmentalCoupling?.purityCategory === 'PRISTINE' ? 'badge-pristine' : 'badge-disturbed'}">
            ${summary.environmentalCoupling?.purityCategory || 'PRISTINE'}
          </span>
        </div>

        <div style="margin-top: 16px;">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">Detected Sequence:</div>
          <div style="font-size: 1.1rem; font-weight: bold; color: var(--accent);">
            ${summary.symbolicProfile?.sequence?.length ? summary.symbolicProfile.sequence.join(' → ') : 'None'}
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Target Dwells & Environmental Event Correlation</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Dwell Duration</th>
              <th>Max Probability</th>
              <th>Coincident Ambient Spikes</th>
            </tr>
          </thead>
          <tbody>
            ${dwells.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No dwell events recorded</td></tr>' : 
              dwells.map(d => {
                const spikes = ambientEvents.filter(e => Math.abs(e.timestamp - d.enterTime) <= 500);
                const spikeStr = spikes.length > 0 
                  ? spikes.map(s => '<span style="color: var(--danger)">' + s.type + ' (' + s.value + s.unit + ')</span>').join(', ')
                  : '<span style="color: var(--success)">None (Undisturbed)</span>';
                return '<tr><td><strong>' + d.target + '</strong></td><td>' + d.durationMs + ' ms</td><td>' + (d.maxProbability * 100).toFixed(1) + '%</td><td>' + spikeStr + '</td></tr>';
              }).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;

  return html;
}
