import { useState, useRef, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { updateConfiguracao } from '../services/db';

export interface UseLogoUploadOptions {
  onSuccess?: (newLogoUrl: string) => void;
  onError?: (error: Error) => void;
  maxDimension?: number;
}

/**
 * Hook to select, resize via HTML5 File API & Canvas, upload to Firebase Storage
 * (with automatic high-quality base64 fallback) and persist to Firestore configuration.
 */
export function useLogoUpload(options: UseLogoUploadOptions = {}) {
  const { onSuccess, onError, maxDimension = 512 } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Resizes an image file via HTML5 Canvas preserving aspect ratio
   */
  const resizeImage = useCallback(
    (file: File): Promise<{ blob: Blob; dataUrl: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Erro ao ler arquivo da imagem via File API'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('Formato de imagem inválido ou corrompido'));
          img.onload = () => {
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

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Falha ao instanciar contexto gráfico 2D do Canvas'));
              return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/png', 0.95);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({ blob, dataUrl });
                } else {
                  reject(new Error('Falha ao gerar Blob redimensionado'));
                }
              },
              'image/png',
              0.95
            );
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
    },
    [maxDimension]
  );

  /**
   * Processes file upload: resizes, uploads to Firebase Storage with canvas fallback,
   * updates Firestore and notifies application state.
   */
  const processAndUploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        const err = 'Por favor selecione um arquivo de imagem válido (PNG, JPG, WebP, SVG).';
        setUploadError(err);
        return null;
      }

      setIsUploading(true);
      setUploadProgress(20);
      setUploadError(null);

      try {
        // 1. Client-side resize via File API & Canvas
        const { blob, dataUrl } = await resizeImage(file);
        setUploadProgress(50);

        let finalUrl: string = dataUrl;

        // 2. Attempt Firebase Storage upload
        try {
          const timestamp = Date.now();
          const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `club_logos/${timestamp}_${cleanName}`;
          const storageRef = ref(storage, storagePath);

          const snapshot = await uploadBytes(storageRef, blob, {
            contentType: 'image/png',
            customMetadata: {
              uploadedAt: new Date().toISOString(),
              resizedBy: 'HeaderLogoUploadHook',
            },
          });

          setUploadProgress(80);
          finalUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn(
            'Firebase Storage upload unavailable or restricted, using optimized high-res Base64 data URL fallback:',
            storageErr
          );
          finalUrl = dataUrl;
        }

        setUploadProgress(90);

        // 3. Persist new logo URL to Firestore configuration
        await updateConfiguracao({ logotipoUrl: finalUrl });

        setUploadProgress(100);

        // 4. Notify app listeners
        window.dispatchEvent(
          new CustomEvent('ironside-logo-updated', { detail: { logotipoUrl: finalUrl } })
        );

        if (onSuccess) {
          onSuccess(finalUrl);
        }

        return finalUrl;
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setUploadError(errorObj.message);
        if (onError) onError(errorObj);
        return null;
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [resizeImage, onSuccess, onError]
  );

  /**
   * Triggers file selector dialog
   */
  const triggerFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processAndUploadFile(file);
      }
    },
    [processAndUploadFile]
  );

  return {
    isUploading,
    uploadProgress,
    uploadError,
    triggerFileDialog,
    processAndUploadFile,
    fileInputRef,
    handleInputChange,
  };
}
