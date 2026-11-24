// Reads everything the clinic edits in the admin panel (content/*.yml, content/blog/*.md)
// and prepares every photo it names: resized copies for the page, cached in .cache/img.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { marked } from 'marked';
import sharp from 'sharp';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT = path.join(ROOT, 'content');
const CACHE = path.join(ROOT, '.cache', 'img');
const WIDTHS = [480, 800, 1200];

const readYaml = (f) => yaml.load(fs.readFileSync(path.join(CONTENT, f), 'utf8')) || {};
const clean = (s) => (s == null ? '' : String(s).trim());

// Turkish-aware slug: "Ağız ve Diş Sağlığı" -> "agiz-ve-dis-sagligi".
export function slugify(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', i̇: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
  return clean(s).toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, (c) => map[c] || c)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  return m ? { data: yaml.load(m[1]) || {}, body: m[2] } : { data: {}, body: text };
}

// Markdown from the panel to HTML. A quote ("> ...") becomes the highlighted warning box.
function markdown(src) {
  return marked.parse(clean(src), { gfm: true, breaks: false })
    .replace(/<blockquote>/g, '<blockquote class="callout callout--warn">');
}

function isoDate(d) {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return clean(d).slice(0, 10);
}

// ---------- photos ----------
// Every photo path in the content ("/assets/img/uploads/x.jpg") gets 480/800/1200 px WebP copies
// (never upscaled) and a 1200 px JPEG for link previews.
async function prepareImages(paths) {
  fs.mkdirSync(CACHE, { recursive: true });
  const map = new Map();
  for (const src of paths) {
    const file = path.join(ROOT, src.replace(/^\//, ''));
    if (!fs.existsSync(file)) throw new Error(`Fotoğraf bulunamadı: ${src}`);
    const buf = fs.readFileSync(file);
    const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
    const base = slugify(path.basename(file, path.extname(file))) || 'foto';
    const meta = await sharp(buf).rotate().metadata();
    const portrait = (meta.orientation || 1) >= 5;
    const w0 = portrait ? meta.height : meta.width;
    const h0 = portrait ? meta.width : meta.height;
    const widths = WIDTHS.filter((w) => w < w0);
    if (!widths.length || widths[widths.length - 1] < Math.min(w0, 1200)) widths.push(Math.min(w0, 1200));
    const variants = [];
    for (const w of widths) {
      const name = `${base}-${hash}-${w}.webp`;
      const out = path.join(CACHE, name);
      if (!fs.existsSync(out)) await sharp(buf).rotate().resize({ width: w }).webp({ quality: 78 }).toFile(out);
      variants.push({ w, file: `assets/img/r/${name}` });
    }
    const ogName = `${base}-${hash}-og.jpg`;
    if (!fs.existsSync(path.join(CACHE, ogName))) {
      await sharp(buf).rotate().resize({ width: 1200, height: 630, fit: 'cover' }).jpeg({ quality: 80 }).toFile(path.join(CACHE, ogName));
    }
    const last = variants[variants.length - 1];
    map.set(src, { w: last.w, h: Math.round((h0 / w0) * last.w), variants, og: `assets/img/r/${ogName}` });
  }
  return map;
}

// ---------- load ----------
export async function loadContent() {
  const S = readYaml('ayarlar.yml');
  const HOME = readYaml('anasayfa.yml');
  const ABOUT = readYaml('hakkimizda.yml');
  const svc = readYaml('hizmetler.yml');
  const faq = readYaml('sss.yml');
  const rev = readYaml('yorumlar.yml');

  const digits = clean(S.phone).replace(/[^\d]/g, '');
  const local = clean(S.phone_display);
  const rating = Number(S.rating) || 0;
  const igUrl = clean(S.instagram);
  const CLINIC = {
    name: 'Güzelyalı Veteriner Kliniği',
    vet: clean(ABOUT.vet_name) || 'Salim Hakveren',
    phone: '+' + digits,
    phoneShow: local,
    phoneShowEn: '+90 ' + local.replace(/^0/, ''),
    phoneIntl: '+' + digits,
    wa: `https://wa.me/${digits}`,
    maps: clean(S.maps_link),
    mapsEmbed: 'https://www.google.com/maps?q=G%C3%BCzelyal%C4%B1+Veteriner+Klini%C4%9Fi,+Anadolu+Lisesi+Cd.,+%C3%87ukurova,+Adana&z=16&output=embed',
    instagram: igUrl,
    email: clean(S.email),
    igHandle: '@' + (igUrl.replace(/\/+$/, '').split('/').pop() || ''),
    rating: { tr: rating.toFixed(1).replace('.', ','), en: rating.toFixed(1) },
    ratingNum: rating,
    reviews: Number(S.review_count) || 0,
    street: clean(S.street),
    district: clean(S.district),
    waText: { tr: clean(S.whatsapp_message), en: clean(S.whatsapp_message_en) || clean(S.whatsapp_message) },
    hoursShort: { tr: clean(S.hours_summary), en: clean(S.hours_summary_en) || clean(S.hours_summary) },
    contactPhoto: clean(S.contact_photo),
    contactPhotoAlt: { tr: clean(S.contact_photo_alt), en: clean(S.contact_photo_alt_en) || clean(S.contact_photo_alt) },
  };

  // Opening hours, indexed by JavaScript day number (0 = Sunday).
  const DAY_INDEX = { pazar: 0, pazartesi: 1, sali: 2, carsamba: 3, persembe: 4, cuma: 5, cumartesi: 6 };
  const HOURS = Array(7).fill(null);
  for (const h of S.hours || []) {
    const i = DAY_INDEX[slugify(h.day).replace(/-/g, '')];
    if (i == null) continue;
    HOURS[i] = h.open ? { from: clean(h.from), to: clean(h.to) } : null;
  }

  const pick = (o, k, l) => (l === 'en' ? clean(o[k + '_en']) || clean(o[k]) : clean(o[k]));
  const SERVICES = (svc.items || []).map((s) => {
    const side = (l) => ({
      title: pick(s, 'title', l),
      short: pick(s, 'short', l),
      body: pick(s, 'body', l),
      points: (s.points || []).map((p) => pick(p, 'text', l)).filter(Boolean),
      cta: pick(s, 'button', l),
      msg: pick(s, 'message', l),
    });
    return {
      icon: clean(s.icon) || 'steth',
      photo: clean(s.photo),
      anchor: { tr: slugify(s.title), en: slugify(s.title_en || s.title) },
      tr: side('tr'),
      enT: side('en'),
    };
  });

  const FAQ = { tr: [], en: [] };
  for (const f of faq.items || []) {
    if (clean(f.question) && clean(f.answer)) FAQ.tr.push([clean(f.question), clean(f.answer)]);
    if (clean(f.question_en) && clean(f.answer_en)) FAQ.en.push([clean(f.question_en), clean(f.answer_en)]);
  }

  const REVIEWS = (rev.items || []).filter((r) => clean(r.text)).map((r) => ({ name: clean(r.name), tr: clean(r.text), en: clean(r.text_en) || clean(r.text) }));

  // Blog posts: content/blog/<slug>.md. The file name is the Turkish address; English is optional.
  const POSTS = [];
  const dir = path.join(CONTENT, 'blog');
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    if (!f.endsWith('.md')) continue;
    const { data: d, body } = frontMatter(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (d.draft === true) continue;
    const hasEn = clean(d.title_en) && clean(d.body_en);
    POSTS.push({
      slug: { tr: f.replace(/\.md$/, ''), en: hasEn ? clean(d.slug_en) || slugify(d.title_en) : null },
      date: isoDate(d.date),
      cover: clean(d.cover),
      tr: { title: clean(d.title), tag: clean(d.tag), excerpt: clean(d.excerpt), alt: clean(d.cover_alt), body: markdown(body) },
      en: hasEn ? { title: clean(d.title_en), tag: clean(d.tag_en) || clean(d.tag), excerpt: clean(d.excerpt_en), alt: clean(d.cover_alt_en) || clean(d.cover_alt), body: markdown(d.body_en) } : null,
    });
  }
  POSTS.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Legal pages: content/yasal/*.md. {{unvan}}, {{adres}}, {{eposta}}, {{telefon}} and {{site}} are filled from the settings.
  const fill = (t) => clean(t)
    .replace(/\{\{unvan\}\}/g, clean(S.legal_name) || CLINIC.name)
    .replace(/\{\{adres\}\}/g, `${CLINIC.street}, ${CLINIC.district}`)
    .replace(/\{\{eposta\}\}/g, CLINIC.email)
    .replace(/\{\{telefon\}\}/g, CLINIC.phoneShow)
    .replace(/\{\{site\}\}/g, 'adanaguzelyaliveteriner.com');
  const legalMd = (src) => marked.parse(fill(src), { gfm: true, breaks: true });
  const LEGALDOCS = {};
  for (const [key, file] of [['kvkk', 'kvkk.md'], ['cookies', 'cerez.md']]) {
    const { data: d, body } = frontMatter(fs.readFileSync(path.join(CONTENT, 'yasal', file), 'utf8'));
    LEGALDOCS[key] = {
      updated: isoDate(d.updated),
      tr: { title: clean(d.title), body: legalMd(body) },
      en: { title: clean(d.title_en) || clean(d.title), body: legalMd(d.body_en || body) },
    };
  }

  const photos = new Set([
    clean(ABOUT.vet_photo), clean(ABOUT.clinic_photo), clean(HOME.booking_photo), CLINIC.contactPhoto,
    ...SERVICES.map((s) => s.photo), ...POSTS.map((p) => p.cover),
  ].filter(Boolean));
  const images = await prepareImages([...photos]);

  return { CLINIC, HOURS, SERVICES, FAQ, REVIEWS, POSTS, HOME, ABOUT, LEGALDOCS, images, CACHE, pickText: pick };
}
