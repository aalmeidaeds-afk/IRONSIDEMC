import React, { useState } from 'react';
import {
  FileText,
  FileDown,
  Users,
  CreditCard,
  Bike,
  Wrench,
  DollarSign,
  TrendingUp,
  Trophy,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Filter,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Associado,
  Veiculo,
  Mensalidade,
  Manutencao,
  Abastecimento,
  Evento,
  AuditoriaLog,
  ConfiguracaoClube,
  CadastroInstitucional,
} from '../types';
import { exportAssociadosPdf, exportFinanceiroPdf, exportFrotaPdf, exportFluxoCaixaAnualPdf } from '../services/pdfExportService';
import { exportarCarteirinhaPdf } from '../services/carteirinhaPdfService';
import { gerarRelatorioPreventivoVeiculosPdf } from '../services/manutencaoPreventivaPdfService';
import { calcularRankEstradas, exportarRankEstradasPdf } from '../services/rankEstradasPdfService';
import { gerarFichaCadastralCompletaPdf } from '../services/fichaCadastralPdfService';
import { exportarAuditoriaCsv } from '../utils/csvExportHelper';

interface Props {
  associados: Associado[];
  veiculos: Veiculo[];
  mensalidades: Mensalidade[];
  manutencoes: Manutencao[];
  abastecimentos: Abastecimento[];
  eventos: Evento[];
  auditoriaLogs: AuditoriaLog[];
  config: ConfiguracaoClube;
  cadastroInstitucional?: CadastroInstitucional;
  onNavigateToTab?: (tab: string) => void;
}

