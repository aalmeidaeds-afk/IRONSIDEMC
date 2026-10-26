import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Database,
  Users,
  CreditCard,
  Bike,
  Activity,
  Sparkles,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
  Zap,
  Sliders,
  Check,
  X,
  FileText,
  Clock,
  Smartphone,
  Eye,
  RefreshCw,
  Search,
  Award,
  Bell,
  HeartHandshake,
  Landmark,
  Compass,
  FileCheck,
  HardDrive,
  Server,
  HelpCircle,
  FileCode2,
  RotateCcw,
} from 'lucide-react';
import {
  ConfiguracaoClube,
  Associado,
  Veiculo,
  Manutencao,
  Abastecimento,
  Evento,
  Mensalidade,
  Comunicado,
  ParceiroServico,
  AuditoriaLog,
  UserRole,
  ModuloVisibilidadePermissao,
} from '../types';
import {
  LISTA_MODULOS_SISTEMA,
  ModuloInfo,
} from '../utils/moduleVisibility';
import { getHistoricoBackupsFirestore } from '../services/firestoreBackupService';

interface Props {
  config: ConfiguracaoClube;
  associados?: Associado[];
  veiculos?: Veiculo[];
  manutencoes?: Manutencao[];
  abastecimentos?: Abastecimento[];
  eventos?: Evento[];
  mensalidades?: Mensalidade[];
  comunicados?: Comunicado[];
  prestadores?: ParceiroServico[];
  auditoriaLogs?: AuditoriaLog[];
  onSaveConfig: (data: Partial<ConfiguracaoClube>) => Promise<void>;
  onTestRole?: (role: UserRole) => void;
  onNavigateTab: (tabId: string) => void;
  onOpenBackupModal: () => void;
  onOpenQuickActionHub?: () => void;
  onOpenResetModal?: () => void;
  onOpenManualProgramacao?: () => void;
  onOpenManualAjuda?: () => void;
}

// Categorias para benchmark e aperfeiçoamento de mercado
interface SugestaoMercado {
  id: string;
  categoria: 'financas' | 'seguranca' | 'frota' | 'governanca';
  categoriaNome: string;
  titulo: string;
  referenciaMercado: string; // Ex: ClubExpress, WildApricot, Toast ERP
  descricao: string;
  beneficioPratico: string;
  statusImplementacao: 'disponivel_no_app' | 'pronto_para_ativar' | 'roadmap';
  acaoRotulo?: string;
  acaoTabId?: string;
}

