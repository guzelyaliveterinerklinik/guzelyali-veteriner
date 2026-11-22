// Local preview with the panel: builds the site, serves dist/ on http://127.0.0.1:5180,
// runs the Decap file proxy (panel saves straight to content/), and rebuilds on every change.
// Run: npm run dev   (then open http://127.0.0.1:5180/admin/)
import { spawn, execFileSync } from 'node:child_process';
import { watch, createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = path.join(ROOT, 'dist');
const build = () => {
  try { execFileSync(process.execPath, [path.join(ROOT, 'src/build.mjs')], { stdio: 'inherit' }); }
  catch { console.error('Derleme hatası: yukarıdaki mesaja bakın.'); }
};
build();

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.yml': 'text/yaml; charset=utf-8', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end('Bulunamadı'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(5180, '127.0.0.1', () => console.log('Site: http://127.0.0.1:5180   Panel: http://127.0.0.1:5180/admin/'));

spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['decap-server'], { cwd: ROOT, stdio: 'inherit' });

let timer;
for (const dir of ['content', 'assets', 'src', 'admin']) {
  watch(path.join(ROOT, dir), { recursive: true }, (_, f) => {
    if (f && (f.includes('.cache') || f.startsWith('r/'))) return;
    clearTimeout(timer);
    timer = setTimeout(build, 400);
  });
}
