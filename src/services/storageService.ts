import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { storage, db, auth } from '../lib/firebase';
import { Evento, EventoFoto } from '../types';
import { offlineDb, enqueueOfflineMutation } from './offlineDb';
import { DEFAULT_EVENTOS } from './db';

/**
 * Comprime e redimensiona imagem no lado do cliente para otimização de banda e compatibilidade móvel.
 * Reduz fotos de 6-12MB para ~150-250KB sem perda visível de qualidade.
 */
export async function compressImage(
  source: File | Blob | string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível obter contexto 2D do Canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ dataUrl, blob });
          } else {
            // Fallback se toBlob falhar
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            resolve({ dataUrl, blob: new Blob([ab], { type: mimeString }) });
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

export interface UploadFotoParams {
  eventoId: string;
  source: File | Blob | string;
  legenda?: string;
  autorId?: string;
  autorNome: string;
  autorFoto?: string;
  origem?: 'camera' | 'upload' | 'storage';
}

/**
 * Faz upload de uma foto para o Firebase Storage e anexa à galeria do evento
 * com resiliência total a falhas de rede e modo offline (IndexedDB Dexie).
 */
export async function uploadFotoEvento({
  eventoId,
  source,
  legenda = '',
  autorId,
  autorNome,
  autorFoto,
  origem = 'camera',
}: UploadFotoParams): Promise<EventoFoto> {
  const fotoId = `foto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // 1. Otimização e compressão no cliente
  const { dataUrl, blob } = await compressImage(source);

  let finalUrl = dataUrl;
  let storagePath: string | undefined = undefined;
  let finalOrigem: 'camera' | 'upload' | 'storage' = origem;

  // 2. Tentativa de upload para o Firebase Storage se online
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;

  if (isOnline) {
    try {
      storagePath = `eventos/${eventoId}/galeria/${fotoId}.jpg`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          eventoId,
          autorNome,
          dataUpload: timestamp,
          origem,
        },
      });
      finalUrl = await getDownloadURL(storageRef);
      finalOrigem = 'storage';
    } catch (storageErr) {
      console.warn('Firebase Storage upload indisponível ou offline. Usando cache local:', storageErr);
      // Fallback gracioso: mantém dataUrl compactada em JPEG
      finalUrl = dataUrl;
      storagePath = undefined;
    }
  }

  const novaFoto: EventoFoto = {
    id: fotoId,
    url: finalUrl,
    legenda: legenda.trim(),
    autorId: autorId || 'anon',
    autorNome: autorNome || 'Motociclista',
    autorFoto,
    dataUpload: timestamp,
    origem: finalOrigem,
    storagePath,
    curtidas: [],
  };

  // 3. Atualiza na lista de demonstração em memória
  const demoEvento = DEFAULT_EVENTOS.find((e) => e.id === eventoId);
  if (demoEvento) {
    demoEvento.galeria = [novaFoto, ...(demoEvento.galeria || [])];
    try {
      await offlineDb.eventos.put(demoEvento);
    } catch {
      // ignore
    }
  }

  // 4. Salva no IndexedDB (Dexie)
  try {
    const localEv = await offlineDb.eventos.get(eventoId);
    if (localEv) {
      localEv.galeria = [novaFoto, ...(localEv.galeria || [])];
      await offlineDb.eventos.put(localEv);
    }
  } catch (err) {
    console.warn('Erro ao atualizar Dexie evento galeria:', err);
  }

  // 5. Se estiver offline, enfileira mutação
  if (!isOnline) {
    await enqueueOfflineMutation('eventos', 'update', eventoId, {
      novaFoto,
    });
    return novaFoto;
  }

  // 6. Atualiza no Firestore se houver autenticação e conectividade
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const evData = docSnap.data() as Evento;
        const currentGaleria = evData.galeria || [];
        const updatedGaleria = [novaFoto, ...currentGaleria];
        await updateDoc(docRef, { galeria: updatedGaleria });
      }
    } catch (fsErr) {
      console.warn('Erro ao atualizar Firestore com nova foto (enfileirando offline):', fsErr);
      await enqueueOfflineMutation('eventos', 'update', eventoId, {
        novaFoto,
      });
    }
  }

  return novaFoto;
}

/**
 * Remove uma foto da galeria do evento e apaga do Firebase Storage se aplicável
 */
export async function deleteFotoEvento(eventoId: string, fotoId: string): Promise<void> {
  // 1. Remove da memória
  const demoEvento = DEFAULT_EVENTOS.find((e) => e.id === eventoId);
  let fotoParaRemover: EventoFoto | undefined;
  if (demoEvento && demoEvento.galeria) {
    fotoParaRemover = demoEvento.galeria.find((f) => f.id === fotoId);
    demoEvento.galeria = demoEvento.galeria.filter((f) => f.id !== fotoId);
    try {
      await offlineDb.eventos.put(demoEvento);
    } catch {
      // ignore
    }
  }

  // 2. Remove do IndexedDB Dexie
  try {
    const localEv = await offlineDb.eventos.get(eventoId);
    if (localEv && localEv.galeria) {
      if (!fotoParaRemover) {
        fotoParaRemover = localEv.galeria.find((f) => f.id === fotoId);
      }
      localEv.galeria = localEv.galeria.filter((f) => f.id !== fotoId);
      await offlineDb.eventos.put(localEv);
    }
  } catch (err) {
    console.warn('Erro ao remover foto do Dexie:', err);
  }

  // 3. Remove do Firebase Storage se tinha caminho
  if (fotoParaRemover?.storagePath) {
    try {
      const storageRef = ref(storage, fotoParaRemover.storagePath);
      await deleteObject(storageRef);
    } catch (storageErr) {
      console.warn('Erro ao remover do Firebase Storage (não fatal):', storageErr);
    }
  }

  // 4. Remove do Firestore
  if (auth.currentUser && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const evData = docSnap.data() as Evento;
        const updatedGaleria = (evData.galeria || []).filter((f) => f.id !== fotoId);
        await updateDoc(docRef, { galeria: updatedGaleria });
      }
    } catch (fsErr) {
      console.warn('Erro ao atualizar remoção de foto no Firestore:', fsErr);
    }
  }
}

/**
 * Alterna curtida em uma foto da galeria
 */
export async function toggleCurtidaFoto(
  eventoId: string,
  fotoId: string,
  associadoId: string
): Promise<void> {
  // 1. Memória
  const demo = DEFAULT_EVENTOS.find((e) => e.id === eventoId);
  if (demo && demo.galeria) {
    const foto = demo.galeria.find((f) => f.id === fotoId);
    if (foto) {
      const curtidas = foto.curtidas || [];
      foto.curtidas = curtidas.includes(associadoId)
        ? curtidas.filter((id) => id !== associadoId)
        : [...curtidas, associadoId];
      try {
        await offlineDb.eventos.put(demo);
      } catch {
        // ignore
      }
    }
  }

  // 2. Dexie
  try {
    const localEv = await offlineDb.eventos.get(eventoId);
    if (localEv && localEv.galeria) {
      const foto = localEv.galeria.find((f) => f.id === fotoId);
      if (foto) {
        const curtidas = foto.curtidas || [];
        foto.curtidas = curtidas.includes(associadoId)
          ? curtidas.filter((id) => id !== associadoId)
          : [...curtidas, associadoId];
        await offlineDb.eventos.put(localEv);
      }
    }
  } catch (err) {
    console.warn('Erro ao curtir foto no Dexie:', err);
  }

  // 3. Firestore
  if (auth.currentUser && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const evData = docSnap.data() as Evento;
        const updatedGaleria = (evData.galeria || []).map((foto) => {
          if (foto.id !== fotoId) return foto;
          const curtidas = foto.curtidas || [];
          const updated = curtidas.includes(associadoId)
            ? curtidas.filter((id) => id !== associadoId)
            : [...curtidas, associadoId];
          return { ...foto, curtidas: updated };
        });
        await updateDoc(docRef, { galeria: updatedGaleria });
      }
    } catch (fsErr) {
      console.warn('Erro ao atualizar curtida no Firestore:', fsErr);
    }
  }
}

/**
 * Alterna a marcação de foto destaque para o Álbum Histórico do Clube (Administradores/Diretoria)
 */
export async function toggleDestaqueFoto(
  eventoId: string,
  fotoId: string
): Promise<boolean> {
  let novoEstado = false;

  // 1. Memória
  const demo = DEFAULT_EVENTOS.find((e) => e.id === eventoId);
  if (demo && demo.galeria) {
    const foto = demo.galeria.find((f) => f.id === fotoId);
    if (foto) {
      foto.destaqueAlbum = !foto.destaqueAlbum;
      novoEstado = !!foto.destaqueAlbum;
      try {
        await offlineDb.eventos.put(demo);
      } catch {
        // ignore
      }
    }
  }

  // 2. Dexie
  try {
    const localEv = await offlineDb.eventos.get(eventoId);
    if (localEv && localEv.galeria) {
      const foto = localEv.galeria.find((f) => f.id === fotoId);
      if (foto) {
        foto.destaqueAlbum = !foto.destaqueAlbum;
        novoEstado = !!foto.destaqueAlbum;
        await offlineDb.eventos.put(localEv);
      }
    }
  } catch (err) {
    console.warn('Erro ao atualizar destaque de foto no Dexie:', err);
  }

  // 3. Firestore
  if (auth.currentUser && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const evData = docSnap.data() as Evento;
        const updatedGaleria = (evData.galeria || []).map((foto) => {
          if (foto.id !== fotoId) return foto;
          const updatedDestaque = !foto.destaqueAlbum;
          novoEstado = updatedDestaque;
          return { ...foto, destaqueAlbum: updatedDestaque };
        });
        await updateDoc(docRef, { galeria: updatedGaleria });
      }
    } catch (fsErr) {
      console.warn('Erro ao atualizar destaque de foto no Firestore:', fsErr);
    }
  }

  return novoEstado;
}

