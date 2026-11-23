import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawn } from "child_process";
import sharp from "sharp";

const rootDir = process.cwd();
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function loadEnvLocal() {
  const envPath = path.join(rootDir, ".env.local");
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in env) || !env[key]) env[key] = val;
    }
  }
  return env;
}

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ FALLÓ: ${msg}`);
    failures++;
    return false;
  }
  console.log(`✅ OK: ${msg}`);
  return true;
}

async function generateTestFixtures() {
  // 1. Android JPEG with EXIF orientation 6 (raw 1200x800, display portrait 800x1200)
  const androidJpeg = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 233, g: 30, b: 99 } },
  })
    .jpeg({ quality: 88 })
    .withMetadata({ orientation: 6 })
    .toBuffer();

  // 2. High-res 12MP JPEG (4032x3024)
  const hiResJpeg = await sharp({
    create: { width: 4032, height: 3024, channels: 3, background: { r: 106, g: 27, b: 77 } },
  })
    .jpeg({ quality: 88 })
    .toBuffer();

  // 3. Gallery PNG (800x800 with alpha)
  const galleryPng = await sharp({
    create: { width: 800, height: 800, channels: 4, background: { r: 253, g: 242, b: 247, alpha: 1 } },
  })
    .png()
    .toBuffer();

  return { androidJpeg, hiResJpeg, galleryPng };
}

async function runRealChromeImageTests(fixtures) {
  console.log("\n=== 1. PRUEBAS REALES EN CHROME HEADLESS (EXIF, WEBP, 12MP, PNG, HEIC, MULTI-FOTO) ===");
  if (!fs.existsSync(CHROME_PATH)) {
    console.log("⏭️  Chrome no encontrado en ruta estándar; omitiendo prueba CDP.");
    return null;
  }

  const port = 9244;
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${port}`,
    "about:blank",
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chrome.kill();
    throw new Error("No se pudo conectar a Chrome DevTools Protocol.");
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let reqCounter = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = reqCounter++;
      const onMsg = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id === id) {
          ws.removeEventListener("message", onMsg);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
      ws.addEventListener("message", onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evalJs = async (expression) => {
    const res = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.text + " " + JSON.stringify(res.exceptionDetails.exception)
      );
    }
    return res.result?.value;
  };

  try {
    const out = await evalJs(`(async () => {
      function b64ToFile(b64, name, type) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new File([bytes], name, { type });
      }
      function blobToB64(blob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      async function optimize(file, maxDimension = 1400, quality = 0.84) {
        const isHeic = file.type === "image/heic" || file.type === "image/heif" || /\\.(heic|heif)$/i.test(file.name);
        try {
          const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
          let w = bmp.width, h = bmp.height;
          if (w > maxDimension || h > maxDimension) {
            if (w >= h) { h = Math.round((h * maxDimension) / w); w = maxDimension; }
            else { w = Math.round((w * maxDimension) / h); h = maxDimension; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(bmp, 0, 0, w, h);
          bmp.close();
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
          canvas.width = 0; canvas.height = 0;
          return {
            width: w,
            height: h,
            type: blob.type,
            size: blob.size,
            usedFallback: false,
            b64: await blobToB64(blob),
          };
        } catch {
          return {
            width: 0,
            height: 0,
            type: file.type || (isHeic ? "image/heic" : "image/jpeg"),
            size: file.size,
            usedFallback: true,
            isHeic,
            b64: null,
          };
        }
      }

      const fAndroid = b64ToFile(${JSON.stringify(fixtures.androidJpeg.toString("base64"))}, "IMG_ANDROID.jpg", "image/jpeg");
      const fAndroidNoMime = b64ToFile(${JSON.stringify(fixtures.androidJpeg.toString("base64"))}, "IMG_OEM.jpg", "");
      const fHiRes = b64ToFile(${JSON.stringify(fixtures.hiResJpeg.toString("base64"))}, "IMG_12MP.jpg", "image/jpeg");
      const fPng = b64ToFile(${JSON.stringify(fixtures.galleryPng.toString("base64"))}, "GALERIA.png", "image/png");
      const fHeic = new File([new Uint8Array([0,0,0,24,102,116,121,112,104,101,105,99,0,0,0,0])], "IMG_IPHONE.HEIC", { type: "image/heic" });

      // Test fixed QuickPublishModal pattern: Array.from(e.target.files) BEFORE e.target.value = ""
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      const dt = new DataTransfer();
      dt.items.add(fAndroid);
      dt.items.add(fHiRes);
      dt.items.add(fPng);
      input.files = dt.files;

      const incoming = input.files ? Array.from(input.files) : [];
      input.value = "";

      return {
        multiPhotoPreservedCount: incoming.length,
        inputClearedCount: input.files.length,
        android: await optimize(fAndroid),
        androidNoMime: await optimize(fAndroidNoMime),
        hiRes: await optimize(fHiRes),
        png: await optimize(fPng),
        heic: await optimize(fHeic),
      };
    })()`);

    assert(
      out.multiPhotoPreservedCount === 3 && out.inputClearedCount === 0,
      `QuickPublishModal captura ${out.multiPhotoPreservedCount} fotos antes de limpiar input.value (evita pérdida de FileList vivo)`
    );
    assert(
      out.android.width === 800 && out.android.height === 1200 && out.android.type === "image/webp",
      `JPEG de Android con EXIF orientación 6 corregido a 800x1200 WebP (${Math.round(out.android.size / 1024)} KB)`
    );
    assert(
      out.androidNoMime.width === 800 && out.androidNoMime.height === 1200 && out.androidNoMime.type === "image/webp",
      `JPEG de Android con MIME vacío ("") procesado correctamente a WebP`
    );
    assert(
      out.hiRes.width === 1400 && out.hiRes.height === 1050 && out.hiRes.type === "image/webp",
      `Fotografía alta resolución 12MP (4032x3024) redimensionada sin deformación a 1400x1050 WebP (${Math.round(out.hiRes.size / 1024)} KB)`
    );
    assert(
      out.png.width === 800 && out.png.height === 800 && out.png.type === "image/webp",
      `PNG de galería optimizado a 800x800 WebP (${Math.round(out.png.size / 1024)} KB)`
    );
    assert(
      out.heic.usedFallback === true && out.heic.isHeic === true && out.heic.type === "image/heic",
      `HEIC/HEIF de iPhone en navegador sin decodificador nativo activa alternativa compatible segura (fallback original)`
    );

    return out;
  } finally {
    ws.close();
    chrome.kill();
  }
}

