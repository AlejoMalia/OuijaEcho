import { ouijaBoardMapping } from './ouijaBoardMapping.js';
import readline from 'node:readline';

/**
 * Generates a list of coordinates for a given phrase based on the ouija board mapping.
 * @param {string} phrase The input phrase to map.
 * @returns {Array<Object>} An array of objects, each containing a character and its corresponding mapping data.
 */
function generatePhraseCoordinates(phrase) {
  const allElements = [
    ...ouijaBoardMapping.letters,
    ...ouijaBoardMapping.numbers.map(n => ({ letter: n.number.toString(), ...n }))
  ];

  const results = [];
  
  for (const char of phrase) {
    const upperChar = char.toUpperCase();
    
    const element = allElements.find(
      e => e.letter === upperChar || e.number === parseInt(upperChar)
    );
    
    if (element) {
      results.push({
        character: char,
        mappedElement: element.letter || element.number,
        position: element.position,
        radius: element.radius
      });
    } else if (char === ' ') {
      results.push({
        character: ' ',
        mappedElement: 'Space',
        position: null,
        radius: null
      });
    } else {
      results.push({
        character: char,
        mappedElement: 'Not Mapped',
        position: null,
        radius: null
      });
    }
  }

  return results;
}

/**
 * Displays the mapping results in a clean, formatted table in the console.
 * @param {Array<Object>} mappingData The data returned from generatePhraseCoordinates.
 */
function displayMappingTable(mappingData) {
  console.log('\nTable with the result:');
  console.table(mappingData);
}

// --- Interactive code to get user input ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('\x1b[1m\x1b[36mGENERATOR-TEXTOUIJA\x1b[0m');
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
