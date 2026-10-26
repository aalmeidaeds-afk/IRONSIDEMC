import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Associado, Veiculo, ConfiguracaoClube } from '../types';
import {
  ShieldCheck,
  Droplet,
  Calendar,
  MapPin,
  RotateCw,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Phone,
  Camera,
  QrCode,
  FileDown,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { QrCodeScannerModal } from './QrCodeScannerModal';
import { exportarCarteirinhaPdf } from '../services/carteirinhaPdfService';

interface Props {
  associado: Associado;
  config: ConfiguracaoClube;
  associados?: Associado[];
  veiculos?: Veiculo[];
  onValidateClick?: () => void;
}

export const CarteirinhaDigital: React.FC<Props> = ({
  associado,
  config,
  associados = [],
  veiculos = [],
  onValidateClick,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setExportingPdf(true);
      const motoPrincipal = veiculos.find((v) => v.associadoId === associado.id);
      await exportarCarteirinhaPdf(associado, config, motoPrincipal);
    } catch (err) {
      console.error('Erro ao gerar PDF da carteirinha:', err);
      alert('Erro ao gerar PDF da carteirinha.');
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    // Generate QR code data pointing to validation payload
    const verificationUrl = `${window.location.origin}/validar/${associado.numeroAssociado}`;
    QRCode.toDataURL(
      verificationUrl,
      {
        width: 180,
        margin: 1,
        color: {
          dark: '#09090b',
          light: '#fef08a',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [associado.numeroAssociado]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/validar/${associado.numeroAssociado}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Perspective Container */}
      <div className="relative w-full max-w-md h-[460px] perspective-1000 select-none">
        <div
          className={`relative w-full h-full duration-700 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FRONT FACE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between shadow-2xl backface-hidden border-2 border-amber-500/40"
            style={{
              backfaceVisibility: 'hidden',
              background:
                'linear-gradient(145deg, #18181b 0%, #09090b 60%, #1c1917 100%)',
            }}
          >
            {/* Holographic accent stripe */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-t-2xl opacity-90" />

            {/* Header with Club Crest & Title */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mt-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-amber-500/80 p-0.5 overflow-hidden bg-zinc-950 shadow-md flex items-center justify-center shrink-0">
                  {config.logotipoUrl ? (
                    <img
                      src={config.logotipoUrl}
                      alt={config.nomeClube}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Award className="w-6 h-6 text-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-club text-sm font-bold tracking-wider text-amber-400 leading-tight uppercase">
                    {config.nomeClube}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase">
                    CARTEIRA OFICIAL DO ASSOCIADO
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 px-2.5 py-1 rounded-full shadow-inner">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {associado.status === 'ativo' ? 'ATIVO' : associado.status.toUpperCase()}
              </span>
            </div>

            {/* Central Member Details */}
            <div className="flex gap-4 items-center my-auto py-2">
              {/* Photo Box with Gold frame */}
              <div className="relative group shrink-0">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-amber-500/70 shadow-lg bg-zinc-900">
                  <img
                    src={
                      associado.fotoUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={associado.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Blood Type Badge attached to photo */}
                <div className="absolute -bottom-2 -right-2 bg-red-950 border border-red-600 text-red-200 text-[11px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  {associado.tipoSanguineo || 'O+'}
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Nome de Guerra
                  </p>
                  <h4 className="text-lg font-black text-zinc-100 truncate font-heading tracking-tight">
                    {associado.nomeGuerra || associado.nome.split(' ')[0]}
                  </h4>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Nome Civil
                  </p>
                  <p className="text-xs text-zinc-300 font-medium truncate">
                    {associado.nome}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div>
                    <p className="text-[9px] text-zinc-500 uppercase">Matrícula</p>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {associado.numeroAssociado}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-zinc-500 uppercase">Cargo</p>
                    <span className="text-xs font-semibold text-zinc-300">
                      {associado.cargo || 'Membro'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-400 pt-0.5">
                  <MapPin className="w-3 h-3 text-amber-500/80 shrink-0" />
                  <span className="truncate">{associado.regional || config.cidadeSede}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer: QR Code & Security Stamp */}
            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {qrCodeDataUrl ? (
                  <div
                    onClick={onValidateClick}
                    className="p-1 bg-amber-400/90 rounded-lg cursor-pointer hover:scale-105 transition-transform shadow-md"
                    title="Clique para validar autenticidade"
                  >
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      className="w-14 h-14 rounded"
                    />
                  </div>
                ) : null}
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-semibold">
                    Autenticidade
                  </p>
                  <p className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Validado Digitalmente
                  </p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">
                    Associação: {associado.dataAssociacao || '2026'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[9px] text-zinc-500 uppercase">Validade</p>
                <p className="text-xs font-semibold text-zinc-200 flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  31/12/2027
                </p>
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="mt-1 text-[10px] text-amber-400/90 hover:text-amber-300 flex items-center justify-end gap-1 transition-colors"
                >
                  <RotateCw className="w-3 h-3" />
                  Ver Verso
                </button>
              </div>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between shadow-2xl border-2 border-amber-500/40"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background:
                'linear-gradient(145deg, #1c1917 0%, #09090b 60%, #18181b 100%)',
            }}
          >
            {/* Header Back */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                {associado.numeroAssociado}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                REGISTRO OFICIAL
              </span>
              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" />
                Frente
              </button>
            </div>

            {/* Important Info: CNH, Emergency, Club Code */}
            <div className="space-y-3 text-xs text-zinc-300">
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">
                    CNH Categoria
                  </span>
                  <span className="font-semibold text-zinc-100">
                    {associado.cnhCategoria || 'A'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">
                    Validade CNH
                  </span>
                  <span className="font-semibold text-zinc-100">
                    {associado.cnhValidade || '2028'}
                  </span>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-red-950/20 border border-red-900/50 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1.5 mb-1">
                  <Phone className="w-3 h-3 text-red-500" />
                  Contatos em Caso de Emergência / Acidente
                </span>
                {associado.contatosEmergencia && associado.contatosEmergencia.length > 0 ? (
                  associado.contatosEmergencia.slice(0, 2).map((c, i) => (
                    <div key={i} className="text-[11px] flex justify-between py-0.5 text-zinc-300">
                      <span>{c.nome} ({c.parentesco}):</span>
                      <span className="font-mono text-amber-300">{c.telefone}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-zinc-400">
                    Sede do Clube: {config.telefoneContato}
                  </p>
                )}
              </div>

              {/* Moto Clube Oath / Creed */}
              <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 italic text-center">
                &ldquo;{config.lema}&rdquo; — Documento de porte obrigatório em encontros, comboios e eventos oficiais.
              </div>
            </div>

            {/* Validation & Signature Line */}
            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-[10px] text-zinc-500">
              <div>
                <p>Secretaria Geral</p>
                <p className="font-semibold text-zinc-300">
                  {config.cidadeSede} - {config.estadoSede}
                </p>
              </div>
              <div className="text-right">
                <div className="w-32 border-b border-zinc-700 mb-1" />
                <p className="text-[9px]">Assinatura da Diretoria</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons below card */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 w-full max-w-md">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-xs font-semibold text-zinc-200 transition-all shadow-sm"
        >
          <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          <span>{isFlipped ? 'Frente' : 'Verso'}</span>
        </button>

        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all shadow-sm"
          title="Escanear e validar carteirinha de outro irmão usando a câmera"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Escanear QR Code</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={exportingPdf}
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
          title="Baixar carteirinha oficial em PDF de alta resolução com frente, verso e QR code"
        >
          {exportingPdf ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>{exportingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
        </button>

        {onValidateClick && (
          <button
            type="button"
            onClick={onValidateClick}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Validar</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyLink}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-all"
          title="Copiar link da carteirinha"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Leitor de QR Code via Câmera */}
      <QrCodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        associados={associados.length > 0 ? associados : [associado]}
        veiculos={veiculos}
        config={config}
      />

      {/* Marca Dinastia System no rodapé da Carteirinha Digital */}
      <div className="w-full max-w-md mt-6">
        <DinastiaBrandBadge variant="footer" />
      </div>
    </div>
  );
};
