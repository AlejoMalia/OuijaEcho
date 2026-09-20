#!/usr/bin/env node

import { argv } from 'node:process';
import fs from 'node:fs';
import readline from 'node:readline';
import {
  OuijaSessionEngine,
  displayMappingTable,
  generatePhraseCoordinates,
  exportToCsv,
  exportToJsonLd,
  exportToMarkdown,
  generateHtmlReport,
  createLabServer,
  AutonomousEmulator
} from './index.js';

const args = argv.slice(2);

const printHelp = () => {
  console.log(`\x1b[1m\x1b[36mOuijaEcho CLI 🧿 — Universal Multimodal Ideomotor Lab\x1b[0m

Usage: $ ouijaecho <command> [options]

Commands:

  session       Start a session (legacy, scientific, or multimodal)
  emulate       Autonomous Langevin physical resonance simulation & streaming reader
  serve         Launch the local Web Laboratory Dashboard in your browser
  generator     Run the phrase-to-coordinate generator
  analyze       Analyze an existing session JSON file
  report        Generate an interactive HTML/SVG visualization

Options for 'session':
  --scientific            Enable continuous kinematics (velocity, acceleration, jerk)
  --ambient               Enable ambient environmental monitoring (noise, light, vibrations)
  --multi-user            Enable dual-participant motor dominance analysis
  --linguistic            Enable real-time linguistic next-letter predictions
  --duration <sec>        Session duration in seconds (default: 3)
  --export <format>       Export results (csv, json, md, html)
  --out <filename>        Output file path for export

Options for 'serve':
  --port <num>            HTTP port for local laboratory dashboard (default: 3000)

Examples:

  $ ouijaecho session
  $ ouijaecho session --scientific --ambient --duration 4
  $ ouijaecho session --scientific --ambient --export html --out docs/session_report.html
  $ ouijaecho serve --port 3000
  $ ouijaecho generator
`);
};

