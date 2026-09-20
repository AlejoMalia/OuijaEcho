import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OuijaSessionEngine } from '../engine/session-engine.js';
import { exportToCsv, exportToJsonLd, exportToMarkdown } from '../analytics/exporter.js';
import { generateHtmlReport } from '../analytics/visualizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates the HTTP request handler for the laboratory server.
 * Can be used with http.createServer or tested directly with mock req/res.
 * 
 * @param {OuijaSessionEngine} engine
 * @param {Object} [state] Shared server state
 * @returns {Function} Request listener (req, res)
 */
export function createLabHandler(engine, state = {}) {
  state.currentResults = state.currentResults || null;
  state.sseClients = state.sseClients || [];

  return (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // CORS headers for local lab development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Serve HTML Dashboard (cached in memory for high-performance throughput)
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const htmlPath = path.join(__dirname, 'public', 'index.html');
      if (!state.cachedHtml && fs.existsSync(htmlPath)) {
        state.cachedHtml = fs.readFileSync(htmlPath, 'utf8');
      }
      if (state.cachedHtml) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(state.cachedHtml);
      } else {
        res.writeHead(404);
        res.end('Lab dashboard index.html not found');
      }
      return;
    }

    // Server-Sent Events (SSE) Stream
    if (url.pathname === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write('retry: 1000\n\n');
      state.sseClients.push(res);

      req.on('close', () => {
        state.sseClients = state.sseClients.filter(client => client !== res);
      });
      return;
    }

    // API: Ingest manual or web frame
    if (url.pathname === '/api/feed' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const frame = engine.feedFrame(
            parsed.coords || { x: parsed.x, y: parsed.y },
            parsed.ambient || {},
            parsed.timestamp || Date.now()
          );

          // Broadcast to connected SSE observers
          if (state.sseClients && state.sseClients.length > 0) {
            const ssePayload = `data: ${JSON.stringify(frame)}\n\n`;
            for (const client of state.sseClients) {
              client.write(ssePayload);
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, frame }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // API: Status
    if (url.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        running: engine.isRunning,
        samples: engine.kinematics.history.length,
        dwells: engine.kinematics.dwellEvents.length,
        transitions: engine.kinematics.transitionEvents.length,
        voids: engine.kinematics.voidEvents.length,
        hasResults: state.currentResults !== null
      }));
      return;
    }

    // API: Stop session & compile
    if (url.pathname === '/api/stop' && req.method === 'POST') {
      state.currentResults = engine.compileResults();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, summary: state.currentResults.scientificSummary }));
      return;
    }

    // API: Export data
    if (url.pathname === '/api/export') {
      const format = (url.searchParams.get('format') || 'json').toLowerCase();
      const data = state.currentResults || engine.compileResults();

      if (format === 'csv') {
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="ouijaecho_session.csv"'
        });
        res.end(exportToCsv(data, 'timeseries'));
      } else if (format === 'transitions') {
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="ouijaecho_transitions.csv"'
        });
        res.end(exportToCsv(data, 'transitions'));
      } else if (format === 'voids') {
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="ouijaecho_voids.csv"'
        });
        res.end(exportToCsv(data, 'voids'));
      } else if (format === 'html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(generateHtmlReport(data));
      } else if (format === 'md') {
        res.writeHead(200, { 'Content-Type': 'text/markdown' });
        res.end(exportToMarkdown(data));
      } else {
        res.writeHead(200, {
          'Content-Type': 'application/ld+json',
          'Content-Disposition': 'attachment; filename="ouijaecho_dataset.jsonld"'
        });
        res.end(exportToJsonLd(data));
      }
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  };
}

/**
 * Creates and starts the local OuijaEcho Laboratory Web Server.
 * Zero external npm dependencies — built with native Node.js HTTP.
 * 
 * @param {Object} [options]
 * @param {number} [options.port=3000] HTTP server port
 * @returns {{ server: http.Server, engine: OuijaSessionEngine, close: Function }}
 */
export function createLabServer(options = {}) {
  const port = options.port !== undefined ? options.port : 3000;
  const engine = new OuijaSessionEngine({ sampleRateHz: 30 });
  const state = { currentResults: null, sseClients: [] };

  // Broadcast frame to SSE clients
  engine.on('frame', (data) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    state.sseClients.forEach(res => res.write(payload));
  });

  const handler = createLabHandler(engine, state);
  const server = http.createServer(handler);

  return {
    server,
    engine,
    handler,
    listen: () => new Promise((resolve) => {
      server.listen(port, () => {
        const actualPort = server.address().port;
        resolve(`http://localhost:${actualPort}`);
      });
    }),
    close: () => new Promise((resolve) => {
      state.sseClients.forEach(client => client.end());
      server.close(resolve);
    })
  };
}
