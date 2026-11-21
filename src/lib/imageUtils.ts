/**
 * Utilidades de validación, corrección de orientación EXIF y optimización WebP
 * para fotografías tomadas desde cámara móvil (Chrome Android / Safari iOS) o galería.
 */

export const MAX_PRODUCT_IMAGES = 5;

export interface OptimizedImageResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  sizeKB: number;
  mimeType: string;
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
    } catch {
      // Fallback a HTMLImageElement si el navegador no soporta imageOrientation o el formato
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "No se pudo leer la fotografía. Usa una imagen válida (JPG, PNG, WEBP o foto de cámara)."
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
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === "image/webp") {
          resolve({ blob: webpBlob, mimeType: "image/webp", ext: "webp" });
          return;
        }
        // Respaldo JPEG si un navegador antiguo no soporta codificación WebP en canvas
        canvas.toBlob(
          (jpegBlob) => {
            if (!jpegBlob) {
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
  });
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
  try {
    const { width, height } = computeTargetDimensions(
      loaded.width,
      loaded.height,
      maxDimension
    );

    const canvas = document.createElement("canvas");
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
    loaded.cleanup();
  }
}

/**
 * Corrige la orientación EXIF, redimensiona (máx. 1400px) y convierte cualquier fotografía
 * de cámara móvil o galería a formato WebP optimizado antes de subirla a Cloudinary.
 */
export async function optimizeImageWithPreview(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<OptimizedImageResult> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("El archivo seleccionado no es una fotografía válida.");
  }

  const loaded = await loadOrientedImageSource(file);
  try {
    const { width, height } = computeTargetDimensions(
      loaded.width,
      loaded.height,
      maxDimension
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Tu navegador no pudo procesar la fotografía.");
    }

    ctx.drawImage(loaded.source, 0, 0, width, height);
    const { blob, mimeType, ext } = await canvasToBlobWithWebPFallback(canvas, quality);

    const baseName = (file.name || "producto")
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .slice(0, 48) || "producto";

    const optimizedFile = new File([blob], `${baseName}.${ext}`, {
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
    };
  } finally {
    loaded.cleanup();
  }
}

/**
 * Comprime y corrige orientación de una fotografía de cámara móvil o galería a WebP optimizado
 * antes de subirla a Cloudinary o Firebase Storage.
 */
export async function optimizeFileForStorage(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<File> {
  // Si ya es un WebP pequeño (< 1.2 MB) previamente optimizado, devolver directamente
  if (file.type === "image/webp" && file.size <= 1_200_000) {
    return file;
  }

  const result = await optimizeImageWithPreview(file, maxDimension, quality);
  URL.revokeObjectURL(result.previewUrl);
  return result.file;
}
