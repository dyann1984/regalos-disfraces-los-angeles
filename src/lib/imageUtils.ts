/**
 * Utilidades de validación y optimización de fotografías tomadas desde cámara móvil o galería.
 */

export const MAX_PRODUCT_IMAGES = 5;

/**
 * Redimensiona una imagen en el navegador a un tamaño máximo (por defecto 1024px)
 * y la exporta como base64 JPEG optimizado para análisis multimodal rápido y económico.
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
 * Comprime una fotografía de cámara de celular (que suele pesar 6–12 MB) a un archivo JPEG ligero (< 1.5 MB)
 * antes de subirlo a Supabase Storage.
 */
export async function optimizeFileForStorage(
  file: File,
  maxDimension = 1600,
  quality = 0.86
): Promise<File> {
  if (file.size <= 1_800_000 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
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
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            resolve(new File([blob], cleanName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
