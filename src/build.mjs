// Builds the static site into dist/ (Turkish at the root, English under /en/).
// Content comes from content/ (edited in the admin panel at /admin); interface text from src/data.mjs.
// Run from the project folder: npm run build
import { writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { posix as path } from 'node:path';
import { PAGES, NAV, UI, SITE_URL, LEGAL } from './data.mjs';
import { loadContent, ROOT } from './content.mjs';

const C = await loadContent();
const { CLINIC, HOURS, SERVICES, FAQ, REVIEWS, POSTS, HOME, ABOUT, LEGALDOCS, images, pickText } = C;
const OUT = path.join(ROOT, 'dist');
// Texts the clinic edits in the panel override the defaults in data.mjs.
for (const l of ['tr', 'en']) {
  UI[l].waText = CLINIC.waText[l] || UI[l].waText;
  UI[l].hoursShort = CLINIC.hoursShort[l] || UI[l].hoursShort;
  const closed = HOURS.map((h, i) => (h ? null : UI[l].days[i])).filter(Boolean);
  UI[l].sundayClosed = closed.length ? (l === 'tr' ? `${closed.join(', ')} kapalı` : `Closed on ${closed.join(', ')}`) : (l === 'tr' ? 'Her gün açık' : 'Open every day');
}
const LANGS = ['tr', 'en'];
// Full address of a built file: index.html -> https://…/ , en/index.html -> https://…/en/
const url = (f) => `${SITE_URL}/${f.replace(/(^|\/)index\.html$/, '$1')}`;
const other = (l) => (l === 'tr' ? 'en' : 'tr');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const postFile = (p, l) => (l === 'tr' ? `blog/${p.slug.tr}.html` : `en/blog/${p.slug.en}.html`);
// Page title with the clinic's name, shortened when it would pass ~60 characters (search results cut longer ones).
const titleFor = (t, l) => {
  for (const suffix of [l === 'tr' ? ' | Güzelyalı Veteriner Kliniği' : ' | Güzelyalı Veterinary Clinic', l === 'tr' ? ' | Güzelyalı Veteriner' : ' | Güzelyalı Vet']) {
    if ((t + suffix).length <= 60) return t + suffix;
  }
  return t;
};
const postsIn = (l) => POSTS.filter((p) => l === 'tr' || p.en);
const T = (o, k, l) => pickText(o, k, l);
const svcAnchor = (s, l) => s.anchor[l];
const svcText = (s, l) => (l === 'tr' ? s.tr : s.enT);

function rel(from, to) {
  const r = path.relative(path.dirname(from), to);
  return r === '' ? path.basename(to) : r;
}
const wa = (text) => `${CLINIC.wa}?text=${encodeURIComponent(text)}`;
const ext = 'target="_blank" rel="noopener"';

// ---------- icons ----------
const I = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.3-7-11.5A7 7 0 0 1 19 9.5C19 14.7 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h3.2l1.6 4.3-2.1 1.4a11.5 11.5 0 0 0 7.1 7.1l1.4-2.1 4.3 1.6V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.75"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.75"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3L2.9 9.4l6.3-.8z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H9l-4 3.5v-3.5H4z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M8 9.5h8M8 12.5h5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  steth: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5v5a4.5 4.5 0 0 0 9 0v-5M6 3.5H4.5M15 3.5h1.5M10.5 13v2.5a4.5 4.5 0 0 0 9 0V13" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><circle cx="19.5" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  access: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8" fill="currentColor"/><path d="M10 8.5h4l-1 5.5h4l2.5 5.5M13 14H9.5a4.5 4.5 0 1 0 4.4 5.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  // service icons
  syringe: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m17 3 4 4M19 5l-3.5 3.5M15.5 5.5l3 3L9 18H6v-3z"/><path d="M11 9.5 12.5 11M8.8 11.7l1.5 1.5M6 18l-3 3"/></g></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 19 6v5.2c0 4.4-3 7.8-7 9.8-4-2-7-5.4-7-9.8V6z"/><path d="m9 12 2.2 2.2L15.5 10"/></g></svg>',
  tooth: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 3.5c-2.3 0-3.8 1.9-3.8 4.3 0 3 1.6 4.4 2.1 7 .4 2.3.8 5.7 2.6 5.7 1.7 0 1.7-4.3 3.6-4.3s1.9 4.3 3.6 4.3c1.8 0 2.2-3.4 2.6-5.7.5-2.6 2.1-4 2.1-7 0-2.4-1.5-4.3-3.8-4.3-2 0-2.9 1.1-4.5 1.1S9.5 3.5 7.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  ear: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9a5.5 5.5 0 0 1 11 0c0 3.2-2.6 4.3-3.2 7-.5 2.4-1.6 4.5-4.3 4.5A3.5 3.5 0 0 1 6.5 17"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.7-1.6 2.2-1.6 3.8"/></g></svg>',
  drip: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="11" rx="2.5"/><path d="M10 6.5h4M10 9.5h2.5M12 13.5v3.5M12 17c0 2.4.8 3.5 3.5 4"/></g></svg>',
  scan: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M8.5 15.5 15.5 8.5"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="8" r="1.6"/></g></svg>',
  scalpel: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5 10 14"/><path d="M10 14 18.6 5.4c1.6 1.6 1.4 4.1-.6 6.1L13.5 16z"/><path d="m8.5 12.5 3 3"/></g></svg>',
  pulse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12.5h4.2l2.1-5 4.2 10 2.1-5H21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bowl: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><circle cx="9" cy="8.5" r="1.3"/><circle cx="12.5" cy="7.5" r="1.3"/><circle cx="15.5" cy="9" r="1.3"/></g></svg>',
  scissors: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="7" r="2.5"/><circle cx="6.5" cy="17" r="2.5"/><path d="M8.6 8.4 20 17M8.6 15.6 20 7"/></g></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8.5h14l-1.1 11a1.5 1.5 0 0 1-1.5 1.4H7.6a1.5 1.5 0 0 1-1.5-1.4z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/></g></svg>',
};
const svcIcon = (s) => I[s.icon] || I.steth;

