// Renders resume.html -> output/Aadarsh Resume.pdf with headless Chrome.
// No dependencies: needs Node 22+ (built-in WebSocket) and Google Chrome or Microsoft Edge.
//
//   node build.mjs                      -> output/Aadarsh Resume.pdf
//   node build.mjs other.html out.pdf   -> custom input / output

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const input = resolve(here, process.argv[2] ?? 'resume.html');
const output = resolve(here, process.argv[3] ?? 'output/Aadarsh Resume.pdf');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const chromePath = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!chromePath) throw new Error('Chrome/Edge not found. Set CHROME_PATH to its executable.');

const profile = mkdtempSync(join(tmpdir(), 'resume-chrome-'));
const chrome = spawn(chromePath, [
  '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

try {
  // Chrome prints "DevTools listening on ws://127.0.0.1:<port>/..." once it's ready.
  const port = await new Promise((ok, fail) => {
    let buf = '';
    chrome.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (m) ok(m[1]);
    });
    chrome.on('exit', () => fail(new Error('Chrome exited early:\n' + buf)));
  });

  const [page] = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).filter((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener('open', ok, { once: true }));

  let nextId = 0;
  const pending = new Map();
  const waiters = [];
  ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
    } else if (msg.method) {
      waiters.filter((w) => w.method === msg.method).forEach((w) => w.ok(msg.params));
    }
  });
  const send = (method, params = {}) => new Promise((ok, fail) => {
    const id = ++nextId;
    pending.set(id, { ok, fail });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const once = (method) => new Promise((ok) => waiters.push({ method, ok }));

  await send('Page.enable');
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: pathToFileURL(input).href });
  await loaded;
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });

  const { data } = await send('Page.printToPDF', {
    preferCSSPageSize: true, // page size + margins come from @page in resume.html
    printBackground: true,
    displayHeaderFooter: false,
  });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, Buffer.from(data, 'base64'));
  console.log(`Wrote ${output}`);

  await send('Browser.close').catch(() => {});
  ws.close();
} finally {
  chrome.kill();
  await new Promise((ok) => (chrome.exitCode !== null ? ok() : chrome.on('exit', ok)));
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
