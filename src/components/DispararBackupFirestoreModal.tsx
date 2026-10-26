import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileJson,
  Hash,
  Server,
  Layers,
  Copy,
  Check,
  Clock,
  HardDrive,
  FileText,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  dispararBackupCompletoFirestore,
  getHistoricoBackupsFirestore,
  FirestoreBackupResult,
  HistoricoBackupRegistro,
} from '../services/firestoreBackupService';
import firebaseConfig from '../../firebase-applet-config.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBackupSuccess?: (result: FirestoreBackupResult) => void;
}

export const DispararBackupFirestoreModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onBackupSuccess,
}) => {
  const { activeRole, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progressoEtapa, setProgressoEtapa] = useState('');
  const [progressoPct, setProgressoPct] = useState(0);
  const [resultado, setResultado] = useState<FirestoreBackupResult | null>(null);
  const [historico, setHistorico] = useState<HistoricoBackupRegistro[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [copiadoHash, setCopiadoHash] = useState(false);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHistorico(getHistoricoBackupsFirestore());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDispararBackup = async () => {
    if (activeRole !== 'administrador') {
      alert('Apenas o perfil Administrador tem permissão para disparar o backup do banco de dados.');
      return;
    }

    setLoading(true);
    setErro(null);
    setResultado(null);
    setProgressoPct(0);
    setProgressoEtapa('Iniciando conexão segura com o Firestore...');

    try {
      const res = await dispararBackupCompletoFirestore({
        autorEmail: currentUser?.email || 'dinastiasystem@gmail.com',
        autorUid: currentUser?.uid || 'admin-geral',
        dispararDownloadAutomatico: true,
        onProgresso: (etapa, pct) => {
          setProgressoEtapa(etapa);
          setProgressoPct(pct);
        },
      });

      if (res.sucesso) {
        setResultado(res);
        setHistorico(getHistoricoBackupsFirestore());
        if (onBackupSuccess) {
          onBackupSuccess(res);
        }
      } else {
        setErro(res.error || 'Falha ao processar o backup do Firestore.');
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro inesperado durante a extração do Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarJson = () => {
    if (!resultado?.jsonCompleto) return;
    navigator.clipboard.writeText(resultado.jsonCompleto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleCopiarHash = () => {
    if (!resultado?.hashIntegridade) return;
    navigator.clipboard.writeText(resultado.hashIntegridade);
    setCopiadoHash(true);
    setTimeout(() => setCopiadoHash(false), 2500);
  };

  const handleReDownload = () => {
    if (!resultado?.jsonCompleto) return;
    const blob = new Blob([resultado.jsonCompleto], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = resultado.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl my-auto rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header do Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Módulo 12 • Auditoria
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Exclusivo Administrador
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-100 font-heading tracking-tight mt-1 flex items-center gap-2">
                Backup Completo do Cloud Firestore (JSON)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Extração integral de todas as coleções, documentos e trilhas de auditoria para arquivo JSON com hash SHA-256.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações da Instância Firestore */}
        <div className="bg-zinc-950/70 px-6 py-2.5 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400 font-mono shrink-0">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span>Projeto Firebase:</span>
            <strong className="text-zinc-200">{firebaseConfig.projectId}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Banco de Dados:</span>
            <strong className="text-emerald-400">
              {firebaseConfig.firestoreDatabaseId || '(default)'} (Cloud Firestore Enterprise)
            </strong>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Card de Disparo Principal */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Disparo de Cópia Bruta de Segurança (JSON)
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                  Ao clicar no botão abaixo, o sistema percorre diretamente as coleções do Cloud Firestore
                  (associados, mensalidades, extrato financeiro, veículos, manutenções, eventos, mural, comunicados e trilha imutável),
                  valida a integridade dos registros e descarrega um arquivo JSON padronizado com carimbo de tempo e hash SHA-256.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDispararBackup}
                disabled={loading || activeRole !== 'administrador'}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs sm:text-sm font-black transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 border border-amber-400/50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando Banco... ({progressoPct}%)</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Disparar Backup Firestore Agora</span>
                    <Download className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Barra de Progresso Durante a Extração */}
            {loading && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                  <span className="flex items-center gap-2 text-amber-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {progressoEtapa}
                  </span>
                  <span className="font-mono font-bold text-amber-400">{progressoPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progressoPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Falha na execução do backup:</strong>
                  <span>{erro}</span>
                </div>
              </div>
            )}
          </div>

          {/* Resultado do Backup Concluído com Sucesso */}
          {resultado && (
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 shadow-xl space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      Backup Concluído &amp; Descarregado com Sucesso!
                    </h4>
                    <p className="text-xs text-zinc-400">
                      O arquivo JSON foi gerado e salvo automaticamente no seu dispositivo.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReDownload}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Novamente
                  </button>

                  <button
                    type="button"
                    onClick={handleCopiarJson}
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiado ? 'Copiado!' : 'Copiar JSON'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMostrarPrevia(!mostrarPrevia)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {mostrarPrevia ? 'Ocultar Prévia' : 'Ver Prévia JSON'}
                  </button>
                </div>
              </div>

              {/* Grid de Metadados do Arquivo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Nome do Arquivo</span>
                  <span className="font-mono text-zinc-200 font-semibold truncate block" title={resultado.nomeArquivo}>
                    {resultado.nomeArquivo}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Tamanho</span>
                  <span className="font-mono text-emerald-400 font-bold block">
                    {resultado.tamanhoFormatado}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total de Coleções</span>
                  <span className="font-mono text-amber-400 font-bold block">
                    {resultado.totalColecoes} coleções
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total de Documentos</span>
                  <span className="font-mono text-sky-400 font-bold block">
                    {resultado.totalDocumentos} registros
                  </span>
                </div>
              </div>

              {/* Hash de Integridade SHA-256 */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Hash className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-zinc-400 shrink-0">Hash de Integridade (SHA-256):</span>
                  <code className="font-mono text-amber-300 text-[11px] truncate select-all">
                    {resultado.hashIntegridade}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopiarHash}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold border border-zinc-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  {copiadoHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiadoHash ? 'Hash Copiado!' : 'Copiar Hash'}
                </button>
              </div>

              {/* Aviso de Registro Automático na Trilha de Auditoria */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-2.5 text-[11px] text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200">Trilha de Auditoria Atualizada:</strong> O disparo deste backup completo
                  foi registrado permanentemente na coleção <code>/auditoria</code> com ação <span className="text-amber-400 font-mono">BACKUP_COMPLETO_FIRESTORE_JSON</span>,
                  autor <span className="text-zinc-300">{currentUser?.email || 'dinastiasystem@gmail.com'}</span>, contagem de registros e hash de integridade para fins de conformidade.
                </div>
              </div>

              {/* Prévia do JSON */}
              {mostrarPrevia && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-bold text-zinc-300">Estrutura Bruta Exportada:</span>
                    <span>Primeiras 120 linhas</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 max-h-60 overflow-y-auto custom-scrollbar">
                    {resultado.jsonCompleto.split('\n').slice(0, 120).join('\n')}
                    {'\n... (restante dos dados omitido na prévia)'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Resumo das Coleções Cobertas pelo Backup */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Coleções &amp; Registros Abrangidos no Backup Completo ({resultado?.totalColecoes || 16})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(resultado?.resumoColecoes || [
                { colecao: 'associados', nomeExibicao: 'Associados', quantidade: 0, descricao: 'Fichas, matrículas e histórico' },
                { colecao: 'veiculos', nomeExibicao: 'Motos & Frota', quantidade: 0, descricao: 'Motos, placas e modelos' },
                { colecao: 'mensalidades', nomeExibicao: 'Mensalidades', quantidade: 0, descricao: 'Baixas PIX e comprovantes' },
                { colecao: 'extrato_bancario', nomeExibicao: 'Extrato Bancário', quantidade: 0, descricao: 'Movimentações de conta' },
                { colecao: 'manutencoes', nomeExibicao: 'Manutenções', quantidade: 0, descricao: 'Revisões mecânicas e custos' },
                { colecao: 'abastecimentos', nomeExibicao: 'Abastecimentos', quantidade: 0, descricao: 'Combustível e km rodados' },
                { colecao: 'eventos', nomeExibicao: 'Eventos & Passeios', quantidade: 0, descricao: 'Passeios e presenças' },
                { colecao: 'comunicados', nomeExibicao: 'Mural Oficial', quantidade: 0, descricao: 'Avisos da diretoria' },
                { colecao: 'campanhas', nomeExibicao: 'Campanhas Solidárias', quantidade: 0, descricao: 'Ação social e doações' },
                { colecao: 'auditoria', nomeExibicao: 'Trilha de Auditoria', quantidade: 0, descricao: 'Logs imutáveis de ações' },
                { colecao: 'cadastro_institucional', nomeExibicao: 'Dados Institucionais', quantidade: 0, descricao: 'CNPJ, atas e bancos' },
                { colecao: 'configuracoes', nomeExibicao: 'Configuração do Clube', quantidade: 0, descricao: 'Identidade e parâmetros' },
              ]).map((c) => (
                <div
                  key={c.colecao}
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <span className="font-bold text-zinc-200 block truncate">{c.nomeExibicao}</span>
                    <span className="text-[10px] text-zinc-500 font-mono block truncate">
                      /{c.colecao}
                    </span>
                  </div>
                  {resultado ? (
                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      {c.quantidade} docs
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">Cloud Firestore</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Histórico Local de Backups Recentes */}
          {historico.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Histórico Recente de Backups Disparados ({historico.length})
              </h4>

              <div className="divide-y divide-zinc-800/80 rounded-2xl bg-zinc-950/60 border border-zinc-800 overflow-hidden">
                {historico.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-zinc-800/30 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-bold text-zinc-200 font-mono text-[11px]">{h.nomeArquivo}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {h.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {h.dataHoraFormatada} &bull; {h.totalDocumentos} registros &bull; {h.tamanhoFormatado} &bull; Autor: {h.autorEmail}
                      </p>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-400 truncate max-w-xs" title={h.hashIntegridade}>
                      {h.hashIntegridade}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Compatível com restauração e contingência offline (JSON RFC 8259)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
