import test from 'node:test';
import assert from 'node:assert/strict';
import { AutonomousEmulator } from '../src/streaming/emulator.js';

test('AutonomousEmulator: runs physical simulation, handles impulses and stops', async () => {
  const emulator = new AutonomousEmulator({ timeStepSec: 0.01, noiseMagnitude: 0.2 });

  let stateEmitted = false;
  emulator.on('particle_state', () => { stateEmitted = true; });

  emulator.start();
  emulator.injectImpulse(5.0, -3.0);

  await new Promise(r => setTimeout(r, 60));

  assert.equal(stateEmitted, true);
  assert.equal(emulator.isRunning, true);

  const res = emulator.stop();
  assert.equal(emulator.isRunning, false);
  assert.ok(typeof res.text === 'string');
});