// The hero kitten (an AI render supplied by the client, cut out with src/kedi.swift).
// Coordinates are in the 1200 x 1030 image. Each eye has three layers inside its iris:
//   an amber disc that hides the painted pupil, the render's own pupil (moved by main.js),
//   and a fixed catch-light, so the gaze turns while the light stays put.
// The closed-eye render (kedi-blink.webp, a 700 x 360 band at 280,460) fades in over the eyes for blinks.
const CAT = {
  w: 1200, h: 1030,
  eyes: [
    { id: 'l', ix: 416, iy: 621, ir: 79, px: 423, py: 621, pr: 58, hx: 397, hy: 587 },
    { id: 'r', ix: 786, iy: 620, ir: 80, px: 778, py: 621, pr: 58, hx: 738, hy: 592 },
  ],
  blink: { x: 280, y: 460, w: 700, h: 360 },
};
function heroCat(from, l) {
  const tr = l === 'tr';
  const alt = tr ? 'Masanın kenarından patilerini uzatıp bakan, iri gözlü turuncu tekir bir yavru kedi' : 'A big-eyed ginger tabby kitten peeking over the edge of a table, paws resting on the edge';
  const src = (w) => rel(from, `assets/img/kedi-${w}.webp`);
  const blink = rel(from, 'assets/img/kedi-blink.webp');
  const defs = CAT.eyes.map((e) => `
            <clipPath id="iris-${e.id}"><circle cx="${e.ix}" cy="${e.iy}" r="${e.ir - 2}"/></clipPath>
            <clipPath id="pupil-${e.id}"><circle cx="${e.px}" cy="${e.py}" r="${e.pr + 1}"/></clipPath>
            <radialGradient id="amber-${e.id}" cx="${e.ix}" cy="${e.iy}" r="${e.ir}" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#2a1a0c"/><stop offset=".6" stop-color="#3e2610"/><stop offset=".72" stop-color="#5e3a14"/>
              <stop offset=".8" stop-color="#8a5418" stop-opacity="1"/><stop offset=".9" stop-color="#a8661a" stop-opacity="0"/>
            </radialGradient>`).join('');
  const eyes = CAT.eyes.map((e) => `
          <g class="cat__eye" clip-path="url(#iris-${e.id})">
            <circle cx="${e.ix}" cy="${e.iy}" r="${e.ir - 8}" fill="url(#amber-${e.id})"/>
            <g data-pupil data-cx="${e.ix}" data-cy="${e.iy}" data-px="${e.px}" data-py="${e.py}">
              <image data-pupil-img width="${CAT.w}" height="${CAT.h}" clip-path="url(#pupil-${e.id})"/>
              <circle cx="${e.hx}" cy="${e.hy}" r="26" fill="url(#patch)"/>
            </g>
            <circle cx="${e.hx}" cy="${e.hy}" r="15" fill="url(#glint)"/>
          </g>`).join('');
  const lids = CAT.eyes.map((e) => `<ellipse cx="${e.ix}" cy="${e.iy}" rx="${e.ir + 48}" ry="${e.ir + 46}" fill="url(#lid-feather)"/>`).join('');
  return `<div class="cat" data-cat>
        <img class="cat__photo" src="${src(1200)}" srcset="${src(760)} 760w, ${src(1200)} 1200w" sizes="(max-width: 900px) 92vw, 50vw" width="${CAT.w}" height="${CAT.h}" alt="${alt}" fetchpriority="high" decoding="async" data-source="client">
        <svg class="cat__eyes" viewBox="0 0 ${CAT.w} ${CAT.h}" aria-hidden="true" focusable="false">
          <defs>${defs}
            <radialGradient id="patch"><stop offset=".5" stop-color="#0d0c0b"/><stop offset="1" stop-color="#0d0c0b" stop-opacity="0"/></radialGradient>
            <radialGradient id="glint"><stop offset=".55" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
            <radialGradient id="lid-feather"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
            <mask id="lids" maskUnits="userSpaceOnUse" x="0" y="0" width="${CAT.w}" height="${CAT.h}">${lids}</mask>
          </defs>${eyes}
          <image class="cat__lids" href="${blink}" x="${CAT.blink.x}" y="${CAT.blink.y}" width="${CAT.blink.w}" height="${CAT.blink.h}" mask="url(#lids)"/>
        </svg>
      </div>`;
}
const stars = (l) => `<span class="stars" role="img" aria-label="${UI[l].stars}">${I.star.repeat(5)}</span>`;

