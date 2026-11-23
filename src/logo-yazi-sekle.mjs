// Turns the logo's live text into outlines so it looks the same on every device.
import fs from 'node:fs';
import * as fontkit from '/Users/ramazan/Desktop/veteriner/node_modules/fontkit/dist/module.mjs';
const F = '/private/tmp/claude-503/-Users-ramazan-Desktop-veteriner/4a849639-79b4-4364-bc9e-f455d1d46919/scratchpad/fonts/';
const R = '/Users/ramazan/Desktop/veteriner/';
const src = fs.readFileSync(R + 'Gorseller/logo/logo.svg', 'utf8');
const icon = src.match(/<g>([\s\S]*?)<\/g>/)[1];

const fraunces = fontkit.openSync(F + 'Fraunces.ttf').getVariation({ opsz: 9, wght: 700, SOFT: 0, WONK: 1 });
const poppins = fontkit.openSync(F + 'Poppins-Medium.ttf');

// One run of text as a single path. x,y = baseline origin, size in px, tracking = extra px after each glyph.
function run(font, text, x, y, size, tracking = 0) {
  const s = size / font.unitsPerEm;
  const layout = font.layout(text);
  let pen = 0, d = '';
  layout.glyphs.forEach((g, i) => {
    const p = layout.positions[i];
    const path = g.path.scale(s, -s).translate(x + pen + p.xOffset * s, y - p.yOffset * s);
    d += path.toSVG();
    pen += p.xAdvance * s + tracking;
  });
  return { d, width: pen };
}

const T1 = [157.7, 73.19], size1 = 86.1;
const a = run(fraunces, 'Güzel', T1[0], T1[1], size1);
const b = run(fraunces, 'y', T1[0] + 243.32, T1[1], size1);
const c = run(fraunces, 'alı', T1[0] + 293.69, T1[1], size1);
const line2 = run(poppins, 'VETERİNER KLİNİĞİ', 160.72, 128.88, 35.53, 0.15 * 35.53);
console.log('widths', a.width.toFixed(1), '(y at 243.32)', (293.69 - 243.32).toFixed(1), 'vs', b.width.toFixed(1), ' line2', line2.width.toFixed(1));

const words = a.d + b.d + c.d;
const make = (dark, light, iconDark, iconLight) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 559.27 149.56" role="img" aria-label="Güzelyalı Veteriner Kliniği">
<g>${icon.replace(/class="cls-1"/g, `fill="${iconDark}" fill-rule="evenodd"`).replace(/class="cls-2"/g, `fill="${iconLight}" fill-rule="evenodd"`)}</g>
<path fill="${dark}" d="${words}"/>
<path fill="${light}" d="${line2.d}"/>
</svg>
`;
fs.writeFileSync(R + 'assets/img/logo/logo.svg', make('#0e5a5e', '#3a8c89', '#0e5a5e', '#3a8c89'));
fs.writeFileSync(R + 'assets/img/logo/logo-beyaz.svg', make('#ffffff', '#b9dcd9', '#ffffff', '#ffffff'));
// Icon: the designer's file as is, with the class styles inlined (some renderers ignore <style>).
const ik = fs.readFileSync(R + 'Gorseller/logo/logo-ikon.svg', 'utf8');
const ikPaths = [...ik.matchAll(/<path class="(cls-\d)" d="([^"]+)"\/>/g)].map(([, cls, d]) => `<path fill="${cls === 'cls-1' ? '#0e5a5e' : '#3a8c89'}" fill-rule="evenodd" d="${d}"/>`).join('\n');
fs.writeFileSync(R + 'assets/img/logo/logo-ikon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 446.79 413.33">\n${ikPaths}\n</svg>\n`);
console.log('written');
