// Gera os posters (fallback sem WebGL, carregamento e Open Graph) a partir do build estático.
// Uso: npm run build && npm run posters
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const OUT = 'out';
const DEST = 'public/posters';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const buf = await readFile(join(OUT, p));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

async function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(homedir(), '.cache/ms-playwright');
  if (existsSync(root)) {
    for (const d of (await readdir(root)).filter((n) => /^chromium-\d+$/.test(n)).sort().reverse()) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
        if (existsSync(join(root, d, rel))) return join(root, d, rel);
      }
    }
  }
  return undefined;
}

const shots = [
  ['poster-hero', 0, 0.3, 1600, 1000, true],
  ['poster-cap1', 1, 0.5, 1600, 1000],
  ['poster-cap2', 2, 0.74, 1600, 1000],
  ['poster-cap3', 3, 0.66, 1600, 1000],
  ['poster-cap4', 4, 0.5, 1600, 1000],
  ['poster-cap5', 5, 0.5, 1600, 1000],
  ['poster-cap6', 6, 0.74, 1600, 1000],
  ['poster-cap7', 7, 0.8, 1600, 1000],
  ['poster-cap8', 8, 0.5, 1600, 1000],
  ['poster-cycle-1', 3, 0.3, 1600, 1000],
  ['poster-cycle-2', 3, 0.47, 1600, 1000],
  ['poster-cycle-3', 3, 0.62, 1600, 1000],
  ['poster-cycle-4', 3, 0.86, 1600, 1000],
  ['og-base', 0, 0.3, 1200, 630, true],
];

await mkdir(DEST, { recursive: true });
const browser = await chromium.launch({
  executablePath: await findChrome(),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
for (const [name, ch, p, w, h, keep] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`${base}/?shot=${ch}&p=${p}${keep ? '&keep=1' : ''}`);
  await page.waitForSelector('.stage.is-ready', { timeout: 90000 });
  await page.waitForTimeout(2500);
  const png = join(DEST, `${name}.png`);
  await page.screenshot({ path: png });
  await page.close();
  if (name === 'og-base') {
    execFileSync('magick', [png, '(', 'public/logo-desol.png', '-resize', 'x230', ')', '-gravity', 'west', '-geometry', '+120+0', '-composite', 'public/og-image.png']);
    execFileSync('rm', [png]);
  } else {
    execFileSync('magick', [png, '-quality', name === 'poster-hero' ? '72' : '78', join(DEST, `${name}.webp`)]);
    execFileSync('rm', [png]);
  }
  console.log('ok', name);
}
await browser.close();
server.close();