// ---------- images ----------
// Any photo named in the content, as resized WebP copies (see prepareImages in content.mjs).
function pic(from, src, alt, { sizes = '(max-width: 760px) 100vw, 33vw', eager = false, cls = '' } = {}) {
  const m = images.get(src);
  if (!m) throw new Error(`Fotoğraf bulunamadı: ${src}`);
  const srcset = m.variants.map((v) => `${rel(from, v.file)} ${v.w}w`).join(', ');
  const big = m.variants[m.variants.length - 1];
  return `<img${cls ? ` class="${cls}"` : ''} src="${rel(from, big.file)}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}
const salim = (from, alt, opts) => pic(from, ABOUT.vet_photo, alt, opts);

// ---------- shared blocks ----------
function hoursTable(l) {
  const u = UI[l];
  const order = [1, 2, 3, 4, 5, 6, 0];
  return `<table class="hours" data-hours>
  <caption class="sr-only">${u.footerHours}</caption>
  <tbody>
${order.map((d) => `    <tr data-day="${d}"><th scope="row">${u.days[d]}</th><td>${HOURS[d] ? `${HOURS[d].from}–${HOURS[d].to}` : u.closed}</td></tr>`).join('\n')}
  </tbody>
</table>`;
}

function reviewCards(l) {
  return REVIEWS.map((r) => `<figure class="review">
  ${stars(l)}
  <blockquote><p>${esc(r[l])}</p></blockquote>
  <figcaption><b>${esc(r.name)}</b><span>${UI[l].reviewSource}</span></figcaption>
</figure>`).join('\n');
}

function postCard(from, p, l, { big = false } = {}) {
  const t = p[l];
  const href = rel(from, postFile(p, l));
  return `<article class="post-card${big ? ' post-card--big' : ''}">
  <a class="post-card__img" href="${href}" tabindex="-1" aria-hidden="true">${pic(from, p.cover, t.alt, { sizes: big ? '(max-width: 760px) 100vw, 55vw' : '(max-width: 760px) 100vw, 33vw' })}</a>
  <div class="post-card__body">
    <p class="meta"><span class="tag">${t.tag}</span><time datetime="${p.date}">${fmtDate(p.date, l)}</time></p>
    <h3><a href="${href}">${t.title}</a></h3>
    <p>${t.excerpt}</p>
    <a class="more" href="${href}" aria-hidden="true" tabindex="-1">${UI[l].readMore} ${I.arrow}</a>
  </div>
</article>`;
}

function fmtDate(iso, l) {
  return new Intl.DateTimeFormat(l === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
}
const readMins = (html) => Math.max(2, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));

function mapBlock(l) {
  const u = UI[l];
  return `<div class="map" data-map data-src="${esc(CLINIC.mapsEmbed + (l === 'en' ? '&hl=en' : '&hl=tr'))}" data-title="${esc(u.mapTitle)}">
  <div class="map__cover">
    <span class="map__pin">${I.pin}</span>
    <p class="map__addr"><b>${CLINIC.street}</b><br>${CLINIC.district}</p>
    <button class="btn btn--outline" type="button" data-map-load>${u.mapLoad}</button>
    <p class="map__note">${u.mapNote}</p>
  </div>
</div>`;
}

function ctaBand(from, l) {
  const tr = l === 'tr';
  return `<section class="cta-band" aria-labelledby="cta-title">
  <div class="wrap cta-band__in">
    <div>
      <h2 id="cta-title">${tr ? 'Randevu için bize yazın' : 'Message us to book a visit'}</h2>
      <p>${tr ? 'Hayvanınızın türünü, yaşını ve şikâyetini WhatsApp’tan kısaca yazın, size uygun bir saat verelim.' : 'Tell us your pet’s species, age and the reason for the visit on WhatsApp, and we will offer you a time.'}</p>
    </div>
    <div class="btns">
      <a class="btn btn--light" href="${wa(UI[l].waText)}" ${ext}>${I.wa}<span>${UI[l].bookWa}</span></a>
      <a class="btn btn--ghost-light" href="tel:${CLINIC.phone}">${I.phone}<span>${tr ? CLINIC.phoneShow : CLINIC.phoneShowEn}</span></a>
    </div>
  </div>
</section>`;
}

function pageHero(from, l, crumbs, eyebrow, h1, lead) {
  const u = UI[l];
  const trail = [[u.home, rel(from, PAGES.home[l])], ...crumbs];
  return `<section class="page-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="${u.breadcrumb}"><ol>
${trail.map(([name, href], i) => (i === trail.length - 1 && !href ? `      <li><span aria-current="page">${name}</span></li>` : `      <li><a href="${href}">${name}</a></li>`)).join('\n')}
    </ol></nav>
    <div class="page-hero__text" data-enter>
      ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
      <h1>${h1}</h1>
      ${lead ? `<p class="lead">${lead}</p>` : ''}
    </div>
  </div>
</section>`;
}

// ---------- layout ----------
function layout({ l, file, pageKey, title, description, body, altFile, ogImage, jsonld = [], noCta = false }) {
  const u = UI[l];
  const tr = l === 'tr';
  const a = (p) => rel(file, p);
  const navItems = NAV.map((k) => {
    const cur = k === pageKey ? ' aria-current="page"' : '';
    return `<li><a href="${a(PAGES[k][l])}"${cur}>${u.nav[k]}</a></li>`;
  }).join('');
  const org = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: CLINIC.name,
    url: SITE_URL,
    image: `${SITE_URL}/share.jpg`,
    logo: `${SITE_URL}/apple-touch-icon.png`,
    telephone: CLINIC.phoneIntl,
    ...(CLINIC.email ? { email: CLINIC.email } : {}),
    address: { '@type': 'PostalAddress', streetAddress: `${CLINIC.street}, ${CLINIC.district.split(',')[0]}`, addressLocality: 'Çukurova', addressRegion: 'Adana', postalCode: (CLINIC.district.match(/\b\d{5}\b/) || ['01170'])[0], addressCountry: 'TR' },
    geo: { '@type': 'GeoCoordinates', latitude: 37.0552971, longitude: 35.2831154 },
    hasMap: CLINIC.maps,
    openingHoursSpecification: HOURS.map((h, i) => (h ? { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i], opens: h.from, closes: h.to } : null)).filter(Boolean),
    founder: { '@type': 'Person', name: CLINIC.vet, jobTitle: tr ? 'Veteriner Hekim' : 'Veterinarian' },
    employee: { '@type': 'Person', name: CLINIC.vet, jobTitle: tr ? 'Veteriner Hekim' : 'Veterinarian' },
    sameAs: [CLINIC.instagram],
    areaServed: ['Güzelyalı', 'Çukurova', 'Adana'],
  };
  const ld = [org, ...jsonld].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  const twin = !(pageKey === 'post' && !/blog\/[^/]+\.html$/.test(altFile));
  const svcLinks = SERVICES.map((s) => `<li><a href="${a(PAGES.services[l])}#${svcAnchor(s, l)}">${svcText(s, l).title}</a></li>`).join('');

  return `<!doctype html>
<html lang="${l}" data-hours="${esc(JSON.stringify(HOURS.map((h) => (h ? [h.from, h.to] : null))))}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#FFFFFF">
<meta property="og:type" content="${pageKey === 'post' ? 'article' : 'website'}">
<meta property="og:site_name" content="${CLINIC.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url(file)}">
<meta property="og:image" content="${SITE_URL}/${ogImage || 'share.jpg'}">
<meta property="og:locale" content="${u.locale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url(file)}">
${twin ? `<link rel="alternate" hreflang="${l}" href="${url(file)}">
<link rel="alternate" hreflang="${other(l)}" href="${url(altFile)}">
<link rel="alternate" hreflang="x-default" href="${url(tr ? file : altFile)}">` : ''}
<link rel="icon" href="${a('favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${a('apple-touch-icon.png')}">
<link rel="preload" href="${a('assets/fonts/figtree.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${a('assets/fonts/fonts.css')}">
<link rel="stylesheet" href="${a('assets/css/main.css')}">
<script>document.documentElement.classList.add('js')</script>
${ld}
</head>
<body data-page="${pageKey}">
<a class="skip" href="#main">${u.skip}</a>

<header class="header" data-header>
  <div class="wrap header__in">
    <a class="brand" href="${a(PAGES.home[l])}"><img class="brand__logo" src="${a('assets/img/logo/logo.svg')}" width="559" height="150" alt="${CLINIC.name}"></a>
    <nav class="nav" aria-label="${u.menu}"><ul>${navItems}</ul></nav>
    <div class="header__end">
      <div class="lang" role="group" aria-label="${u.langLabel}">
        <a href="${tr ? path.basename(file) : a(altFile)}" lang="tr" hreflang="tr"${tr ? ' aria-current="true"' : ''}>TR</a>
        <a href="${tr ? a(altFile) : path.basename(file)}" lang="en" hreflang="en"${tr ? '' : ' aria-current="true"'}>EN</a>
      </div>
      <a class="header__phone" href="tel:${CLINIC.phone}">${I.phone}<span>${tr ? CLINIC.phoneShow : CLINIC.phoneShowEn}</span></a>
      <a class="btn btn--primary btn--sm header__cta" href="${wa(u.waText)}" ${ext}>${u.book}</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav" data-menu>${I.menu}<span class="sr-only">${u.menu}</span></button>
    </div>
  </div>
  <div class="mnav" id="mnav" hidden>
    <div class="wrap">
      <ul>${navItems}</ul>
      <div class="mnav__end">
        <a class="btn btn--primary" href="${wa(u.waText)}" ${ext}>${I.wa}<span>${u.bookWa}</span></a>
        <a class="btn btn--outline" href="tel:${CLINIC.phone}">${I.phone}<span>${u.call}</span></a>
      </div>
    </div>
  </div>
</header>

<main id="main" tabindex="-1">
${body}
${noCta ? '' : ctaBand(file, l)}
</main>

<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <a class="brand brand--light" href="${a(PAGES.home[l])}"><img class="brand__logo" src="${a('assets/img/logo/logo-beyaz.svg')}" width="559" height="150" alt="${CLINIC.name}"></a>
        <p>${u.footerAbout}</p>
        <a class="footer__social" href="${CLINIC.instagram}" ${ext}>${I.ig}<span>${CLINIC.igHandle}</span></a>
      </div>
      <div>
        <h2 class="footer__h">${u.footerPages}</h2>
        <ul>${NAV.map((k) => `<li><a href="${a(PAGES[k][l])}">${u.nav[k]}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2 class="footer__h">${u.footerServices}</h2>
        <ul>${svcLinks}</ul>
      </div>
      <div>
        <h2 class="footer__h">${u.footerContact}</h2>
        <address>${CLINIC.street}<br>${CLINIC.district}</address>
        <p><a href="tel:${CLINIC.phone}">${tr ? CLINIC.phoneShow : CLINIC.phoneShowEn}</a>${CLINIC.email ? `<br><a href="mailto:${CLINIC.email}">${CLINIC.email}</a>` : ''}</p>
        <p>${u.hoursShort}<br>${u.sundayClosed}</p>
      </div>
      <div>
        <h2 class="footer__h">${u.footerLegal}</h2>
        <ul>${LEGAL.map((k) => `<li><a href="${a(PAGES[k][l])}"${k === pageKey ? ' aria-current="page"' : ''}>${u.legal[k]}</a></li>`).join('')}</ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p>© 2026 ${CLINIC.name}. ${u.rights}</p>
    </div>
  </div>
</footer>

<a class="wa-float" href="${wa(u.waText)}" ${ext} aria-label="${tr ? 'WhatsApp’tan yazın' : 'Message us on WhatsApp'}">${I.wa}<span class="wa-float__label">${tr ? 'WhatsApp’tan yazın' : 'Message us on WhatsApp'}</span></a>

<nav class="actionbar" aria-label="${u.book}">
  <a class="btn btn--primary" href="${wa(u.waText)}" ${ext}>${I.wa}<span>WhatsApp</span></a>
  <a class="btn btn--outline" href="tel:${CLINIC.phone}">${I.phone}<span>${u.call}</span></a>
</nav>

<script src="${a('assets/js/main.js')}" defer></script>
</body>
</html>
`;
}


// ---------- pages ----------
function home(l) {
  const file = PAGES.home[l];
  const u = UI[l];
  const tr = l === 'tr';
  const svcPage = rel(file, PAGES.services[l]);
  const cards = SERVICES;
  const h = (k) => T(HOME, k, l);
  const body = `
<section class="hero">
  <div class="wrap">
    <div class="hero__panel">
      <div class="hero__top">
        <div class="hero__text" data-enter>
          <p class="eyebrow">${tr ? 'Veteriner kliniği · Adana' : 'Veterinary clinic · Adana'}</p>
          <h1>${esc(h('hero_title'))}</h1>
          <p class="lead">${esc(h('hero_text'))}</p>
          <div class="btns">
            <a class="btn btn--primary" href="${wa(u.waText)}" ${ext}>${I.wa}<span>${u.bookWa}</span></a>
            <a class="btn btn--outline" href="${svcPage}">${tr ? 'Hizmetlerimiz' : 'Our services'}</a>
          </div>
        </div>
        ${heroCat(file, l)}
      </div>
      <div class="hero__ledge">
        <a class="ledge-item" href="${CLINIC.maps}" ${ext}>
          <b class="ledge-item__big">${CLINIC.rating[l]}</b>
          <span>${stars(l)}<small>${tr ? `Google’da ${CLINIC.reviews} yorum` : `${CLINIC.reviews} reviews on Google`}</small></span>
        </a>
        <div class="ledge-item">
          <span class="ledge-item__icon">${I.clock}</span>
          <span><b>${u.hoursShort}</b><small class="ledge-open" data-open-now><i aria-hidden="true"></i><span>${u.sundayClosed}</span></small></span>
        </div>
        <a class="ledge-item" href="${rel(file, PAGES.about[l])}">
          ${salim(file, '', { sizes: '56px', cls: 'ledge-item__avatar' })}
          <span><small>${tr ? 'Kurucu veteriner hekim' : 'Founding veterinarian'}</small><b>${esc(CLINIC.vet)}</b></span>
        </a>
      </div>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="svc-title">
  <div class="wrap">
    <div class="sec-head">
      <div>
        <h2 id="svc-title">${tr ? 'Hizmetlerimiz' : 'Our services'}</h2>
      </div>
      <a class="link-arrow" href="${svcPage}">${u.allServices} ${I.arrow}</a>
    </div>
    <div class="svc-feature">
${cards.map((s) => {
  const t = svcText(s, l);
  return `      <a class="svc-card" href="${svcPage}#${svcAnchor(s, l)}">
        <div class="svc-card__img">${pic(file, s.photo, '', { sizes: '(max-width: 760px) 100vw, (max-width: 1024px) 50vw, 33vw' })}<span class="svc-icon svc-icon--badge">${svcIcon(s)}</span></div>
        <div class="svc-card__body">
          <h3>${t.title}</h3>
          <p>${t.short}</p>
        </div>
      </a>`;
}).join('\n')}
    </div>
  </div>
</section>

<section class="sec sec--brand" aria-labelledby="about-title">
  <div class="wrap split">
    <figure class="split__media portrait">${salim(file, tr ? 'Veteriner Hekim Salim Hakveren, mavi cerrahi forması içinde kollarını kavuşturmuş gülümsüyor' : 'Veterinarian Salim Hakveren in blue scrubs, arms folded, smiling', { sizes: '(max-width: 900px) 100vw, 45vw' })}</figure>
    <div class="split__text">
      <p class="eyebrow">${u.nav.about}</p>
      <h2 id="about-title">${esc(h('about_title'))}</h2>
      <p>${esc(h('about_text'))}</p>
      <ul class="checks">
${(HOME.about_points || []).map((p) => T(p, 'text', l)).filter(Boolean).map((t) => `        <li>${I.check}<span>${esc(t)}</span></li>`).join('\n')}
      </ul>
      <a class="btn btn--light" href="${rel(file, PAGES.about[l])}">${tr ? 'Bizi tanıyın' : 'About the clinic'}</a>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="steps-title">
  <div class="wrap split split--steps">
    <div class="split__media">${pic(file, HOME.booking_photo, h('booking_photo_alt'), { sizes: '(max-width: 900px) 100vw, 45vw' })}</div>
    <div class="split__text">
      <h2 id="steps-title">${tr ? 'Randevu üç adımda' : 'Booking in three steps'}</h2>
      <ol class="steps">
        <li><span class="steps__n">1</span><div><h3>${tr ? 'Bize yazın' : 'Message us'}</h3><p>${tr ? 'WhatsApp’tan ya da telefonla hayvanınızın türünü, yaşını ve şikâyetini kısaca iletin.' : 'On WhatsApp or by phone, tell us your pet’s species, age and the reason for the visit.'}</p></div></li>
        <li><span class="steps__n">2</span><div><h3>${tr ? 'Saati birlikte belirleyelim' : 'Pick a time together'}</h3><p>${tr ? 'Size uygun bir saat verir, gelmeden önce yapmanız gereken bir şey varsa söyleriz.' : 'We offer a time that suits you and tell you if anything is needed before you come.'}</p></div></li>
        <li><span class="steps__n">3</span><div><h3>${tr ? 'Muayene ve tedavi planı' : 'Examination and plan'}</h3><p>${tr ? 'Muayeneden sonra bulguları, tedaviyi ve bir sonraki kontrol tarihini birlikte konuşuruz.' : 'After the examination we go through the findings, the treatment and the next check-up date.'}</p></div></li>
      </ol>
      <div class="btns">
        <a class="btn btn--primary" href="${wa(u.waText)}" ${ext}>${I.wa}<span>${u.bookWa}</span></a>
        <a class="btn btn--outline" href="tel:${CLINIC.phone}">${I.phone}<span>${tr ? CLINIC.phoneShow : CLINIC.phoneShowEn}</span></a>
      </div>
    </div>
  </div>
</section>

<section class="sec sec--surface" aria-labelledby="rev-title">
  <div class="wrap rev">
    <div class="rev__head">
      <h2 id="rev-title">${tr ? 'Hasta sahipleri ne diyor?' : 'What pet owners say'}</h2>
      <div class="score"><b>${CLINIC.rating[l]}</b><div>${stars(l)}<span>${tr ? `Google’da ${CLINIC.reviews} yorum` : `${CLINIC.reviews} reviews on Google`}</span></div></div>
      <a class="link-arrow" href="${CLINIC.maps}" ${ext}>${tr ? 'Tüm yorumları Google’da okuyun' : 'Read all reviews on Google'} ${I.arrow}</a>
    </div>
    <div class="reviews reviews--two">
${reviewCards(l)}
    </div>
  </div>
</section>

${postsIn(l).length ? `<section class="sec" aria-labelledby="blog-title">
  <div class="wrap">
    <div class="sec-head">
      <div>
        <h2 id="blog-title">${tr ? 'Hasta sahipleri için rehber yazılar' : 'Guides for pet owners'}</h2>
      </div>
      <a class="link-arrow" href="${rel(file, PAGES.blog[l])}">${u.allPosts} ${I.arrow}</a>
    </div>
    <div class="posts">
${postsIn(l).slice(0, 3).map((p) => postCard(file, p, l)).join('\n')}
    </div>
  </div>
</section>` : ''}

<section class="sec sec--surface" aria-labelledby="visit-title">
  <div class="wrap visit">
    <div class="visit__info">
      <h2 id="visit-title">${tr ? 'Adres ve çalışma saatleri' : 'Address and opening hours'}</h2>
      <address class="visit__addr">${CLINIC.street}<br>${CLINIC.district}</address>
      ${hoursTable(l)}
      <div class="btns">
        <a class="btn btn--primary" href="${CLINIC.maps}" ${ext}>${I.pin}<span>${u.directions}</span></a>
        <a class="btn btn--outline" href="tel:${CLINIC.phone}">${I.phone}<span>${u.call}</span></a>
      </div>
    </div>
    ${mapBlock(l)}
  </div>
</section>`;
  return layout({
    l, file, pageKey: 'home', altFile: PAGES.home[other(l)], body, noCta: true,
    title: tr ? 'Güzelyalı Veteriner Kliniği | Adana kedi ve köpek veterineri' : 'Güzelyalı Veterinary Clinic | Cat and dog vet in Adana',
    description: tr ? 'Adana’da kedi ve köpekler için muayene, ultrasonografi, röntgen, cerrahi, yoğun bakım, diş tedavisi, aşılama ve pet shop. Kurucu: Veteriner Hekim Salim Hakveren.' : 'Examinations, ultrasound, X-ray, surgery, intensive care, dental care, vaccinations and a pet shop for cats and dogs in Adana. Founded by veterinarian Salim Hakveren.',
  });
}

function about(l) {
  const file = PAGES.about[l];
  const u = UI[l];
  const tr = l === 'tr';
  const t = (k) => T(ABOUT, k, l);
  const body = `
${pageHero(file, l, [[u.nav.about]], u.nav.about, esc(t('title')), esc(t('intro')))}

<section class="sec" aria-label="${tr ? 'Kliniğimiz' : 'Our clinic'}">
  <div class="wrap split split--story">
    <div class="split__text story">
${(ABOUT.paragraphs || []).map((p) => T(p, 'text', l)).filter(Boolean).map((p) => `      <p>${esc(p)}</p>`).join('\n')}
      <a class="btn btn--outline" href="${rel(file, PAGES.services[l])}">${tr ? 'Hizmetlerimizi inceleyin' : 'See our services'}</a>
    </div>
    <div class="split__media">${pic(file, ABOUT.clinic_photo, t('clinic_photo_alt'), { sizes: '(max-width: 900px) 100vw, 45vw' })}</div>
  </div>
</section>

<section class="sec sec--surface" aria-labelledby="vet-title">
  <div class="wrap split split--doc">
    <figure class="split__media portrait">${salim(file, (tr ? 'Veteriner Hekim ' : 'Veterinarian ') + CLINIC.vet, { sizes: '(max-width: 760px) 100vw, 45vw' })}</figure>
    <div class="split__text">
      <p class="eyebrow">${tr ? 'Kurucu veteriner hekim' : 'Founding veterinarian'}</p>
      <h2 id="vet-title">${esc(CLINIC.vet)}</h2>
      <p>${esc(t('vet_text'))}</p>
      <a class="btn btn--primary" href="${wa(u.waText)}" ${ext}>${I.wa}<span>${u.bookWa}</span></a>
    </div>
  </div>
</section>`;
  return layout({
    l, file, pageKey: 'about', altFile: PAGES.about[other(l)], body,
    title: tr ? 'Hakkımızda | Güzelyalı Veteriner Kliniği' : 'About | Güzelyalı Veterinary Clinic',
    description: t('intro'),
  });
}

function services(l) {
  const file = PAGES.services[l];
  const u = UI[l];
  const tr = l === 'tr';
  const all = SERVICES;
  const body = `
${pageHero(file, l, [[u.nav.services]], tr ? 'Kedi ve köpekler için' : 'For cats and dogs', tr ? 'Hizmetlerimiz' : 'Our services',
  tr ? 'Muayene ve teşhisten cerrahi ve yoğun bakıma, beslenme danışmanlığından pet shop’a. Her hizmet için WhatsApp’tan randevu alabilirsiniz.' : 'From examination and diagnosis to surgery and intensive care, from nutrition advice to our pet shop. You can book any service on WhatsApp.')}

<section class="sec sec--tight">
  <div class="wrap svc-layout">
    <nav class="svc-index" aria-label="${u.nav.services}">
      <ol>
${all.map((s, i) => `        <li><a href="#${svcAnchor(s, l)}" data-spy="${svcAnchor(s, l)}"><span>${String(i + 1).padStart(2, '0')}</span>${svcText(s, l).title}</a></li>`).join('\n')}
      </ol>
    </nav>
    <div class="svc-list">
${all.map((s, i) => {
  const t = svcText(s, l);
  const shop = !!t.cta;
  const msg = t.msg ? t.msg : tr ? `Merhaba, ${t.title.toLocaleLowerCase('tr')} için randevu almak istiyorum.` : `Hello, I would like to book: ${t.title.toLowerCase()}.`;
  return `      <article class="svc" id="${svcAnchor(s, l)}">
        <div class="svc__img">${pic(file, s.photo, '', { sizes: '(max-width: 900px) 100vw, 40vw' })}<span class="svc-icon svc-icon--badge">${svcIcon(s)}</span></div>
        <div class="svc__body">
          <h2><span class="num">${String(i + 1).padStart(2, '0')}</span>${t.title}</h2>
          <p>${esc(t.body)}</p>
${t.points.length ? `          <ul class="checks">
${t.points.map((p) => `            <li>${I.check}<span>${p}</span></li>`).join('\n')}
          </ul>` : ''}
          <a class="btn btn--outline btn--sm" href="${wa(msg)}" ${ext}>${I.wa}<span>${shop ? esc(t.cta) : tr ? 'Bu hizmet için randevu al' : 'Book this service'}</span></a>
        </div>
      </article>`;
}).join('\n')}
    </div>
  </div>
</section>

<section class="sec sec--surface" aria-labelledby="faq-title">
  <div class="wrap faq-wrap">
    <div>
      <h2 id="faq-title">${tr ? 'Sıkça sorulan sorular' : 'Frequently asked questions'}</h2>
      <p class="muted">${tr ? 'Aradığınız cevap burada yoksa WhatsApp’tan yazın.' : 'If your question is not here, message us on WhatsApp.'}</p>
    </div>
    <div class="faq">
${FAQ[l].map(([q, a], i) => `      <details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
    </div>
  </div>
</section>`;
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ[l].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  return layout({
    l, file, pageKey: 'services', altFile: PAGES.services[other(l)], body, jsonld: [faqLd],
    title: tr ? 'Hizmetlerimiz | Güzelyalı Veteriner Kliniği' : 'Services | Güzelyalı Veterinary Clinic',
    description: tr ? 'Muayene, teşhis ve tedavi; ultrasonografi ve röntgen; cerrahi; yoğun bakım; diş tedavisi; aşılama; beslenme danışmanlığı; tıraş ve pet shop. Adana.' : 'Examination and treatment, ultrasound and X-ray, surgery, intensive care, dental care, vaccinations, nutrition advice, grooming and a pet shop in Adana.',
  });
}

function blog(l) {
  const file = PAGES.blog[l];
  const u = UI[l];
  const tr = l === 'tr';
  const [first, ...rest] = postsIn(l);
  const body = `
${pageHero(file, l, [['Blog']], tr ? 'Hasta sahipleri için' : 'For pet owners', 'Blog',
  tr ? 'Aşı takviminden diş bakımına, kedi ve köpek sahiplerinin en çok sorduğu konularda kısa rehberler.' : 'Short guides on the questions cat and dog owners ask most, from vaccine schedules to dental care.')}

<section class="sec sec--tight">
  <div class="wrap">
    ${first ? postCard(file, first, l, { big: true }) : `<p class="lead">${tr ? 'Yakında burada yazılar olacak.' : 'Articles are coming soon.'}</p>`}
    <div class="posts posts--two">
${rest.map((p) => postCard(file, p, l)).join('\n')}
    </div>
  </div>
</section>`;
  return layout({
    l, file, pageKey: 'blog', altFile: PAGES.blog[other(l)], body,
    title: tr ? 'Blog | Güzelyalı Veteriner Kliniği' : 'Blog | Güzelyalı Veterinary Clinic',
    description: tr ? 'Kedi ve köpek sahipleri için aşı, parazit ve diş bakımı rehberleri.' : 'Guides on vaccinations, parasites and dental care for cat and dog owners.',
  });
}

function post(p, l) {
  const file = postFile(p, l);
  const u = UI[l];
  const t = p[l];
  const tr = l === 'tr';
  const related = postsIn(l).filter((x) => x !== p).slice(0, 2);
  const body = `
<article class="article">
  <header class="article__head">
    <div class="wrap wrap--narrow">
      <nav class="crumbs" aria-label="${u.breadcrumb}"><ol>
        <li><a href="${rel(file, PAGES.home[l])}">${u.home}</a></li>
        <li><a href="${rel(file, PAGES.blog[l])}">Blog</a></li>
        <li><span aria-current="page">${t.title}</span></li>
      </ol></nav>
      <div data-enter>
        <p class="meta"><span class="tag">${t.tag}</span><time datetime="${p.date}">${fmtDate(p.date, l)}</time><span>${u.minRead(readMins(t.body))}</span></p>
        <h1>${t.title}</h1>
        <p class="lead">${t.excerpt}</p>
        <p class="byline"><img class="byline__icon" src="${rel(file, 'assets/img/logo/logo-ikon.svg')}" width="447" height="413" alt=""><span>${u.by}</span></p>
      </div>
    </div>
  </header>
  <div class="wrap wrap--narrow">
    <figure class="article__cover">${pic(file, p.cover, t.alt, { eager: true, sizes: '(max-width: 860px) 100vw, 820px' })}</figure>
    <div class="prose">
${t.body.trim()}
      <aside class="callout">${u.note}</aside>
    </div>
    <aside class="post-cta">
      <div>
        <h2>${u.postCta}</h2>
        <p>${u.postCtaText}</p>
      </div>
      <a class="btn btn--primary" href="${wa(tr ? `Merhaba, "${t.title}" yazısıyla ilgili bir sorum var.` : `Hello, I have a question about "${t.title}".`)}" ${ext}>${I.wa}<span>${tr ? 'WhatsApp’tan sor' : 'Ask on WhatsApp'}</span></a>
    </aside>
  </div>
</article>

${related.length ? `<section class="sec sec--surface" aria-labelledby="rel-title">
  <div class="wrap">
    <div class="sec-head">
      <div><h2 id="rel-title">${u.related}</h2></div>
      <a class="link-arrow" href="${rel(file, PAGES.blog[l])}">${u.allPosts} ${I.arrow}</a>
    </div>
    <div class="posts posts--two">
${related.map((x) => postCard(file, x, l)).join('\n')}
    </div>
  </div>
</section>` : ''}`;
  const articleLd = { '@context': 'https://schema.org', '@type': 'Article', mainEntityOfPage: url(file), image: `${SITE_URL}/${images.get(p.cover).og}`, headline: t.title, description: t.excerpt, datePublished: p.date, inLanguage: l, author: { '@type': 'Organization', name: CLINIC.name }, publisher: { '@type': 'Organization', name: CLINIC.name } };
  return layout({
    l, file, pageKey: 'post', altFile: l === 'tr' && !p.en ? PAGES.blog.en : postFile(p, other(l)), body, jsonld: [articleLd],
    title: titleFor(t.title, l),
    description: t.excerpt,
    ogImage: images.get(p.cover).og,
  });
}

function contact(l) {
  const file = PAGES.contact[l];
  const u = UI[l];
  const tr = l === 'tr';
  const body = `
${pageHero(file, l, [[u.nav.contact]], 'Adana', u.nav.contact,
  tr ? 'Randevu ve sorularınız için WhatsApp’tan yazabilir, telefonla arayabilir ya da kliniğe uğrayabilirsiniz.' : 'For appointments and questions, message us on WhatsApp, call, or drop by the clinic.')}

<section class="sec sec--tight">
  <div class="wrap contact">
    <div class="contact__info">
      <ul class="channels">
        <li><a class="channel" href="${wa(u.waText)}" ${ext}><span class="channel__icon channel__icon--wa">${I.wa}</span><span><small>WhatsApp</small><b>${tr ? CLINIC.phoneShow : CLINIC.phoneShowEn}</b></span>${I.arrow}</a></li>
        <li><a class="channel" href="tel:${CLINIC.phone}"><span class="channel__icon">${I.phone}</span><span><small>${tr ? 'Telefon' : 'Phone'}</small><b>${tr ? CLINIC.phoneShow : CLINIC.phoneShowEn}</b></span>${I.arrow}</a></li>
${CLINIC.email ? `        <li><a class="channel" href="mailto:${CLINIC.email}"><span class="channel__icon">${I.mail}</span><span><small>${tr ? 'E-posta' : 'Email'}</small><b>${CLINIC.email}</b></span>${I.arrow}</a></li>
` : ''}        <li><a class="channel" href="${CLINIC.maps}" ${ext}><span class="channel__icon">${I.pin}</span><span><small>${tr ? 'Adres' : 'Address'}</small><b>${CLINIC.street}</b><em>${CLINIC.district}</em></span>${I.arrow}</a></li>
        <li><a class="channel" href="${CLINIC.instagram}" ${ext}><span class="channel__icon">${I.ig}</span><span><small>Instagram</small><b>${CLINIC.igHandle}</b></span>${I.arrow}</a></li>
      </ul>
      <div class="hours-card">
        <div class="hours-card__head"><h2>${u.footerHours}</h2><p class="open-badge" data-open-now><i aria-hidden="true"></i><span>${u.hoursShort}</span></p></div>
        ${hoursTable(l)}
      </div>
    </div>

    <form class="form" data-wa-form action="${CLINIC.wa}" method="get" target="_blank" novalidate>
      <h2>${tr ? 'Randevu talebi' : 'Appointment request'}</h2>
      <p class="muted">${tr ? 'Formu doldurun; mesajınız WhatsApp’ta hazır olarak açılır, göndermeyi siz yaparsınız.' : 'Fill in the form and your message opens ready in WhatsApp; you send it yourself.'}</p>
      <div class="field">
        <label for="f-name">${tr ? 'Adınız' : 'Your name'}</label>
        <input id="f-name" name="name" type="text" autocomplete="name" required>
        <p class="field__err" id="f-name-err" hidden>${tr ? 'Lütfen adınızı yazın.' : 'Please enter your name.'}</p>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="f-pet">${tr ? 'Hayvanınız' : 'Your pet'}</label>
          <select id="f-pet" name="pet">
            <option>${tr ? 'Kedi' : 'Cat'}</option>
            <option>${tr ? 'Köpek' : 'Dog'}</option>
          </select>
        </div>
        <div class="field">
          <label for="f-svc">${tr ? 'Hizmet' : 'Service'}</label>
          <select id="f-svc" name="service">
${SERVICES.filter((s) => !svcText(s, l).cta).map((s) => `            <option>${esc(svcText(s, l).title)}</option>`).join('\n')}
            <option>${tr ? 'Diğer' : 'Other'}</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="f-msg">${tr ? 'Kısaca şikâyet ya da not' : 'Reason for the visit'} <span class="muted">(${tr ? 'isteğe bağlı' : 'optional'})</span></label>
        <textarea id="f-msg" name="note" rows="4"></textarea>
      </div>
      <input type="hidden" name="text" value="${esc(u.waText)}">
      <button class="btn btn--primary" type="submit">${I.wa}<span>${tr ? 'WhatsApp’ta hazırla' : 'Prepare in WhatsApp'}</span></button>
      <p class="form__note">${u.formNote(`<a href="${rel(file, PAGES.kvkk[l])}">${u.legal.kvkk}</a>`)}</p>
    </form>
  </div>
</section>

<section class="sec sec--surface sec--tight" aria-label="${u.mapTitle}">
  <div class="wrap find">
    <figure class="find__photo">${pic(file, CLINIC.contactPhoto, CLINIC.contactPhotoAlt[l], { sizes: '(max-width: 900px) 100vw, 45vw' })}</figure>
    ${mapBlock(l)}
  </div>
</section>`;
  return layout({
    l, file, pageKey: 'contact', altFile: PAGES.contact[other(l)], body, noCta: true,
    title: tr ? 'İletişim | Güzelyalı Veteriner Kliniği' : 'Contact | Güzelyalı Veterinary Clinic',
    description: tr ? `${CLINIC.street}, ${CLINIC.district}. Telefon ve WhatsApp: ${CLINIC.phoneShow}. ${UI.tr.hoursShort}.` : `${CLINIC.street}, ${CLINIC.district}. Phone and WhatsApp: ${CLINIC.phoneShowEn}. ${UI.en.hoursShort}.`,
  });
}

function legal(l, key) {
  const file = PAGES[key][l];
  const u = UI[l];
  const doc = LEGALDOCS[key][l];
  const body = `
${pageHero(file, l, [[u.legal[key]]], '', esc(doc.title), `${u.lastUpdated}: ${fmtDate(LEGALDOCS[key].updated, l)}`)}

<section class="sec sec--tight">
  <div class="wrap wrap--narrow">
    <div class="prose legal">
${doc.body.trim()}
    </div>
  </div>
</section>`;
  return layout({
    l, file, pageKey: key, altFile: PAGES[key][other(l)], body, noCta: true,
    title: titleFor(doc.title, l),
    description: l === 'tr' ? `${CLINIC.name} ${doc.title.toLocaleLowerCase('tr')}.` : `${doc.title} of Güzelyalı Veterinary Clinic.`,
  });
}

// "Page not found". Netlify serves dist/404.html for any missing address, at any depth,
// so the page gets <base href="/"> and its links resolve from the site root.
function notFound() {
  const file = '404.html';
  const l = 'tr';
  const u = UI.tr;
  const body = `
<section class="sec nf">
  <div class="wrap nf__in">
    <p class="eyebrow">404</p>
    <h1>Aradığınız sayfa bulunamadı</h1>
    <p class="lead">Sayfanın adresi değişmiş ya da kaldırılmış olabilir. Aşağıdaki bağlantılardan devam edebilir ya da bize WhatsApp'tan yazabilirsiniz.</p>
    <div class="btns">
      <a class="btn btn--primary" href="${PAGES.home.tr}">Anasayfaya dön</a>
      <a class="btn btn--outline" href="${PAGES.services.tr}">Hizmetlerimiz</a>
      <a class="btn btn--outline" href="${PAGES.contact.tr}">İletişim</a>
    </div>
    <p class="nf__en" lang="en">Page not found. <a href="${PAGES.home.en}">Go to the English homepage</a>.</p>
  </div>
</section>`;
  return layout({ l, file, pageKey: '404', altFile: PAGES.home.en, body, noCta: true, title: 'Sayfa bulunamadı | Güzelyalı Veteriner Kliniği', description: 'Aradığınız sayfa bulunamadı.' })
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">\n<meta name="robots" content="noindex">')
    .replace(/<link rel="canonical"[^>]*>\n/, '')
    .replace(/<link rel="alternate" hreflang[^>]*>\n/g, '')
    .replace('href="#main"', 'href="/404.html#main"');
}

// ---------- write ----------
function write(file, html) {
  const out = path.join(OUT, file);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
// Static files the pages use, plus the admin panel and the clinic's original uploads (the panel shows them).
for (const p of ['assets/css', 'assets/js', 'assets/img/uploads', 'assets/img/logo', 'assets/fonts', 'admin', 'favicon.svg', 'apple-touch-icon.png', 'share.jpg']) {
  if (existsSync(path.join(ROOT, p))) cpSync(path.join(ROOT, p), path.join(OUT, p), { recursive: true });
}
for (const f of readdirSync(path.join(ROOT, 'assets/img')).filter((f) => f.startsWith('kedi-'))) {
  cpSync(path.join(ROOT, 'assets/img', f), path.join(OUT, 'assets/img', f));
}
cpSync(C.CACHE, path.join(OUT, 'assets/img/r'), { recursive: true });

let pages = 0;
for (const l of LANGS) {
  write(PAGES.home[l], home(l));
  write(PAGES.about[l], about(l));
  write(PAGES.services[l], services(l));
  write(PAGES.blog[l], blog(l));
  write(PAGES.contact[l], contact(l));
  for (const k of LEGAL) write(PAGES[k][l], legal(l, k));
  pages += 5 + LEGAL.length;
  for (const p of postsIn(l)) { write(postFile(p, l), post(p, l)); pages++; }
}
write('404.html', notFound());
// sitemap.xml lists every page; robots.txt points to it and keeps the panel out of search results.
const today = new Date().toISOString().slice(0, 10);
const entries = [];
for (const l of LANGS) {
  for (const k of Object.keys(PAGES)) entries.push([PAGES[k][l], today]);
  for (const p of postsIn(l)) entries.push([postFile(p, l), p.date]);
}
writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(([f, d]) => `  <url><loc>${url(f)}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${SITE_URL}/sitemap.xml
`);
console.log(`Site hazır: ${pages} sayfa, ${images.size} fotoğraf -> dist/`);
