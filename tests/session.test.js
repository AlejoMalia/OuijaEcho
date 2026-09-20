import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OuijaSessionEngine,
  startOuijaSession,
  generatePhraseCoordinates,
  exportToCsv,
  exportToJsonLd,
  exportToMarkdown,
  generateHtmlReport
} from '../src/index.js';

test('OuijaSessionEngine: live feed and compilation', () => {
  const engine = new OuijaSessionEngine({ sampleRateHz: 10, minDwellTimeMs: 100 });
  const t0 = 1000;

  engine.feedFrame({ x: 8.0, y: 3.5 }, { noiseDb: 35, lightLux: 300, vibrationG: 0.01 }, t0);
  engine.feedFrame({ x: 8.0, y: 3.5 }, { noiseDb: 80, lightLux: 300, vibrationG: 0.01 }, t0 + 100);
  engine.feedFrame({ x: 29.0, y: 3.5 }, { noiseDb: 35, lightLux: 300, vibrationG: 0.01 }, t0 + 250);

  const results = engine.compileResults();
  assert.equal(results.kinematicFrames.length, 3);
  assert.equal(results.ambientSamples.length, 3);
  assert.ok(results.scientificSummary);
  assert.ok(results.scientificSummary.movementProfile);
  assert.ok(results.scientificSummary.environmentalCoupling);

  // Exporters
  const csv = exportToCsv(results, 'timeseries');
  assert.ok(csv.includes('timestamp,dt_sec,x_cm,y_cm'));
  assert.ok(csv.split('\n').length >= 4);

  const jsonLd = exportToJsonLd(results);
  assert.ok(jsonLd.includes('"@type": "Dataset"'));

  const md = exportToMarkdown(results);
  assert.ok(md.includes('# OuijaEcho Scientific Report'));

  const html = generateHtmlReport(results);
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('<svg'));
});

test('Legacy startOuijaSession: backward compatibility', async () => {
  let callCount = 0;
  function getCoords() {
    callCount++;
    return callCount > 2 ? { x: 29.0, y: 3.5 } : { x: 8.0, y: 3.5 };
  }

  const stop = startOuijaSession(getCoords, { sampleRateHz: 20 });
  await new Promise(r => setTimeout(r, 250));
  const log = stop();

  assert.ok(Array.isArray(log), 'Legacy stop() should return an array');
  assert.ok(log.length >= 1);
  assert.ok(log[0].element !== undefined);
  assert.ok(log[0].timestamp !== undefined);
  assert.ok(log[0].position !== undefined);
});

test('Generator: theoretical kinematics on phrase mapping', () => {
  const mapping = generatePhraseCoordinates('YES NO');
  assert.ok(mapping.length === 6);
  assert.ok(mapping.totalTheoreticalDistanceCm > 0);
  assert.equal(mapping[0].mappedElement, 'Y');
});
