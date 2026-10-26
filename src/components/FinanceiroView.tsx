import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  CreditCard,
  QrCode,
  FileText,
  Calendar,
  BarChart3,
  Upload,
  FileCheck2,
  Eye,
  ShieldCheck,
  XCircle,
  X,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  FileDown,
  BellRing,
} from 'lucide-react';
import { Landmark } from 'lucide-react';
import { AdminChartsDashboard } from './AdminChartsDashboard';
import { HistoricoMensalidadesLineChart } from './HistoricoMensalidadesLineChart';
import { UploadComprovanteModal } from './UploadComprovanteModal';
import { RelatoriosFinanceirosModal } from './RelatoriosFinanceirosModal';
import { LembretesMensalidadesModal } from './LembretesMensalidadesModal';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { ExtratoFinanceiroBancario } from './ExtratoFinanceiroBancario';
import { exportFinanceiroPdf, exportFluxoCaixaAnualPdf } from '../services/pdfExportService';
import { DEFAULT_CADASTRO_INSTITUCIONAL } from '../services/db';
import {
  Mensalidade,
  Associado,
  ConfiguracaoClube,
  Manutencao,
  Abastecimento,
  CadastroInstitucional,
} from '../types';

interface Props {
  mensalidades: Mensalidade[];
  associados: Associado[];
  manutencoes?: Manutencao[];
  abastecimentos?: Abastecimento[];
  config: ConfiguracaoClube;
  dadosInstitucionais?: CadastroInstitucional;
  onUpdateStatus: (id: string, status: Mensalidade['status'], forma?: string) => Promise<void>;
  onCreateBatchMonth: (
    competencia: string,
    ano: number,
    mes: number,
    valor: number,
    vencimento: string
  ) => Promise<void>;
  onOpenPixModal: (m: Mensalidade) => void;
  onSubmitComprovante?: (
    mensalidadeId: string,
    fileDataUrl: string,
    fileName: string,
    fileType: string
  ) => Promise<void>;
  onAprovarComprovante?: (mensalidadeId: string, diretorNome?: string) => Promise<void>;
  onRejeitarComprovante?: (
    mensalidadeId: string,
    motivo: string,
    diretorNome?: string
  ) => Promise<void>;
}

