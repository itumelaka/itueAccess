import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";

import { LoginHero } from "../src/features/brand/login-hero";

async function main() {
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const outputPath = join(projectRoot, "..", "outputs", "itu-eaccess-selected-login.html");
  const css = await readFile(join(projectRoot, "src", "app", "globals.css"), "utf8");
  const logo = await readFile(join(projectRoot, "public", "brand", "itu-eaccess-mark.svg"), "utf8");
  const markup = renderToStaticMarkup(<LoginHero />)
    .replace("/brand/itu-eaccess-mark.svg", `data:image/svg+xml,${encodeURIComponent(logo)}`);

  await writeFile(outputPath, `<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ITU eAccess Preview</title><style>${css.replace('@import "tailwindcss";', "")}</style></head><body>${markup}</body></html>`);
  console.log(outputPath);
}

void main();
