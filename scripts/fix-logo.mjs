import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const logoSrc = join(root, 'public', 'logo.png');
const logoOut = join(root, 'public', 'logo-clean.png');
const iconOut = join(root, 'app', 'icon.png');
const faviconOut = join(root, 'app', 'favicon.ico');

async function fixLogo() {
  console.log('🔧 Fixing logo...');

  // Read original and get raw pixels
  const { data, info } = await sharp(logoSrc)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf = Buffer.from(data);
  const threshold = 35;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = buf[idx], g = buf[idx+1], b = buf[idx+2];
      if (r < threshold && g < threshold && b < threshold) {
        buf[idx+3] = 0;
      }
    }
  }

  // Save clean logo as new file
  const cleanBuf = await sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();

  writeFileSync(logoOut, cleanBuf);
  console.log('✅ logo-clean.png created');

  // Generate icon.png
  await sharp(cleanBuf).resize(192, 192).png().toFile(iconOut);
  console.log('✅ icon.png (192x192)');

  // Generate favicon
  await sharp(cleanBuf).resize(32, 32).png().toFile(faviconOut);
  console.log('✅ favicon.ico (32x32)');
}

fixLogo().catch(console.error);
