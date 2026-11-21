import fs from "fs";
import path from "path";
import crypto from "crypto";

const rootDir = process.cwd();

function loadEnvLocal() {
  const envPath = path.join(rootDir, ".env.local");
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in env) || !env[key]) {
        env[key] = val;
      }
    }
  }
  return env;
}

function assert(condition, label) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${label}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`✅ OK: ${label}`);
  return true;
}

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), "utf8");
}

async function runStaticSecurityChecks() {
  console.log("\n=== 1. VERIFICACIONES DE ARQUITECTURA Y SEGURIDAD ===");

  const firebaseTs = readFile("src/lib/firebase.ts");
  const signRoute = readFile("src/app/api/admin/cloudinary/sign/route.ts");
  const deleteRoute = readFile("src/app/api/admin/cloudinary/delete/route.ts");
  const aiRoute = readFile("src/app/api/admin/ai-product/route.ts");
  const adminPage = readFile("src/app/admin/page.tsx");
  const firestoreRules = readFile("firestore.rules");
  const envExample = readFile(".env.example");

  assert(
    !firebaseTs.includes("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET") &&
      !envExample.includes("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
    "Sin presets públicos sin restricciones (NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET eliminado)"
  );
  assert(
    !firebaseTs.includes('storageMode === "firestore_inline"') &&
      !firebaseTs.includes("compressImageToSparkWebPDataUrl"),
    "firestore_inline eliminado como mecanismo de subida de producción"
  );
  assert(
    !envExample.includes("NEXT_PUBLIC_CLOUDINARY_API_SECRET") &&
      !firebaseTs.includes("CLOUDINARY_API_SECRET"),
    "CLOUDINARY_API_SECRET nunca expuesto en cliente ni con prefijo NEXT_PUBLIC_"
  );
  assert(
    signRoute.includes("requireFirebaseAdminRequest") &&
      deleteRoute.includes("requireFirebaseAdminRequest"),
    "Rutas /api/admin/cloudinary/sign y /delete verifican Firebase ID Token + admin_users"
  );
  assert(
    aiRoute.includes("verifyFirebaseAdminOnServer") &&
      aiRoute.includes("gemini-2.5-flash") &&
      aiRoute.includes("AUTH_NOT_CONFIGURED"),
    "Ruta /api/admin/ai-product verifica admin en Firebase, bloquea sin auth y usa Gemini 2.5 Flash"
  );
  const gitignore = readFile(".gitignore");
  assert(
    gitignore.includes(".env*.local") && gitignore.includes(".env"),
    ".gitignore excluye .env y .env*.local del repositorio"
  );
  const staticChunksDir = path.join(rootDir, ".next", "static");
  if (fs.existsSync(staticChunksDir)) {
    const walkFiles = (dir) => {
      let out = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out = out.concat(walkFiles(full));
        else if (entry.name.endsWith(".js")) out.push(full);
      }
      return out;
    };
    const jsFiles = walkFiles(staticChunksDir);
    const leaked = jsFiles.some((f) => {
      const content = fs.readFileSync(f, "utf8");
      return (
        content.includes("CLOUDINARY_API_SECRET") ||
        content.includes("GEMINI_API_KEY") ||
        content.includes("OPENAI_API_KEY")
      );
    });
    assert(!leaked, "Ninguna clave privada aparece en el bundle de cliente (.next/static)");
  }
  assert(
    firestoreRules.includes("match /admin_users/{adminId}") &&
      firestoreRules.includes("allow write: if false;"),
    "firestore.rules protege admin_users contra escritura desde cliente"
  );
  assert(
    adminPage.includes('capture="environment"') &&
      adminPage.includes("MAX_PRODUCT_IMAGES") &&
      adminPage.includes("Confirma manualmente el precio real") &&
      adminPage.includes("Confirma manualmente las existencias disponibles"),
    "Panel /admin conserva formulario avanzado (hasta 5 fotos) con confirmación manual de precio y existencias"
  );

  const quickModal = readFile("src/components/QuickPublishModal.tsx");
  const imageUtils = readFile("src/lib/imageUtils.ts");
  const storeContext = readFile("src/context/StoreContext.tsx");

  assert(
    quickModal.includes("Publicación rápida") &&
      quickModal.includes('accept="image/*"') &&
      quickModal.includes('capture="environment"') &&
      quickModal.includes("Tomar otra foto") &&
      quickModal.includes("Subir desde galería") &&
      quickModal.includes("Guardar como borrador") &&
      quickModal.includes("submittingRef.current") &&
      quickModal.includes("deleteImageFromCloudinary"),
    "QuickPublishModal implementa Publicación rápida móvil, cámara/galería, borrador, anti-doble-clic y rollback seguro"
  );
  assert(
    imageUtils.includes("imageOrientation") &&
      imageUtils.includes("image/webp") &&
      imageUtils.includes("optimizeImageWithPreview"),
    "imageUtils corrige orientación EXIF y optimiza fotografías a WebP"
  );
  assert(
    adminPage.includes("Precio rápido") &&
      adminPage.includes("Marcar agotado") &&
      adminPage.includes("QuickPublishModal") &&
      storeContext.includes("data.products.filter((p) => !p.isDemo)"),
    "Panel /admin incluye edición rápida de precio, botón Marcar agotado y excluye datos demo como productos reales"
  );
  assert(
    fs.existsSync(path.join(rootDir, "src/lib/supabase.ts")) &&
      fs.existsSync(path.join(rootDir, "supabase/schema.sql")),
    "Archivos originales de Supabase conservados como respaldo durante la migración"
  );
}

