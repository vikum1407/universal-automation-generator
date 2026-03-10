import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';

export class HybridDashboardApi {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  start(port = 5050) {
    const app = express();

    // --- Hybrid Coverage JSON ---
    app.get('/coverage', (req, res) => {
      const file = path.join(this.outputDir, 'hybrid-coverage.json');
      if (!fs.existsSync(file)) {
        return res.status(404).json({ error: 'Coverage not found. Run hybrid pipeline first.' });
      }
      res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
    });

    // --- Hybrid Coverage SVG ---
    app.get('/coverage/svg', (req, res) => {
      const file = path.join(this.outputDir, 'hybrid-coverage.svg');
      if (!fs.existsSync(file)) {
        return res.status(404).json({ error: 'Coverage SVG not found. Run hybrid pipeline first.' });
      }
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(fs.readFileSync(file, 'utf-8'));
    });

    // --- RTM Document ---
    app.get('/rtm', (req, res) => {
      const file = path.join(this.outputDir, 'rtm.json');
      if (!fs.existsSync(file)) {
        return res.status(404).json({ error: 'RTM not found.' });
      }
      res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
    });

    // --- Hybrid Tests List ---
    app.get('/tests', (req, res) => {
      const testDir = path.join(this.outputDir, 'tests', 'hybrid');
      if (!fs.existsSync(testDir)) {
        return res.status(404).json({ error: 'Hybrid tests not found.' });
      }

      const files = fs.readdirSync(testDir).filter(f => f.endsWith('.spec.ts'));
      res.json(files);
    });

    // --- Single Test File ---
    app.get('/tests/:name', (req, res) => {
      const file = path.join(this.outputDir, 'tests', 'hybrid', req.params.name);
      if (!fs.existsSync(file)) {
        return res.status(404).json({ error: 'Test not found.' });
      }
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(file, 'utf-8'));
    });

    app.get('/', (req, res) => {
      res.send(`
        <h1>Qlitz Hybrid Dashboard API</h1>
        <p>Available endpoints:</p>
        <ul>
          <li><a href="/coverage">/coverage</a> – Hybrid coverage JSON</li>
          <li><a href="/coverage/svg">/coverage/svg</a> – Hybrid coverage graph (SVG)</li>
          <li><a href="/rtm">/rtm</a> – RTM document</li>
          <li><a href="/tests">/tests</a> – List of hybrid tests</li>
        </ul>
      `);
    });

    app.listen(port, () => {
      console.log(`🚀 Hybrid Dashboard API running at http://localhost:${port}`);
    });
  }
}
