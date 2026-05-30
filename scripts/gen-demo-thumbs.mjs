import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public/demos/thumbs');
fs.mkdirSync(dir, { recursive: true });

const items = [
  ['party-dance', 'dance', '#ec4899', '#7c3aed'],
  ['roller-dance', 'dance', '#f472b6', '#6366f1'],
  ['hype-bounce', 'dance', '#fb7185', '#8b5cf6'],
  ['lobby-groove', 'vtuber', '#22d3ee', '#0891b2'],
  ['victory-royale', 'vtuber', '#38bdf8', '#0284c7'],
  ['greeting-wide', 'vtuber', '#5eead4', '#0d9488'],
  ['cinematic-intro', 'cinematic', '#fbbf24', '#b45309'],
  ['showcase-orbit', 'cinematic', '#fcd34d', '#7c2d12'],
  ['sky-flex', 'cinematic', '#a78bfa', '#4c1d95'],
  ['corner-spotlight', 'cinematic', '#e879f9', '#86198f'],
];

for (const [id, label, c1, c2] of items) {
  const title = id.replace(/-/g, ' ');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="#0a0a0c"/>
  <rect width="320" height="180" fill="url(#g)" opacity="0.35"/>
  <ellipse cx="160" cy="118" rx="52" ry="14" fill="#000" opacity="0.35"/>
  <circle cx="160" cy="72" r="28" fill="#39c5bb" opacity="0.9"/>
  <rect x="138" y="98" width="44" height="48" rx="10" fill="#39c5bb" opacity="0.75"/>
  <text x="16" y="28" fill="#fff" font-family="system-ui,sans-serif" font-size="13" font-weight="700">${label.toUpperCase()}</text>
  <text x="16" y="164" fill="#e4e4e7" font-family="system-ui,sans-serif" font-size="11" opacity="0.85">${title}</text>
</svg>`;
  fs.writeFileSync(path.join(dir, `${id}.svg`), svg);
}

console.log(`Wrote ${items.length} thumbnails to ${dir}`);
