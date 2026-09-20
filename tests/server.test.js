import test from 'node:test';
import assert from 'node:assert/strict';
import EventEmitter from 'node:events';
import { createLabHandler, createLabServer } from '../src/server/lab-server.js';
import { OuijaSessionEngine } from '../src/engine/session-engine.js';

class MockReq extends EventEmitter {
  constructor(url, method = 'GET', body = null) {
    super();
    this.url = url;
    this.method = method;
    this.headers = { host: 'localhost' };
    this.body = body;
  }
  start() {
    process.nextTick(() => {
      if (this.body) {
        this.emit('data', this.body);
      }
      this.emit('end');
    });
  }
}

class MockRes {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
    this.ended = false;
  }
  setHeader(k, v) {
    this.headers[k] = v;
  }
  writeHead(code, headers = {}) {
    this.statusCode = code;
    Object.assign(this.headers, headers);
  }
  end(chunk = '') {
    this.body += chunk;
    this.ended = true;
  }
}

test('LabServer: createLabServer instantiation', () => {
  const lab = createLabServer({ port: 3000 });
  assert.ok(lab.server);
  assert.ok(lab.engine);
  assert.ok(typeof lab.listen === 'function');
  assert.ok(typeof lab.close === 'function');
});

test('LabServer: handles /api/status endpoint', async () => {
  const engine = new OuijaSessionEngine();
  const handler = createLabHandler(engine);

  const req = new MockReq('/api/status');
  const res = new MockRes();

  handler(req, res);
  req.start();

  await new Promise(r => setTimeout(r, 20));
  assert.equal(res.statusCode, 200);
  const status = JSON.parse(res.body);
  assert.equal(status.running, false);
  assert.equal(status.samples, 0);
});

test('LabServer: handles /api/feed endpoint', async () => {
  const engine = new OuijaSessionEngine();
  const handler = createLabHandler(engine);

  const req = new MockReq('/api/feed', 'POST', JSON.stringify({
    coords: { x: 12.0, y: 6.0 },
    ambient: { noiseDb: 42.0 }
  }));
  const res = new MockRes();

  handler(req, res);
  req.start();

  await new Promise(r => setTimeout(r, 20));
  assert.equal(res.statusCode, 200);
  const feed = JSON.parse(res.body);
  assert.equal(feed.success, true);
  assert.equal(feed.frame.kinematic.nearestTarget, 'D');
});

test('LabServer: handles /api/export endpoint for CSV format', async () => {
  const engine = new OuijaSessionEngine();
  engine.feedFrame({ x: 8.0, y: 3.5 });
  const handler = createLabHandler(engine);

  const req = new MockReq('/api/export?format=csv');
  const res = new MockRes();

  handler(req, res);
  req.start();

  await new Promise(r => setTimeout(r, 20));
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.includes('timestamp,dt_sec,x_cm,y_cm'));
});
