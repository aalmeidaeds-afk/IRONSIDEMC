import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Mensalidade, ConfiguracaoClube } from '../types';
import { QrCode, Copy, Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  mensalidade: Mensalidade;
  config: ConfiguracaoClube;
  onClose: () => void;
  onSimulatePayment?: () => void;
}

export const PixModal: React.FC<Props> = ({
  mensalidade,
  config,
  onClose,
  onSimulatePayment,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // BR Code / Pix copy-paste standard simulation payload
  const pixPayload = `00020126580014br.gov.bcb.pix0136${config.chavePix}520400005303986540${mensalidade.valor.toFixed(2)}5802BR5925${config.nomeClube.slice(0, 25)}6009SAO PAULO62070503***6304`;

  useEffect(() => {
    QRCode.toDataURL(
      pixPayload,
      {
        width: 200,
        margin: 1,
        color: {
          dark: '#09090b',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeUrl(url);
        }
      }
    );
  }, [pixPayload]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(config.chavePix);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-zinc-900 border-t border-amber-500/50 sm:border sm:border-amber-500/60 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 text-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl max-h-[90vh] overflow-y-auto pb-safe pb-6 sm:pb-6"
      >
        {/* Mobile Drag / Touch Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mb-3.5 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-3 border-b border-zinc-800">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">
            Pagamento Oficial via PIX
          </h3>
          <p className="text-xs text-zinc-400">
            {mensalidade.competencia} • {config.nomeClube}
          </p>
        </div>

        <div className="py-4 space-y-4">
          {/* Amount Badge */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Valor a Pagar:</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              R$ {mensalidade.valor.toFixed(2)}
            </span>
          </div>

          {/* QR Code image */}
          {qrCodeUrl && (
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner mx-auto w-fit">
              <img src={qrCodeUrl} alt="QR Code PIX" className="w-44 h-44 rounded-xl" />
              <span className="text-[10px] text-zinc-800 font-semibold mt-1">
                Aponte a câmera do aplicativo do seu banco
              </span>
            </div>
          )}

          {/* Copy Key Box */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-400 font-semibold block">
              Chave PIX Oficial ({config.tipoChavePix}):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={config.chavePix}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                {copiedKey ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Copy Paste Code */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-400 font-semibold block">
              Código PIX Copia e Cola:
            </span>
            <button
              type="button"
              onClick={handleCopyPayload}
              className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              {copiedPayload ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              {copiedPayload ? 'Código Copiado com Sucesso!' : 'Copiar Código PIX Completo'}
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 text-center">
            Após transferir, guarde o comprovante em seu aplicativo. A compensação é conferida pela diretoria.
          </div>
        </div>

        {onSimulatePayment && (
          <div className="pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onSimulatePayment}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Pagamento Realizado
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
