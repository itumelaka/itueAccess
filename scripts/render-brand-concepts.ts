import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const designDir = resolve(root, "design/visual-identity");
const outputDir = resolve(root, "../outputs/brand-concepts");
const boardPath = resolve(root, "../outputs/itu-eaccess-brand-concepts.png");
const concepts = [
  ["A1", "DVS Pixel Circuit", "a1-dvs-pixel-circuit.svg"],
  ["A2", "DVS Access Gate", "a2-dvs-access-gate.svg"],
  ["B1", "ITU Circuit Shield", "b1-itu-circuit-shield.svg"],
  ["B2", "eAccess Monogram", "b2-eaccess-monogram.svg"],
] as const;

async function main() {
await mkdir(outputDir, { recursive: true });

const rendered: Array<{ code: string; name: string; dataUri: string }> = [];
for (const [code, name, filename] of concepts) {
  const source = await readFile(resolve(designDir, filename));
  const png = await sharp(source).resize(512, 512).png().toBuffer();
  const metadata = await sharp(png).metadata();
  if (metadata.width !== 512 || metadata.height !== 512 || metadata.channels !== 4) {
    throw new Error(`${filename} did not render as a 512×512 RGBA icon.`);
  }
  await writeFile(resolve(outputDir, basename(filename, ".svg") + ".png"), png);
  rendered.push({ code, name, dataUri: `data:image/png;base64,${png.toString("base64")}` });
}

const cards = rendered.map((item, index) => {
  const x = index % 2 === 0 ? 70 : 815;
  const y = index < 2 ? 190 : 700;
  const recommended = item.code === "B1";
  return `<g transform="translate(${x} ${y})">
    <rect width="715" height="450" rx="32" fill="#FFFFFF" stroke="${recommended ? "#FFF200" : "#DCE5F2"}" stroke-width="${recommended ? 8 : 2}"/>
    ${recommended ? '<rect x="535" y="24" width="145" height="38" rx="19" fill="#FFF200"/><text x="607" y="49" text-anchor="middle" font-size="17" font-weight="800" fill="#1D388C">CADANGAN</text>' : ""}
    <image href="${item.dataUri}" x="34" y="34" width="145" height="145"/>
    <text x="205" y="65" font-size="18" font-weight="800" letter-spacing="3" fill="#E6002D">${item.code}</text>
    <text x="205" y="105" font-size="30" font-weight="800" fill="#10233F">${item.name}</text>
    <text x="205" y="140" font-size="18" fill="#617187">ITU eAccess · Masuk mudah, rekod teratur.</text>
    <rect x="34" y="205" width="647" height="210" rx="24" fill="#F3F7FC"/>
    <image href="${item.dataUri}" x="64" y="232" width="58" height="58"/>
    <text x="140" y="269" font-size="25" font-weight="800" fill="#1D388C">ITU eAccess</text>
    <path d="M510 245h105v50h44" fill="none" stroke="#1D388C" stroke-opacity=".18" stroke-width="5"/>
    <circle cx="659" cy="295" r="10" fill="#FFF200" stroke="#1D388C" stroke-width="4"/>
    <text x="64" y="335" font-size="29" font-weight="800" fill="#10233F">Rekod akses, lebih teratur.</text>
    <rect x="64" y="360" width="190" height="37" rx="12" fill="#1D388C"/>
    <text x="159" y="385" text-anchor="middle" font-size="15" font-weight="700" fill="#FFFFFF">Log masuk dengan Google</text>
  </g>`;
}).join("");

const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
  <rect width="1600" height="1200" fill="#E9EFF8"/>
  <text x="70" y="84" font-family="Segoe UI,Arial,sans-serif" font-size="46" font-weight="800" fill="#10233F">ITU eAccess — Perbandingan Identiti</text>
  <text x="70" y="126" font-family="Segoe UI,Arial,sans-serif" font-size="23" fill="#56677E">Empat konsep · warna DVS · jaluran litar elektronik · ikon PWA tanpa tulisan kecil</text>
  <g font-family="Segoe UI,Arial,sans-serif">${cards}</g>
</svg>`;

await sharp(Buffer.from(board)).png().toFile(boardPath);
console.log(`Rendered 4 icons to ${outputDir}`);
console.log(`Rendered comparison board to ${boardPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Brand rendering failed.");
  process.exitCode = 1;
});
