import test from 'node:test';
import assert from 'node:assert/strict';
import { EmergentTopology } from '../src/streaming/emergent-topology.js';

test('EmergentTopology: ignores high-speed transit points and creates nodes at low speed', () => {
  const topo = new EmergentTopology({ speedThresholdCmS: 2.0 });

  // High speed point: in transit
  const transit = topo.feed({ x: 10.0, y: 10.0, speed: 15.0 });
  assert.equal(transit.isNewAttractor, false);
  assert.equal(topo.nodes.length, 0);

  // Low speed stabilization: forms emergent attractor
  const settled = topo.feed({ x: 15.0, y: 8.0, speed: 0.5 });
  assert.equal(settled.isNewAttractor, true);
  assert.equal(topo.nodes.length, 1);
  assert.equal(topo.nodes[0].x, 15.0);
  assert.equal(topo.nodes[0].y, 8.0);
});

test('EmergentTopology: merges nearby stabilization points using Hebbian learning', () => {
  const topo = new EmergentTopology({ mergeRadiusCm: 2.0, learningRate: 0.5 });

  // First anchor
  topo.feed({ x: 20.0, y: 10.0, speed: 0.5 });
  assert.equal(topo.nodes.length, 1);

  // Second point nearby (distance 1.0 < mergeRadius 2.0)
  const merged = topo.feed({ x: 21.0, y: 10.0, speed: 0.4 });
  assert.equal(merged.isNewAttractor, false);
  assert.equal(topo.nodes.length, 1);
  assert.equal(topo.nodes[0].hits, 2);
  // Center should move towards 21.0: 20.0 + 0.5 * (21.0 - 20.0) = 20.5
  assert.equal(topo.nodes[0].x, 20.5);

  const attractors = topo.getAttractors();
  assert.equal(attractors.length, 1);
  assert.equal(attractors[0].hits, 2);
});
