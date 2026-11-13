/**
 * Utilidades de validación y optimización de fotografías tomadas desde cámara móvil o galería.
 */

export const MAX_PRODUCT_IMAGES = 5;

/**
 * Redimensiona una imagen en el navegador a un tamaño máximo (por defecto 1024px)
 * y la exporta como base64 JPEG optimizado para análisis multimodal rápido y económico con Gemini.
 */
export async function compressImageForAI(
  file: File,
  maxDimension = 1024,
  quality = 0.82
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo de imagen."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo seleccionado no es una imagen válida."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            base64: String(reader.result),
            mimeType: file.type || "image/jpeg",
          });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          base64: compressedDataUrl,
          mimeType: "image/jpeg",
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime una fotografía de cámara de celular (que suele pesar 6–12 MB) a un archivo JPEG/WebP ligero (< 1.2 MB)
 * antes de subirlo a Firebase Cloud Storage o Supabase Storage.
 */
export async function optimizeFileForStorage(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<File> {
  if (file.size <= 1_400_000 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la fotografía."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen inválida."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            resolve(new File([blob], cleanName, { type: "image/webp" }));
          },
          "image/webp",
          quality
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Alternativa 100% gratuita para Plan Spark de Firebase (sin tarjeta ni Cloud Storage):
 * Comprime una fotografía de cámara móvil a WebP ultra-ligero (~45–65 KB, máx. 720px)
 * para almacenarla de forma segura o usarla cuando el bucket de Storage no está habilitado.
 */
export async function compressImageToSparkWebPDataUrl(
  file: File,
  maxDimension = 720,
  quality = 0.76
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo procesar la fotografía."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL("image/webp", quality);
        resolve(webpDataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
