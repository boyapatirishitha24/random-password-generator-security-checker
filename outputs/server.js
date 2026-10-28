'use strict';

const http = require('node:http');
const { randomInt } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const BODY_LIMIT = 4096;
const WORDS = 'amber apple arch arctic arrow atlas autumn badge bamboo basil beach berry birch bloom blue breeze bronze cabin cactus cafe candle canyon cedar cello cherry citrus clay cloud clover coast cocoa comet coral cosmos crane creek crystal dawn delta denim desert dolphin dream drift dune eagle earth echo elm ember falcon fern field finch flame flora forest fossil fox frost galaxy garden gem ginger glacier glow golden grove harbor hazel hill honey horizon island ivory jade jasmine jazz juniper kite lagoon lantern lemon lilac linen lotus maple marble meadow melon memory meteor mint mirror mist moon moss mountain nectar nickel night north nova oak ocean olive opal orbit orchid otter palm paper pearl pebble pepper pine planet plum poet polar pond poppy prairie prism pumpkin quartz quiet rabbit radar rainbow raven reed river robin rocket rose ruby sage sail salmon sand satin scarlet sea secret shadow silver sky slate smile snow solar sparrow spice spruce star stone storm sugar summer summit sunny sunset swift teal temple terra thyme timber tulip valley velvet violet walnut wave wheat whisper willow winter wolf wood yellow zenith'.split(' ');
const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?'
};
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function generatePassword(options) {
  const enabled = Object.keys(CHARSETS).filter((key) => options.characterSets?.[key] !== false);
  if (enabled.length === 0) throw new Error('Select at least one character type.');

  const excludeAmbiguous = options.excludeAmbiguous === true;
  const selectedSets = enabled.map((key) => {
    const charset = excludeAmbiguous ? CHARSETS[key].replace(/[il1Lo0O]/g, '') : CHARSETS[key];
    return charset;
  }).filter(Boolean);
  if (selectedSets.length === 0) throw new Error('The selected options leave no characters to use.');

  const length = options.length;
  const pool = [...new Set(selectedSets.join(''))];
  const output = selectedSets.map((set) => set[randomInt(set.length)]);
  while (output.length < length) output.push(pool[randomInt(pool.length)]);
  return shuffle(output).join('');
}

function generatePassphrase(options) {
  const count = options.wordCount;
  const separator = options.separator;
  return Array.from({ length: count }, () => WORDS[randomInt(WORDS.length)]).join(separator);
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > BODY_LIMIT) throw Object.assign(new Error('Request body is too large.'), { statusCode: 413 });
  }
  try {
    return JSON.parse(body || '{}');
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 });
  }
}

function validateOptions(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Request must be a JSON object.');
  if (body.mode !== 'password' && body.mode !== 'passphrase') throw new Error('Mode must be password or passphrase.');

  if (body.mode === 'password') {
    if (!Number.isInteger(body.length) || body.length < 8 || body.length > 64) throw new Error('Length must be an integer from 8 to 64.');
    if (body.characterSets !== undefined && (!body.characterSets || typeof body.characterSets !== 'object' || Array.isArray(body.characterSets))) {
      throw new Error('Character set preferences must be an object.');
    }
  } else {
    if (!Number.isInteger(body.wordCount) || body.wordCount < 5 || body.wordCount > 10) throw new Error('Word count must be an integer from 5 to 10.');
    if (!['-', ' ', '.'].includes(body.separator)) throw new Error('Separator must be a hyphen, space, or period.');
  }
}

async function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  } catch {
    sendJson(res, 400, { error: 'Invalid URL.' });
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolvedPath = path.resolve(ROOT, relativePath);
  if (!resolvedPath.startsWith(`${ROOT}${path.sep}`) && resolvedPath !== path.join(ROOT, 'index.html')) {
    sendJson(res, 403, { error: 'Forbidden.' });
    return;
  }

  try {
    const data = await fs.promises.readFile(resolvedPath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(resolvedPath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': path.basename(resolvedPath) === 'index.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'Not found.' });
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/generate') {
    try {
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
        sendJson(res, 415, { error: 'Content-Type must be application/json.' });
        return;
      }
      const options = await readJson(req);
      validateOptions(options);
      const password = options.mode === 'passphrase' ? generatePassphrase(options) : generatePassword(options);
      sendJson(res, 200, { password, generatedBy: 'server' });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Could not generate a password.' });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  await serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Keysmith server running at http://${HOST}:${PORT}\n`);
});

server.on('error', (error) => {
  process.stderr.write(`Server error: ${error.message}\n`);
  process.exitCode = 1;
});
