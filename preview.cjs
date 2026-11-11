const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');

const root = __dirname;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf'
};

createServer(async (request, response) => {
  try {
    const route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, route === '/' ? 'index.html' : '.' + route);
    if (!path.startsWith(root + sep) || !types[extname(path)]) {
      response.writeHead(404).end();
      return;
    }
    const file = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] }).end(file);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173'));
