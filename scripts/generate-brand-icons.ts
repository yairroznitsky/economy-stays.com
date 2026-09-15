import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";

const PUBLIC = path.resolve(process.cwd(), "public");
const BRAND_BLUE = "#166534";
const BRAND_YELLOW = "#E8882A";

const buildSvg = (size: number): Buffer => {
  const fontSize = Math.round(size * 0.52);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${BRAND_BLUE}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="${BRAND_YELLOW}">E</text>
</svg>`;
  return Buffer.from(svg);
};

const writePng = async (filename: string, size: number) => {
  const out = path.join(PUBLIC, filename);
  await sharp(buildSvg(size)).png().toFile(out);
  console.log(`Wrote ${out}`);
};

const writeIco = async () => {
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map((size) => sharp(buildSvg(size)).png().toBuffer())
  );

  const headerSize = 6 + sizes.length * 16;
  const imageData: Buffer[] = [];
  let offset = headerSize;

  for (let i = 0; i < sizes.length; i++) {
    const png = pngBuffers[i];
    imageData.push(png);
    offset += png.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  let dataOffset = headerSize;
  for (let i = 0; i < sizes.length; i++) {
    const entryOffset = 6 + i * 16;
    const size = sizes[i];
    const png = pngBuffers[i];
    header.writeUInt8(size === 256 ? 0 : size, entryOffset);
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(png.length, entryOffset + 8);
    header.writeUInt32LE(dataOffset, entryOffset + 12);
    dataOffset += png.length;
  }

  const ico = Buffer.concat([header, ...pngBuffers]);
  const out = path.join(PUBLIC, "favicon.ico");
  writeFileSync(out, ico);
  console.log(`Wrote ${out}`);
};

const main = async () => {
  mkdirSync(PUBLIC, { recursive: true });
  await writePng("favicon-16x16.png", 16);
  await writePng("favicon-32x32.png", 32);
  await writePng("apple-touch-icon.png", 180);
  await writePng("android-chrome-192x192.png", 192);
  await writePng("android-chrome-512x512.png", 512);
  await sharp(buildSvg(512)).webp({ quality: 90 }).toFile(path.join(PUBLIC, "logo-icon.webp"));
  console.log(`Wrote ${path.join(PUBLIC, "logo-icon.webp")}`);
  await writeIco();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