async function runLiveIntegrationChecks(env) {
  console.log("\n=== 2. PRUEBAS EN VIVO CON FIREBASE, CLOUDINARY Y GEMINI ===");

  const firebaseApiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const firebaseProjectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const cloudName = env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const cloudKey = env.CLOUDINARY_API_KEY || "";
  const cloudSecret = env.CLOUDINARY_API_SECRET || "";
  const geminiKey = env.GEMINI_API_KEY || "";

  if (!firebaseApiKey || !firebaseProjectId || firebaseProjectId.includes("tu-proyecto")) {
    console.log("⏭️  Omitido Firebase en vivo: falta configurar NEXT_PUBLIC_FIREBASE_* en .env.local.");
  } else {
    // Verificar que Firestore bloquea escritura anónima en admin_users y products
    const anonWriteRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        firebaseProjectId
      )}/databases/(default)/documents/admin_users/test-intruder`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { active: { booleanValue: true } } }),
      }
    );
    assert(
      anonWriteRes.status === 401 || anonWriteRes.status === 403,
      `Firestore rechaza escritura anónima en admin_users (HTTP ${anonWriteRes.status})`
    );

    const anonProductWriteRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        firebaseProjectId
      )}/databases/(default)/documents/products/test-intruder-prod`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            name: { stringValue: "Producto intruso" },
            price: { doubleValue: 10 },
            active: { booleanValue: true },
          },
        }),
      }
    );
    assert(
      anonProductWriteRes.status === 401 || anonProductWriteRes.status === 403,
      `Firestore rechaza escritura anónima en products (HTTP ${anonProductWriteRes.status})`
    );
  }

  if (!cloudName || !cloudKey || !cloudSecret) {
    console.log(
      "⏭️  Omitido Cloudinary en vivo: falta configurar CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env.local."
    );
  } else {
    // Subida firmada de prueba (PNG 1x1) y borrado inmediato
    const png1x1Base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "los-angeles-store/test-healthcheck";
    const uploadSig = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${cloudSecret}`)
      .digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", `data:image/png;base64,${png1x1Base64}`);
    uploadForm.append("api_key", cloudKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("folder", folder);
    uploadForm.append("signature", uploadSig);

    const upRes = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: "POST", body: uploadForm }
    );
    const upJson = await upRes.json();
    const uploadedOk = assert(
      upRes.ok &&
        Boolean(upJson.secure_url) &&
        Boolean(upJson.public_id) &&
        String(upJson.public_id).startsWith("los-angeles-store/"),
      `Cloudinary acepta subida firmada SHA-1 en carpeta los-angeles-store/ (${upJson.public_id || "sin public_id"})`
    );

    if (uploadedOk) {
      const optimizedUrl = String(upJson.secure_url).replace(
        "/image/upload/",
        "/image/upload/f_auto,q_auto/"
      );
      const deliveryRes = await fetch(optimizedUrl, { method: "HEAD" });
      assert(
        deliveryRes.ok &&
          String(deliveryRes.headers.get("content-type") || "").startsWith("image/"),
        `Cloudinary entrega imagen optimizada (f_auto,q_auto) correctamente (HTTP ${deliveryRes.status})`
      );

      const delTs = Math.floor(Date.now() / 1000);
      const delSig = crypto
        .createHash("sha1")
        .update(`public_id=${upJson.public_id}&timestamp=${delTs}${cloudSecret}`)
        .digest("hex");
      const delForm = new FormData();
      delForm.append("public_id", upJson.public_id);
      delForm.append("api_key", cloudKey);
      delForm.append("timestamp", String(delTs));
      delForm.append("signature", delSig);

      const delRes = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
        { method: "POST", body: delForm }
      );
      const delJson = await delRes.json();
      assert(
        delRes.ok && delJson.result === "ok",
        "Cloudinary elimina correctamente la imagen de prueba mediante firma SHA-1"
      );
    }
  }

  if (!geminiKey) {
    console.log("⏭️  Omitido Gemini en vivo: falta configurar GEMINI_API_KEY en .env.local.");
  } else {
    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${encodeURIComponent(
        geminiKey
      )}`
    );
    assert(
      gemRes.ok,
      `Gemini API responde correctamente para gemini-2.5-flash (HTTP ${gemRes.status})`
    );
  }
}

async function main() {
  const env = loadEnvLocal();
  await runStaticSecurityChecks();
  await runLiveIntegrationChecks(env);
  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
  console.log("\n🎉 Verificación completada sin errores.");
}

main().catch((err) => {
  console.error("Error inesperado en verificación:", err);
  process.exit(1);
});