if (args.includes('serve')) {
  const portIdx = args.indexOf('--port');
  const port = portIdx !== -1 && args[portIdx + 1] ? parseInt(args[portIdx + 1]) : 3000;

  const lab = createLabServer({ port });
  lab.listen().then(url => {
    console.log(`\n\x1b[1m\x1b[32m🧿 OuijaEcho Research Laboratory is live!\x1b[0m`);
    console.log(`\x1b[36m➜ Open your browser at:\x1b[0m \x1b[1m${url}\x1b[0m`);
    console.log(`\nModes available in Web UI:`);
    console.log(`  • 🖱️ Mouse / Touch Interactive Board`);
    console.log(`  • 🎙️ Web Audio Ambient Decibel Meter`);
    console.log(`  • 📷 Webcam Homography Perspective Tracking`);
    console.log(`  • 📖 Linguistic Bigram Predictions`);
    console.log(`\nPress Ctrl+C to stop the server.\n`);
  });

} else if (args.includes('emulate')) {
  const isBoardless = args.includes('--boardless');
  const durIdx = args.indexOf('--duration');
  const durationSec = durIdx !== -1 && args[durIdx + 1] ? parseFloat(args[durIdx + 1]) : 4;

  const emulator = new AutonomousEmulator({
    boardlessMode: isBoardless,
    noiseMagnitude: 0.45
  });

  console.log(`\n\x1b[1m\x1b[36m--- Starting Autonomous Resonance Emulator (${durationSec}s) ---\x1b[0m`);
  console.log(`Mode: ${isBoardless ? 'Boardless Projection (Emergent Hebbian Topology)' : 'Standard Continuous Potential Landscape'}`);
  console.log(`Listening to reactive event stream in real-time...\n`);
  process.stdout.write('Decoded Stream: ');

  emulator.on('token', t => {
    if (t.fromCharacter) {
      process.stdout.write(`\x1b[90m--(${t.flightDurationMs}ms in void, ${t.voidDistanceCm}cm)-->\x1b[0m `);
    }
    process.stdout.write(`\x1b[1m\x1b[32m[${t.character}]\x1b[0m `);
  });

  emulator.start();

  setTimeout(() => {
    const res = emulator.stop();
    console.log(`\n\n\x1b[1m\x1b[32m✓ Emulation completed.\x1b[0m`);
    console.log(`Streamed Output: \x1b[1m${res.text || '(Particle in continuous transit)'}\x1b[0m`);
    if (isBoardless) {
      console.log(`Discovered Emergent Attractors: ${res.emergentNodes.length}`);
    }

    const stats = res.timingStats;
    if (stats) {
      console.log(`\n\x1b[1m⏱️  TEMPORAL & VOID ANALYSIS (TIEMPOS ENTRE LETRAS Y VACÍOS):\x1b[0m`);
      console.log(`   Total Duration       : ${stats.totalDurationSeconds} s`);
      console.log(`   Letters / Symbols    : ${stats.totalTokens}`);
      console.log(`   Dwell (Letters) Time : ${stats.totalDwellTimeMs} ms (${stats.dwellRatioPercent}%)`);
      console.log(`   Void (Transit) Time  : ${stats.totalVoidTimeMs} ms (${stats.voidRatioPercent}%)`);
      console.log(`   Mean Flight Time(ISI): ${stats.meanInterSymbolIntervalMs} ms`);
      console.log(`   Hesitation in Void   : ${stats.totalVoidHesitationMs} ms`);

      if (stats.tokenHistory && stats.tokenHistory.length > 0) {
        console.log(`\n   \x1b[1mDetailed Letter Transitions:\x1b[0m`);
        for (const tok of stats.tokenHistory) {
          const from = tok.fromCharacter ? `From '${tok.fromCharacter}'` : 'Start';
          console.log(`     • [${tok.character}] | Dwell: ${tok.dwellMs}ms | Flight from prev: ${tok.flightDurationMs}ms | Void Dist: ${tok.voidDistanceCm}cm`);
        }
      }
    }
  }, durationSec * 1000);

} else if (args.includes('session')) {
  const isScientific = args.includes('--scientific');
  const isAmbient = args.includes('--ambient');
  const isMultiUser = args.includes('--multi-user');
  const isLinguistic = args.includes('--linguistic');
  
  const durIdx = args.indexOf('--duration');
  const durationSec = durIdx !== -1 && args[durIdx + 1] ? parseFloat(args[durIdx + 1]) : 3;

  const expIdx = args.indexOf('--export');
  const exportFormat = expIdx !== -1 && args[expIdx + 1] ? args[expIdx + 1].toLowerCase() : null;

  const outIdx = args.indexOf('--out');
  const outputFile = outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1] : null;

  // Realistic trajectory simulation: Moves through YES -> D -> 4 -> NO -> Mute Zone with micro-tremors
  let step = 0;
  const simulatedWaypoints = [
    { x: 8.0, y: 3.5 },   // YES
    { x: 8.1, y: 3.6 },
    { x: 10.0, y: 4.8 },  // Transition
    { x: 12.0, y: 6.0 },  // D
    { x: 12.1, y: 6.05 },
    { x: 13.5, y: 11.2 }, // Transition
    { x: 15.0, y: 16.5 }, // 4
    { x: 22.0, y: 10.0 }, // Transition
    { x: 29.0, y: 3.5 },  // NO
    { x: 1.0, y: 1.0 }    // Mute Zone
  ];

  function getCoords() {
    const target = simulatedWaypoints[Math.min(step, simulatedWaypoints.length - 1)];
    step++;
    const jitterX = (Math.random() - 0.5) * 0.08;
    const jitterY = (Math.random() - 0.5) * 0.08;
    return { x: Number((target.x + jitterX).toFixed(2)), y: Number((target.y + jitterY).toFixed(2)) };
  }

  const engine = new OuijaSessionEngine({
    sampleRateHz: isScientific ? 25 : 10,
    minDwellTimeMs: 150,
    enableMultiUser: isMultiUser,
    enableLinguisticPrior: isLinguistic
  });

  let tick = 0;
  function getAmbient() {
    tick++;
    const injectSpike = isAmbient && (tick === 12);
    return engine.environment.generateSimulatedFrame({
      injectSpike,
      spikeType: 'noise'
    });
  }

  console.log(`\n\x1b[1m\x1b[32m--- Starting OuijaEcho Session (${durationSec}s) ---\x1b[0m`);
  if (isScientific) console.log('✓ Kinematic Tracking active (Velocity, Acceleration, Jerk, Dwell Times)');
  if (isAmbient) console.log('✓ Environmental Compilation active (Acoustic, Optical, Vibrational)');
  if (isMultiUser) console.log('✓ Multi-User Dynamics active (Motor Dominance Index)');
  if (isLinguistic) console.log('✓ Linguistic Prior active (Markov Next-Letter Predictor)');

  const stopSession = engine.start(
    getCoords,
    isAmbient ? getAmbient : undefined
  );

  engine.on('target_change', ev => {
    console.log(`  🎯 Target transition: \x1b[1m${ev.currentTarget}\x1b[0m at (${ev.position.x}, ${ev.position.y})`);
  });

  if (isAmbient) {
    engine.on('ambient_spike', anom => {
      console.log(`  ⚠️  \x1b[33mAmbient Anomaly:\x1b[0m ${anom.type} (${anom.value} ${anom.unit})`);
    });
  }

  if (isLinguistic) {
    engine.on('semantic_commitment', comm => {
      console.log(`  📖 \x1b[35mSemantic Commitment:\x1b[0m Pre-committed towards letter '${comm.committedLetter}' (Dist: ${comm.targetDistanceCm}cm)`);
    });
  }

  setTimeout(() => {
    const results = stopSession();
    console.log(`\n\x1b[1m\x1b[32m--- Session Finished ---\x1b[0m\n`);

    if (!isScientific && !isAmbient) {
      console.log("Final Session Target Transitions:");
      console.log(results.kinematics.dwellEvents.map(d => ({
        element: d.target,
        durationMs: d.durationMs,
        position: d.position
      })));
      return;
    }

    const summary = results.scientificSummary;
    console.log('\x1b[1m📊 BIOMECHANICAL & KINEMATIC PROFILE:\x1b[0m');
    console.log(`   Cumulative Distance : ${summary.movementProfile.cumulativeDistanceCm} cm`);
    console.log(`   Mean Velocity       : ${summary.movementProfile.meanSpeedCmS} cm/s (Max: ${summary.movementProfile.maxSpeedCmS} cm/s)`);
    console.log(`   Mean Acceleration   : ${summary.movementProfile.meanAccelerationCmS2} cm/s²`);
    console.log(`   Tortuosity Index    : ${summary.movementProfile.tortuosityIndex}`);
    console.log(`   Log Dim. Jerk       : ${summary.movementProfile.logDimensionlessJerk} [${summary.movementProfile.motorControlClassification}]`);

    if (summary.temporalProfile) {
      const tp = summary.temporalProfile;
      console.log('\n\x1b[1m⏱️  TEMPORAL & INTER-LETTER PROFILE (Tiempos entre letras y vacíos):\x1b[0m');
      console.log(`   Total Dwell Time    : ${tp.totalDwellTimeMs} ms (${tp.dwellRatioPercent}%)`);
      console.log(`   Total Void Time     : ${tp.totalVoidTimeMs} ms (${tp.voidRatioPercent}%)`);
      console.log(`   Mean Flight Time(ISI): ${tp.meanInterSymbolIntervalMs} ms`);
      console.log(`   Mean Target Dwell   : ${tp.meanDwellTimeMs} ms`);
      console.log(`   Hesitation in Void  : ${tp.totalHesitationInVoidMs} ms (${(tp.cognitiveHesitationRatio * 100).toFixed(1)}% of void time)`);
    }

    if (isAmbient) {
      console.log('\n\x1b[1m🌿 AMBIENT & ENVIRONMENTAL CORRELATION:\x1b[0m');
      console.log(`   Isolation Score     : ${summary.environmentalCoupling.isolationScore} / 1.0`);
      console.log(`   Purity Category     : ${summary.environmentalCoupling.purityCategory}`);
      console.log(`   Ambient Shocks      : ${summary.environmentalCoupling.ambientSpikesDetected}`);
      console.log(`   Correlated Artifacts: ${summary.environmentalCoupling.correlatedArtifacts}`);
    }

    if (results.multiUser) {
      console.log('\n\x1b[1m👥 MULTI-USER DYNAMICS:\x1b[0m');
      console.log(`   Motor Dominance     : ${results.multiUser.motorDominanceIndex} [${results.multiUser.classification}]`);
      console.log(`   Interpersonal Coherence: ${results.multiUser.interpersonalSynchrony}`);
    }

    if (exportFormat) {
      let content = '';
      let defaultName = `session_export.${exportFormat}`;

      if (exportFormat === 'csv') content = exportToCsv(results, 'timeseries');
      else if (exportFormat === 'json') content = exportToJsonLd(results);
      else if (exportFormat === 'md') content = exportToMarkdown(results);
      else if (exportFormat === 'html') content = generateHtmlReport(results);
      else {
        content = exportToJsonLd(results);
        defaultName = 'session_export.json';
      }

      const dest = outputFile || defaultName;
      fs.writeFileSync(dest, content, 'utf8');
      console.log(`\n\x1b[1m\x1b[36m✓ Export saved successfully to:\x1b[0m ${dest}`);
    }
  }, durationSec * 1000);

} else if (args.includes('generator')) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('');
  console.log('\x1b[1m\x1b[36mGENERATOR-TEXTOUIJA (Scientific Enhanced)\x1b[0m');
  console.log('');

  rl.question('Write your word or phrase: ', (input) => {
    if (input.trim() === '') {
      console.log('\nNo text entered. Exiting.');
    } else {
      const mappingResults = generatePhraseCoordinates(input);
      displayMappingTable(mappingResults);
    }
    rl.close();
  });

} else if (args.includes('report') || args.includes('analyze')) {
  const fileArg = args.find(a => a.endsWith('.json'));
  if (!fileArg || !fs.existsSync(fileArg)) {
    console.error('Error: Please provide a valid JSON session file to analyze.');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
  if (args.includes('report')) {
    const html = generateHtmlReport(rawData);
    const outIdx = args.indexOf('--out');
    const dest = outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1] : 'ouija_report.html';
    fs.writeFileSync(dest, html, 'utf8');
    console.log(`\x1b[1m\x1b[32m✓ Visual report generated:\x1b[0m ${dest}`);
  } else {
    console.log(exportToMarkdown(rawData));
  }

} else {
  printHelp();
}