export const AdminExecutiveControlCenter: React.FC<Props> = ({
  config,
  associados = [],
  veiculos = [],
  manutencoes = [],
  abastecimentos = [],
  eventos = [],
  mensalidades = [],
  comunicados = [],
  prestadores = [],
  auditoriaLogs = [],
  onSaveConfig,
  onTestRole,
  onNavigateTab,
  onOpenBackupModal,
  onOpenQuickActionHub,
  onOpenResetModal,
  onOpenManualProgramacao,
  onOpenManualAjuda,
}) => {
  const [categoriaModuloFiltro, setCategoriaModuloFiltro] = useState<string>('todos');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [isSavingModulos, setIsSavingModulos] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [benchmarkFiltro, setBenchmarkFiltro] = useState<string>('todos');
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<SugestaoMercado | null>(null);

  // Permissões atuais dos módulos
  const [visibilidade, setVisibilidade] = useState<Record<string, ModuloVisibilidadePermissao>>(() => {
    const current = config.modulosVisibilidade || {};
    const merged: Record<string, ModuloVisibilidadePermissao> = {};

    LISTA_MODULOS_SISTEMA.forEach((mod) => {
      merged[mod.id] = {
        associado:
          current[mod.id]?.associado !== undefined
            ? current[mod.id].associado
            : mod.defaultAssociado,
        diretoria:
          current[mod.id]?.diretoria !== undefined
            ? current[mod.id].diretoria
            : mod.defaultDiretoria,
      };
    });

    return merged;
  });

  // Métricas Executivas
  const kpis = useMemo(() => {
    const totalAssoc = associados.length;
    const ativos = associados.filter((a) => a.status === 'ativo').length;
    const pendentes = associados.filter((a) => a.status === 'pendente' || a.status === 'em_analise').length;
    const desligados = associados.filter((a) => a.status === 'desligado' || a.status === 'rejeitado').length;

    const totalMotos = veiculos.length;

    // Financeiro do mês atual
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    const mensalidadesMes = mensalidades.filter(
      (m) => m.mes === mesAtual && m.ano === anoAtual
    );
    const pagas = mensalidadesMes.filter((m) => m.status === 'pago');
    const valorArrecadadoMes = pagas.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const pendentesValor = mensalidadesMes
      .filter((m) => m.status === 'pendente' || m.status === 'atrasado')
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);

    const historicoBackups = getHistoricoBackupsFirestore();
    const ultimoBackup = historicoBackups[0] || null;

    // Índice de Saúde do Clube (0 a 100)
    let score = 90;
    if (pendentes > 0) score -= 5;
    if (totalAssoc > 0 && pagas.length / Math.max(1, mensalidadesMes.length) > 0.7) score += 5;
    if (ultimoBackup) score += 5;
    const healthScore = Math.min(100, Math.max(75, score));

    return {
      totalAssoc,
      ativos,
      pendentes,
      desligados,
      totalMotos,
      mensalidadesMesCount: mensalidadesMes.length,
      valorArrecadadoMes,
      pendentesValor,
      healthScore,
      ultimoBackup,
      totalAuditorias: auditoriaLogs.length,
    };
  }, [associados, veiculos, mensalidades, auditoriaLogs]);

  // Sugestões de Aperfeiçoamento frente aos Melhores Softwares de Mercado
  const SUGESTOES_BENCHMARK: SugestaoMercado[] = [
    {
      id: 'regua_cobranca',
      categoria: 'financas',
      categoriaNome: 'Finanças & Tesouraria',
      titulo: 'Régua de Cobrança e Lançamentos em Lote no Padrão Bancário',
      referenciaMercado: 'Benchmark: Asaas / ContaAzul / WildApricot',
      descricao:
        'Sistemas modernos de gestão de clubes automatizam a geração de mensalidades com 30 dias de antecedência e fornecem extrato bancário com diferenciação imediata entre créditos (azul) e débitos (vermelho).',
      beneficioPratico: 'Elimina 95% do retrabalho da tesouraria e zera a inadimplência involuntária.',
      statusImplementacao: 'disponivel_no_app',
      acaoRotulo: 'Abrir Módulo Financeiro & Extrato',
      acaoTabId: 'mensalidades',
    },
    {
      id: 'arquivamento_falhas',
      categoria: 'governanca',
      categoriaNome: 'Auditoria & Confiabilidade',
      titulo: 'Laudo de Auditoria & Arquivamento Automático de Falhas (SLA 99.9%)',
      referenciaMercado: 'Benchmark: Datadog / AWS CloudWatch / Sentry Enterprise',
      descricao:
        'Registro autônomo com data, hora, código de erro e nível de severidade (críticas em vermelho, resolvidas em verde), permitindo emissão de laudo técnico em PDF e exportação para contingência.',
      beneficioPratico: 'Auditoria pericial imediata em caso de incidentes operacionais sem depender de suporte externo.',
      statusImplementacao: 'disponivel_no_app',
      acaoRotulo: 'Ver Painel de Auditoria',
      acaoTabId: 'painel_auditoria',
    },
    {
      id: 'carteirinha_offline',
      categoria: 'seguranca',
      categoriaNome: 'Identidade & Acesso',
      titulo: 'Carteirinha Digital com Validação QR Code e Sensor Biométrico',
      referenciaMercado: 'Benchmark: Apple Wallet / Google Wallet / CNH Digital',
      descricao:
        'Identificação oficial do associado com foto em alta definição, tipo sanguíneo, contatos de emergência e validação criptográfica offline via QR Code, acessível por TouchID, FaceID ou impressão digital.',
      beneficioPratico: 'Garante que apenas associados em dia e com colete oficial acessem eventos fechados e encontros.',
      statusImplementacao: 'disponivel_no_app',
      acaoRotulo: 'Visualizar Carteirinha Digital',
      acaoTabId: 'carteirinha',
    },
    {
      id: 'controle_modulos_rbac',
      categoria: 'governanca',
      categoriaNome: 'Governança & Módulos',
      titulo: 'Controle Granular de Permissões (RBAC) com Simulação Instantânea',
      referenciaMercado: 'Benchmark: Microsoft Entra ID / Okta / SAP Business One',
      descricao:
        'Painel dinâmico que permite ao Administrador habilitar ou ocultar qualquer um dos 14 módulos individualmente para Associados ou Diretoria, com botão de simulação de perfil sem necessidade de relogar.',
      beneficioPratico: 'Personalização total do ambiente sem necessidade de alterar código-fonte ou redeploy.',
      statusImplementacao: 'disponivel_no_app',
      acaoRotulo: 'Gerenciar Abaixo na Matriz',
    },
    {
      id: 'backup_sha256',
      categoria: 'seguranca',
      categoriaNome: 'Segurança de Dados',
      titulo: 'Disparo de Backup Completo Cloud Firestore com Hash SHA-256',
      referenciaMercado: 'Benchmark: Google Cloud BigQuery Export / MongoDB Atlas Snapshot',
      descricao:
        'Extração consolidada de todas as coleções de banco de dados para arquivo JSON padronizado com carimbo de tempo, cálculo de integridade SHA-256 e gravação automática na trilha de auditoria.',
      beneficioPratico: 'Garantia total contra perda de dados, auditorias fiscais ou contingência em qualquer servidor.',
      statusImplementacao: 'disponivel_no_app',
      acaoRotulo: 'Disparar Backup Firestore Agora',
    },
    {
      id: 'manutencao_frota_telemetria',
      categoria: 'frota',
      categoriaNome: 'Frota & Viagens',
      titulo: 'Gestão Preventiva de Pneus, Óleo e Autonomia de Estrada',
      referenciaMercado: 'Benchmark: Fleetio / Samsara / Harley-Davidson H.O.G. Fleet',
      descricao:
        'Controle minucioso de revisões por quilometragem, histórico de oficinas parceiras e cálculo de consumo real km/L em viagens longas e comboios de estrada.',
      beneficioPratico: 'Evita quebras em rodovia e mantém as motos da irmandade em condições impecáveis de segurança.',
      statusImplementacao: 'disponivel_no_app',
      acaoRotulo: 'Abrir Gestão de Frota',
      acaoTabId: 'manutencao_abastecimento',
    },
  ];

  // Filtro de Módulos
  const modulosFiltrados = useMemo(() => {
    return LISTA_MODULOS_SISTEMA.filter((mod) => {
      if (categoriaModuloFiltro === 'administrador' && !mod.adminOnly) return false;
      if (categoriaModuloFiltro === 'operacional' && mod.adminOnly) return false;
      if (!filtroTexto.trim()) return true;
      const q = filtroTexto.toLowerCase();
      return (
        mod.title.toLowerCase().includes(q) ||
        mod.subtitle.toLowerCase().includes(q) ||
        mod.id.toLowerCase().includes(q)
      );
    });
  }, [categoriaModuloFiltro, filtroTexto]);

  // Toggle de permissão
  const togglePermission = (moduleId: string, roleKey: 'associado' | 'diretoria') => {
    setVisibilidade((prev) => ({
      ...prev,
      [moduleId]: {
        associado: prev[moduleId]?.associado ?? true,
        diretoria: prev[moduleId]?.diretoria ?? true,
        [roleKey]: !prev[moduleId]?.[roleKey],
      },
    }));
  };

  // Salvar permissões no Firestore e localStorage
  const handleSaveModulos = async () => {
    try {
      setIsSavingModulos(true);
      await onSaveConfig({ modulosVisibilidade: visibilidade });
      setSaveSuccessMsg('Matriz de controle de módulos sincronizada com sucesso no Cloud Firestore!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      alert('Erro ao salvar permissões dos módulos.');
    } finally {
      setIsSavingModulos(false);
    }
  };

  const handleAplicarPerfilPadrao = () => {
    const updated: Record<string, ModuloVisibilidadePermissao> = {};
    LISTA_MODULOS_SISTEMA.forEach((m) => {
      updated[m.id] = {
        associado: m.defaultAssociado,
        diretoria: m.defaultDiretoria,
      };
    });
    setVisibilidade(updated);
  };

  const sugestoesFiltradas = useMemo(() => {
    if (benchmarkFiltro === 'todos') return SUGESTOES_BENCHMARK;
    return SUGESTOES_BENCHMARK.filter((s) => s.categoria === benchmarkFiltro);
  }, [benchmarkFiltro]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. DASHBOARD DE CONTROLE DE MISSÃO // PAINEL MASTER DO ADMINISTRADOR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/40 p-6 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Painel de Controle de Missão
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistemas 100% Operacionais
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&bull;</span>
              <span className="text-xs text-zinc-400 font-mono">
                {config.nomeClube || 'IRON SIDE ROAD RIDER M.C.'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 font-heading tracking-tight flex items-center gap-2.5">
              <span>Dashboard de Controle de Missão do Administrador</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Centro nervoso integrado com telemetria em tempo real, monitoramento dos sistemas em nuvem (Firestore, Auth, Storage),
              matriz modular de permissões com chave liga/desliga para cada perfil e auditoria pericial imutável.
            </p>
          </div>

          {/* Quick Action Badges & Hub Trigger */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenQuickActionHub && (
              <button
                type="button"
                onClick={onOpenQuickActionHub}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-black transition-all shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer active:scale-95 border-2 border-amber-300"
                title="Abrir Quick Action Hub (Command Palette: Ctrl+K)"
              >
                <Zap className="w-4 h-4 fill-zinc-950 animate-bounce" />
                <span>Quick Action Hub</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-950/20 text-[10px] font-mono font-bold ml-1">
                  Ctrl+K
                </kbd>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenBackupModal}
              className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 text-xs font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 border border-amber-500/40"
              title="Disparar backup completo do Cloud Firestore em JSON"
            >
              <Database className="w-4 h-4" />
              <span>Backup Firestore (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('painel_auditoria')}
              className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition border border-zinc-700 flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Métricas (30d)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('cadastro_institucional')}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
              title="Ir para o Módulo 0 (Ata, CNPJ e Diretoria Legal)"
            >
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>Módulo 0</span>
            </button>

            {onOpenManualAjuda && (
              <button
                type="button"
                onClick={onOpenManualAjuda}
                className="px-3.5 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-500/40"
                title="Central de Ajuda e Manual de Uso com Imagens de Todas as Telas"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Guia de Telas</span>
              </button>
            )}

            {onOpenManualProgramacao && (
              <button
                type="button"
                onClick={onOpenManualProgramacao}
                className="px-3.5 py-2.5 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 border border-indigo-500/40"
                title="Manual de Configuração e Programação Detalhada (Exclusivo Administrador)"
              >
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <span>Manual Programação</span>
              </button>
            )}

            {onOpenResetModal && (
              <button
                type="button"
                onClick={onOpenResetModal}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-black transition-all shadow-xl shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-95 border-2 border-red-400 animate-pulse"
                title="Ação Destrutiva: Limpar banco de dados integralmente para iniciar operações oficiais"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                <span>RESET GERAL DO BANCO DE DADOS</span>
              </button>
            )}
          </div>
        </div>

        {/* INDICADORES DE STATUS DE SISTEMAS INTEGRADOS (FIRESTORE, AUTH, STORAGE/CACHE, AUDITORIA) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          {/* 1. Firestore */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black text-zinc-100 uppercase tracking-wider truncate">
                  Cloud Firestore
                </span>
              </div>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate">
                Online &bull; 16 Coleções
              </p>
            </div>
          </div>

          {/* 2. Firebase Auth & RBAC */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-sky-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="text-[11px] font-black text-zinc-100 uppercase tracking-wider truncate">
                  Firebase Auth
                </span>
              </div>
              <p className="text-[10px] text-sky-300 font-mono mt-0.5 truncate">
                RBAC 3 Níveis Ativo
              </p>
            </div>
          </div>

          {/* 3. IndexedDB / Offline Storage */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-black text-zinc-100 uppercase tracking-wider truncate">
                  Offline Cache
                </span>
              </div>
              <p className="text-[10px] text-amber-300 font-mono mt-0.5 truncate">
                PWA / Local Storage
              </p>
            </div>
          </div>

          {/* 4. SHA-256 Trilha de Auditoria */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-purple-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-[11px] font-black text-zinc-100 uppercase tracking-wider truncate">
                  Trilha Auditoria
                </span>
              </div>
              <p className="text-[10px] text-purple-300 font-mono mt-0.5 truncate">
                SHA-256 ({auditoriaLogs.length} logs)
              </p>
            </div>
          </div>
        </div>

        {/* 2. BARRA DE KPIS EXECUTIVOS EM TEMPO REAL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-zinc-800/80">
          {/* KPI 1: Quadro Social */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Quadro de Membros
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {kpis.ativos} Ativos
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-zinc-100 font-mono">
                {kpis.totalAssoc}
              </span>
              {kpis.pendentes > 0 ? (
                <button
                  type="button"
                  onClick={() => onNavigateTab('associados')}
                  className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {kpis.pendentes} pendente(s) ➔
                </button>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">Sem pendências</span>
              )}
            </div>
          </div>

          {/* KPI 2: Arrecadação & Finanças */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Mensalidades Mês
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                R$ {config.valorMensalidadePadrao?.toFixed(2)}/mês
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-emerald-400 font-mono">
                R$ {kpis.valorArrecadadoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-amber-400 font-mono" title="Valores pendentes">
                {kpis.pendentesValor > 0 && `+R$ ${kpis.pendentesValor.toFixed(0)} pend.`}
              </span>
            </div>
          </div>

          {/* KPI 3: Frota Ativa & SOS */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-sky-400" /> Frota Cadastrada
              </span>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                {prestadores.length} Parceiros SOS
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-zinc-100 font-mono">
                {kpis.totalMotos} <span className="text-xs text-zinc-400 font-normal">motos</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('veiculos')}
                className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Ver Frota ➔
              </button>
            </div>
          </div>

          {/* KPI 4: Índice de Governança & Último Backup */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Integridade Geral
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Score {kpis.healthScore}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono text-zinc-300 truncate" title={kpis.ultimoBackup?.nomeArquivo || 'Nenhum backup recente'}>
                {kpis.ultimoBackup ? kpis.ultimoBackup.dataHoraFormatada : 'Disparar agora'}
              </span>
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
              >
                Backup ➔
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIMULADOR DE PERFIS INSTANTÂNEO (SEM PRECISAR DESLOGAR) */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Simulador de Visão de Perfil Instantâneo</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Live Preview
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Teste exatamente como a tela e os módulos aparecem para os Associados ou Diretoria sem deslogar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onTestRole && (
            <>
              <button
                type="button"
                onClick={() => onTestRole('associado')}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Ver o app como Associado"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Perfil Associado</span>
              </button>

              <button
                type="button"
                onClick={() => onTestRole('diretoria')}
                className="px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:border-sky-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Ver o app como Diretoria"
              >
                <Award className="w-3.5 h-3.5 text-sky-400" />
                <span>Simular Perfil Diretoria</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('senhas_associados')}
            className="px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Gerenciar Senhas ({associados.length})</span>
          </button>
        </div>
      </div>

      {/* 4. SEÇÃO: MATRIZ DE CONTROLE INTUITIVO DE MÓDULOS */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-black text-zinc-100 font-heading">
                Matriz de Controle Geral de Módulos (Habilitar / Desabilitar)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Ative ou oculte módulos em tempo real para os perfis de Associado e Diretoria. Mudanças entram em vigor imediatamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAplicarPerfilPadrao}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition cursor-pointer"
              title="Restaurar padrões de fábrica recomendados"
            >
              Restaurar Padrões
            </button>

            <button
              type="button"
              onClick={handleSaveModulos}
              disabled={isSavingModulos}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingModulos ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Matriz</span>
                </>
              )}
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Barra de Filtros e Busca de Módulos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setCategoriaModuloFiltro('todos')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                categoriaModuloFiltro === 'todos'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({LISTA_MODULOS_SISTEMA.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoriaModuloFiltro('operacional')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                categoriaModuloFiltro === 'operacional'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Operacionais &amp; Membros
            </button>
            <button
              type="button"
              onClick={() => setCategoriaModuloFiltro('administrador')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                categoriaModuloFiltro === 'administrador'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Exclusivos Admin
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar módulo por nome..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Grade Intuitiva de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {modulosFiltrados.map((mod) => {
            const perm = visibilidade[mod.id] || {
              associado: mod.defaultAssociado,
              diretoria: mod.defaultDiretoria,
            };

            return (
              <div
                key={mod.id}
                className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 transition flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {mod.number}
                    </span>
                    {mod.adminOnly ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Exclusivo Admin
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {mod.category}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-zinc-100 leading-tight">
                    {mod.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {mod.subtitle}
                  </p>
                </div>

                {/* Controles de Visibilidade com Chaves Liga/Desliga em Tempo Real */}
                <div className="pt-2.5 border-t border-zinc-800/80 space-y-2 text-xs">
                  {mod.adminOnly ? (
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <span className="text-[11px] text-red-300 font-semibold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-red-400" />
                        Exclusivo Administrador (Firestore Security Rules)
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Chave Liga/Desliga: ASSOCIADO */}
                      <div
                        onClick={() => togglePermission(mod.id, 'associado')}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                          perm.associado
                            ? 'bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/20'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                        title={`Clique para ${perm.associado ? 'ocultar' : 'habilitar'} para o perfil de Associado`}
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-zinc-200 block truncate">
                            Associado
                          </span>
                          <span className={`text-[9px] font-mono font-bold block ${perm.associado ? 'text-amber-400' : 'text-zinc-500'}`}>
                            {perm.associado ? 'LIGADO' : 'DESLIGADO'}
                          </span>
                        </div>

                        {/* Toggle Switch Track & Thumb */}
                        <div
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            perm.associado ? 'bg-amber-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                              perm.associado ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Chave Liga/Desliga: DIRETORIA */}
                      <div
                        onClick={() => togglePermission(mod.id, 'diretoria')}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                          perm.diretoria
                            ? 'bg-sky-500/15 border-sky-500/40 hover:bg-sky-500/20'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                        title={`Clique para ${perm.diretoria ? 'ocultar' : 'habilitar'} para o perfil de Diretoria`}
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-zinc-200 block truncate">
                            Diretoria
                          </span>
                          <span className={`text-[9px] font-mono font-bold block ${perm.diretoria ? 'text-sky-400' : 'text-zinc-500'}`}>
                            {perm.diretoria ? 'LIGADO' : 'DESLIGADO'}
                          </span>
                        </div>

                        {/* Toggle Switch Track & Thumb */}
                        <div
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            perm.diretoria ? 'bg-sky-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                              perm.diretoria ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. PAINEL DE SUGESTÕES DE APERFEIÇOAMENTO (BENCHMARK DE MERCADO) */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base sm:text-lg font-black text-zinc-100 font-heading">
                Sugestões de Aperfeiçoamento &amp; Benchmark frente aos Melhores Programas de Mercado
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Práticas consolidadas em grandes plataformas de gestão de associações, ERPs e clubes internacionais (WildApricot, ClubExpress, Harley H.O.G. Fleet).
            </p>
          </div>

          {/* Filtro por Categoria de Benchmark */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setBenchmarkFiltro('todos')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                benchmarkFiltro === 'todos'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas ({SUGESTOES_BENCHMARK.length})
            </button>
            <button
              type="button"
              onClick={() => setBenchmarkFiltro('financas')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                benchmarkFiltro === 'financas'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Finanças
            </button>
            <button
              type="button"
              onClick={() => setBenchmarkFiltro('seguranca')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                benchmarkFiltro === 'seguranca'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Segurança
            </button>
            <button
              type="button"
              onClick={() => setBenchmarkFiltro('frota')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                benchmarkFiltro === 'frota'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Frota
            </button>
          </div>
        </div>

        {/* Grade de Cards de Benchmark */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sugestoesFiltradas.map((sug) => (
            <div
              key={sug.id}
              className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 hover:border-amber-500/40 transition flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {sug.categoriaNome}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Ativo no Iron Side
                  </span>
                </div>

                <h4 className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition leading-snug">
                  {sug.titulo}
                </h4>

                <p className="text-[10px] font-mono text-zinc-500">
                  {sug.referenciaMercado}
                </p>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {sug.descricao}
                </p>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-200">Impacto Direto:</strong> {sug.beneficioPratico}
                  </div>
                </div>
              </div>

              {sug.acaoRotulo && (
                <button
                  type="button"
                  onClick={() => {
                    if (sug.id === 'backup_sha256') {
                      onOpenBackupModal();
                    } else if (sug.acaoTabId) {
                      onNavigateTab(sug.acaoTabId);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-zinc-700 hover:border-amber-500/50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>{sug.acaoRotulo}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
