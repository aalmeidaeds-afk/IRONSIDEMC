import React, { useState, useRef } from 'react';
import { Mensalidade } from '../types';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  FileCheck2,
  ShieldCheck,
  Eye,
  Info,
} from 'lucide-react';

interface Props {
  mensalidade: Mensalidade;
  onClose: () => void;
  onSubmitComprovante: (
    mensalidadeId: string,
    fileDataUrl: string,
    fileName: string,
    fileType: string
  ) => Promise<void>;
}

export const UploadComprovanteModal: React.FC<Props> = ({
  mensalidade,
  onClose,
  onSubmitComprovante,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<{
    dataUrl: string;
    name: string;
    type: string;
    sizeKb: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData({
        dataUrl: reader.result as string,
        name: file.name,
        type: file.type || 'application/pdf',
        sizeKb: Math.round(file.size / 1024),
      });
    };
    reader.onerror = () => {
      setError('Falha ao processar o arquivo selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSamplePdf = () => {
    // PDF simulado de pagamento PIX
    const sampleDataUrl =
      'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDb21wcm92YW50ZSBkZSBQYWdhbWVudG8gUElYKQovQXV0aG9yIChCYW5jbyBBc3NvY2lhZG8pCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNjEwMTIxMjAwMDApCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAzIDAgUgo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzQgMCBSXQovQ291bnQgMQo+PgplbmRvYmoK';

    setFileData({
      dataUrl: sampleDataUrl,
      name: `comprovante_pix_${mensalidade.competencia.toLowerCase().replace('/', '_')}.pdf`,
      type: 'application/pdf',
      sizeKb: 142,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileData) {
      setError('Por favor, selecione ou gere um comprovante em PDF.');
      return;
    }

    try {
      setLoading(true);
      await onSubmitComprovante(
        mensalidade.id,
        fileData.dataUrl,
        fileData.name,
        fileData.type
      );
      onClose();
    } catch {
      setError('Erro ao enviar comprovante. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg bg-zinc-900 border-t border-amber-500/50 sm:border sm:border-amber-500/60 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 text-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl max-h-[90vh] overflow-y-auto pb-safe pb-6 sm:pb-6"
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100 font-heading">
              Enviar Comprovante de Mensalidade (PDF)
            </h3>
            <p className="text-xs text-zinc-400">
              Anexe o comprovante para análise e homologação da Diretoria Financeira.
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="my-4 p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-zinc-500 block text-[11px]">Competência:</span>
            <strong className="text-amber-400 font-semibold">{mensalidade.competencia}</strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">Valor da Mensalidade:</span>
            <strong className="text-emerald-400 font-mono text-sm">
              R$ {mensalidade.valor.toFixed(2)}
            </strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">Vencimento Oficial:</span>
            <span className="text-zinc-300 font-medium">{mensalidade.vencimento}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">Associado:</span>
            <span className="text-zinc-300 font-medium truncate block">
              {mensalidade.nomeAssociado} ({mensalidade.numeroAssociado})
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* File Selector & Drag Area */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-2">
              Selecione o arquivo do comprovante (PDF ou imagem):
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="hidden"
            />

            {!fileData ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-amber-500/70 bg-zinc-950/50 hover:bg-zinc-950 rounded-2xl p-6 text-center cursor-pointer transition group"
              >
                <FileText className="w-10 h-10 mx-auto text-zinc-500 group-hover:text-amber-400 mb-2 transition" />
                <p className="font-semibold text-zinc-200">
                  Clique aqui para selecionar seu arquivo PDF
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Formatos aceitos: PDF, PNG, JPG (Máximo de 8 MB)
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateSamplePdf();
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold border border-zinc-700 transition flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Gerar Comprovante PDF Simulado
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-950 border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-100 text-xs truncate max-w-[220px]">
                        {fileData.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {fileData.sizeKb} KB • {fileData.type.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFileData(null)}
                    className="text-zinc-400 hover:text-red-400 text-[11px] font-semibold transition"
                  >
                    Trocar arquivo
                  </button>
                </div>

                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[11px] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Arquivo pronto para envio ao Financeiro do Clube.</span>
                </div>
              </div>
            )}
          </div>

          {/* Flow Disclaimer */}
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Fluxo de Baixa Automática da Mensalidade:</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[10px]">
              1. Você envia o comprovante em PDF anexado. <br />
              2. O status mudará imediatamente para &ldquo;Em Análise da Diretoria&rdquo;. <br />
              3. O Diretor examina o anexo no painel financeiro e clica em <strong>Aprovar</strong>. <br />
              4. A mensalidade muda para <strong>PAGO</strong> e o histórico definitivo é registrado na sua <strong>Ficha Cadastral</strong>.
            </p>
          </div>

          {/* Statutory protection notice (LGPD / LAI) */}
          <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] text-zinc-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Arquivamento protegido pela <strong>LGPD (Lei nº 13.709/2018)</strong> e auditoria financeira transparente conforme a <strong>LAI (Lei nº 12.527/2011)</strong>.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !fileData}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Enviando...' : 'Enviar Comprovante ao Financeiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
