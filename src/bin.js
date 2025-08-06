#!/usr/bin/env node

import { argv } from 'node:process'
import readline from 'node:readline';
import { startOuijaSession, displayMappingTable, generatePhraseCoordinates } from './index.js'

const args = argv.slice(2) 

const printHelp = () => {
	console.log(`Ouija CLI 🧿

Usage: $ ouija <command>

Commands:

  session      Start a session
  generator    Run the generator

Examples:

  $ ouija session
  $ ouija generator
`)
}

if (args.includes('session')) {
	
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
    const stopSession = startOuijaSession(getSimulatedCoords());
    setTimeout(() => {
        const sessionResults = stopSession();
        console.log("\nFinal Session Log:");
        console.log(sessionResults);
    }, 2000);

} else if(args.includes('generator')){
	
	const runReadline = () => {
	
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

	}
	runReadline()

}else {
	printHelp()
}