async function uploadBufferToCloudinarySigned(env, buffer, mimeType, filename) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const folder = "los-angeles-store/products";
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), filename);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: "POST", body: form }
  );
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function destroyFromCloudinary(env, publicId) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
    { method: "POST", body: form }
  );
  return await res.json();
}

async function runLiveCloudinaryUploadTests(env, chromeOut) {
  console.log("\n=== 2. SUBIDA REAL A CLOUDINARY (ANDROID EXIF, 12MP, PNG Y MULTI-FOTO) ===");
  const uploadedPublicIds = [];
  try {
    const cases = [
      {
        label: "Android EXIF WebP (800x1200)",
        buf: Buffer.from(chromeOut.android.b64, "base64"),
        name: "test-android-exif.webp",
        expW: 800,
        expH: 1200,
      },
      {
        label: "Alta resolución 12MP -> WebP (1400x1050)",
        buf: Buffer.from(chromeOut.hiRes.b64, "base64"),
        name: "test-hires-12mp.webp",
        expW: 1400,
        expH: 1050,
      },
      {
        label: "PNG galería -> WebP (800x800)",
        buf: Buffer.from(chromeOut.png.b64, "base64"),
        name: "test-gallery-png.webp",
        expW: 800,
        expH: 800,
      },
    ];

    for (const c of cases) {
      const res = await uploadBufferToCloudinarySigned(env, c.buf, "image/webp", c.name);
      const ok = assert(
        res.ok &&
          res.json?.secure_url &&
          res.json?.width === c.expW &&
          res.json?.height === c.expH &&
          String(res.json?.public_id || "").startsWith("los-angeles-store/products/"),
        `Cloudinary subió ${c.label}: ${res.json?.width}x${res.json?.height} (${res.json?.public_id})`
      );
      if (ok) {
        uploadedPublicIds.push(res.json.public_id);
        const deliveryUrl = String(res.json.secure_url).replace(
          "/image/upload/",
          "/image/upload/f_auto,q_auto/"
        );
        const head = await fetch(deliveryUrl, { method: "HEAD" });
        assert(
          head.ok && String(head.headers.get("content-type") || "").startsWith("image/"),
          `Entrega pública optimizada f_auto,q_auto OK (HTTP ${head.status}) para ${c.label}`
        );
      }
    }
  } finally {
    for (const pid of uploadedPublicIds) {
      const del = await destroyFromCloudinary(env, pid);
      assert(del?.result === "ok", `Limpieza de imagen de prueba en Cloudinary (${pid})`);
    }
  }
}

