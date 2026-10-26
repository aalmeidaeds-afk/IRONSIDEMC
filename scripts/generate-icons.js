import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('public/ironside-logo.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Copy icon.svg
fs.writeFileSync(path.resolve('public/icon.svg'), svg);

function renderPng(width, height, outputPath, padRatio = 0) {
  let processedSvg = svg;
  if (padRatio > 0) {
    const pad = Math.round(500 * padRatio);
    const total = 500 + pad * 2;
    // Extract everything between <svg ...> and </svg>
    const inner = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    processedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">
      <rect width="${total}" height="${total}" fill="#09090b" />
      <g transform="translate(${pad}, ${pad})">
        ${inner}
      </g>
    </svg>`;
  }

  const resvg = new Resvg(processedSvg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(path.resolve(outputPath), pngBuffer);
  console.log(`Rendered: ${outputPath} (${width}x${height})`);
}

renderPng(192, 192, 'public/pwa-192x192.png');
renderPng(512, 512, 'public/pwa-512x512.png');
renderPng(512, 512, 'public/pwa-maskable-512x512.png', 0.15); // 15% maskable safe-zone
renderPng(180, 180, 'public/apple-touch-icon.png');

console.log('All PWA icons successfully generated!');
