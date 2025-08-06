// Import the mapping data
import { ouijaBoardMapping } from './ouija-board-mapping.js';

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Starts a Ouija board session that tracks the given coordinates and logs detected elements.
 *
 * The function continuously checks every 100ms whether the current position (x, y)
 * falls within the area of a letter, number, or special element (affirmation, negation, farewell).
 * If a new element is detected (i.e., different from the last one), it is added to the session log.
 *
 * @param {{ x: number, y: number }} cords - An object containing the x and y coordinates to be checked.
 *
 * @returns {() => Array<{ element: string, timestamp: string, position: { x: number, y: number } }>}
 * A function that stops the session when called and returns the complete session log.
 *
 * @example
 * const cords = { x: 10, y: 5 };
 * const stop = startOuijaSession(cords);
 * setTimeout(() => {
 *   const log = stop();
 *   console.log(log);
 * }, 2000);
 */
export function startOuijaSession(cords) {

    let sessionLog = [];
    let lastDetectedElement = null;
    let intervalId = null;

    console.log("--- Ouija Session Started ---");
    
    intervalId = setInterval(() => {
        const { x, y } = cords;
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
