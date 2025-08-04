// Import the mapping data
import { ouijaBoardMapping } from './ouijaBoardMapping.js';

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function startOuijaSession(getCoordsFunc) {
    let sessionLog = [];
    let lastDetectedElement = null;
    let intervalId = null;

    console.log("--- Ouija Session Started ---");
    
    intervalId = setInterval(() => {
        const { x, y } = getCoordsFunc();
        const currentPos = { x, y };
        let detectedElement = "Mute Zone";

        // Check Affirmation/Negation/Farewell areas first
        if (getDistance(currentPos, ouijaBoardMapping.affirmation.position) <= ouijaBoardMapping.affirmation.radius) {
            detectedElement = ouijaBoardMapping.affirmation.element;
        } else if (getDistance(currentPos, ouijaBoardMapping.negation.position) <= ouijaBoardMapping.negation.radius) {
            detectedElement = ouijaBoardMapping.negation.element;
        } else if (getDistance(currentPos, ouijaBoardMapping.farewell.position) <= ouijaBoardMapping.farewell.radius) {
            detectedElement = ouijaBoardMapping.farewell.element;
        }
        // Check Letters
        else {
            for (const letterData of ouijaBoardMapping.letters) {
                if (getDistance(currentPos, letterData.position) <= letterData.radius) {
                    detectedElement = letterData.letter;
                    break;
                }
            }
            // Check Numbers if no letter was found
            if (detectedElement === "Mute Zone") {
                for (const numberData of ouijaBoardMapping.numbers) {
                    if (getDistance(currentPos, numberData.position) <= numberData.radius) {
                        detectedElement = numberData.number;
                        break;
                    }
                }
            }
        }

        if (detectedElement !== lastDetectedElement) {
            const timestamp = new Date().toLocaleTimeString();
            sessionLog.push({
                element: detectedElement,
                timestamp: timestamp,
                position: { x, y }
            });
            console.log(`[${timestamp}] New element detected: ${detectedElement}`);
            lastDetectedElement = detectedElement;
        }
    }, 100); // Check every 100ms
    
    // Function to stop the session and return the log
    return () => {
        clearInterval(intervalId);
        console.log("--- Ouija Session Ended ---");
        return sessionLog;
    };
}

// --- Example of a function that provides coordinates ---
let simulationIndex = 0;
const coordinatesSimulationData = [
    { x: 8.0, y: 3.5 }, { x: 8.1, y: 3.6 }, { x: 8.2, y: 3.7 },
    { x: 12.0, y: 6.0 }, { x: 12.1, y: 6.1 },
    { x: 15.0, y: 16.5 },
    { x: 29.0, y: 3.5 },
    { x: 1.0, y: 1.0 }
];
function getSimulatedCoords() {
    if (simulationIndex < coordinatesSimulationData.length) {
        return coordinatesSimulationData[simulationIndex++];
    }
    return { x: 1, y: 1 };
}

// --- Run the session and stop it after a few seconds ---
const stopSession = startOuijaSession(getSimulatedCoords);
setTimeout(() => {
    const sessionResults = stopSession();
    console.log("\nFinal Session Log:");
    console.log(sessionResults);
}, 2000);