export const FinanceiroView: React.FC<Props> = ({
  mensalidades,
  associados,
  manutencoes = [],
  abastecimentos = [],
  config,
  dadosInstitucionais,
  onUpdateStatus,
  onCreateBatchMonth,
  onOpenPixModal,
  onSubmitComprovante,
  onAprovarComprovante,
  onRejeitarComprovante,
}) => {
  const { activeRole, currentAssociado } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'mensalidades' | 'extrato_bancario'>('mensalidades');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [comprovanteFilter, setComprovanteFilter] = useState<'todos' | 'pendentes' | 'com_anexo'>('todos');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false);
  const [isLembretesModalOpen, setIsLembretesModalOpen] = useState(false);

  // Modals for receipts
  const [selectedUploadMensalidade, setSelectedUploadMensalidade] = useState<Mensalidade | null>(null);
  const [previewComprovante, setPreviewComprovante] = useState<Mensalidade | null>(null);
  const [rejeicaoModalMensalidade, setRejeicaoModalMensalidade] = useState<Mensalidade | null>(null);
  const [rejeicaoMotivo, setRejeicaoMotivo] = useState('');

  // Batch generator state
  const [batchForm, setBatchForm] = useState({
    competencia: 'Novembro/2026',
    ano: 2026,
    mes: 11,
    valor: config.valorMensalidadePadrao || 85.0,
    vencimento: `10/11/2026`,
  });

  // Filter based on role
  const displayMensalidades = mensalidades.filter((m) => {
    if (activeRole === 'associado' && currentAssociado) {
      if (m.associadoId !== currentAssociado.id && m.associadoId !== currentAssociado.uid) {
        return false;
      }
    }

    const matchesSearch =
      m.nomeAssociado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.numeroAssociado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.competencia.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'todos' ? true : m.status === statusFilter;

    const matchesComprovante =
      comprovanteFilter === 'todos'
        ? true
        : comprovanteFilter === 'pendentes'
        ? m.statusComprovante === 'pendente_analise'
        : Boolean(m.comprovanteUrl);

    return matchesSearch && matchesStatus && matchesComprovante;
  });

  // Financial statistics
  const totalArrecadado = displayMensalidades
    .filter((m) => m.status === 'pago')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalPendente = displayMensalidades
    .filter((m) => m.status === 'pendente')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalAtrasado = displayMensalidades
    .filter((m) => m.status === 'atrasado')
    .reduce((acc, c) => acc + c.valor, 0);

  const comprovantesPendentesCount = mensalidades.filter(
    (m) => m.statusComprovante === 'pendente_analise'
  ).length;

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateBatchMonth(
      batchForm.competencia,
      batchForm.ano,
      batchForm.mes,
      batchForm.valor,
      batchForm.vencimento
    );
    setIsBatchModalOpen(false);
  };

  const handleAprovar = async (m: Mensalidade) => {
    if (onAprovarComprovante) {
      await onAprovarComprovante(m.id, 'Diretoria Financeira');
    } else {
      await onUpdateStatus(m.id, 'pago', 'Comprovante Homologado');
    }
  };

  const handleConfirmRejeicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejeicaoModalMensalidade || !rejeicaoMotivo.trim()) return;

    if (onRejeitarComprovante) {
      await onRejeitarComprovante(
        rejeicaoModalMensalidade.id,
        rejeicaoMotivo,
        'Diretoria Financeira'
      );
    }
    setRejeicaoModalMensalidade(null);
    setRejeicaoMotivo('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
              {activeRole === 'associado'
                ? 'Dashboard das Mensalidades & Competências'
                : 'Controle Financeiro & Mensalidades'}
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Auditoria LAI &amp; LGPD
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {activeRole === 'associado'
              ? 'Consulte a situação de cada competência, envie comprovante em PDF para aprovação do Diretor e pague via PIX.'
              : 'Gerenciamento de mensalidades, arrecadação da sede e homologação de comprovantes anexados pelos associados.'}
          </p>
        </div>

        {activeRole !== 'associado' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsRelatorioModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition shadow-sm"
              title="Fluxo de Caixa Acumulado Anual (Recharts)"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Fluxo de Caixa Anual</span>
            </button>
            <button
              type="button"
              onClick={() =>
                exportFinanceiroPdf(
                  displayMensalidades,
                  config,
                  statusFilter !== 'todos' ? `Status: ${statusFilter}` : undefined
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold transition shadow-sm"
              title="Exportar Relação de Títulos em PDF"
            >
              <FileDown className="w-4 h-4 text-zinc-400" />
              <span>Lista Títulos PDF</span>
            </button>
            <button
              type="button"
              onClick={() => exportFluxoCaixaAnualPdf(mensalidades, manutencoes, config, 2026)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black transition shadow-md shadow-amber-500/20 cursor-pointer"
              title="Gerar PDF Consolidado de Fluxo de Caixa Anual (Mensalidades vs Despesas) com Branding e Rodapé Jurídico LGPD & LAI"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF Fluxo Anual (LGPD/LAI)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLembretesModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Agendamento Automático de Lembretes no Navegador para Mensalidades Pendentes"
            >
              <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Lembretes Automáticos</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCharts((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition border ${
                showCharts
                  ? 'bg-amber-500 text-zinc-950 border-amber-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showCharts ? 'Ocultar Gráficos' : 'Gráficos Analíticos'}</span>
            </button>
            {activeRole === 'administrador' && (
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Gerar Competência do Mês
              </button>
            )}
          </div>
        )}
      </div>

      {/* SUBTAB NAVIGATOR: MENSALIDADES VS EXTRATO BANCÁRIO (MÓDULO 05) */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSubTab('mensalidades')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'mensalidades'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black'
              : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Mensalidades dos Integrantes</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${
              activeSubTab === 'mensalidades'
                ? 'bg-zinc-950/20 text-zinc-950'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {displayMensalidades.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('extrato_bancario')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'extrato_bancario'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black'
              : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
          }`}
        >
          <Landmark className="w-4 h-4 text-blue-400" />
          <span>Extrato Bancário &amp; Movimentações (Módulo 05)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              activeSubTab === 'extrato_bancario'
                ? 'bg-white/20 text-white'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}
          >
            {activeRole === 'associado' ? 'Somente Leitura' : 'Créditos / Débitos'}
          </span>
        </button>
      </div>

      {activeSubTab === 'extrato_bancario' ? (
        <ExtratoFinanceiroBancario
          dadosInstitucionais={dadosInstitucionais || DEFAULT_CADASTRO_INSTITUCIONAL}
          mensalidades={mensalidades}
          config={config}
          onOpenPixModal={onOpenPixModal}
        />
      ) : (
        <>
          {/* LGPD & LAI Financial Banner */}
          <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-zinc-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Prestação de Contas &amp; Transparência (LAI Lei 12.527 / LGPD Lei 13.709):</strong> Comprovantes em PDF aprovados pela diretoria ficam permanentemente registrados na ficha cadastral do associado para auditoria e histórico de contribuições.
              </span>
            </div>
          </div>

      {/* DIRECTORS' PENDING RECEIPT BANNER */}
      {activeRole !== 'associado' && comprovantesPendentesCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-950/60 to-zinc-950 border-2 border-amber-500/60 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-heading">
                {comprovantesPendentesCount} Comprovante(s) em PDF Aguardando Aprovação da Diretoria
              </h4>
              <p className="text-xs text-zinc-300">
                Associados anexaram comprovantes de pagamento. Valide os anexos para mudar o status para <strong>Pago</strong> e arquivar na Ficha do Associado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setComprovanteFilter(comprovanteFilter === 'pendentes' ? 'todos' : 'pendentes')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shrink-0 shadow-md"
          >
            {comprovanteFilter === 'pendentes' ? 'Ver Todos os Títulos' : 'Filtrar Pendentes'}
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium block">Total Recebido &amp; Homologado</span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="text-2xl font-black text-emerald-400 font-heading">
              R$ {totalArrecadado.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Mensalidades confirmadas pelo diretor</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium block">Pendente no Período</span>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <span className="text-2xl font-black text-amber-400 font-heading">
              R$ {totalPendente.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Aguardando comprovante ou aprovação</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium block">Em Atraso</span>
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-2xl font-black text-red-400 font-heading">
              R$ {totalAtrasado.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Cobrança pendente da tesouraria</p>
        </div>
      </div>

      {/* Gráfico de Linhas Interativo (Recharts): Histórico dos Últimos 6 Meses (Pagas vs. Pendentes) */}
      <HistoricoMensalidadesLineChart
        mensalidades={activeRole === 'associado' && currentAssociado ? displayMensalidades : mensalidades}
        activeRole={activeRole}
        isAssociadoView={activeRole === 'associado'}
        associadoNome={currentAssociado?.nome || currentAssociado?.nomeGuerra}
      />

      {/* Gráficos Analíticos com Recharts */}
      {showCharts && activeRole !== 'associado' && (
        <AdminChartsDashboard
          associados={associados}
          mensalidades={mensalidades}
          config={config}
        />
      )}

      {/* Filters (Admin & Diretoria) */}
      {activeRole !== 'associado' && (
        <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por associado, matrícula ou competência..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Quitados / Pagos</option>
              <option value="pendente">Pendentes</option>
              <option value="atrasado">Em Atraso</option>
            </select>

            <select
              value={comprovanteFilter}
              onChange={(e) => setComprovanteFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="todos">Todos os Comprovantes</option>
              <option value="pendentes">Em Análise pelo Diretor</option>
              <option value="com_anexo">Com Anexo (PDF/Imagem)</option>
            </select>
          </div>
        </div>
      )}

      {/* Dues Table / Cards */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Associado</th>
                <th className="py-3 px-4">Competência</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Situação</th>
                <th className="py-3 px-4">Comprovante em PDF</th>
                <th className="py-3 px-4 text-right">Ações &amp; Aprovação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {displayMensalidades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Nenhum registro de mensalidade encontrado para esta consulta.
                  </td>
                </tr>
              ) : (
                displayMensalidades.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-100">{m.nomeAssociado}</div>
                      <span className="text-[10px] font-mono text-amber-400">
                        {m.numeroAssociado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-200">
                      {m.competencia}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-100">
                      R$ {m.valor.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{m.vencimento}</td>

                    {/* Situação */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          m.status === 'pago'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : m.status === 'pendente'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {m.status === 'pago' && <CheckCircle2 className="w-3 h-3" />}
                        {m.status === 'pendente' && <Clock className="w-3 h-3" />}
                        {m.status === 'atrasado' && <AlertCircle className="w-3 h-3" />}
                        {m.status}
                      </span>
                      {m.dataPagamento && (
                        <span className="block text-[10px] text-zinc-500 mt-0.5">
                          Pago em {m.dataPagamento}
                        </span>
                      )}
                    </td>

                    {/* Comprovante em PDF */}
                    <td className="py-3.5 px-4">
                      {m.comprovanteUrl ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setPreviewComprovante(m)}
                            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="truncate max-w-[140px]">
                              {m.comprovanteNomeArquivo || 'Ver Anexo (PDF)'}
                            </span>
                          </button>

                          {m.statusComprovante === 'pendente_analise' && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Aguardando Diretor
                            </span>
                          )}

                          {m.statusComprovante === 'aprovado' && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Homologado ({m.aprovadoPorDiretor || 'Diretoria'})
                            </span>
                          )}

                          {m.statusComprovante === 'rejeitado' && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                              Recusado
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">
                          Nenhum comprovante anexado
                        </span>
                      )}
                    </td>

                    {/* Ações & Aprovação */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Member: Botão de envio do comprovante da mensalidade em PDF */}
                        {m.status !== 'pago' && (
                          <button
                            type="button"
                            onClick={() => setSelectedUploadMensalidade(m)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] font-bold border border-zinc-700 transition shadow-sm"
                            title="Anexar Comprovante em PDF para o Financeiro"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>{m.comprovanteUrl ? 'Reenviar PDF' : 'Enviar Comprovante (PDF)'}</span>
                          </button>
                        )}

                        {/* PIX Modal Button */}
                        {m.status !== 'pago' && (
                          <button
                            type="button"
                            onClick={() => onOpenPixModal(m)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] shadow-sm transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Pagar PIX
                          </button>
                        )}

                        {/* Diretoria / Admin: Aprovação de Comprovante & Mudança para Pago */}
                        {activeRole !== 'associado' && m.status !== 'pago' && (
                          <>
                            {m.comprovanteUrl && m.statusComprovante === 'pendente_analise' ? (
                              <button
                                type="button"
                                onClick={() => handleAprovar(m)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[11px] font-bold shadow-md transition"
                                title="Aprovar anexo e mudar para Pago com histórico"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>Aprovar &amp; Quitar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(m.id, 'pago', 'Manual')}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-[11px] font-semibold border border-zinc-700 transition"
                                title="Dar baixa manual"
                              >
                                Dar Baixa
                              </button>
                            )}

                            {m.comprovanteUrl && m.statusComprovante === 'pendente_analise' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejeicaoModalMensalidade(m);
                                  setRejeicaoMotivo('');
                                }}
                                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-red-900/40 text-red-400 border border-zinc-700 transition"
                                title="Recusar comprovante"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}

                        {m.status === 'pago' && (
                          <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Quitado ({m.formaPagamento || 'PIX'})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* UPLOAD RECEIPT MODAL */}
      {selectedUploadMensalidade && onSubmitComprovante && (
        <UploadComprovanteModal
          mensalidade={selectedUploadMensalidade}
          onClose={() => setSelectedUploadMensalidade(null)}
          onSubmitComprovante={onSubmitComprovante}
        />
      )}

      {/* PREVIEW COMPROVANTE MODAL */}
      {previewComprovante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/60 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <button
              onClick={() => setPreviewComprovante(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-heading">
                  Comprovante Anexado de Mensalidade
                </h3>
                <p className="text-xs text-zinc-400">
                  {previewComprovante.competencia} • {previewComprovante.nomeAssociado} (
                  {previewComprovante.numeroAssociado})
                </p>
              </div>
            </div>

            <div className="my-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Nome do Arquivo:</span>
                <strong className="text-amber-400 font-mono">
                  {previewComprovante.comprovanteNomeArquivo || 'comprovante.pdf'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Enviado em:</span>
                <span className="text-zinc-200">
                  {previewComprovante.comprovanteEnviadoEm || 'Recente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Valor do Título:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  R$ {previewComprovante.valor.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Status de Homologação:</span>
                <span
                  className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                    previewComprovante.status === 'pago'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {previewComprovante.status === 'pago' ? 'Aprovado / Quitado' : 'Em Análise pelo Diretor'}
                </span>
              </div>
              {previewComprovante.aprovadoPorDiretor && (
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Aprovado Por:</span>
                  <strong className="text-emerald-400">
                    {previewComprovante.aprovadoPorDiretor} ({previewComprovante.dataAprovacaoDiretor})
                  </strong>
                </div>
              )}
            </div>

            {/* Direct Open / Download Link */}
            {previewComprovante.comprovanteUrl && (
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center">
                <a
                  href={previewComprovante.comprovanteUrl}
                  download={previewComprovante.comprovanteNomeArquivo || 'comprovante.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  <FileText className="w-4 h-4" />
                  Abrir / Baixar Documento PDF Completo
                </a>
              </div>
            )}

            {/* Director Actions from Preview */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800 mt-4">
              <button
                type="button"
                onClick={() => setPreviewComprovante(null)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs"
              >
                Fechar
              </button>

              {activeRole !== 'associado' && previewComprovante.status !== 'pago' && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleAprovar(previewComprovante);
                    setPreviewComprovante(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Aprovar Comprovante &amp; Mudar para Pago
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejeicaoModalMensalidade && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-red-500/50 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Recusar Comprovante de Pagamento
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Informe a justificativa da recusa para o associado {rejeicaoModalMensalidade.nomeAssociado}.
            </p>

            <form onSubmit={handleConfirmRejeicao} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Motivo da Recusa *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Valor incorreto no anexo, comprovante ilegível ou data divergente..."
                  value={rejeicaoMotivo}
                  onChange={(e) => setRejeicaoMotivo(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRejeicaoModalMensalidade(null)}
                  className="px-3 py-2 text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl"
                >
                  Confirmar Recusa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH GENERATOR MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Lançamento em Lote para Todos os Associados
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Cria uma nova mensalidade automaticamente para cada um dos associados ativos cadastrados.
            </p>

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nome da Competência *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novembro/2026"
                  value={batchForm.competencia}
                  onChange={(e) => setBatchForm({ ...batchForm, competencia: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Valor Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.valor}
                    onChange={(e) => setBatchForm({ ...batchForm, valor: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Data de Vencimento</label>
                  <input
                    type="text"
                    required
                    placeholder="10/11/2026"
                    value={batchForm.vencimento}
                    onChange={(e) => setBatchForm({ ...batchForm, vencimento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
                Serão gerados títulos para <strong>{associados.length} associados</strong> no valor individual de R$ {batchForm.valor.toFixed(2)}.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-3 py-2 text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
                >
                  Gerar Títulos em Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé do Financeiro */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />

      {/* Modal de Relatórios Financeiros (Fluxo de Caixa Acumulado Anual) */}
      {isRelatorioModalOpen && (
        <RelatoriosFinanceirosModal
          isOpen={isRelatorioModalOpen}
          onClose={() => setIsRelatorioModalOpen(false)}
          mensalidades={mensalidades}
          manutencoes={manutencoes}
          abastecimentos={abastecimentos}
          config={config}
        />
      )}

      {/* Modal de Lembretes Automáticos e Agendamento no Navegador */}
      <LembretesMensalidadesModal
        isOpen={isLembretesModalOpen}
        onClose={() => setIsLembretesModalOpen(false)}
        mensalidades={mensalidades}
        associados={associados}
      />
    </div>
  );
};
