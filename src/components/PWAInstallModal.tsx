import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  WifiOff,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'button' | 'banner' | 'card' | 'prominent_header' | 'floating_strip';
  className?: string;
}

export const PWAInstallModal: React.FC<Props> = ({ variant = 'button', className = '' }) => {
  const { isInstallable, canPromptDirectly, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  // If already installed in standalone mode, do not show install banners or intrusive prompts
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (canPromptDirectly) {
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallStatus('Aplicativo instalado com sucesso!');
        setTimeout(() => setInstallStatus(null), 3000);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Visual variants */}
      {variant === 'prominent_header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/25 border border-amber-300 active:scale-95 transition-all cursor-pointer group ${className}`}
          title="Instalar App Oficial na Tela de Início (Android, iOS ou Computador)"
        >
          <div className="relative">
            <Smartphone className="w-4 h-4 text-zinc-950" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600" />
          </div>
          <span className="font-extrabold hidden sm:inline">Instalar App</span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-950/20 text-[9px] font-mono uppercase">
            PWA
          </span>
        </button>
      )}

      {variant === 'floating_strip' && (
        <div className={`p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/50 shadow-2xl flex items-center justify-between gap-3 animate-fade-in ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 truncate">
                <span>Instalar Aplicativo Oficial</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 text-[9px] font-black uppercase">
                  Nativo
                </span>
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                Adicione à Tela de Início para acesso offline e melhor desempenho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shrink-0 transition-transform active:scale-95 shadow-md flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      )}
      {variant === 'button' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold text-xs tracking-wide shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all ${className}`}
          title="Instalar aplicativo no Android ou iPhone"
        >
          <Smartphone className="w-4 h-4" />
          <span>Instalar no Celular</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-900/90 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Instale o App no Android ou iPhone
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PWA Oficial
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Acesse sua carteirinha e dados da moto mesmo sem sinal de internet na estrada.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              Instalar Agora
            </button>
          </div>
        </div>
      )}

      {/* Installation Guide Modal (Especially designed for iPhone & iOS Safari) */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md bg-zinc-900 border-t border-amber-500/50 sm:border sm:border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 text-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl max-h-[90vh] overflow-y-auto pb-safe pb-6 sm:pb-6"
          >
            {/* Mobile Drag / Touch Handle */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mb-3.5 sm:hidden" />

            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">
                  {isIOS ? 'Instalar no iPhone (iOS)' : 'Instalar no Celular'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Iron Side Road Rider M.C. direto na tela inicial
                </p>
              </div>
            </div>

            {/* Benefits list */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 mb-5 text-center">
              <div className="p-2">
                <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[11px] font-medium text-zinc-300 block">1 Toque</span>
                <span className="text-[9px] text-zinc-500">Sem digitar URL</span>
              </div>
              <div className="p-2 border-x border-zinc-800">
                <WifiOff className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[11px] font-medium text-zinc-300 block">Offline</span>
                <span className="text-[9px] text-zinc-500">Disponível na estrada</span>
              </div>
              <div className="p-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[11px] font-medium text-zinc-300 block">Tela Cheia</span>
                <span className="text-[9px] text-zinc-500">Visual de app nativo</span>
              </div>
            </div>

            {/* Instructions Steps */}
            {isIOS ? (
              <div className="space-y-3.5 mb-6">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Passo a passo no Safari (iPhone):
                </h4>
                
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="text-xs text-zinc-300">
                    Toque no botão <strong className="text-white">Compartilhar</strong>{' '}
                    <Share className="inline w-3.5 h-3.5 text-blue-400 mx-1 align-sub" /> na barra inferior do Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="text-xs text-zinc-300">
                    Role a lista e toque em{' '}
                    <strong className="text-white">Adicionar à Tela de Início</strong>{' '}
                    <PlusSquare className="inline w-3.5 h-3.5 text-amber-400 mx-1 align-sub" />.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="text-xs text-zinc-300">
                    No canto superior direito, toque em <strong className="text-white">Adicionar</strong>. Pronto! O ícone oficial aparecerá no seu iPhone.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Instalação no Android (Chrome):
                </h4>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="text-xs text-zinc-300">
                    No menu do navegador (três pontinhos no topo à direita), selecione{' '}
                    <strong className="text-white">Instalar Aplicativo</strong> ou{' '}
                    <strong className="text-white">Adicionar à tela inicial</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="text-xs text-zinc-300">
                    Confirme em <strong className="text-white">Instalar</strong>. O app funcionará com ícone próprio e sem barra do navegador.
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {installStatus && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          {installStatus}
        </div>
      )}
    </>
  );
};
