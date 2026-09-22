import { cpSync, mkdirSync } from "node:fs";
const root = new URL("../public/pdf-assets/", import.meta.url);
mkdirSync(root, { recursive: true });
for (const dir of ["cmaps", "standard_fonts", "wasm"]) {
  cpSync(
    new URL(`../node_modules/pdfjs-dist/${dir}`, import.meta.url),
    new URL(dir, root),
    { recursive: true },
  );
}
