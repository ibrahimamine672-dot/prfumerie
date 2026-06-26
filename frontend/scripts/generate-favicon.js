const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'logo.svg');
const publicDir = path.join(__dirname, '..', 'public');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'favicon-192x192.png', size: 192 },
];

async function main() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }

  console.log('\nAll favicon PNGs generated successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
