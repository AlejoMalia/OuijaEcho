import { ouijaBoardMapping } from './ouija-board-mapping.js';
import { getDistance } from './core/geometry.js';
import { calculateFittsMetrics } from './analytics/metrics.js';

/**
 * Generates a list of coordinates for a given phrase based on the ouija board mapping.
 * Also computes theoretical kinematic metrics (distance between letters, Fitts difficulty).
 * 
 * @param {string} phrase The input phrase to map.
 * @returns {Array<Object>} An array of objects, each containing a character and its corresponding mapping data.
 */
export function generatePhraseCoordinates(phrase) {
  const allElements = [
    ...ouijaBoardMapping.letters,
    ...ouijaBoardMapping.numbers.map(n => ({ letter: n.number.toString(), ...n })),
    { letter: 'YES', ...ouijaBoardMapping.affirmation },
    { letter: 'NO', ...ouijaBoardMapping.negation },
    { letter: 'GOOD BYE', ...ouijaBoardMapping.farewell }
  ];

  const results = [];
  let previousPosition = null;
  let totalTheoreticalDistance = 0;
  
  for (const char of phrase) {
    const upperChar = char.toUpperCase();
    
    const element = allElements.find(
      e => e.letter === upperChar || e.number === parseInt(upperChar)
    );
    
    if (element) {
      let stepDistance = 0;
      let fittsDifficulty = null;

      if (previousPosition) {
        stepDistance = Number(getDistance(previousPosition, element.position).toFixed(2));
        totalTheoreticalDistance += stepDistance;
        const targetWidth = (element.radius || 1.5) * 2;
        fittsDifficulty = calculateFittsMetrics(0, stepDistance, targetWidth).indexOfDifficultyBits;
      }

      previousPosition = element.position;

      results.push({
        character: char,
        mappedElement: element.letter || element.number,
        position: element.position,
        radius: element.radius,
        stepDistanceCm: stepDistance,
        fittsIndexBits: fittsDifficulty
      });
    } else if (char === ' ') {
      results.push({
        character: ' ',
        mappedElement: 'Space',
        position: null,
        radius: null,
        stepDistanceCm: 0,
        fittsIndexBits: null
      });
    } else {
      results.push({
        character: char,
        mappedElement: 'Not Mapped',
        position: null,
        radius: null,
        stepDistanceCm: 0,
        fittsIndexBits: null
      });
    }
  }

  // Attach theoretical totals to array object
  results.totalTheoreticalDistanceCm = Number(totalTheoreticalDistance.toFixed(2));

  return results;
}

/**
 * Displays the mapping results in a clean, formatted table in the console.
 * @param {Array<Object>} mappingData The data returned from generatePhraseCoordinates.
 */
export function displayMappingTable(mappingData) {
  console.log('\nTable with the result:');
  console.table(mappingData);
  if (mappingData.totalTheoreticalDistanceCm !== undefined) {
    console.log(`\nTheoretical Minimum Path Distance: ${mappingData.totalTheoreticalDistanceCm} cm`);
  }
}