export const RelatoriosCentralView: React.FC<Props> = ({
  associados,
  veiculos,
  mensalidades,
  manutencoes,
  abastecimentos,
  eventos,
  auditoriaLogs,
  config,
  cadastroInstitucional,
  onNavigateToTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<'todos' | 'membros' | 'frota' | 'financeiro' | 'estrada' | 'auditoria'>('todos');
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const [selectedAssociadoId, setSelectedAssociadoId] = useState<string>(associados[0]?.id || '');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const selectedAssociado = associados.find((a) => a.id === selectedAssociadoId) || associados[0];

  // Report Executions
  const handleGerarFichaCadastral = async () => {
    if (!selectedAssociado) {
      showFeedback('Selecione um associado para gerar a ficha cadastral.', 'error');
      return;
    }
    try {
      setLoadingReportId('ficha_cadastral');
      const doc = await gerarFichaCadastralCompletaPdf({
        associado: selectedAssociado,
        veiculos: veiculos.filter((v) => v.associadoId === selectedAssociado.id),
        mensalidades: mensalidades.filter((m) => m.associadoId === selectedAssociado.id),
        eventos,
        config,
      });
      const slug = (selectedAssociado.nome || 'associado').toLowerCase().replace(/\s+/g, '-');
      doc.save(`ficha-cadastral-${slug}.pdf`);
      showFeedback('Ficha Cadastral Oficial gerada com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar Ficha Cadastral.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGerarCarteirinha = async () => {
    if (!selectedAssociado) {
      showFeedback('Selecione um associado para gerar a carteirinha.', 'error');
      return;
    }
    try {
      setLoadingReportId('carteirinha');
      await exportarCarteirinhaPdf(selectedAssociado, config);
      showFeedback('Carteirinha Digital (Frente & Verso) gerada com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar Carteirinha Digital.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGerarQuadroAssociados = async () => {
    try {
      setLoadingReportId('quadro_associados');
      await exportAssociadosPdf(associados, config);
      showFeedback('Relatório Geral de Associados gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar relatório.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGerarPreventivoFrota = async () => {
    try {
      setLoadingReportId('preventivo_frota');
      await gerarRelatorioPreventivoVeiculosPdf(veiculos, manutencoes, config);
      showFeedback('Relatório Preventivo de Manutenção gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar relatório preventivo.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGerarFrotaGeral = async () => {
    try {
      setLoadingReportId('frota_geral');
      await exportFrotaPdf(veiculos, manutencoes, config);
      showFeedback('Relatório Geral da Frota gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar relatório de frota.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGerarFinanceiroMensalidades = async () => {
    try {
      setLoadingReportId('financeiro_mensalidades');
      await exportFinanceiroPdf(mensalidades, config);
      showFeedback('Relatório Financeiro de Mensalidades gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar relatório financeiro.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGerarFluxoCaixaAnual = async () => {
    try {
      setLoadingReportId('fluxo_caixa_anual');
      await exportFluxoCaixaAnualPdf(mensalidades, manutencoes, config, 2026);
      showFeedback('Demonstrativo Consolidado de Fluxo de Caixa gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar demonstrativo de fluxo de caixa.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGerarRankEstradas = async () => {
    try {
      setLoadingReportId('rank_estradas');
      const rank = calcularRankEstradas(associados, abastecimentos, manutencoes);
      await exportarRankEstradasPdf(rank, config);
      showFeedback('Relatório Oficial de Rank de Estradas gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar relatório de rank de estradas.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleExportarCsvAuditoria = () => {
    try {
      setLoadingReportId('auditoria_csv');
      const success = exportarAuditoriaCsv(auditoriaLogs);
      if (success) {
        showFeedback('Arquivo CSV de Auditoria baixado com sucesso!');
      } else {
        showFeedback('Não há registros de auditoria para exportar.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao exportar logs de auditoria.', 'error');
    } finally {
      setLoadingReportId(null);
    }
  };

  const relatorios = [
    {
      id: 'ficha_cadastral',
      titulo: 'Ficha Cadastral Oficial do Associado',
      subtitulo: 'Dossiê completo individual com foto 3x4, filiação estatutária, saúde, CRLV de motos, mensalidades e QR code de autenticidade.',
      categoria: 'membros',
      moduloOrigem: 'Módulo 04 — Associados',
      icone: Users,
      badge: 'Individual',
      corIcone: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      executar: handleGerarFichaCadastral,
      requerAssociado: true,
    },
    {
      id: 'carteirinha',
      titulo: 'Carteirinha Digital Oficial (Frente & Verso)',
      subtitulo: 'Documento oficial de porte obrigatório de alta resolução com fotografia, tipagem sanguínea, QR Code de validação e emergência.',
      categoria: 'membros',
      moduloOrigem: 'Módulo 01 — Carteirinha Digital',
      icone: CreditCard,
      badge: 'Documento',
      corIcone: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      executar: handleGerarCarteirinha,
      requerAssociado: true,
    },
    {
      id: 'quadro_associados',
      titulo: 'Relatório Executivo do Quadro Geral de Integrantes',
      subtitulo: 'Relação completa de todos os membros ativos, aspirantes e diretoria, com matrículas, datas de filiação e contatos telefônicos.',
      categoria: 'membros',
      moduloOrigem: 'Módulo 04 — Associados',
      icone: Users,
      badge: 'Geral',
      corIcone: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      executar: handleGerarQuadroAssociados,
    },
    {
      id: 'preventivo_frota',
      titulo: 'Laudo Preventivo de Manutenção Obrigatória (Óleo & Pneus)',
      subtitulo: 'Triagem urgente da frota indicando motocicletas que atingiram ou estão próximas da tolerância de troca de óleo (5.000 km) e pneus (15.000 km).',
      categoria: 'frota',
      moduloOrigem: 'Módulo 02 — Minhas Motos & Frota',
      icone: AlertTriangle,
      badge: 'Segurança Viária',
      corIcone: 'text-red-400 bg-red-500/10 border-red-500/30',
      executar: handleGerarPreventivoFrota,
    },
    {
      id: 'frota_geral',
      titulo: 'Relatório Geral da Frota & Telemetria de Odômetros',
      subtitulo: 'Motos cadastradas no clube com placas, cilindradas, proprietários, km atual e soma de ordens de serviço executadas.',
      categoria: 'frota',
      moduloOrigem: 'Módulo 02 & 03 — Frota & Manutenção',
      icone: Bike,
      badge: 'Frota',
      corIcone: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      executar: handleGerarFrotaGeral,
    },
    {
      id: 'financeiro_mensalidades',
      titulo: 'Balanço Geral de Mensalidades & Títulos da Tesouraria',
      subtitulo: 'Extrato financeiro com total arrecadado, pendente e em atraso, comprovantes homologados por diretores e chaves PIX.',
      categoria: 'financeiro',
      moduloOrigem: 'Módulo 05 — Mensalidades & Finanças',
      icone: DollarSign,
      badge: 'Contábil',
      corIcone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      executar: handleGerarFinanceiroMensalidades,
    },
    {
      id: 'fluxo_caixa_anual',
      titulo: 'Demonstrativo Consolidado de Fluxo de Caixa Anual (2026)',
      subtitulo: 'Comparativo mês a mês das receitas de mensalidades contra despesas operacionais da frota, com margens e reservas.',
      categoria: 'financeiro',
      moduloOrigem: 'Módulo 05 — Tesouraria',
      icone: TrendingUp,
      badge: 'Anual LAI/LGPD',
      corIcone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      executar: handleGerarFluxoCaixaAnual,
    },
    {
      id: 'rank_estradas',
      titulo: 'Relatório Oficial de Rank de Estradas & Motoqueiros de Elite',
      subtitulo: 'Classificação oficial por quilometragem somada de abastecimentos e manutenções, destacando os níveis Diamante, Ouro e Prata.',
      categoria: 'estrada',
      moduloOrigem: 'Rank de Estradas',
      icone: Trophy,
      badge: 'Competição & Honra',
      corIcone: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      executar: handleGerarRankEstradas,
    },
    {
      id: 'auditoria_csv',
      titulo: 'Exportação Completa de Logs de Auditoria & Segurança (.CSV)',
      subtitulo: 'Download em formato estruturado UTF-8 compatível com Excel de todos os registros de acessos, alterações cadastrais e transações.',
      categoria: 'auditoria',
      moduloOrigem: 'Módulo 12 — Configurações & Auditoria',
      icone: ShieldAlert,
      badge: 'Governança',
      corIcone: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      executar: handleExportarCsvAuditoria,
    },
  ];

  const filteredRelatorios = relatorios.filter((r) => {
    if (activeCategory === 'todos') return true;
    return r.categoria === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-lg animate-in fade-in slide-in-from-top-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/80 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-0.5"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-amber-400">
          <FileText className="w-64 h-64" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo 14 — Central Unificada de Documentos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 font-heading">
              Central de Relatórios Oficiais em PDF
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Todos os relatórios, laudos técnicos, demonstrativos contábeis e carteirinhas do Moto Clube {config.nomeClube} reunidos em um único centro de emissão e auditoria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-right">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Documentos Catalogados</p>
              <p className="text-lg font-black text-amber-400">{relatorios.length} modelos oficiais</p>
            </div>
          </div>
        </div>

        {/* Global Select for Individual Reports */}
        <div className="mt-5 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 whitespace-nowrap">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Associado Ativo para Emissões Individuais:</span>
          </label>
          <select
            value={selectedAssociadoId}
            onChange={(e) => setSelectedAssociadoId(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {associados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.numeroAssociado ? `[${a.numeroAssociado}] ` : ''}
                {a.nome} ({a.nomeGuerra || 'Sem Guerra'}) - {a.cargo || 'Membro'}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-zinc-500">
            Aplica-se automaticamente à Ficha Cadastral e à Carteirinha Digital.
          </span>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'todos', label: 'Todos os Relatórios', icon: FileText },
          { id: 'membros', label: 'Quadro & Integrantes', icon: Users },
          { id: 'frota', label: 'Frota & Garagem', icon: Bike },
          { id: 'financeiro', label: 'Finanças & Contábil', icon: DollarSign },
          { id: 'estrada', label: 'Rank de Estradas', icon: Trophy },
          { id: 'auditoria', label: 'Auditoria & Logs', icon: ShieldAlert },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRelatorios.map((relatorio) => {
          const Icon = relatorio.icone;
          const isLoading = loadingReportId === relatorio.id;

          return (
            <div
              key={relatorio.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className={`p-2.5 rounded-xl border ${relatorio.corIcone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {relatorio.badge}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500/90">
                    {relatorio.moduloOrigem}
                  </p>
                  <h3 className="text-base font-bold text-zinc-100 mt-1 leading-snug group-hover:text-amber-400 transition-colors">
                    {relatorio.titulo}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    {relatorio.subtitulo}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Formato PDF A4</span>
                </span>

                <button
                  type="button"
                  onClick={relatorio.executar}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Gerar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
