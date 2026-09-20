import test from 'node:test';
import assert from 'node:assert/strict';
import { EventStreamPipeline } from '../src/streaming/event-stream.js';

test('EventStreamPipeline: differential filtering suppresses redundant idle frames', () => {
  const pipeline = new EventStreamPipeline({ spatialEpsilonCm: 0.1 });

  const events = [];
  pipeline.subscribe(e => events.push(e));

  // Initial frame (always emitted)
  const ok1 = pipeline.push({ x: 10.0, y: 10.0, totalEnergy: -2.0 });
  assert.equal(ok1, true);
  assert.equal(events.length, 1);

  // Micro-jitter below epsilon (< 0.1 cm) -> Suppressed!
  const ok2 = pipeline.push({ x: 10.02, y: 10.03, totalEnergy: -2.01 });
  assert.equal(ok2, false);
  assert.equal(events.length, 1, 'Redundant idle frame should be suppressed');

  // Significant movement (> 0.1 cm) -> Dispatched!
  const ok3 = pipeline.push({ x: 10.5, y: 10.0, totalEnergy: -2.0 });
  assert.equal(ok3, true);
  assert.equal(events.length, 2);
  assert.equal(events[1].delta.dx, 0.5);
});

test('EventStreamPipeline: emits high-priority resonance events and iterates stream', async () => {
  const pipeline = new EventStreamPipeline();

  setTimeout(() => {
    pipeline.emitResonance('ATTRACTOR_COLLAPSE', { target: 'YES' });
    pipeline.close();
  }, 30);

  const received = [];
  for await (const event of pipeline.stream()) {
    received.push(event);
    if (event.type === 'ATTRACTOR_COLLAPSE') break;
  }

  assert.equal(received.length, 1);
  assert.equal(received[0].type, 'ATTRACTOR_COLLAPSE');
  assert.equal(received[0].data.target, 'YES');
});
