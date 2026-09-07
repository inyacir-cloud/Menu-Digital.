/**
 * Convierte un archivo de imagen en un data URL JPEG redimensionado.
 * Así las fotos ocupan poco espacio en el almacenamiento del navegador.
 */
export function fileToResizedDataUrl(file: File, maxSize = 640, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo seleccionado no es una imagen"));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      // Fondo blanco: los PNG transparentes se funden bien con el papel
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        reject(new Error("No se pudo convertir la imagen"));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = url;
  });
}

/** Tamaño aproximado (KB) de un data URL */
export function dataUrlSizeKb(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4 / 1024);
}
