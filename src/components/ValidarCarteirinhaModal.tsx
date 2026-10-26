import React from 'react';
import { Associado, ConfiguracaoClube } from '../types';
import { ShieldCheck, CheckCircle, Droplet, MapPin, X, Lock } from 'lucide-react';

interface Props {
  associado: Associado;
  config: ConfiguracaoClube;
  onClose: () => void;
}

export const ValidarCarteirinhaModal: React.FC<Props> = ({
  associado,
  config,
  onClose,
}) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-zinc-900 border-t border-amber-500/50 sm:border sm:border-amber-500/50 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto pb-safe pb-6 sm:pb-6"
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

        <div className="text-center pb-4 border-b border-zinc-800">
          <div className="w-16 h-16 mx-auto mb-2 p-1 rounded-xl bg-zinc-950 border border-amber-500/50 shadow-lg flex items-center justify-center">
            <img
              src={config.logotipoUrl || '/ironside-logo.svg'}
              alt={config.nomeClube}
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">
            Validação de Carteirinha Oficial
          </h3>
          <p className="text-xs text-amber-400 font-semibold">{config.nomeClube}</p>
          <p className="text-[11px] text-zinc-400 italic mt-0.5">&ldquo;{config.lema}&rdquo;</p>
        </div>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
            <img
              src={
                associado.fotoUrl ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
              }
              alt={associado.nome}
              className="w-16 h-16 rounded-xl object-cover border border-amber-500/40"
            />
            <div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {associado.numeroAssociado}
              </span>
              <h4 className="text-base font-bold text-zinc-100">
                {associado.nomeGuerra || associado.nome}
              </h4>
              <p className="text-xs text-zinc-400">{associado.nome}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3" />
                  ASSOCIADO ATIVO E REGULAR
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase block">Tipo Sanguíneo</span>
              <span className="font-bold text-red-400 flex items-center gap-1 mt-0.5">
                <Droplet className="w-3.5 h-3.5 fill-red-400" />
                {associado.tipoSanguineo || 'Não informado'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase block">Regional</span>
              <span className="font-bold text-zinc-200 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {associado.regional || config.cidadeSede}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase block">Cargo Oficial</span>
              <span className="font-semibold text-zinc-200 mt-0.5 block truncate">
                {associado.cargo || 'Membro do Clube'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase block">Data de Associação</span>
              <span className="font-semibold text-zinc-200 mt-0.5 block">
                {associado.dataAssociacao || 'Ativa'}
              </span>
            </div>
          </div>

          {/* LGPD Safety Notice */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-zinc-400 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Proteção LGPD:</strong> Documentos pessoais sensíveis (CPF, RG, CNH e endereço) estão salvaguardados e não são expostos na consulta pública do QR Code.
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
        >
          Fechar Validação
        </button>
      </div>
    </div>
  );
};
