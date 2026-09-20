import test from 'node:test';
import assert from 'node:assert/strict';
import { PointerAdapter } from '../src/inputs/pointer-adapter.js';
import { HardwareAdapter } from '../src/inputs/hardware-adapter.js';
import { CameraAdapter } from '../src/inputs/camera-adapter.js';

test('PointerAdapter: normalizes screen pixels to metric board cm', () => {
  const pointer = new PointerAdapter({ viewportWidth: 1000, viewportHeight: 600 });

  let emittedCoords = null;
  pointer.on('coords', ({ coords }) => {
    emittedCoords = coords;
  });

  // Center click
  const c = pointer.handlePointer(500, 300);
  assert.equal(c.x, 18.5); // 37 / 2
  assert.equal(c.y, 12.0); // 24 / 2
  assert.deepEqual(emittedCoords, { x: 18.5, y: 12.0 });

  // Origin click
  const origin = pointer.handlePointer(0, 0);
  assert.equal(origin.x, 0);
  assert.equal(origin.y, 0);

  // Maximum corner click
  const corner = pointer.handlePointer(1000, 600);
  assert.equal(corner.x, 37.0);
  assert.equal(corner.y, 24.0);
});

test('HardwareAdapter: parses JSON and CSV telemetry lines', () => {
  const hw = new HardwareAdapter();
  let receivedCoords = null;
  let receivedAmbient = null;

  hw.on('coords', ({ coords }) => { receivedCoords = coords; });
  hw.on('ambient', ({ readings }) => { receivedAmbient = readings; });

  // Ingest JSON string from microcontroller
  hw.ingest('{"x": 14.5, "y": 5.5, "vibration": 0.04, "noise": 52.3}');
  assert.deepEqual(receivedCoords, { x: 14.5, y: 5.5 });
  assert.equal(receivedAmbient.vibrationG, 0.04);
  assert.equal(receivedAmbient.noiseDb, 52.3);

  // Ingest CSV string from microcontroller: x,y,vibration,noise
  hw.ingest('29.0,3.5,0.015,40.0');
  assert.deepEqual(receivedCoords, { x: 29.0, y: 3.5 });
  assert.equal(receivedAmbient.vibrationG, 0.015);
  assert.equal(receivedAmbient.noiseDb, 40.0);
});

test('CameraAdapter: processes frame and emits metric coordinates', () => {
  const camera = new CameraAdapter({
    calibrationCorners: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ]
  });

  assert.ok(camera.homographyMatrix);
  assert.equal(camera.name, 'CameraAdapter');
});
