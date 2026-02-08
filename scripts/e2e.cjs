const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { spawn } = require('node:child_process');
const path = require('node:path');

const distDir = path.resolve(__dirname, '../examples/remote/dist');
const hostEntry = path.resolve(__dirname, '../examples/host/dist-node/main.cjs');

const contentTypes = {
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.zip': 'application/zip',
  '.d.ts': 'text/plain',
};

const serveStatic = async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rawPath = url.pathname === '/' ? '/remoteEntry.js' : url.pathname;
  const filePath = path.resolve(distDir, `.${rawPath}`);

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
  } catch {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = contentTypes[ext] ?? 'application/octet-stream';
  const body = await readFile(filePath);
  res.writeHead(200, { 'content-type': contentType });
  res.end(body);
};

const startServer = () =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      void serveStatic(req, res);
    });
    server.listen(3001, () => resolve(server));
  });

const runHost = () =>
  new Promise((resolve, reject) => {
    const child = spawn('node', [hostEntry], {
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Host exited with code ${code}`));
      }
    });
  });

const main = async () => {
  const server = await startServer();

  try {
    await runHost();
  } finally {
    server.close();
  }
};

main().catch((error) => {
  console.error('E2E error', error);
  process.exitCode = 1;
});
