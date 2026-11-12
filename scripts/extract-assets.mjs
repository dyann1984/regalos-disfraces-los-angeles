import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_IMAGE =
  "C:/Users/DYANN/.gemini/antigravity/brain/67fcf820-8452-47d4-949c-3f17736c56e5/.user_uploaded/media_1794507384614_1655b851.jpg";

const PUBLIC_DIR = path.resolve("public/images");
const CAT_DIR = path.join(PUBLIC_DIR, "categories");
const PROD_DIR = path.join(PUBLIC_DIR, "products");
const STORE_DIR = path.join(PUBLIC_DIR, "tienda");

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(CAT_DIR, { recursive: true });
fs.mkdirSync(PROD_DIR, { recursive: true });
fs.mkdirSync(STORE_DIR, { recursive: true });

async function cropNormalized(inputBuffer, W, H, rect, outPath) {
  const left = Math.max(0, Math.round(rect.left * W));
  const top = Math.max(0, Math.round(rect.top * H));
  const width = Math.min(W - left, Math.round(rect.width * W));
  const height = Math.min(H - top, Math.round(rect.height * H));

  await sharp(inputBuffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 95 })
    .toFile(outPath);
  console.log(`Saved: ${outPath} (${width}x${height})`);
}

async function run() {
  const inputBuffer = fs.readFileSync(SOURCE_IMAGE);
  const meta = await sharp(inputBuffer).metadata();
  const W = meta.width;
  const H = meta.height;

  // 1. Logos y Banner (Recortando la parte inferior del banner para excluir la taza que decía "Personaliza tu Taza")
  await cropNormalized(
    inputBuffer,
    W,
    H,
    { left: 0.036, top: 0.003, width: 0.202, height: 0.127 },
    path.join(PUBLIC_DIR, "logo-header.jpg")
  );

  await cropNormalized(
    inputBuffer,
    W,
    H,
    { left: 0.048, top: 0.155, width: 0.272, height: 0.265 },
    path.join(PUBLIC_DIR, "logo-banner.jpg")
  );

  // Hero sin la taza inferior de personalización: muestra peluche, rosas, globos y regalo con moño dorado
  await cropNormalized(
    inputBuffer,
    W,
    H,
    { left: 0.582, top: 0.135, width: 0.375, height: 0.205 },
    path.join(PUBLIC_DIR, "hero-gifts.jpg")
  );

  // Eliminar archivos antiguos de personalización si existen
  const obsoleteFiles = [
    path.join(CAT_DIR, "cat-personalizados.jpg"),
    path.join(PROD_DIR, "prod-taza.jpg"),
  ];
  for (const f of obsoleteFiles) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`Removed obsolete file: ${f}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
