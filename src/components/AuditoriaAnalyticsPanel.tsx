import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import { AuditoriaLog, ConfiguracaoClube } from '../types';
import { SistemaArquivamentoFalhasCorrecoes } from './SistemaArquivamentoFalhasCorrecoes';
import { DispararBackupFirestoreModal } from './DispararBackupFirestoreModal';
import { useAuth } from '../context/AuthContext';
import { exportarAuditoriaCsv } from '../utils/csvExportHelper';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Filter,
  CheckCircle2,
  UserX,
  CreditCard,
  UserPlus,
  Settings,
  Layers,
  Activity,
  ArrowUpRight,
  Search,
  Eye,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  History,
  AlertOctagon,
  Database,
  Download,
  Sparkles,
} from 'lucide-react';

interface Props {
  logs: AuditoriaLog[];
  config?: ConfiguracaoClube;
}

// Definição das categorias de operação com metadados visuais
export interface OperacaoCategoria {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  hoverCor: string;
  icon: React.ElementType;
  matches: (acao: string) => boolean;
}

export const CATEGORIAS_OPERACAO: OperacaoCategoria[] = [
  {
    id: 'baixas',
    nome: 'Baixas de Mensalidade',
    descricao: 'Baixas manuais e automáticas de mensalidades via PIX, dinheiro e lotes',
    cor: '#f59e0b', // Amber
    hoverCor: '#fbbf24',
    icon: CreditCard,
    matches: (acao) => {
      const a = (acao || '').toUpperCase();
      return a.includes('BAIXA') || a.includes('MENSALIDADE') || a.includes('PAGAMENTO');
    },
  },
  {
    id: 'aprovacoes',
    nome: 'Aprovações & Filiações',
    descricao: 'Aprovações de novos membros, emissão de matrículas e homologações em ata',
    cor: '#10b981', // Emerald
    hoverCor: '#34d399',
    icon: CheckCircle2,
    matches: (acao) => {
      const a = (acao || '').toUpperCase();
      return a.includes('APROVACAO') || a.includes('HOMOLOGACAO') || a.includes('FILIACAO');
    },
  },
  {
    id: 'exclusoes',
    nome: 'Exclusões & Desligamentos',
    descricao: 'Desligamentos de colete, exclusões de membros, bloqueios de CPF e rejeições',
    cor: '#ef4444', // Red
    hoverCor: '#f87171',
    icon: UserX,
    matches: (acao) => {
      const a = (acao || '').toUpperCase();
      return (
        a.includes('DESLIGAMENTO') ||
        a.includes('EXCLUSAO') ||
        a.includes('BLOQUEIO') ||
        a.includes('REJEICAO') ||
        a.includes('DELETE')
      );
    },
  },
  {
    id: 'cadastros',
    nome: 'Novos Cadastros',
    descricao: 'Inclusão de pretendentes, aspirantes e fichas de novos associados',
    cor: '#3b82f6', // Blue
    hoverCor: '#60a5fa',
    icon: UserPlus,
    matches: (acao) => {
      const a = (acao || '').toUpperCase();
      return a.includes('CRIACAO') || a.includes('CADASTRO') || a.includes('NOVO');
    },
  },
  {
    id: 'lotes',
    nome: 'Geração em Lote',
    descricao: 'Emissão em massa de cobranças de mensalidades para o quadro ativo',
    cor: '#8b5cf6', // Violet
    hoverCor: '#a78bfa',
    icon: Layers,
    matches: (acao) => {
      const a = (acao || '').toUpperCase();
      return a.includes('LOTE') || a.includes('GERACAO');
    },
  },
  {
    id: 'configuracoes',
    nome: 'Configurações do Clube',
    descricao: 'Alterações em parâmetros institucionais, chave PIX e credenciais da diretoria',
    cor: '#06b6d4', // Cyan
    hoverCor: '#22d3ee',
    icon: Settings,
    matches: (acao) => {
      const a = (acao || '').toUpperCase();
      return a.includes('CONFIGURACAO') || a.includes('SENHA') || a.includes('PARAMETRO');
    },
  },
];

