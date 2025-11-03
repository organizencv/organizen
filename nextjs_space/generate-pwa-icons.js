// Script para gerar ícones PWA básicos
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Template SVG do ícone OrganiZen
const createIconSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#1e40af"/>
  <text x="${size/2}" y="${size * 0.7}" font-family="Arial, sans-serif" font-size="${size * 0.55}" font-weight="bold" fill="#ffffff" text-anchor="middle">OZ</text>
</svg>`;

// Template SVG maskable (com padding)
const createMaskableIconSVG = (size) => {
  const innerSize = size * 0.8;
  const offset = (size - innerSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#ffffff"/>
  <rect x="${offset}" y="${offset}" width="${innerSize}" height="${innerSize}" fill="#1e40af"/>
  <text x="${size/2}" y="${size * 0.7}" font-family="Arial, sans-serif" font-size="${size * 0.44}" font-weight="bold" fill="#ffffff" text-anchor="middle">OZ</text>
</svg>`;
};

// Criar ícones normais
sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `public/icon-${size}x${size}.png.svg`;
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

// Criar ícones maskable
[192, 512].forEach(size => {
  const svg = createMaskableIconSVG(size);
  const filename = `public/icon-maskable-${size}x${size}.png.svg`;
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('PWA icons generated successfully!');