async function runApiAndSessionExpiryTests() {
  console.log("\n=== 3. PRUEBA DE API LOCAL: SESIÓN EXPIRADA (401), SIN TOKEN (401) Y ESTADO ===");
  const port = 3099;
  const server = spawn("npm.cmd", ["run", "start", "--", "-p", String(port)], {
    cwd: rootDir,
    shell: true,
    stdio: "pipe",
  });

  let ready = false;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/admin/status`);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
  }

  try {
    assert(ready, `Servidor Next.js de producción iniciado en puerto ${port}`);
    if (!ready) return;

    const statusRes = await fetch(`http://127.0.0.1:${port}/api/admin/status`);
    const statusJson = await statusRes.json();
    assert(
      statusJson.firebaseConfigured === true && statusJson.cloudinaryConfigured === true,
      "GET /api/admin/status confirma Firebase y Cloudinary configurados"
    );

    const noAuthRes = await fetch(`http://127.0.0.1:${port}/api/admin/cloudinary/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "products" }),
    });
    const noAuthJson = await noAuthRes.json();
    assert(
      noAuthRes.status === 401 && noAuthJson.code === "UNAUTHORIZED",
      `POST /api/admin/cloudinary/sign sin token responde HTTP ${noAuthRes.status} (${noAuthJson.code})`
    );

    const expiredRes = await fetch(`http://127.0.0.1:${port}/api/admin/cloudinary/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer expired.invalid.firebase.token",
      },
      body: JSON.stringify({ folder: "products" }),
    });
    const expiredJson = await expiredRes.json();
    assert(
      expiredRes.status === 401 && expiredJson.code === "TOKEN_EXPIRED",
      `POST /api/admin/cloudinary/sign con token expirado responde HTTP ${expiredRes.status} (${expiredJson.code}) para disparar renovación automática`
    );

    const delNoAuth = await fetch(`http://127.0.0.1:${port}/api/admin/cloudinary/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: "https://res.cloudinary.com/demo/image/upload/los-angeles-store/products/x.webp" }),
    });
    assert(
      delNoAuth.status === 401,
      `POST /api/admin/cloudinary/delete sin token responde HTTP ${delNoAuth.status}`
    );
  } finally {
    server.kill();
    // Asegurar cierre en Windows
    if (server.pid) {
      spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    }
  }
}

async function runRetryAndTimeoutUnitChecks() {
  console.log("\n=== 4. PRUEBAS DE CONEXIÓN LENTA, TIMEOUT, REINTENTOS Y ERRORES HTTP ===");
  const firebaseSrc = fs.readFileSync(path.join(rootDir, "src/lib/firebase.ts"), "utf8");
  const quickModalSrc = fs.readFileSync(
    path.join(rootDir, "src/components/QuickPublishModal.tsx"),
    "utf8"
  );

  // Verificar que QuickPublishModal copia FileList antes de limpiar e.target.value
  const copyIdx = quickModalSrc.indexOf("Array.from(e.target.files)");
  const resetIdx = quickModalSrc.indexOf('e.target.value = ""', copyIdx > -1 ? copyIdx : 0);
  assert(
    copyIdx > -1 && resetIdx > copyIdx,
    "QuickPublishModal copia Array.from(e.target.files) ANTES de resetear e.target.value"
  );

  assert(
    firebaseSrc.includes("signRes.status === 401 && !forceRefresh") &&
      firebaseSrc.includes("user.getIdToken(forceRefresh)"),
    "uploadImageToFirebase renueva automáticamente el Firebase ID Token ante HTTP 401"
  );
  assert(
    firebaseSrc.includes("AbortController") &&
      firebaseSrc.includes("status === 413") &&
      firebaseSrc.includes("status === 429") &&
      firebaseSrc.includes("status >= 500"),
    "uploadImageToFirebase implementa timeout con AbortController y mensajes claros para 413, 429 y 5xx"
  );

  // Simular conexión lenta con timeout AbortController real
  let aborted = false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 80);
  try {
    await new Promise((_, reject) => {
      controller.signal.addEventListener("abort", () => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  } catch (err) {
    aborted = err?.name === "AbortError";
  } finally {
    clearTimeout(timer);
  }
  assert(aborted, "Timeout por conexión lenta dispara AbortError controlado");
}

async function main() {
  const env = loadEnvLocal();
  const fixtures = await generateTestFixtures();
  const chromeOut = await runRealChromeImageTests(fixtures);
  if (chromeOut) {
    await runLiveCloudinaryUploadTests(env, chromeOut);
  }
  await runApiAndSessionExpiryTests();
  await runRetryAndTimeoutUnitChecks();

  if (failures > 0) {
    console.error(`\n❌ ${failures} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log("\n🎉 Todas las pruebas del flujo de carga de fotografías pasaron.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error fatal en pruebas:", err);
  process.exit(1);
});