export const AuditoriaAnalyticsPanel: React.FC<Props> = ({ logs, config }) => {
  const { activeRole } = useAuth();
  const [subTab, setSubTab] = useState<'graficos' | 'arquivamento_falhas'>('graficos');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  // Filtro de período (padrão 30 dias conforme solicitação)
  const [periodoDias, setPeriodoDias] = useState<number>(30);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [orientacaoGrafico, setOrientacaoGrafico] = useState<'vertical' | 'horizontal'>('vertical');
  const [visualizacaoModo, setVisualizacaoModo] = useState<'tipo' | 'temporal'>('tipo');
  const [buscaTabela, setBuscaTabela] = useState<string>('');

  // Fallback com dados realistas caso os logs estejam vazios ou escassos
  const effectiveLogs = useMemo(() => {
    if (logs && logs.length > 0) return logs;

    // Gerador de logs sintéticos dos últimos 30 dias caso o banco ainda esteja limpo
    const now = new Date();
    const daysAgo = (d: number, h: number = 0) =>
      new Date(now.getTime() - d * 24 * 3600 * 1000 - h * 3600 * 1000).toISOString();

    return [
      {
        id: 's-1',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000001 (Roberto Silveira)',
        detalhes: 'Mensalidade Outubro/2026 quitada via PIX no valor de R$ 85,00',
        timestamp: daysAgo(1, 2),
      },
      {
        id: 's-2',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000004 (Marcos Silva)',
        detalhes: 'Mensalidade Outubro/2026 quitada via PIX com comprovante validado',
        timestamp: daysAgo(2, 4),
      },
      {
        id: 's-3',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000002 (Carlos Mendonça)',
        detalhes: 'Baixa de mensalidade efetuada via transferência bancária',
        timestamp: daysAgo(4, 3),
      },
      {
        id: 's-4',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000007 (Luciano Neves)',
        detalhes: 'Baixa de mensalidade confirmada pela tesouraria via PIX',
        timestamp: daysAgo(6, 1),
      },
      {
        id: 's-5',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000003 (Fernando Torres)',
        detalhes: 'Baixa efetuada em espécie na tesouraria da sede',
        timestamp: daysAgo(9, 5),
      },
      {
        id: 's-6',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000005 (Eduardo Prado)',
        detalhes: 'Mensalidade quitada via PIX com chave CNPJ',
        timestamp: daysAgo(12, 6),
      },
      {
        id: 's-7',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000008 (André Mattos)',
        detalhes: 'Baixa de mensalidade confirmada no extrato bancário',
        timestamp: daysAgo(17, 3),
      },
      {
        id: 's-8',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'BAIXA_MENSALIDADE',
        alvo: 'MC-000006 (Alexandre Ramos)',
        detalhes: 'Mensalidade quitada na sede do clube',
        timestamp: daysAgo(22, 4),
      },
      {
        id: 's-9',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'APROVACAO_ASSOCIADO',
        alvo: 'MC-000009 (Rodrigo Nogueira)',
        detalhes: 'Associado aprovado após estágio probatório com emissão de matrícula oficial',
        timestamp: daysAgo(3, 5),
      },
      {
        id: 's-10',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'APROVACAO_ASSOCIADO',
        alvo: 'MC-000008 (André Mattos)',
        detalhes: 'Aprovação de novo membro efetivo com colete fechado e carteirinha digital',
        timestamp: daysAgo(8, 2),
      },
      {
        id: 's-11',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'APROVACAO_ASSOCIADO',
        alvo: 'MC-000007 (Luciano Neves)',
        detalhes: 'Aprovação unânime em conselho de estrada',
        timestamp: daysAgo(15, 4),
      },
      {
        id: 's-12',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'APROVACAO_ASSOCIADO',
        alvo: 'MC-000006 (Alexandre Ramos)',
        detalhes: 'Aprovação de solicitação de filiação com documentação conferida',
        timestamp: daysAgo(24, 7),
      },
      {
        id: 's-13',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'HOMOLOGACAO_FILIACAO',
        alvo: 'MC-000009',
        detalhes: 'Filiação oficial homologada pela Diretoria em Ata nº 142/2026',
        timestamp: daysAgo(5, 2),
      },
      {
        id: 's-14',
        autorUid: 'dir-01',
        autorEmail: 'diretoria@ironsidemc.com.br',
        acao: 'HOMOLOGACAO_FILIACAO',
        alvo: 'MC-000008',
        detalhes: 'Filiação homologada em reunião ordinária da diretoria executiva',
        timestamp: daysAgo(19, 3),
      },
      {
        id: 's-15',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'DESLIGAMENTO_ASSOCIADO',
        alvo: '345.678.901-22',
        detalhes:
          'Associado desligado e CPF bloqueado para acesso Web e Android pelo Presidente. Motivo: Infração disciplinar ao código de conduta.',
        timestamp: daysAgo(7, 4),
      },
      {
        id: 's-16',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'DESLIGAMENTO_ASSOCIADO',
        alvo: '987.654.321-88',
        detalhes:
          'Associado desligado e CPF bloqueado por desligamento voluntário de colete formalizado na sede.',
        timestamp: daysAgo(21, 5),
      },
      {
        id: 's-17',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'CRIACAO_ASSOCIADO',
        alvo: 'Bruno Ferreira (Aspirante)',
        detalhes: 'Novo cadastro criado para Bruno Ferreira (bruno@custom.com.br)',
        timestamp: daysAgo(1, 6),
      },
      {
        id: 's-18',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'CRIACAO_ASSOCIADO',
        alvo: 'Marcos Vinicius',
        detalhes: 'Novo cadastro de aspirante registrado no portal do clube',
        timestamp: daysAgo(10, 3),
      },
      {
        id: 's-19',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'CRIACAO_ASSOCIADO',
        alvo: 'Thiago Ribeiro',
        detalhes: 'Novo cadastro de membro criado na plataforma',
        timestamp: daysAgo(18, 2),
      },
      {
        id: 's-20',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'CRIACAO_ASSOCIADO',
        alvo: 'Rafael Lima',
        detalhes: 'Novo cadastro submetido para avaliação da diretoria',
        timestamp: daysAgo(27, 4),
      },
      {
        id: 's-21',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'GERACAO_LOTE_MENSALIDADE',
        alvo: 'Outubro/2026',
        detalhes: 'Geradas mensalidades para associados ativos no valor de R$ 85,00',
        timestamp: daysAgo(11, 8),
      },
      {
        id: 's-22',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'CONFIGURACAO_CLUBE',
        alvo: 'geral',
        detalhes: 'Atualização da chave PIX oficial da tesouraria e telefone da sede central',
        timestamp: daysAgo(13, 2),
      },
      {
        id: 's-23',
        autorUid: 'admin-01',
        autorEmail: 'dinastiasystem@gmail.com',
        acao: 'CONFIGURACAO_CLUBE',
        alvo: 'geral',
        detalhes: 'Atualização do lema institucional e dados da sede',
        timestamp: daysAgo(26, 3),
      },
    ];
  }, [logs]);

  // Filtragem dos logs dentro da janela de dias selecionada (default 30 dias)
  const logsNoPeriodo = useMemo(() => {
    const agora = new Date().getTime();
    const limiteMs = agora - periodoDias * 24 * 3600 * 1000;

    return effectiveLogs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      return !isNaN(logTime) && logTime >= limiteMs;
    });
  }, [effectiveLogs, periodoDias]);

  // Mapeamento e agrupamento por categoria de operação
  const { chartDataPorTipo, kpis, logsClassificados } = useMemo(() => {
    const classificados = logsNoPeriodo.map((log) => {
      const cat =
        CATEGORIAS_OPERACAO.find((c) => c.matches(log.acao)) || {
          id: 'outros',
          nome: 'Outras Operações',
          descricao: 'Demais ações administrativas registradas',
          cor: '#71717a',
          hoverCor: '#a1a1aa',
          icon: Activity,
          matches: () => true,
        };
      return {
        ...log,
        categoriaId: cat.id,
        categoriaNome: cat.nome,
        categoriaCor: cat.cor,
      };
    });

    const contagemPorCat: Record<string, number> = {};
    CATEGORIAS_OPERACAO.forEach((c) => {
      contagemPorCat[c.id] = 0;
    });

    classificados.forEach((item) => {
      if (contagemPorCat[item.categoriaId] !== undefined) {
        contagemPorCat[item.categoriaId] += 1;
      } else {
        contagemPorCat['outros'] = (contagemPorCat['outros'] || 0) + 1;
      }
    });

    const totalLogs = classificados.length;

    const dataGrafico = CATEGORIAS_OPERACAO.map((cat) => {
      const total = contagemPorCat[cat.id] || 0;
      const pct = totalLogs > 0 ? ((total / totalLogs) * 100).toFixed(1) : '0';
      return {
        id: cat.id,
        nome: cat.nome,
        nomeCurto:
          cat.id === 'baixas'
            ? 'Baixas Mens.'
            : cat.id === 'aprovacoes'
            ? 'Aprovações'
            : cat.id === 'exclusoes'
            ? 'Exclusões'
            : cat.id === 'cadastros'
            ? 'Cadastros'
            : cat.id === 'lotes'
            ? 'Lotes Mens.'
            : 'Configurações',
        quantidade: total,
        percentual: Number(pct),
        cor: cat.cor,
        hoverCor: cat.hoverCor,
        descricao: cat.descricao,
      };
    });

    // Ordenar do maior volume para o menor volume
    const sortedGrafico = [...dataGrafico].sort((a, b) => b.quantidade - a.quantidade);

    // KPIs calculados
    const baixasCount = contagemPorCat['baixas'] || 0;
    const aprovacoesCount = contagemPorCat['aprovacoes'] || 0;
    const exclusoesCount = contagemPorCat['exclusoes'] || 0;
    const mediaPorDia = (totalLogs / Math.max(1, periodoDias)).toFixed(1);

    const maiorOperacao = sortedGrafico[0] || { nome: 'N/A', quantidade: 0 };

    return {
      chartDataPorTipo: sortedGrafico,
      logsClassificados: classificados,
      kpis: {
        totalGeral: totalLogs,
        baixas: baixasCount,
        aprovacoes: aprovacoesCount,
        exclusoes: exclusoesCount,
        mediaPorDia,
        maiorTipo: maiorOperacao.nome,
        maiorQtd: maiorOperacao.quantidade,
      },
    };
  }, [logsNoPeriodo, periodoDias]);

  // Agrupamento temporal para a linha do tempo (últimos 30 dias agrupados em intervalos)
  const chartDataTemporal = useMemo(() => {
    // Agrupar por dia (formato DD/MM)
    const agrupadoDia: Record<string, { dataStr: string; baixas: number; aprovacoes: number; exclusoes: number; outros: number; total: number }> = {};

    // Inicializar os últimos 30 dias em ordem cronológica
    const agora = new Date();
    for (let i = periodoDias - 1; i >= 0; i--) {
      const d = new Date(agora.getTime() - i * 24 * 3600 * 1000);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      agrupadoDia[chave] = {
        dataStr: chave,
        baixas: 0,
        aprovacoes: 0,
        exclusoes: 0,
        outros: 0,
        total: 0,
      };
    }

    logsClassificados.forEach((log) => {
      const d = new Date(log.timestamp);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (agrupadoDia[chave]) {
        agrupadoDia[chave].total += 1;
        if (log.categoriaId === 'baixas') agrupadoDia[chave].baixas += 1;
        else if (log.categoriaId === 'aprovacoes') agrupadoDia[chave].aprovacoes += 1;
        else if (log.categoriaId === 'exclusoes') agrupadoDia[chave].exclusoes += 1;
        else agrupadoDia[chave].outros += 1;
      }
    });

    return Object.values(agrupadoDia);
  }, [logsClassificados, periodoDias]);

  // Filtro de tabela interativa
  const logsFiltradosTabela = useMemo(() => {
    return logsClassificados.filter((log) => {
      if (categoriaFiltro !== 'todos' && log.categoriaId !== categoriaFiltro) {
        return false;
      }
      if (buscaTabela.trim()) {
        const q = buscaTabela.toLowerCase();
        const texto = `${log.acao} ${log.alvo} ${log.detalhes} ${log.autorEmail}`.toLowerCase();
        return texto.includes(q);
      }
      return true;
    });
  }, [logsClassificados, categoriaFiltro, buscaTabela]);

  // Data formatada de início do período
  const dataInicioPeriodo = useMemo(() => {
    const d = new Date(Date.now() - periodoDias * 24 * 3600 * 1000);
    return d.toLocaleDateString('pt-BR');
  }, [periodoDias]);

  const dataFimPeriodo = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR');
  }, []);

  // Custom Tooltip para o Recharts
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 z-50">
          <div className="flex items-center gap-2 font-bold text-zinc-100">
            <span
              className="w-3 h-3 rounded-md shrink-0 inline-block"
              style={{ backgroundColor: data.cor }}
            />
            <span>{data.nome}</span>
          </div>
          <p className="text-[11px] text-zinc-400">{data.descricao}</p>
          <div className="pt-2 mt-1 border-t border-zinc-800 flex items-center justify-between text-zinc-200">
            <span>Volume registrado:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {data.quantidade} ops
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>Representatividade (30d):</span>
            <span className="font-semibold text-zinc-200">{data.percentual}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/95 border border-zinc-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Data: {label}</span>
          </div>
          <div className="space-y-1 pt-1 border-t border-zinc-800">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-mono font-bold text-zinc-100">{entry.value} ops</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* SELETOR DE MODO NO PAINEL DE AUDITORIA DO MÓDULO 12 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('graficos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              subTab === 'graficos'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas &amp; Gráficos (30 dias)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('arquivamento_falhas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              subTab === 'arquivamento_falhas'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-200 hover:text-white border border-zinc-800'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Arquivamento de Falhas &amp; Correções</span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" title="Falhas Críticas" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Correções Validadas" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => exportarAuditoriaCsv(logs)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm cursor-pointer"
            title="Exportar todos os registros de auditoria para arquivo .CSV compatível com Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Logs (.CSV)</span>
          </button>

          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setBackupModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-amber-500/25 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer ml-auto sm:ml-0"
              title="Disparar backup completo de todas as coleções do Cloud Firestore para formato JSON"
            >
              <Database className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Disparar Backup Firestore (JSON)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-black bg-zinc-950 text-emerald-400 border border-emerald-500/30">
                Admin
              </span>
            </button>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-zinc-400 font-mono pr-2">
          <span className="text-red-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Falhas Críticas (Vermelho)
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Correções Validadas (Verde)
          </span>
        </div>
      </div>

      {subTab === 'arquivamento_falhas' ? (
        <SistemaArquivamentoFalhasCorrecoes config={config || ({} as any)} />
      ) : (
        <>
          {/* Banner de Cabeçalho do Painel Analítico */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/20 p-5 sm:p-6 shadow-xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Auditoria & Governança
              </span>
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                {dataInicioPeriodo} até {dataFimPeriodo} ({periodoDias} dias)
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-amber-400 shrink-0" />
              Volume de Operações Administrativas
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Visualização analítica de logs de segurança com distribuição por tipo de operação (exclusões de associados, aprovações oficiais e baixas de mensalidades) na trilha imutável.
            </p>
          </div>

          {/* Controles de Período e Visualização */}
          <div className="flex flex-wrap items-center gap-2">
            {activeRole === 'administrador' && (
              <button
                type="button"
                onClick={() => setBackupModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                title="Disparar backup completo em JSON do Firestore"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
                <Download className="w-3 h-3" />
              </button>
            )}
            {/* Seletor de Período */}
            <div className="flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setPeriodoDias(7)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                  periodoDias === 7
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => setPeriodoDias(30)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  periodoDias === 30
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                30 dias (Padrão)
              </button>
              <button
                type="button"
                onClick={() => setPeriodoDias(60)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                  periodoDias === 60
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                60d
              </button>
            </div>

            {/* Alternador de Modo de Gráfico */}
            <div className="flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setVisualizacaoModo('tipo')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  visualizacaoModo === 'tipo'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Por Tipo
              </button>
              <button
                type="button"
                onClick={() => setVisualizacaoModo('temporal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  visualizacaoModo === 'temporal'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Linha do Tempo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cartões de KPIs Rápidos dos Últimos 30 Dias */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Baixas de Mensalidade */}
        <div
          onClick={() => setCategoriaFiltro(categoriaFiltro === 'baixas' ? 'todos' : 'baixas')}
          className={`cursor-pointer p-4 rounded-2xl bg-zinc-900/90 border transition-all duration-200 hover:border-amber-500/50 ${
            categoriaFiltro === 'baixas'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
              : 'border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Baixas Mensalidades
            </span>
            <span className="text-[10px] font-mono text-zinc-500">30 dias</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-100 font-mono">
            {kpis.baixas}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>
              {kpis.totalGeral > 0
                ? `${((kpis.baixas / kpis.totalGeral) * 100).toFixed(0)}% do volume total`
                : '0%'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </p>
        </div>

        {/* KPI 2: Aprovações & Filiações */}
        <div
          onClick={() =>
            setCategoriaFiltro(categoriaFiltro === 'aprovacoes' ? 'todos' : 'aprovacoes')
          }
          className={`cursor-pointer p-4 rounded-2xl bg-zinc-900/90 border transition-all duration-200 hover:border-emerald-500/50 ${
            categoriaFiltro === 'aprovacoes'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5'
              : 'border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aprovações Oficiais
            </span>
            <span className="text-[10px] font-mono text-zinc-500">30 dias</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {kpis.aprovacoes}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Matrículas & Homologações</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </p>
        </div>

        {/* KPI 3: Exclusões & Desligamentos */}
        <div
          onClick={() =>
            setCategoriaFiltro(categoriaFiltro === 'exclusoes' ? 'todos' : 'exclusoes')
          }
          className={`cursor-pointer p-4 rounded-2xl bg-zinc-900/90 border transition-all duration-200 hover:border-red-500/50 ${
            categoriaFiltro === 'exclusoes'
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-500/5'
              : 'border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400/90 flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5" />
              Exclusões & Bloqueios
            </span>
            <span className="text-[10px] font-mono text-zinc-500">30 dias</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-400 font-mono">
            {kpis.exclusoes}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Desligamentos por CPF</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
          </p>
        </div>

        {/* KPI 4: Total de Operações e Média */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Total Auditado
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Média</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-100 font-mono">
            {kpis.totalGeral}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>{kpis.mediaPorDia} ações/dia</span>
            <span className="text-[10px] text-zinc-500">Firestore</span>
          </p>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO GRÁFICO (RECHARTS) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
          <div>
            <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              {visualizacaoModo === 'tipo' ? (
                <>
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Volume de Operações por Tipo de Ação ({periodoDias} dias)
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-amber-400" />
                  Distribuição Diária de Operações ao Longo dos {periodoDias} Dias
                </>
              )}
            </h4>
            <p className="text-xs text-zinc-400">
              {visualizacaoModo === 'tipo'
                ? 'Barras representam o número total de eventos executados por tipo no período selecionado.'
                : 'Distribuição cronológica diária mostrando picos operacionais de baixas, aprovações e exclusões.'}
            </p>
          </div>

          {visualizacaoModo === 'tipo' && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setOrientacaoGrafico('vertical')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  orientacaoGrafico === 'vertical'
                    ? 'bg-zinc-800 text-amber-400 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Colunas
              </button>
              <button
                type="button"
                onClick={() => setOrientacaoGrafico('horizontal')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  orientacaoGrafico === 'horizontal'
                    ? 'bg-zinc-800 text-amber-400 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Barras Horizontais
              </button>
            </div>
          )}
        </div>

        {/* CONTAINER DO RECHARTS */}
        <div className="w-full h-80 sm:h-96 pt-2">
          {visualizacaoModo === 'tipo' ? (
            orientacaoGrafico === 'vertical' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartDataPorTipo}
                  margin={{ top: 25, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="nomeCurto"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }}
                    tickLine={{ stroke: '#3f3f46' }}
                    interval={0}
                    dy={8}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickLine={{ stroke: '#3f3f46' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar
                    dataKey="quantidade"
                    radius={[6, 6, 0, 0]}
                    onClick={(entry: any) => {
                      const catId = entry?.id || entry?.payload?.id;
                      if (catId) {
                        setCategoriaFiltro((prev) => (prev === catId ? 'todos' : catId));
                      }
                    }}
                    className="cursor-pointer transition-opacity duration-200"
                  >
                    <LabelList
                      dataKey="quantidade"
                      position="top"
                      fill="#e4e4e7"
                      fontSize={11}
                      fontWeight="bold"
                      offset={6}
                    />
                    {chartDataPorTipo.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.cor}
                        opacity={categoriaFiltro === 'todos' || categoriaFiltro === entry.id ? 1 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              /* MODO HORIZONTAL */
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartDataPorTipo}
                  layout="vertical"
                  margin={{ top: 15, right: 35, left: 35, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nomeCurto"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar
                    dataKey="quantidade"
                    radius={[0, 6, 6, 0]}
                    onClick={(entry: any) => {
                      const catId = entry?.id || entry?.payload?.id;
                      if (catId) {
                        setCategoriaFiltro((prev) => (prev === catId ? 'todos' : catId));
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <LabelList
                      dataKey="quantidade"
                      position="right"
                      fill="#e4e4e7"
                      fontSize={11}
                      fontWeight="bold"
                      offset={6}
                    />
                    {chartDataPorTipo.map((entry) => (
                      <Cell
                        key={`cell-h-${entry.id}`}
                        fill={entry.cor}
                        opacity={categoriaFiltro === 'todos' || categoriaFiltro === entry.id ? 1 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            /* VISUALIZAÇÃO TEMPORAL (LINHA DO TEMPO 30 DIAS) */
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataTemporal}
                margin={{ top: 20, right: 15, left: -15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="dataStr"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  interval={Math.ceil(periodoDias / 10)}
                  dy={6}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTimelineTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  formatter={(value) => <span className="text-zinc-300 font-medium">{value}</span>}
                />
                <Bar dataKey="baixas" name="Baixas de Mensalidade" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="aprovacoes" name="Aprovações & Filiações" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="exclusoes" name="Exclusões & Bloqueios" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="outros" name="Demais Operações" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* LEGENDA INTERATIVA E FILTRO RÁPIDO */}
        <div className="pt-3 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                Filtrar por Categoria:
              </span>
              <button
                type="button"
                onClick={() => setCategoriaFiltro('todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  categoriaFiltro === 'todos'
                    ? 'bg-zinc-100 text-zinc-950 font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                Todas ({kpis.totalGeral})
              </button>
              {chartDataPorTipo.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategoriaFiltro(categoriaFiltro === item.id ? 'todos' : item.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    categoriaFiltro === item.id
                      ? 'ring-2 font-bold shadow-sm'
                      : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                  style={{
                    color: categoriaFiltro === item.id ? item.cor : undefined,
                    borderColor: categoriaFiltro === item.id ? item.cor : undefined,
                    backgroundColor:
                      categoriaFiltro === item.id ? `${item.cor}15` : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.cor }}
                  />
                  <span>{item.nome}</span>
                  <span className="text-[10px] font-mono opacity-80">({item.quantidade})</span>
                </button>
              ))}
            </div>

            {categoriaFiltro !== 'todos' && (
              <button
                type="button"
                onClick={() => setCategoriaFiltro('todos')}
                className="text-[11px] text-amber-400 hover:underline font-bold"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE REGISTROS CORRESPONDENTES AOS ÚLTIMOS 30 DIAS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              Detalhamento dos Eventos de Auditoria ({logsFiltradosTabela.length} encontrados)
            </h4>
            <p className="text-xs text-zinc-400">
              Listagem cronológica imutável dos registros correspondentes ao período de {periodoDias} dias.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar autor, alvo ou detalhe..."
              value={buscaTabela}
              onChange={(e) => setBuscaTabela(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Tipo de Operação</th>
                <th className="py-3 px-4">Alvo / Registro</th>
                <th className="py-3 px-4">Autor</th>
                <th className="py-3 px-4">Detalhes da Execução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
              {logsFiltradosTabela.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    Nenhum registro encontrado para os filtros selecionados nos últimos {periodoDias} dias.
                  </td>
                </tr>
              ) : (
                logsFiltradosTabela.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          backgroundColor: `${log.categoriaCor}15`,
                          borderColor: `${log.categoriaCor}40`,
                          color: log.categoriaCor,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: log.categoriaCor }}
                        />
                        {log.categoriaNome}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-200 max-w-[160px] truncate">
                      {log.alvo}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] max-w-[180px] truncate">
                      {log.autorEmail}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-sm">
                      <span className="line-clamp-2">{log.detalhes}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {logsFiltradosTabela.length > 30 && (
          <p className="text-[11px] text-zinc-500 text-center pt-1">
            Exibindo os primeiros 30 registros mais recentes do período de {periodoDias} dias.
          </p>
        )}
      </div>
        </>
      )}

      {/* Modal de Disparo de Backup Completo do Firestore */}
      <DispararBackupFirestoreModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />
    </div>
  );
};
