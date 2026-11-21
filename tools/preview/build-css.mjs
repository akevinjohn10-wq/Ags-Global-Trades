import fs from 'node:fs';
import path from 'node:path';
import { compile } from '/opt/npm-tools/node_modules/tailwindcss/dist/lib.mjs';

const root = '/home/claude/ags-global-trades';
const twDir = '/opt/npm-tools/node_modules/tailwindcss';

// Translate the v3 theme into v4 @theme tokens (preview only)
const theme = `
@theme {
  --color-paper:#FFFFFF; --color-space:#05070F; --color-navy:#0A1640; --color-mist:#ECF0F8; --color-haze:#E1E7F4; --color-line:#DCE1EB;
  --color-ink:#1B1E24; --color-ink2:#2E333D; --color-muted:#62677A; --color-soft:#6B7285;
  --color-accent:#0229D5; --color-accent2:#2546E0; --color-sky:#AEBDF3; --color-signal:#F73636;
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif;
  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui, sans-serif;
  --font-mono: -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif;
  --tracking-tightest:-0.02em; --tracking-display:-0.015em; --tracking-eyebrow:0.12em;
  --container-content:1440px;
  --ease-out: cubic-bezier(0.2,0.7,0.2,1); --ease-expo: cubic-bezier(0.16,1,0.3,1);
  --animate-marquee: marquee 40s linear infinite;
  --animate-marquee-fast: marquee 24s linear infinite;
  --animate-marquee-rev: marquee-rev 48s linear infinite;
  --animate-scrollcue: scrollcue 2.2s ease-in-out infinite;
  --animate-blink: blink 1.6s ease-in-out infinite;
  --animate-panelin: panelin .7s cubic-bezier(0.16,1,0.3,1) both;
  --animate-imgin: imgin .9s cubic-bezier(0.16,1,0.3,1) both;
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes marquee-rev { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
  @keyframes scrollcue { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes panelin { 0%{opacity:0;transform:translateY(18px)} 100%{opacity:1;transform:none} }
  @keyframes imgin { 0%{opacity:0;transform:scale(1.06);clip-path:inset(0 0 100% 0)} 100%{opacity:1;transform:scale(1);clip-path:inset(0 0 0 0)} }
}`;

const userCss = fs.readFileSync(`${root}/src/index.css`, 'utf8').replace(/@tailwind [a-z]+;\n?/g, '');
const input = `@import "tailwindcss";\n${theme}\n${userCss}`;

const loadStylesheet = async (id, base) => {
  let p;
  if (id === 'tailwindcss') p = `${twDir}/index.css`;
  else if (id.startsWith('tailwindcss/')) p = `${twDir}/${id.slice('tailwindcss/'.length)}`;
  else p = path.resolve(base, id);
  return { path: p, base: path.dirname(p), content: fs.readFileSync(p, 'utf8') };
};

const compiler = await compile(input, { base: root, loadStylesheet });

// Collect candidate class names from source files
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : /\.(tsx?|html)$/.test(f.name) && files.push(p); } })(`${root}/src`);
files.push(`${root}/index.html`);
const set = new Set();
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/[^\s"'`<>={}()]+(?:\([^\s"'`]*\))?[^\s"'`<>={}]*/g)) set.add(m[0]);
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/"([^"]+)"|'([^']+)'|`([^`]+)`/g)) (m[1]||m[2]||m[3]||'').split(/\s+/).forEach(t => t && set.add(t));
fs.writeFileSync('/tmp/site/app.css', compiler.build([...set]));
console.log('css bytes', fs.statSync('app.css').size, 'candidates', set.size);
