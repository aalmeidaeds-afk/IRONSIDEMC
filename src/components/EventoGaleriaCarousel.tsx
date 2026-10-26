import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Heart,
  Trash2,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  SwitchCamera,
  Layers,
  Clock,
  User,
  Star,
  Award,
} from 'lucide-react';
import { Evento, EventoFoto, Associado } from '../types';
import {
  uploadFotoEvento,
  deleteFotoEvento,
  toggleCurtidaFoto,
  toggleDestaqueFoto,
} from '../services/storageService';

interface EventoGaleriaCarouselProps {
  evento: Evento;
  currentAssociado?: Associado | null;
  isAdminOrDiretoria?: boolean;
  onFotoAdded?: (foto: EventoFoto) => void;
  onFotoDeleted?: (fotoId: string) => void;
  onCurtidaToggled?: (fotoId: string) => void;
  onDestaqueToggled?: (fotoId: string, destaque: boolean) => void;
}

export const EventoGaleriaCarousel: React.FC<EventoGaleriaCarouselProps> = ({
  evento,
  currentAssociado,
  isAdminOrDiretoria = false,
  onFotoAdded,
  onFotoDeleted,
  onCurtidaToggled,
  onDestaqueToggled,
}) => {
  const fotos = evento.galeria || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modais
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxFoto, setLightboxFoto] = useState<EventoFoto | null>(null);

  // Estados da Câmera ao vivo
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Pré-visualização pós-captura
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Input de arquivo nativo (mobile & desktop)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Mantém índice válido se fotos diminuírem
  useEffect(() => {
    if (currentIndex >= fotos.length && fotos.length > 0) {
      setCurrentIndex(fotos.length - 1);
    }
  }, [fotos.length, currentIndex]);

  // Teclas de atalho para navegar no carrossel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCameraModalOpen) return;
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, fotos.length, isLightboxOpen, isCameraModalOpen]);

  const goToPrevious = () => {
    if (fotos.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    if (fotos.length <= 1) return;
    setCurrentIndex((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
  };

  // ================= CÂMERA AO VIVO =================
  const startCameraStream = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Erro ao inicializar câmera via getUserMedia:', err);
      setCameraError('Permissão de câmera não concedida ou dispositivo sem suporte.');
      setCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const openCameraModal = () => {
    setIsCameraModalOpen(true);
    setCapturedPhotoUrl(null);
    setCaptionText('');
    setUploadFeedback(null);
    // Inicia stream após modal montar
    setTimeout(() => {
      startCameraStream('environment');
    }, 150);
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
    setCapturedPhotoUrl(null);
    setCaptionText('');
    setUploadFeedback(null);
  };

  const toggleCameraFacing = () => {
    const newFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(newFacing);
    startCameraStream(newFacing);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Se for câmera frontal, espelha para ficar natural
    if (cameraFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhotoUrl(dataUrl);
    stopCameraStream();
  };

  // ================= UPLOAD NATIVO / ARQUIVO =================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedPhotoUrl(dataUrl);
      setIsCameraModalOpen(true);
      stopCameraStream();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ================= CONFIRMAR UPLOAD PARA FIREBASE STORAGE =================
  const handleConfirmUpload = async () => {
    if (!capturedPhotoUrl) return;
    setIsUploading(true);
    setUploadFeedback(null);

    const autorNome =
      currentAssociado?.nomeGuerra
        ? `${currentAssociado.nome} (${currentAssociado.nomeGuerra})`
        : currentAssociado?.nome || 'Motociclista Iron Side';

    try {
      const novaFoto = await uploadFotoEvento({
        eventoId: evento.id,
        source: capturedPhotoUrl,
        legenda: captionText,
        autorId: currentAssociado?.id || currentAssociado?.uid,
        autorNome,
        autorFoto: currentAssociado?.fotoUrl,
        origem: 'camera',
      });

      setUploadFeedback({
        type: 'success',
        msg: 'Foto registrada com sucesso na galeria do evento!',
      });

      if (onFotoAdded) {
        onFotoAdded(novaFoto);
      }

      setTimeout(() => {
        closeCameraModal();
        setCurrentIndex(0); // Coloca em foco a nova foto no carrossel
      }, 700);
    } catch (err) {
      console.error('Falha no upload da foto do evento:', err);
      setUploadFeedback({
        type: 'error',
        msg: 'Não foi possível salvar a imagem. Verifique a conexão e tente novamente.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ================= AÇÕES NA FOTO =================
  const handleDeleteFoto = async (fotoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta foto da galeria?')) {
      return;
    }
    try {
      await deleteFotoEvento(evento.id, fotoId);
      if (onFotoDeleted) {
        onFotoDeleted(fotoId);
      }
      if (isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    } catch (err) {
      console.error('Erro ao excluir foto:', err);
    }
  };

  const handleToggleCurtida = async (fotoId: string) => {
    const userId = currentAssociado?.id || currentAssociado?.uid || 'user-anon';
    try {
      await toggleCurtidaFoto(evento.id, fotoId, userId);
      if (onCurtidaToggled) {
        onCurtidaToggled(fotoId);
      }
    } catch (err) {
      console.error('Erro ao curtir foto:', err);
    }
  };

  const handleToggleDestaque = async (fotoId: string) => {
    try {
      const novoEstado = await toggleDestaqueFoto(evento.id, fotoId);
      if (onDestaqueToggled) {
        onDestaqueToggled(fotoId, novoEstado);
      }
    } catch (err) {
      console.error('Erro ao alternar destaque do álbum:', err);
    }
  };

  const handleShareFoto = async (foto: EventoFoto) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Foto do evento: ${evento.titulo}`,
          text: foto.legenda || `Galeria Oficial - ${evento.titulo}`,
          url: foto.url,
        });
      } catch {
        // Ignora cancelamento do usuário
      }
    } else {
      navigator.clipboard.writeText(foto.url);
      alert('Link da foto copiado para a área de transferência!');
    }
  };

  const activeFoto = fotos[currentIndex];

  return (
    <div className="space-y-4">
      {/* Header da Galeria com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Camera className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Galeria de Fotos do Evento
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-amber-400 border border-zinc-700">
              {fotos.length} {fotos.length === 1 ? 'Foto' : 'Fotos'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Registros fotográficos do comboio, paradas técnicas e confraternizações.
          </p>
        </div>

        {/* Botões de Ação de Câmera e Upload */}
        <div className="flex items-center gap-2">
          {/* Botão de Câmera Direta */}
          <button
            type="button"
            onClick={openCameraModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Tirar Foto (Câmera)</span>
          </button>

          {/* Botão de Upload da Galeria do Aparelho */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition"
            title="Escolher arquivo do dispositivo"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Inputs Ocultos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* ÁREA DO CARROSSEL VISUAL */}
      {fotos.length === 0 ? (
        <div className="p-8 text-center bg-zinc-950/60 rounded-2xl border border-dashed border-zinc-800 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-zinc-200">
              Nenhuma foto registrada neste evento ainda
            </h5>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Os motociclistas podem usar a câmera do smartphone para enviar imagens em tempo real para o Storage do Firebase.
            </p>
          </div>
          <button
            type="button"
            onClick={openCameraModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition"
          >
            <Camera className="w-4 h-4" />
            <span>Ser o primeiro a fotografar</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Slide Principal com Controles */}
          <div className="relative w-full h-80 sm:h-96 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl group">
            <img
              src={activeFoto.url}
              alt={activeFoto.legenda || 'Foto do evento'}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Gradientes Superior e Inferior para Legibilidade */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

            {/* Badge de Posição / Índice e Armazenamento */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-zinc-700/80 text-[11px] font-bold text-zinc-200">
                Foto {currentIndex + 1} de {fotos.length}
              </span>
              <span className="px-2 py-1 rounded-lg bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Firebase Storage
              </span>
              {activeFoto.destaqueAlbum && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-zinc-950" />
                  <span>Álbum Histórico</span>
                </span>
              )}
            </div>

            {/* Botões do Topo Direito (Expandir / Excluir) */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLightboxFoto(activeFoto);
                  setIsLightboxOpen(true);
                }}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-700/80 transition"
                title="Visualizar em Tela Cheia"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              {(isAdminOrDiretoria ||
                activeFoto.autorId === currentAssociado?.id ||
                activeFoto.autorId === currentAssociado?.uid) && (
                <button
                  type="button"
                  onClick={() => handleDeleteFoto(activeFoto.id)}
                  className="p-2 rounded-xl bg-black/60 hover:bg-red-500 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-700/80 transition"
                  title="Excluir Foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Setas de Navegação (Anterior / Próximo) */}
            {fotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-zinc-950 text-white backdrop-blur-md border border-zinc-700/80 transition-all opacity-80 group-hover:opacity-100 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Próxima foto"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-zinc-950 text-white backdrop-blur-md border border-zinc-700/80 transition-all opacity-80 group-hover:opacity-100 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Informações da Foto no Rodapé do Slide */}
            <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-zinc-100">
              <div className="space-y-1 max-w-xl">
                {activeFoto.legenda && (
                  <p className="text-sm font-semibold text-white drop-shadow">
                    "{activeFoto.legenda}"
                  </p>
                )}
                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  {activeFoto.autorFoto ? (
                    <img
                      src={activeFoto.autorFoto}
                      alt={activeFoto.autorNome}
                      className="w-5 h-5 rounded-full object-cover border border-amber-400"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-black text-[9px] flex items-center justify-center">
                      {activeFoto.autorNome.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-amber-300">
                    {activeFoto.autorNome}
                  </span>
                  <span className="text-zinc-500">&bull;</span>
                  <span className="text-zinc-400">
                    {new Date(activeFoto.dataUpload).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Botões de Interação (Curtir e Compartilhar) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleCurtida(activeFoto.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition ${
                    (activeFoto.curtidas || []).includes(
                      currentAssociado?.id || currentAssociado?.uid || ''
                    )
                      ? 'bg-red-500/30 text-red-300 border-red-500/50'
                      : 'bg-black/60 text-zinc-200 border-zinc-700/80 hover:bg-black/90'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      (activeFoto.curtidas || []).includes(
                        currentAssociado?.id || currentAssociado?.uid || ''
                      )
                        ? 'fill-red-400 text-red-400'
                        : 'text-zinc-300'
                    }`}
                  />
                  <span>{(activeFoto.curtidas || []).length}</span>
                </button>

                {isAdminOrDiretoria && (
                  <button
                    type="button"
                    onClick={() => handleToggleDestaque(activeFoto.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition cursor-pointer ${
                      activeFoto.destaqueAlbum
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-black/60 text-zinc-200 border-zinc-700/80 hover:bg-black/90'
                    }`}
                    title={activeFoto.destaqueAlbum ? 'Remover do Álbum Histórico' : 'Salvar no Álbum Histórico'}
                  >
                    <Star className={`w-3.5 h-3.5 ${activeFoto.destaqueAlbum ? 'fill-zinc-950 text-zinc-950' : 'text-amber-400'}`} />
                    <span>{activeFoto.destaqueAlbum ? 'Destaque no Álbum' : 'Salvar no Álbum'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleShareFoto(activeFoto)}
                  className="p-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-700/80 transition"
                  title="Compartilhar"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* FITA DE MINIATURAS (THUMBNAIL STRIP) */}
          {fotos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {fotos.map((foto, idx) => (
                <button
                  key={foto.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                    idx === currentIndex
                      ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                      : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-600'
                  }`}
                >
                  <img
                    src={foto.url}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {foto.destaqueAlbum && (
                    <div className="absolute top-1 right-1 p-0.5 rounded-full bg-amber-500 text-zinc-950">
                      <Star className="w-2 h-2 fill-zinc-950" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* SEÇÃO ESPECIAL: ÁLBUM HISTÓRICO DE MELHORES FOTOS (DESTAQUES) */}
          {fotos.some((f) => f.destaqueAlbum) && (
            <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl p-4 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Álbum Histórico Oficial — Melhores Fotos Selecionadas
                  </h5>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {fotos.filter((f) => f.destaqueAlbum).length} fotos no álbum
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Fotos homologadas pela diretoria como o acervo visual e histórico deste evento no motoclube.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                {fotos
                  .filter((f) => f.destaqueAlbum)
                  .map((foto) => (
                    <div
                      key={foto.id}
                      onClick={() => {
                        const idx = fotos.findIndex((item) => item.id === foto.id);
                        if (idx >= 0) setCurrentIndex(idx);
                      }}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-amber-500/70 shadow-md group cursor-pointer hover:scale-105 transition-all"
                      title={foto.legenda || 'Foto do Álbum'}
                    >
                      <img src={foto.url} alt="Destaque" className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 p-1 rounded-full bg-amber-500 text-zinc-950 shadow">
                        <Star className="w-2.5 h-2.5 fill-zinc-950" />
                      </div>
                      {foto.legenda && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/85 px-1.5 py-0.5 text-[9px] text-zinc-200 truncate">
                          {foto.legenda}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL DA CÂMERA AO VIVO / CAPTURA ================= */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl text-zinc-100">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Camera className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  {capturedPhotoUrl ? 'Confirmar Registro Fotográfico' : 'Câmera do Evento'}
                </h4>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder da Câmera OU Preview da Foto Capturada */}
            <div className="p-4 space-y-4">
              {!capturedPhotoUrl ? (
                <div className="space-y-3">
                  <div className="relative w-full h-72 sm:h-80 bg-black rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                    {cameraError ? (
                      <div className="p-6 text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                        <p className="text-xs text-zinc-300">{cameraError}</p>
                        <div className="flex flex-col gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => nativeCameraInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950"
                          >
                            Abrir Câmera Nativa do Celular
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
                          >
                            Escolher Arquivo da Galeria
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Grade e Brackets de Enquadramento */}
                        <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
                          <div className="w-8 h-8 border-t-2 border-l-2 border-amber-400 absolute top-0 left-0" />
                          <div className="w-8 h-8 border-t-2 border-r-2 border-amber-400 absolute top-0 right-0" />
                          <div className="w-8 h-8 border-b-2 border-l-2 border-amber-400 absolute bottom-0 left-0" />
                          <div className="w-8 h-8 border-b-2 border-r-2 border-amber-400 absolute bottom-0 right-0" />
                          <div className="w-3 h-3 bg-amber-400/60 rounded-full" />
                        </div>

                        {/* Botão de Alternar Câmera (Frontal / Traseira) */}
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-zinc-700 transition"
                          title="Alternar Câmera"
                        >
                          <SwitchCamera className="w-4 h-4 text-amber-400" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Controles de Captura */}
                  {!cameraError && (
                    <div className="flex items-center justify-center gap-4 pt-1">
                      {/* Botão de Disparo da Câmera */}
                      <button
                        type="button"
                        onClick={captureSnapshot}
                        className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 p-1.5 shadow-xl shadow-amber-500/30 flex items-center justify-center active:scale-95 transition"
                        title="Tirar Foto"
                      >
                        <div className="w-full h-full rounded-full border-2 border-zinc-950 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-zinc-950" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* PRÉ-VISUALIZAÇÃO PÓS-DISPARO */
                <div className="space-y-4">
                  <div className="relative w-full h-64 sm:h-72 bg-black rounded-2xl overflow-hidden border border-zinc-800">
                    <img
                      src={capturedPhotoUrl}
                      alt="Prévia capturada"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Captura Realizada
                    </div>
                  </div>

                  {/* Campo de Legenda Opcional */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Legenda / Descrição da Foto (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Chegando no mirante com o comboio!"
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      maxLength={120}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Identificação do Autor */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>
                      Registrado por:{' '}
                      <strong className="text-zinc-100">
                        {currentAssociado?.nome || 'Motociclista Iron Side'}
                      </strong>
                    </span>
                  </div>

                  {/* Mensagem de Feedback */}
                  {uploadFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        uploadFeedback.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {uploadFeedback.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{uploadFeedback.msg}</span>
                    </div>
                  )}

                  {/* Ações de Confirmar / Descartar */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhotoUrl(null);
                        startCameraStream();
                      }}
                      disabled={isUploading}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    >
                      Tirar Outra
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmUpload}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando para o Storage...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Salvar na Galeria</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX (TELA CHEIA) ================= */}
      {isLightboxOpen && lightboxFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Imagem em alta resolução */}
            <div className="relative max-h-[80vh] overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl">
              <img
                src={lightboxFoto.url}
                alt={lightboxFoto.legenda || 'Foto do evento'}
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>

            {/* Barra de Informações do Lightbox */}
            <div className="mt-4 w-full bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-200">
              <div>
                <p className="text-sm font-bold text-white">
                  {lightboxFoto.legenda || evento.titulo}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Foto por <strong className="text-amber-400">{lightboxFoto.autorNome}</strong> &bull;{' '}
                  {new Date(lightboxFoto.dataUpload).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxFoto.url}
                  download={`ironside-evento-${evento.id}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleShareFoto(lightboxFoto)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
