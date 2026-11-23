/**
 * Utilidades de validación, corrección de orientación EXIF y optimización WebP/JPEG
 * para fotografías tomadas desde cámara móvil (Chrome Android / Safari iOS) o galería.
 * Incluye liberación explícita de memoria de Canvas y respaldo seguro al archivo original
 * (ej. HEIC/HEIF de iPhone o límites de memoria en móviles) respetando límites de formato y tamaño.
 */

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_UPLOAD_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB máximo seguro

const SUPPORTED_EXT_REGEX = /\.(jpe?g|png|webp|heic|heif|avif)$/i;
const HEIC_REGEX = /\.(heic|heif)$/i;

export interface OptimizedImageResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  sizeKB: number;
  mimeType: string;
  usedOriginalFallback?: boolean;
  isHeic?: boolean;
}

export function isHeicFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    HEIC_REGEX.test(file.name || "")
  );
}

export function isSupportedImageFile(file: File): boolean {
  if (!file) return false;
  const type = (file.type || "").toLowerCase().trim();
  if (type.startsWith("image/")) return true;
  if (
    (type === "" || type === "application/octet-stream") &&
    SUPPORTED_EXT_REGEX.test(file.name || "")
  ) {
    return true;
  }
  return false;
}

/**
 * Carga una imagen respetando su orientación EXIF original (vital para fotos verticales
 * tomadas en Android Chrome y Safari iPhone) sin saturar la memoria del dispositivo.
 */
async function loadOrientedImageSource(
  file: File
): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => {
            try {
              bitmap.close();
            } catch {
              // Ignorar si ya fue liberado
            }
          },
        };
      }
      bitmap.close();
    } catch {
      // Fallback a HTMLImageElement si el navegador no soporta imageOrientation o el formato
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (w <= 0 || h <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("La fotografía tiene dimensiones inválidas."));
        return;
      }
      resolve({
        source: img,
        width: w,
        height: h,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "No se pudo decodificar la fotografía en el navegador."
        )
      );
    };
    img.src = objectUrl;
  });
}

function computeTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension: number
): { width: number; height: number } {
  let width = srcWidth;
  let height = srcHeight;
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.max(1, Math.round((height * maxDimension) / width));
      width = maxDimension;
    } else {
      width = Math.max(1, Math.round((width * maxDimension) / height));
      height = maxDimension;
    }
  }
  return { width, height };
}

function canvasToBlobWithWebPFallback(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<{ blob: Blob; mimeType: "image/webp" | "image/jpeg"; ext: "webp" | "jpg" }> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob && webpBlob.size > 0 && webpBlob.type === "image/webp") {
            resolve({ blob: webpBlob, mimeType: "image/webp", ext: "webp" });
            return;
          }
          // Respaldo JPEG si Safari iOS u otro navegador no soporta codificación WebP en canvas
          canvas.toBlob(
            (jpegBlob) => {
              if (!jpegBlob || jpegBlob.size <= 0) {
                reject(new Error("No se pudo optimizar la fotografía en el navegador."));
                return;
              }
              resolve({ blob: jpegBlob, mimeType: "image/jpeg", ext: "jpg" });
            },
            "image/jpeg",
            quality
          );
        },
        "image/webp",
        quality
      );
    } catch (err) {
      reject(
        err instanceof Error
          ? err
          : new Error("Error de memoria al comprimir la fotografía en el navegador.")
      );
    }
  });
}

function releaseCanvasMemory(canvas: HTMLCanvasElement): void {
  try {
    canvas.width = 0;
    canvas.height = 0;
  } catch {
    // Ignorar en entornos sin DOM completo
  }
}

function buildSanitizedFileName(originalName: string, ext: string): string {
  const baseName =
    (originalName || "producto")
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "producto";
  return `${baseName}.${ext}`;
}

async function encodeSourceWithCanvas(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  maxDimension: number,
  quality: number,
  originalName: string
): Promise<OptimizedImageResult> {
  const { width, height } = computeTargetDimensions(srcWidth, srcHeight, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseCanvasMemory(canvas);
    throw new Error("Tu navegador no pudo preparar el lienzo para procesar la fotografía.");
  }

  try {
    // Fondo blanco suave para evitar transparencias negras si se exporta a JPEG
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);

    const { blob, mimeType, ext } = await canvasToBlobWithWebPFallback(canvas, quality);

    const optimizedFile = new File([blob], buildSanitizedFileName(originalName, ext), {
      type: mimeType,
      lastModified: Date.now(),
    });

    const previewUrl = URL.createObjectURL(optimizedFile);

    return {
      file: optimizedFile,
      previewUrl,
      width,
      height,
      sizeKB: Math.max(1, Math.round(optimizedFile.size / 1024)),
      mimeType,
      usedOriginalFallback: false,
      isHeic: false,
    };
  } finally {
    releaseCanvasMemory(canvas);
  }
}

/**
 * Redimensiona una imagen en el navegador a un tamaño máximo (por defecto 1024px)
 * con orientación EXIF corregida y la exporta como base64 JPEG ligero para análisis con Gemini.
 */
