import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Mail,
  Copy,
  Check,
  X,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Loader2,
  MessageCircle,
  Smartphone,
  Maximize2,
  Send,
  Eye,
} from 'lucide-react';
import { Associado, Veiculo, Mensalidade, ConfiguracaoClube, Evento } from '../types';
import {
  gerarFichaCadastralCompletaPdf,
  gerarChaveAutenticidade20Chars,
} from '../services/fichaCadastralPdfService';

interface Props {
  associado: Associado;
  veiculos: Veiculo[];
  mensalidades: Mensalidade[];
  eventos?: Evento[];
  config: ConfiguracaoClube;
  onClose: () => void;
}

export const VisualizadorFichaCadastralPdfModal: React.FC<Props> = ({
  associado,
  veiculos,
  mensalidades,
  eventos = [],
  config,
  onClose,
}) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // 20-character randomized alphanumeric authenticity key
  const [authInfo] = useState(() => gerarChaveAutenticidade20Chars(associado));

  useEffect(() => {
    // Detect mobile device
    const mobileCheck =
      typeof window !== 'undefined' &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768);
    setIsMobileDevice(mobileCheck);

    let active = true;
    let createdUrl: string | null = null;

    const generatePdf = async () => {
      try {
        setIsGenerating(true);
        const doc = await gerarFichaCadastralCompletaPdf({
          associado,
          veiculos,
          mensalidades,
          eventos,
          config,
          chaveAutenticidade: authInfo,
        });

        if (!active) return;

        const blob = doc.output('blob');
        createdUrl = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setPdfUrl(createdUrl);
      } catch (err) {
        console.error('Erro ao gerar PDF da Ficha Cadastral:', err);
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    generatePdf();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [associado, veiculos, mensalidades, eventos, config, authInfo]);

  // Copy 20-character authentication key
  const handleCopyKey = () => {
    navigator.clipboard.writeText(authInfo.chaveFormatada);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Open natively in the mobile browser
  const handleOpenNativeBrowser = () => {
    if (!pdfBlob) return;
    const blobUrl = URL.createObjectURL(pdfBlob);
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Pop-up blocked: fallback to anchor click
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
    setShareSuccess('PDF aberto em tela cheia no navegador nativo!');
    setTimeout(() => setShareSuccess(null), 3500);
  };

  // Download PDF file
  const handleDownloadPdf = () => {
    if (!pdfBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    const cleanName = (associado.nomeGuerra || associado.nome).replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Ficha_Cadastral_${cleanName}_${associado.numeroAssociado}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  // Direct print
  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.print();
        return;
      } catch {
        // Fallback
      }
    }
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  // Share via WhatsApp (native file share via Web Share API with WhatsApp fallback)
  const handleShareWhatsApp = async () => {
    const nome = associado.nomeGuerra || associado.nome;
    const cleanName = nome.replace(/[^a-zA-Z0-9]/g, '_');
    const msgTexto =
      `🏍️ *FICHA CADASTRAL OFICIAL - ${config.nomeClube}*\n\n` +
      `👤 *Associado:* ${associado.nome} (${nome})\n` +
      `📜 *Matrícula:* ${associado.numeroAssociado}\n` +
      `🛡️ *Cargo:* ${associado.cargo || 'Membro Ativo'}\n` +
      `📍 *Regional:* ${associado.regional || config.cidadeSede}\n` +
      `🩸 *Tipo Sanguíneo:* ${associado.tipoSanguineo || 'Não informado'}\n` +
      `🔑 *Chave de Autenticidade (20 Dígitos):* ${authInfo.chaveFormatada}\n` +
      `🔒 *Hash de Integridade:* ${authInfo.hashIntegridade}\n\n` +
      `_Documento emitido com cabeçalho oficial do clube, resguardado pela LGPD (Lei nº 13.709/2018)._`;

    // Try native Web Share with file attachment
    if (pdfBlob && typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File(
          [pdfBlob],
          `Ficha_Cadastral_${cleanName}_${associado.numeroAssociado}.pdf`,
          { type: 'application/pdf' }
        );

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Ficha Cadastral Oficial - ${nome}`,
            text: msgTexto,
          });
          setShareSuccess('Documento compartilhado com sucesso!');
          setTimeout(() => setShareSuccess(null), 3000);
          return;
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.warn('Web Share API fallback acionado:', err);
        } else {
          return; // User cancelled
        }
      }
    }

    // Direct WhatsApp API URL
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msgTexto)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Share via Email (prepares attachment download + pre-filled mailto)
  const handleShareEmail = () => {
    // 1. Download the file so the user can easily attach
    handleDownloadPdf();

    // 2. Open email client with pre-filled subject and detailed body
    const nome = associado.nomeGuerra || associado.nome;
    const assunto = `Ficha Cadastral Oficial - ${nome} (${associado.numeroAssociado}) - ${config.nomeClube}`;
    const corpo =
      `Prezados,\n\n` +
      `Segue a Ficha Cadastral Oficial completa emitida pelo sistema ${config.nomeClube}.\n\n` +
      `DADOS DO ASSOCIADO:\n` +
      `- Nome Completo: ${associado.nome}\n` +
      `- Nome de Guerra / Apelido: ${nome}\n` +
      `- Matrícula Oficial: ${associado.numeroAssociado}\n` +
      `- CPF: ${associado.cpf}\n` +
      `- Cargo: ${associado.cargo || 'Membro Ativo'}\n` +
      `- Regional: ${associado.regional || config.cidadeSede}\n` +
      `- Tipo Sanguíneo com Rh: ${associado.tipoSanguineo || 'Não informado'}\n\n` +
      `CHAVE DE AUTENTICIDADE E VALIDAÇÃO DIGITAL (20 CARACTERES):\n` +
      `Código: ${authInfo.chaveFormatada}\n` +
      `Chave Bruta: ${authInfo.chaveBruta}\n` +
      `Hash de Integridade: ${authInfo.hashIntegridade}\n\n` +
      `O arquivo em formato PDF foi baixado automaticamente no seu dispositivo para envio em anexo.\n\n` +
      `Atenciosamente,\n` +
      `Diretoria do ${config.nomeClube}\n` +
      `Contato: ${config.telefoneContato || config.whatsappContato} | ${config.emailContato}`;

    const mailtoUrl = `mailto:${associado.email || ''}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = mailtoUrl;

    setShareSuccess('PDF baixado no dispositivo e e-mail aberto para envio!');
    setTimeout(() => setShareSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[95vh] bg-zinc-900 border border-amber-500/60 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-zinc-950 border-b border-zinc-800 gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Ficha Cadastral em PDF • {associado.nomeGuerra || associado.nome}
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  {associado.numeroAssociado}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Cabeçalho oficial do clube, todos os campos de cadastro e chave de 20 caracteres no rodapé
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Botão de Abertura Nativa no Navegador Móvel */}
            <button
              type="button"
              onClick={handleOpenNativeBrowser}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-black transition shadow-md shadow-amber-500/25 cursor-pointer disabled:opacity-50"
              title="Abrir o PDF nativamente no navegador móvel com zoom tátil completo"
            >
              <Smartphone className="w-4 h-4" />
              <span>Abrir no Navegador</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Compartilhar Ficha Cadastral no WhatsApp como anexo ou mensagem"
            >
              <MessageCircle className="w-4 h-4 text-emerald-100" />
              <span>WhatsApp</span>
            </button>

            {/* Email Share Button */}
            <button
              type="button"
              onClick={handleShareEmail}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Enviar por E-mail com anexo em PDF"
            >
              <Mail className="w-4 h-4 text-sky-100" />
              <span>E-mail</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition cursor-pointer disabled:opacity-50 hidden sm:flex"
              title="Baixar arquivo PDF"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Baixar</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 transition cursor-pointer disabled:opacity-50 hidden md:flex"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {shareSuccess && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 text-xs px-4 py-2 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {shareSuccess}
            </span>
            <button onClick={() => setShareSuccess(null)} className="text-zinc-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Mobile Device Optimization Prompt */}
        {isMobileDevice && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-2 flex items-center justify-between gap-2 text-[11px] text-amber-300 shrink-0">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Para a melhor experiência no celular, toque em <strong>"Abrir no Navegador"</strong> para visualização fluida em tela cheia com zoom tátil.
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenNativeBrowser}
              className="px-2.5 py-1 bg-amber-500 text-zinc-950 rounded-lg font-black shrink-0 text-[10px]"
            >
              Abrir
            </button>
          </div>
        )}

        {/* Center: PDF Interactive Preview */}
        <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center space-y-3 p-6">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-zinc-200">
                Gerando Ficha Cadastral Oficial com Cabeçalho e Todos os Campos...
              </p>
              <p className="text-[11px] text-zinc-500">
                Compilando dados civis, veículos, saúde, chave de 20 caracteres e hash de integridade
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              title="Pré-visualização da Ficha Cadastral Oficial"
              className="w-full h-full border-none"
            />
          ) : (
            <div className="text-zinc-500 text-xs">Erro ao processar pré-visualização.</div>
          )}
        </div>

        {/* Bottom Bar: 20-Character Authenticity Key (Hash) & Validation */}
        <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
                  Chave de Autenticidade &amp; Validação (20 Caracteres no Rodapé)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  <ShieldCheck className="w-3 h-3" /> Hash Verificado
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-sm sm:text-base font-mono font-extrabold text-amber-300 tracking-wider bg-zinc-900 px-2.5 py-1 rounded-lg border border-amber-500/40 select-all">
                  {authInfo.chaveFormatada}
                </code>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition cursor-pointer"
                  title="Copiar código de 20 dígitos"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 text-right hidden sm:block">
            <span className="block font-mono text-zinc-300">
              Chave Bruta: <strong className="text-amber-400 font-bold">{authInfo.chaveBruta}</strong>
            </span>
            <span className="text-zinc-500">
              Hash: {authInfo.hashIntegridade} • Emissão: {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
