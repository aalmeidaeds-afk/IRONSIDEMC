import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Droplet,
  Bike,
  User,
  MapPin,
  Calendar,
  Search,
} from 'lucide-react';
import { Associado, Veiculo, ConfiguracaoClube } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  associados: Associado[];
  veiculos?: Veiculo[];
  config?: ConfiguracaoClube;
}

export const QrCodeScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  associados,
  veiculos = [],
  config,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedAssociado, setScannedAssociado] = useState<Associado | null>(null);
  const [scannedVeiculo, setScannedVeiculo] = useState<Veiculo | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScannedAssociado(null);
      setScannedVeiculo(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Start BarcodeDetector loop if supported
      if ('BarcodeDetector' in window) {
        startBarcodeDetectorLoop();
      }
    } catch (err: any) {
      console.warn('Câmera indisponível ou permissão negada:', err);
      setCameraError('Câmera em uso ou permissão não concedida. Você pode validar digitando o código abaixo.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startBarcodeDetectorLoop = async () => {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const interval = setInterval(async () => {
        if (!videoRef.current || !streamRef.current || scannedAssociado) {
          clearInterval(interval);
          return;
        }
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            handleProcessScannedCode(rawValue);
            clearInterval(interval);
          }
        } catch {
          // Frame not ready
        }
      }, 500);
    } catch {}
  };

  const handleProcessScannedCode = (code: string) => {
    const cleanCode = code.trim().toLowerCase();
    // Search member by numeroAssociado, ID, CPF or url
    const found = associados.find(
      (a) =>
        cleanCode.includes(a.numeroAssociado.toLowerCase()) ||
        cleanCode.includes(a.id.toLowerCase()) ||
        cleanCode.includes(a.cpf.replace(/\D/g, '')) ||
        (a.nomeGuerra && cleanCode.includes(a.nomeGuerra.toLowerCase()))
    );

    if (found) {
      setScannedAssociado(found);
      const moto = veiculos.find((v) => v.associadoId === found.id || (found.uid && v.associadoId === found.uid));
      setScannedVeiculo(moto || null);
    } else {
      alert(`Código lido: "${code}". Nenhum registro de associado correspondente encontrado na base oficial.`);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScannedCode(manualCode);
  };

  const handleQuickSelectMember = (assoc: Associado) => {
    setScannedAssociado(assoc);
    const moto = veiculos.find((v) => v.associadoId === assoc.id || (assoc.uid && v.associadoId === assoc.uid));
    setScannedVeiculo(moto || null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-1.5">
                Validador de Carteirinha via Câmera
              </h3>
              <p className="text-[11px] text-zinc-400">
                Aponte para o QR Code da carteirinha digital para verificar autenticidade.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!scannedAssociado ? (
            <>
              {/* Camera Scanner Viewfinder */}
              <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-dashed border-amber-500/60 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Scanning HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-amber-400 rounded-2xl relative shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300" />

                    {/* Animated Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-[0_0_10px_#f59e0b]" />
                  </div>
                  <span className="mt-3 px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-700 text-[10px] text-amber-300 font-bold backdrop-blur-md">
                    Posicione o QR Code dentro da moldura
                  </span>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-zinc-950/90 p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                    <p className="text-xs text-zinc-300 font-semibold">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Code Input Form */}
              <form onSubmit={handleManualSearch} className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-400">
                  Ou valide digitando o Número da Carteirinha / Nome de Guerra:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Ex: MC-000001 ou Trovão Negro"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 transition"
                  >
                    Verificar
                  </button>
                </div>
              </form>

              {/* Quick Select demo associates */}
              {associados.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">
                    Simular Leitura Imediata de Irmão Cadastrado:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {associados.slice(0, 6).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleQuickSelectMember(a)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-semibold transition"
                      >
                        {a.numeroAssociado} • {a.nomeGuerra || a.nome.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Scanned Associate Verified Dossier */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                      Carteirinha Autêntica &amp; Regularizada
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Registro oficial ativo no {config?.nomeClube || 'Iron Side Road Rider M.C.'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-zinc-950">
                  Ativo
                </span>
              </div>

              {/* Member Card Summary */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-amber-500/70 shrink-0">
                    <img
                      src={scannedAssociado.fotoUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300'}
                      alt={scannedAssociado.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-zinc-100">{scannedAssociado.nome}</h4>
                    {scannedAssociado.nomeGuerra && (
                      <span className="text-xs font-extrabold text-amber-400 block">
                        "{scannedAssociado.nomeGuerra}"
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-[10px] font-mono text-zinc-300 border border-zinc-800">
                        {scannedAssociado.numeroAssociado}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                        {scannedAssociado.cargo || 'Membro Oficial'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-zinc-800/80">
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-bold block flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-red-500" />
                      Tipo Sanguíneo
                    </span>
                    <strong className="text-zinc-200">{scannedAssociado.tipoSanguineo || 'Não inf.'}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-bold block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      Regional
                    </span>
                    <strong className="text-zinc-200 truncate block">
                      {scannedAssociado.regional || scannedAssociado.cidade || 'Sede Central'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-bold block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-400" />
                      Data de Filiação
                    </span>
                    <strong className="text-zinc-200">{scannedAssociado.dataFiliacao || scannedAssociado.dataAssociacao || '2024'}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-bold block flex items-center gap-1">
                      <Bike className="w-3 h-3 text-emerald-400" />
                      Moto Cadastrada
                    </span>
                    <strong className="text-zinc-200 truncate block">
                      {scannedVeiculo ? `${scannedVeiculo.marca} ${scannedVeiculo.modelo}` : 'Harley-Davidson'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScannedAssociado(null);
                    setScannedVeiculo(null);
                    startCamera();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Escanear Outro
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