export async function compressImageForAI(
  file: File,
  maxDimension = 1024,
  quality = 0.82
): Promise<{ base64: string; mimeType: string }> {
  const loaded = await loadOrientedImageSource(file);
  const canvas = document.createElement("canvas");
  try {
    const { width, height } = computeTargetDimensions(
      loaded.width,
      loaded.height,
      maxDimension
    );

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No se pudo preparar el lienzo de imagen para el análisis.");
    }
    ctx.drawImage(loaded.source, 0, 0, width, height);
    const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
    return {
      base64: compressedDataUrl,
      mimeType: "image/jpeg",
    };
  } finally {
    releaseCanvasMemory(canvas);
    loaded.cleanup();
  }
}

/**
 * Corrige la orientación EXIF, redimensiona (máx. 1400px) y convierte cualquier fotografía
 * de cámara móvil o galería a formato WebP (o JPEG en iOS) antes de subirla a Cloudinary.
 *
 * Si el navegador no puede decodificar el archivo (ej. HEIC/HEIF de iPhone en Chrome) o
 * falla Canvas por memoria en un móvil, utiliza de forma segura el archivo original
 * (si cumple formato y límite de 10 MB) para que Cloudinary lo convierta y oriente en servidor.
 */
export async function optimizeImageWithPreview(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<OptimizedImageResult> {
  if (!file || file.size <= 0) {
    throw new Error("La fotografía seleccionada está vacía. Intenta tomarla nuevamente.");
  }

  if (!isSupportedImageFile(file)) {
    throw new Error(
      "El archivo seleccionado no es una fotografía válida (usa JPG, PNG, WEBP o HEIC/HEIF)."
    );
  }

  const heic = isHeicFile(file);

  try {
    const loaded = await loadOrientedImageSource(file);
    try {
      try {
        return await encodeSourceWithCanvas(
          loaded.source,
          loaded.width,
          loaded.height,
          maxDimension,
          quality,
          file.name
        );
      } catch {
        // Reintento con menor resolución si el primer lienzo agotó memoria en celular
        const fallbackDim = Math.min(maxDimension, 1024);
        return await encodeSourceWithCanvas(
          loaded.source,
          loaded.width,
          loaded.height,
          fallbackDim,
          Math.min(quality, 0.78),
          file.name
        );
      }
    } finally {
      loaded.cleanup();
    }
  } catch {
    // Alternativa compatible: conservar el archivo original dentro de límites seguros (<= 10 MB)
    // Cloudinary decodifica HEIC/HEIF, corrige orientación EXIF y optimiza con f_auto,q_auto.
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `La fotografía pesa ${sizeMB} MB y el navegador no pudo comprimirla (límite 10 MB). Toma una foto con menor resolución o en formato JPG.`
      );
    }

    const inferredType =
      file.type && file.type.startsWith("image/")
        ? file.type
        : heic
          ? "image/heic"
          : /\.png$/i.test(file.name)
            ? "image/png"
            : /\.webp$/i.test(file.name)
              ? "image/webp"
              : "image/jpeg";

    const safeExt = heic
      ? "heic"
      : inferredType === "image/png"
        ? "png"
        : inferredType === "image/webp"
          ? "webp"
          : "jpg";

    const normalizedFile =
      file.type === inferredType
        ? file
        : new File([file], buildSanitizedFileName(file.name, safeExt), {
            type: inferredType,
            lastModified: file.lastModified || Date.now(),
          });

    const previewUrl = URL.createObjectURL(normalizedFile);

    return {
      file: normalizedFile,
      previewUrl,
      width: 0,
      height: 0,
      sizeKB: Math.max(1, Math.round(normalizedFile.size / 1024)),
      mimeType: inferredType,
      usedOriginalFallback: true,
      isHeic: heic,
    };
  }
}

/**
 * Comprime y corrige orientación de una fotografía de cámara móvil o galería a WebP/JPEG optimizado
 * antes de subirla a Cloudinary o Firebase Storage.
 * Evita recomprimir archivos que ya fueron optimizados (incluyendo respaldo JPEG de iOS Safari).
 */
export async function optimizeFileForStorage(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<File> {
  // Si ya es WebP o JPEG ligero (<= 1.5 MB) previamente optimizado, devolver directamente sin degradar ni gastar RAM
  if (
    (file.type === "image/webp" || file.type === "image/jpeg") &&
    file.size > 0 &&
    file.size <= 1_500_000
  ) {
    return file;
  }

  const result = await optimizeImageWithPreview(file, maxDimension, quality);
  URL.revokeObjectURL(result.previewUrl);
  return result.file;
}

/**
 * Optimiza URLs de entrega de Cloudinary para dispositivos móviles con ancho máximo y calidad adaptativa
 * (f_auto,q_auto,w_<width>,c_limit), evitando descargar archivos innecesariamente pesados en celular.
 */
export function getOptimizedCloudinaryUrl(url: string, maxWidth = 720): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  const transform = `f_auto,q_auto,w_${maxWidth},c_limit`;
  if (url.includes("/image/upload/f_auto,q_auto/")) {
    return url.replace("/image/upload/f_auto,q_auto/", `/image/upload/${transform}/`);
  }
  if (/\/image\/upload\/[^/]*w_\d+/.test(url)) {
    return url;
  }
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}
