import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Associado,
  Veiculo,
  Mensalidade,
  Evento,
  Comunicado,
  ConfiguracaoClube,
  CredencialDiretoria,
  Manutencao,
} from '../types';
import {
  getCredencialDiretoria,
  checkCpfBloqueado,
  DEFAULT_CREDENCIAL_DIRETORIA,
} from '../services/db';
import { AdminChartsDashboard } from './AdminChartsDashboard';
import { RelatorioFrotaChart } from './RelatorioFrotaChart';
import { PWAInstallModal } from './PWAInstallModal';
import { GaleriaLogoModal } from './GaleriaLogoModal';
import { NotificacoesAgendadasModal } from './NotificacoesAgendadasModal';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import {
  Users,
  UserCheck,
  Clock,
  DollarSign,
  Bike,
  Calendar,
  AlertCircle,
  PlusCircle,
  CreditCard,
  Bell,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Shield,
  AlertOctagon,
  UserX,
  FileCheck,
  Fingerprint,
  Lock,
  Search,
  Camera,
  Image as ImageIcon,
  Palette,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface Props {
  associados: Associado[];
  veiculos: Veiculo[];
  mensalidades: Mensalidade[];
  manutencoes?: Manutencao[];
  eventos: Evento[];
  comunicados: Comunicado[];
  config: ConfiguracaoClube;
  onTabChange: (tab: string) => void;
  onOpenNovoAssociado: () => void;
  onOpenNovoEvento: () => void;
  onOpenNovoComunicado: () => void;
  onOpenPixModal: (m: Mensalidade) => void;
  onOpenTrocaSenhaModal?: () => void;
  onOpenLoginModal?: () => void;
  onSaveConfig?: (cfg: Partial<ConfiguracaoClube>) => Promise<void>;
}

export const Dashboard: React.FC<Props> = ({
  associados,
  veiculos,
  mensalidades,
  manutencoes = [],
  eventos,
  comunicados,
  config,
  onTabChange,
  onOpenNovoAssociado,
  onOpenNovoEvento,
  onOpenNovoComunicado,
  onOpenPixModal,
  onOpenTrocaSenhaModal,
  onOpenLoginModal,
  onSaveConfig,
}) => {
  const { activeRole, currentAssociado } = useAuth();
  const [credencial, setCredencial] = useState<CredencialDiretoria>(DEFAULT_CREDENCIAL_DIRETORIA);
  const [testCpf, setTestCpf] = useState('');
  const [testResult, setTestResult] = useState<{
    checked: boolean;
    blocked: boolean;
    associado?: Associado;
  } | null>(null);
  const [checkingCpf, setCheckingCpf] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  useEffect(() => {
    getCredencialDiretoria().then((c) => setCredencial(c));
  }, []);

  const formatCPF = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const handleVerifyCpf = async (cpfToTest: string) => {
    const clean = cpfToTest.replace(/\D/g, '');
    if (clean.length < 11) return;
    setCheckingCpf(true);
    try {
      const blocked = await checkCpfBloqueado(clean);
      if (blocked) {
        setTestResult({ checked: true, blocked: true, associado: blocked });
      } else {
        const found = associados.find(
          (a) => (a.cpf || '').replace(/\D/g, '') === clean
        );
        setTestResult({ checked: true, blocked: false, associado: found });
      }
    } finally {
      setCheckingCpf(false);
    }
  };

  // Metrics computations
  const totalAssociados = associados.length;
  const associadosAtivos = associados.filter((a) => a.status === 'ativo').length;
  const associadosPendentes = associados.filter(
    (a) => a.status === 'pendente' || a.status === 'em_analise'
  ).length;

  const totalRecebidoMes = mensalidades
    .filter((m) => m.status === 'pago')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalPendenteMes = mensalidades
    .filter((m) => m.status === 'pendente' || m.status === 'atrasado')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const proximosEventos = eventos
    .filter((e) => e.status === 'agendado')
    .slice(0, 3);

  const comunicadosRecentes = comunicados.slice(0, 3);

  // If role is Associado, filter their specific data
  const minhasMensalidades = currentAssociado
    ? mensalidades.filter((m) => m.associadoId === currentAssociado.id || m.associadoId === currentAssociado.uid)
    : [];
  const mensalidadePendente = minhasMensalidades.find((m) => m.status === 'pendente' || m.status === 'atrasado');

  const minhasMotos = currentAssociado
    ? veiculos.filter((v) => v.associadoId === currentAssociado.id || v.associadoId === currentAssociado.uid)
    : [];

  // Scheduled 48-hour event alert computation
  const now = new Date();
  const eventos48h = eventos.filter((ev) => {
    if (ev.status !== 'agendado') return false;
    let evDate: Date | null = null;
    if (ev.data && ev.data.includes('/')) {
      const [d, m, y] = ev.data.split('/').map(Number);
      evDate = new Date(y, m - 1, d);
    } else if (ev.data) {
      evDate = new Date(ev.data);
    }
    if (!evDate || isNaN(evDate.getTime())) return false;
    const diffHours = (evDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= -4 && diffHours <= 48;
  });

  const displayEventos48h =
    eventos48h.length > 0
      ? eventos48h
      : eventos.filter((e) => e.status === 'agendado').slice(0, 1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div
                onClick={() => activeRole !== 'associado' && setIsLogoModalOpen(true)}
                className={`w-16 h-16 rounded-2xl border-2 border-amber-500/60 bg-zinc-950 p-1 shadow-xl flex items-center justify-center shrink-0 ${
                  activeRole !== 'associado' ? 'cursor-pointer hover:border-amber-400 transition' : ''
                }`}
                title={activeRole !== 'associado' ? 'Clique para trocar o logotipo ou escolher na galeria' : config.nomeClube}
              >
                <img
                  src={config.logotipoUrl || '/ironside-logo.svg'}
                  alt={config.nomeClube}
                  className="w-full h-full object-contain filter drop-shadow"
                />
                {activeRole !== 'associado' && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-amber-400 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
              </div>
              {activeRole !== 'associado' && (
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(true)}
                  className="absolute -bottom-2 -right-2 p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md transition"
                  title="Trocar Logotipo / Galeria de Artes"
                >
                  <Palette className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                  {config.nomeClube}
                </span>
                <span className="text-xs text-zinc-400">
                  Fundado em {config.anoFundacao}
                </span>
                {activeRole !== 'associado' && (
                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(true)}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                  >
                    <Palette className="w-3 h-3" />
                    <span>Galeria de Logos</span>
                  </button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading">
                {activeRole === 'administrador'
                  ? 'Painel Geral de Comando'
                  : activeRole === 'diretoria'
                  ? 'Painel da Diretoria Executiva'
                  : `Bem-vindo à Estrada, ${currentAssociado?.nomeGuerra || 'Irmão'}!`}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                &ldquo;{config.lema}&rdquo; — {config.cidadeSede}/{config.estadoSede}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotificationsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
              title="Central de Notificações e Lembretes Agendados"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Notificações</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('carteirinha')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              <CreditCard className="w-4 h-4" />
              Minha Carteirinha Digital
            </button>
            {activeRole === 'administrador' && (
              <button
                type="button"
                onClick={onOpenNovoAssociado}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                Novo Associado
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ALERTA VISUAL: EVENTOS AGENDADOS NAS PRÓXIMAS 48 HORAS */}
      {displayEventos48h.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/70 bg-gradient-to-r from-red-950/80 via-zinc-950 to-red-950/60 p-4 sm:p-5 shadow-2xl text-zinc-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0 shadow-lg">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    Alerta de Estrada • Próximas 48 Horas
                  </span>
                  <span className="text-xs font-mono text-red-300 font-semibold">
                    Comboio se preparando!
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  {displayEventos48h[0].titulo}
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>📅 <strong>{displayEventos48h[0].data}</strong> às <strong>{displayEventos48h[0].hora}</strong></span>
                  <span>•</span>
                  <span>📍 {displayEventos48h[0].local} ({displayEventos48h[0].cidade || config.cidadeSede})</span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">
                    {displayEventos48h[0].participantesCount || 15} confirmados
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsNotificationsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700 transition"
              >
                Central de Lembretes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('eventos')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition shadow-lg shadow-red-600/30"
              >
                <span>Confirmar Presença</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Mobile App Installation Banner */}
      <PWAInstallModal variant="banner" />

      {/* Admin/Diretoria Pending Approvals Alert Banner */}
      {activeRole !== 'associado' && associadosPendentes > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold">
                {associadosPendentes}{' '}
                {associadosPendentes === 1
                  ? 'cadastro de associado aguardando aprovação'
                  : 'cadastros de associados aguardando aprovação'}
              </p>
              <p className="text-xs text-zinc-400">
                Revise os documentos e numere a matrícula oficial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTabChange('associados')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition"
          >
            Analisar Agora
          </button>
        </div>
      )}

      {/* METRIC CARDS */}
      {activeRole !== 'associado' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Associados */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Total de Associados</span>
              <div className="p-2 rounded-xl bg-zinc-800 text-amber-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-zinc-100 font-heading">
                {totalAssociados}
              </span>
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {associadosAtivos} ativos
                </span>
                <span>•</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {associadosPendentes} pendentes
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Financeiro */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Receita Mensalidades</span>
              <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-400 font-heading">
                R$ {totalRecebidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-zinc-400 mt-2">
                A receber:{' '}
                <span className="text-amber-400 font-semibold">
                  R$ {totalPendenteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>

          {/* Card 3: Motos Cadastradas */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Frota do Clube</span>
              <div className="p-2 rounded-xl bg-zinc-800 text-sky-400">
                <Bike className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-zinc-100 font-heading">
                {veiculos.length}
              </span>
              <p className="text-xs text-zinc-400 mt-2">
                Motos e veículos de apoio cadastrados
              </p>
            </div>
          </div>

          {/* Card 4: Eventos */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Agenda de Passeios</span>
              <div className="p-2 rounded-xl bg-zinc-800 text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-zinc-100 font-heading">
                {proximosEventos.length}
              </span>
              <p className="text-xs text-zinc-400 mt-2">
                Próximos eventos programados
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ASSOCIADO METRICS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Associado Card 1: Situação */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium block">Situação do Associado</span>
            <div className="flex items-center gap-3 mt-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <span className="text-lg font-bold text-zinc-100">
                  {currentAssociado?.status === 'ativo' ? 'Regular / Ativo' : 'Em Análise'}
                </span>
                <p className="text-xs font-mono text-amber-400">
                  {currentAssociado?.numeroAssociado || 'MC-000001'}
                </p>
              </div>
            </div>
          </div>

          {/* Associado Card 2: Mensalidade */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium block">Mensalidade Atual</span>
            <div className="flex items-center justify-between mt-2">
              <div>
                {mensalidadePendente ? (
                  <>
                    <span className="text-lg font-bold text-amber-400">
                      R$ {mensalidadePendente.valor.toFixed(2)} Pendente
                    </span>
                    <p className="text-xs text-zinc-400">
                      Vencimento: {mensalidadePendente.vencimento}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Em dia
                    </span>
                    <p className="text-xs text-zinc-400">Todas as mensalidades quitadas</p>
                  </>
                )}
              </div>
              {mensalidadePendente && (
                <button
                  type="button"
                  onClick={() => onOpenPixModal(mensalidadePendente)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition"
                >
                  Pagar PIX
                </button>
              )}
            </div>
          </div>

          {/* Associado Card 3: Minha Moto */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium block">Minha Garagem</span>
            <div className="flex items-center gap-3 mt-2">
              <span className="p-2 rounded-xl bg-zinc-800 text-sky-400">
                <Bike className="w-6 h-6" />
              </span>
              <div>
                <span className="text-base font-bold text-zinc-100">
                  {minhasMotos.length > 0
                    ? `${minhasMotos[0].marca} ${minhasMotos[0].modelo}`
                    : 'Nenhuma moto ainda'}
                </span>
                <p className="text-xs text-zinc-400">
                  {minhasMotos.length > 0 ? `Placa: ${minhasMotos[0].placa}` : 'Cadastre sua moto'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE ANALÍTICO DE DASHBOARD COM GRÁFICOS RECHARTS */}
      {activeRole !== 'associado' ? (
        <AdminChartsDashboard
          associados={associados}
          mensalidades={mensalidades}
          eventos={eventos}
          veiculos={veiculos}
          manutencoes={manutencoes}
          config={config}
          onNavigateTab={onTabChange}
        />
      ) : (
        /* Para Associado: Relatório de Frota Oficial do Clube */
        <div className="pt-2">
          <RelatorioFrotaChart
            veiculos={veiculos}
            manutencoes={manutencoes}
            associados={associados}
            config={config}
            onNavigateTab={onTabChange}
          />
        </div>
      )}

      {/* PAINEL DE CONTROLE DA DIRETORIA: LOGIN, FILIAÇÃO & CONTROLE POR CPF */}
      {activeRole !== 'associado' && (
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-heading">
                Gestão da Diretoria: Login Oficial, Filiações & Bloqueio por CPF
              </h3>
              <p className="text-xs text-zinc-400">
                Controle institucional para acesso web e aplicativo móvel Android.
              </p>
            </div>
          </div>
          {onOpenTrocaSenhaModal && (
            <button
              type="button"
              onClick={onOpenTrocaSenhaModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/50 text-sky-300 text-xs font-bold transition shadow-sm self-start sm:self-auto"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span>Trocar Senha da Diretoria</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Credencial Oficial Diretoria */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Login da Diretoria
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                Gravado no Banco
              </span>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Usuário:</span>
                <span className="font-mono font-black text-white text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                  {credencial.login || 'DIRETORIA'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Senha:</span>
                <span className="font-mono font-black text-amber-400 text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                  {credencial.senha ? '••••••••' : 'DIR202627'} ({credencial.senha || 'DIR202627'})
                </span>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              {onOpenTrocaSenhaModal && (
                <button
                  type="button"
                  onClick={onOpenTrocaSenhaModal}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg transition text-center"
                >
                  Trocar Senha
                </button>
              )}
              {onOpenLoginModal && (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold rounded-lg transition text-center"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Filiação e Aprovação da Diretoria */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" />
                  Filiação Oficial
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                  Aprovação em Ata
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Aprovação da Diretoria com registro de data de filiação e ata oficial de reunião para novos associados.
              </p>
              <div className="mt-2 text-[11px] text-zinc-300">
                Cadastros pendentes:{' '}
                <strong className="text-amber-400 font-mono">{associadosPendentes}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange('associados')}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition text-center text-[11px]"
            >
              Homologar Filiações
            </button>
          </div>

          {/* Card 3: Desligamento & Bloqueio por CPF */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" />
                  Controle por CPF
                </span>
                <span className="text-[10px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded-md font-bold">
                  Até 3.000 Caracteres
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Associados desligados têm a data e motivo gravados (base até 3.000 caracteres) e ficam impedidos de acessar o sistema ou app Android.
              </p>
              <div className="mt-2 text-[11px] text-zinc-300">
                Membros desligados:{' '}
                <strong className="text-red-400 font-mono">
                  {associados.filter((a) => a.status === 'desligado').length}
                </strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange('associados')}
              className="w-full py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-lg transition text-center text-[11px]"
            >
              Ver Desligados / Bloqueados
            </button>
          </div>
        </div>

        {/* VERIFICADOR DE ACESSO POR CPF (WEB & ANDROID) */}
        <div className="p-4 rounded-xl bg-zinc-950/90 border border-amber-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-heading">
                <Fingerprint className="w-4 h-4 text-amber-400" />
                Simulador & Verificador de Bloqueio por CPF (Acesso Web e Aplicativo Android)
              </h4>
              <p className="text-[11px] text-zinc-400">
                Consulte qualquer CPF para verificar se está ativo ou se foi desligado pela Diretoria com parecer até 3.000 caracteres.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTestCpf('987.654.321-99');
                  handleVerifyCpf('987.654.321-99');
                }}
                className="px-2.5 py-1 bg-red-950/80 border border-red-700/60 hover:bg-red-900 text-red-200 text-[10px] font-bold rounded-lg transition"
              >
                Testar CPF Desligado (Marcos)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestCpf('123.456.789-00');
                  handleVerifyCpf('123.456.789-00');
                }}
                className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-200 text-[10px] font-bold rounded-lg transition"
              >
                Testar CPF Ativo (Roberto)
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyCpf(testCpf);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Digite o CPF: 000.000.000-00"
              value={testCpf}
              onChange={(e) => setTestCpf(formatCPF(e.target.value))}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={checkingCpf}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              {checkingCpf ? 'Consultando...' : 'Consultar CPF'}
            </button>
          </form>

          {/* Test Result Display */}
          {testResult && (
            <div className="mt-2 animate-fade-in">
              {testResult.blocked ? (
                <div className="p-4 rounded-xl bg-red-950/70 border-2 border-red-600 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider">
                    <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
                    <span>ACESSO NEGADO / CPF BLOQUEADO NO SISTEMA E APLICATIVO ANDROID</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    O associado <strong>{testResult.associado?.nome} ({testResult.associado?.nomeGuerra})</strong>, portador do CPF <strong className="font-mono text-amber-300">{testResult.associado?.cpf}</strong>, foi desligado em <strong>{testResult.associado?.dataDesligamento || 'data registrada'}</strong> por <strong>{testResult.associado?.desligadoPor || 'Diretoria'}</strong>.
                  </p>
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                      Motivo Oficial do Desligamento Homologado pela Diretoria (Até 3000 Caracteres):
                    </span>
                    <div className="max-h-40 overflow-y-auto p-3 rounded-lg bg-zinc-950 border border-red-900/80 text-[11px] text-zinc-200 italic leading-relaxed whitespace-pre-wrap">
                      {testResult.associado?.motivoDesligamento}
                    </div>
                  </div>
                </div>
              ) : testResult.associado ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      ACESSO PERMITIDO: {testResult.associado.nome} ({testResult.associado.nomeGuerra}) — Matrícula: {testResult.associado.numeroAssociado} (Status: {testResult.associado.status.toUpperCase()})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded">
                    Regular
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                  CPF não encontrado na base de membros do clube.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* QUICK SHORTCUTS & PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Próximos Passeios */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Próximos Passeios e Encontros
            </h3>
            <button
              type="button"
              onClick={() => onTabChange('eventos')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {proximosEventos.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                Nenhum passeio agendado no momento.
              </div>
            ) : (
              proximosEventos.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold">{ev.data.slice(0, 5)}</span>
                      <span className="text-[10px] text-zinc-400">{ev.hora}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{ev.titulo}</h4>
                      <p className="text-xs text-zinc-400">{ev.local} • {ev.cidade || config.cidadeSede}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTabChange('eventos')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                  >
                    Detalhes & Inscrição
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Mural de Comunicados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Mural Oficial
            </h3>
            {activeRole !== 'associado' && (
              <button
                type="button"
                onClick={onOpenNovoComunicado}
                className="text-xs text-amber-400 hover:underline"
              >
                + Publicar
              </button>
            )}
          </div>

          <div className="space-y-3">
            {comunicadosRecentes.length === 0 ? (
              <div className="p-6 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                Nenhum comunicado recente.
              </div>
            ) : (
              comunicadosRecentes.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">{c.data}</span>
                    <span className="text-amber-400 font-semibold">{c.autor}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-200">{c.titulo}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{c.conteudo}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Marca Dinastia System no rodapé do Dashboard */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />

      {/* Modal de Troca de Logo via Galeria */}
      {isLogoModalOpen && (
        <GaleriaLogoModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          currentLogoUrl={config.logotipoUrl}
          onSelectLogo={async (url) => {
            if (onSaveConfig) {
              await onSaveConfig({ logotipoUrl: url });
            }
          }}
        />
      )}

      {/* Modal de Notificações e Lembretes Agendados */}
      {isNotificationsModalOpen && (
        <NotificacoesAgendadasModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          eventos={eventos}
          mensalidades={mensalidades}
          currentAssociado={currentAssociado}
          onNavigateTab={onTabChange}
        />
      )}
    </div>
  );
};
