/**
 * Utilitário Universal de Processamento de Imagens
 *
 * Suporta busca na Área de Trabalho (Windows/Mac/Linux) e na Galeria de Fotos (Android/iOS)
 * Compatível com formatos: JPEG, JPG, PNG, BMP, GIF, HEIC, HEIF, WEBP, SVG
 */

import heic2any from 'heic2any';

export interface ProcessImageResult {
  dataUrl: string;
  fileName: string;
  format: string;
  sizeBytes: number;
}

/**
 * Converte qualquer arquivo de imagem suportado em um Data URL otimizado
 */
export async function processUniversalImageFile(file: File): Promise<ProcessImageResult> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const fileType = file.type.toLowerCase();

  // 1. Identificar se é formato HEIC/HEIF
  const isHeic =
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif') ||
    fileType.includes('heic') ||
    fileType.includes('heif');

  let workingBlob: Blob = file;

  if (isHeic) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
      });
      workingBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn('[imageUploadHelper] Conversão HEIC via heic2any falhou, tentando fallback:', err);
      workingBlob = file;
    }
  }

  // 2. Se for SVG, preserva vetor como texto/dataUrl sem perda
  if (lowerName.endsWith('.svg') || fileType.includes('svg')) {
    const rawDataUrl = await readBlobAsDataUrl(workingBlob);
    return {
      dataUrl: rawDataUrl,
      fileName,
      format: 'SVG (Vetor)',
      sizeBytes: file.size,
    };
  }

  // 3. Lê o blob como Data URL
  const rawDataUrl = await readBlobAsDataUrl(workingBlob);

  // 4. Se for GIF animado, preserva diretamente para manter os frames
  if (lowerName.endsWith('.gif') || fileType.includes('gif')) {
    return {
      dataUrl: rawDataUrl,
      fileName,
      format: 'GIF',
      sizeBytes: file.size,
    };
  }

  // 5. Otimiza no Canvas para JPEG, PNG, BMP, WEBP (mantendo proporção e qualidade)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDimension = 800; // Nitidez cristalina para tela cheia e ícones
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Se for PNG/WEBP com fundo transparente, mantém transparente
          const isTransparent = lowerName.endsWith('.png') || lowerName.endsWith('.webp') || fileType.includes('png');
          ctx.drawImage(img, 0, 0, width, height);

          const outputMime = isTransparent ? 'image/png' : 'image/jpeg';
          const optimized = canvas.toDataURL(outputMime, 0.92);

          resolve({
            dataUrl: optimized,
            fileName,
            format: isHeic ? 'HEIC (Convertido)' : (fileType || 'Imagem'),
            sizeBytes: Math.round((optimized.length * 3) / 4),
          });
          return;
        }
      } catch (e) {
        console.warn('[imageUploadHelper] Falha ao processar canvas, usando original:', e);
      }

      resolve({
        dataUrl: rawDataUrl,
        fileName,
        format: fileType || 'Imagem',
        sizeBytes: file.size,
      });
    };

    img.onerror = () => {
      resolve({
        dataUrl: rawDataUrl,
        fileName,
        format: fileType || 'Imagem',
        sizeBytes: file.size,
      });
    };

    img.src = rawDataUrl;
  });
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
}
