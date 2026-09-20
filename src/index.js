/**
 * OuijaEcho Library Main Entry Point
 * Comprehensive computational & scientific framework for Ouija board analysis.
 * Universal Multimodal Architecture: Spatial, Kinematic, Ambient, Vision, Multi-User & Linguistic.
 */

// Legacy API & Generators
export { displayMappingTable, generatePhraseCoordinates } from "./ouija-generator.js";
export { ouijaBoardMapping } from './ouija-board-mapping.js';
export { startOuijaSession } from './ouija-session.js';

// Core Geometry & Spatial Probability
export {
  getDistance,
  findNearestElement,
  calculateTargetProbabilities,
  getAllBoardTargets,
  isWithinBoard
} from './core/geometry.js';

// Projective Geometry, Vision & Optical Tracking
export {
  computeHomography,
  projectPoint,
  invertMatrix3x3
} from './vision/homography.js';
export { OpticalTracker } from './vision/optical-tracker.js';

// Pluggable Input Modalities & Adapters
export { BaseAdapter } from './inputs/base-adapter.js';
export { PointerAdapter } from './inputs/pointer-adapter.js';
export { CameraAdapter } from './inputs/camera-adapter.js';
export { HardwareAdapter } from './inputs/hardware-adapter.js';

// Kinematics & Reactive Engine
export { KinematicTracker } from './engine/kinematics.js';
export { OuijaSessionEngine } from './engine/session-engine.js';

// Environmental Intelligence & Ambient Compilation
export { EnvironmentalMonitor } from './ambient/environmental-monitor.js';
export { CorrelationAnalyzer } from './ambient/correlation-analyzer.js';

// Advanced Multimodal Analytics
export { MultiUserAnalyzer } from './analytics/multi-user.js';
export { LinguisticPrior } from './analytics/linguistic-prior.js';

// Scientific Analytics & Metrics
export {
  calculateTortuosity,
  calculateNormalizedJerk,
  calculateFittsMetrics,
  calculateShannonEntropy,
  generateScientificSummary
} from './analytics/metrics.js';

// Data Exporters & Visualizers
export {
  exportToCsv,
  exportToJsonLd,
  exportToMarkdown
} from './analytics/exporter.js';

export { generateHtmlReport } from './analytics/visualizer.js';

// Local Web Laboratory Server
export { createLabServer } from './server/lab-server.js';

// Autonomous Potential Landscape & Event Stream Reactive Pipeline
export { PotentialLandscape } from './streaming/potential-landscape.js';
export { EventStreamPipeline } from './streaming/event-stream.js';
export { EmergentTopology } from './streaming/emergent-topology.js';
export { AutonomousEmulator } from './streaming/emulator.js';