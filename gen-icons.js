const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO_SVG = fs.readFileSync('public/logos/shivansh-app-icon.svg');

async function generate() {
  // Main app icons (any purpose) - just the SVG logo with transparency
  await sharp(LOGO_SVG, { density: 512 })
    .resize(512, 512)
    .png()
    .toFile('public/logos/shivansh-app-icon-512.png');
  console.log('✓ app-icon-512');

  await sharp(LOGO_SVG, { density: 512 })
    .resize(192, 192)
    .png()
    .toFile('public/logos/shivansh-app-icon-192.png');
  console.log('✓ app-icon-192');

  // Maskable icons - need full-bleed background with logo centered at 60% size (safe zone)
  const maskBgSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1A1A"/>
      <stop offset="50%" stop-color="#0B0B0B"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
</svg>`);

  // Create maskable by compositing logo at 60% size on background
  const logo512 = await sharp(LOGO_SVG, { density: 512 }).resize(307, 307).png().toBuffer();
  await sharp(maskBgSvg)
    .composite([{ input: logo512, gravity: 'center' }])
    .png()
    .toFile('public/logos/shivansh-maskable-512.png');
  console.log('✓ maskable-512');

  const logo192 = await sharp(LOGO_SVG, { density: 512 }).resize(115, 115).png().toBuffer();
  const maskBg192 = await sharp(maskBgSvg).resize(192, 192).png().toBuffer();
  await sharp(maskBg192)
    .composite([{ input: logo192, gravity: 'center' }])
    .png()
    .toFile('public/logos/shivansh-maskable-192.png');
  console.log('✓ maskable-192');

  // Apple touch icon - 180x180 with full-bleed dark background
  const logo180 = await sharp(LOGO_SVG, { density: 512 }).resize(108, 108).png().toBuffer();
  const bg180 = await sharp(maskBgSvg).resize(180, 180).png().toBuffer();
  await sharp(bg180)
    .composite([{ input: logo180, gravity: 'center' }])
    .png()
    .toFile('public/logos/shivansh-apple-touch-icon.png');
  console.log('✓ apple-touch-icon');

  // Monochrome icons - white background with black logo
  const monoSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#FFFFFF"/>
  <g transform="translate(256,256)">
    <circle cx="0" cy="0" r="200" fill="none" stroke="#000000" stroke-width="3"/>
    <text x="-80" y="50" font-family="Georgia, 'Times New Roman', serif" font-size="180" font-weight="700" fill="#000000" letter-spacing="-4">S</text>
    <rect x="30" y="-100" width="66" height="10" rx="2" fill="#000000"/>
    <rect x="58" y="-90" width="10" height="160" fill="#000000"/>
    <rect x="30" y="70" width="66" height="10" rx="2" fill="#000000"/>
  </g>
</svg>`);

  await sharp(monoSvg, { density: 512 }).resize(512, 512).png().toFile('public/logos/shivansh-monochrome-512.png');
  console.log('✓ monochrome-512');

  await sharp(monoSvg, { density: 512 }).resize(192, 192).png().toFile('public/logos/shivansh-monochrome-192.png');
  console.log('✓ monochrome-192');

  // Favicons
  await sharp(LOGO_SVG, { density: 512 }).resize(32, 32).png().toFile('public/favicon-32.png');
  console.log('✓ favicon-32');

  await sharp(LOGO_SVG, { density: 512 }).resize(16, 16).png().toFile('public/favicon-16.png');
  console.log('✓ favicon-16');

  console.log('All icons generated successfully!');
}

generate().catch(e => { console.error(e); process.exit(1); });
