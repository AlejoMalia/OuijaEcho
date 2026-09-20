// Import the mapping data and new engine
import { ouijaBoardMapping } from './ouija-board-mapping.js';
import { OuijaSessionEngine } from './engine/session-engine.js';
import { getDistance } from './core/geometry.js';

/**
 * Starts a Ouija board session that tracks the given coordinates and logs detected elements.
 * 
 * Preserves 100% backward compatibility with the legacy API while providing
 * full access to the scientific kinematic and ambient environmental engine.
 *
 * @param {{ x: number, y: number }|Function} cords - An object or getter function containing x and y coordinates.
 * @param {Object} [options] - Optional scientific configuration
 * @param {boolean} [options.scientific=false] - When true, attaches full kinematic and ambient data to returned log
 * @param {Function|Object} [options.ambientSource] - Optional ambient telemetry generator
 * @param {number} [options.sampleRateHz=10] - Sampling frequency in Hz (default 10Hz / 100ms)
 *
 * @returns {() => Array<{ element: string, timestamp: string, position: { x: number, y: number } }>}
 * A function that stops the session when called and returns the complete session log.
 */
export function startOuijaSession(cords, options = {}) {
    const isScientific = Boolean(options.scientific);

    let sessionLog = [];
    let lastDetectedElement = null;

    console.log("--- Ouija Session Started ---");

    const engine = new OuijaSessionEngine({
        sampleRateHz: options.sampleRateHz || 10,
        minDwellTimeMs: options.minDwellTimeMs || 200,
        ambientConfig: options.ambientConfig || {},
        correlationConfig: options.correlationConfig || {}
    });

    const stopEngine = engine.start(cords, options.ambientSource);

    engine.on('target_change', (event) => {
        const timestamp = new Date(event.timestamp).toLocaleTimeString();
        sessionLog.push({
            element: event.currentTarget,
            timestamp: timestamp,
            position: { x: event.position.x, y: event.position.y }
        });
        console.log(`[${timestamp}] New element detected: ${event.currentTarget}`);
    });

    // Function to stop the session and return the log
    return () => {
        const scientificData = stopEngine();
        console.log("--- Ouija Session Ended ---");

        if (isScientific) {
            // Attach rich scientific telemetry to the returned log
            sessionLog.scientific = scientificData;
            sessionLog.kinematics = scientificData.kinematics;
            sessionLog.environment = scientificData.environment;
            sessionLog.correlation = scientificData.correlation;
            sessionLog.summary = scientificData.scientificSummary;
        }

        return sessionLog;
    };
}
