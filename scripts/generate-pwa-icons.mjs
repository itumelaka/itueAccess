import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(projectRoot, "design", "visual-identity", "itu-eaccess-ea-shield.svg");
const publicBrand = join(projectRoot, "public", "brand", "itu-eaccess-mark.svg");
const iconSizes = [192, 512];

await mkdir(dirname(publicBrand), { recursive: true });
await copyFile(source, publicBrand);

const mark = await readFile(source);

for (const size of iconSizes) {
  const inset = Math.round(size * 0.08);
  const roundedBackground = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#F3F7FC"/></svg>`,
  );
  const renderedMark = await sharp(mark, { density: 1200 })
    .resize(size - inset * 2, size - inset * 2, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp(roundedBackground)
    .composite([{ input: renderedMark, left: inset, top: inset }])
    .png()
    .toFile(join(projectRoot, "public", `icon-${size}.png`));
}

console.log(`Generated ${iconSizes.map((size) => `${size}x${size}`).join(" and ")} ITU eAccess icons.`);
