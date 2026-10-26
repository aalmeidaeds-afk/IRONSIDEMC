import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Trash2,
  X,
  Settings,
  ShieldCheck,
  Check,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Filter,
  Users,
} from 'lucide-react';
import {
  Mensalidade,
  Associado,
  LembreteMensalidadeAgendado,
  ConfiguracaoLembretesAutomaticos,
  TipoLembreteMensalidade,
} from '../types';
import {
  getLembretesAgendados,
  salvarLembretesAgendados,
  cancelarLembrete,
  agendarLembretesAutomaticosParaMensalidades,
  verificarEExecutarLembretesAgendados,
  getConfiguracaoLembretes,
  salvarConfiguracaoLembretes,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  dispararNotificacaoNavegador,
} from '../services/notificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mensalidades: Mensalidade[];
  associados?: Associado[];
  onNavigateTab?: (tab: string) => void;
}

export const LembretesMensalidadesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mensalidades,
  associados = [],
  onNavigateTab,
}) => {
  const [lembretes, setLembretes] = useState<LembreteMensalidadeAgendado[]>([]);
  const [config, setConfig] = useState<ConfiguracaoLembretesAutomaticos>(getConfiguracaoLembretes());
  const [activeTab, setActiveTab] = useState<'lista' | 'configuracoes'>('lista');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'agendado' | 'disparado' | 'cancelado'>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const loadData = () => {
    setLembretes(getLembretesAgendados());
    setConfig(getConfiguracaoLembretes());
    setPermission(getNotificationPermission());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener('ironside-lembretes-updated', handleUpdate);
    window.addEventListener('ironside-config-lembretes-updated', handleUpdate);
    return () => {
      window.removeEventListener('ironside-lembretes-updated', handleUpdate);
      window.removeEventListener('ironside-config-lembretes-updated', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setFeedbackToast({ type, msg });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Solicitar permissão de notificação do navegador
  const handleRequestPermission = async () => {
    setLoadingAction('permission');
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        showToast('success', 'Notificações do navegador ativadas com sucesso!');
        await dispararNotificacaoNavegador('🔔 Notificações Ativadas!', {
          body: 'O Iron Side Road Rider M.C. enviará lembretes automáticos de suas mensalidades.',
        });
      } else if (res === 'denied') {
        showToast('error', 'Permissão bloqueada no navegador. Habilite nas configurações do site.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Gerar e agendar lembretes para todas as mensalidades abertas
  const handleGerarLembretes = () => {
    setLoadingAction('gerar');
    try {
      const res = agendarLembretesAutomaticosParaMensalidades(mensalidades, config);
      loadData();
      showToast(
        'success',
        `${res.criados} novos lembretes foram agendados automaticamente com integração ao navegador!`
      );
    } catch (e) {
      showToast('error', 'Erro ao processar agendamento de lembretes.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Disparar verificação imediata (processa pendentes com horário vencido)
  const handleVerificarAgora = async () => {
    setLoadingAction('verificar');
    try {
      const res = await verificarEExecutarLembretesAgendados(mensalidades);
      loadData();
      if (res.disparados > 0) {
        showToast(
          'success',
          `Disparo concluído: ${res.disparados} lembrete(s) enviado(s) para o navegador e central!`
        );
      } else {
        showToast('info', 'Nenhum lembrete com data/hora expirada no momento. Cronograma em dia.');
      }
    } catch {
      showToast('error', 'Erro ao executar verificação de lembretes.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Testar alerta nativo imediato no navegador
  const handleTestarAlertaNavegador = async () => {
    setLoadingAction('teste');
    try {
      const sucesso = await dispararNotificacaoNavegador('🏍️ Teste de Notificação - Iron Side M.C.', {
        body: 'Este é um teste do sistema de lembretes automáticos de mensalidades no seu navegador!',
        tag: `teste-${Date.now()}`,
      });
      if (sucesso) {
        showToast('success', 'Notificação enviada diretamente para a área de trabalho/Android!');
      } else {
        showToast('error', 'Não foi possível disparar. Verifique se a permissão foi concedida.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Disparar um lembrete específico de forma imediata
  const handleDispararLembreteIndividual = async (lem: LembreteMensalidadeAgendado) => {
    setLoadingAction(`disp-${lem.id}`);
    try {
      let titulo = '💰 Lembrete de Mensalidade';
      let corpo = `Olá ${lem.nomeAssociado}! Consta mensalidade de ${lem.competencia} (R$ ${lem.valor.toFixed(2)}) com vencimento em ${lem.vencimento}.`;

      if (lem.tipoLembrete === 'preventivo_5d') {
        titulo = '⚠️ Lembrete Preventivo (5 dias)';
        corpo = `Olá ${lem.nomeAssociado}! A mensalidade de ${lem.competencia} vence em 5 dias (${lem.vencimento}). Pague via PIX.`;
      } else if (lem.tipoLembrete === 'preventivo_2d') {
        titulo = '⏰ Atenção: Vencimento em 48h';
        corpo = `Aviso para ${lem.nomeAssociado}: mensalidade de ${lem.competencia} vence em 2 dias (${lem.vencimento}).`;
      } else if (lem.tipoLembrete === 'dia_vencimento') {
        titulo = '🔔 Vencimento Hoje - Iron Side M.C.';
        corpo = `A mensalidade de ${lem.competencia} (R$ ${lem.valor.toFixed(2)}) vence hoje! Regularize via PIX.`;
      } else if (lem.tipoLembrete === 'cobranca_atraso') {
        titulo = '🚨 Mensalidade em Atraso';
        corpo = `Prezado ${lem.nomeAssociado}, a competência de ${lem.competencia} encontra-se em atraso. Efetue a quitação no app.`;
      }

      await dispararNotificacaoNavegador(titulo, { body: corpo, tag: lem.id });

      const updated = lembretes.map((item) =>
        item.id === lem.id
          ? {
              ...item,
              status: 'disparado' as const,
              disparadoEm: new Date().toISOString(),
              notificadoNavegador: true,
              mensagemPersonalizada: corpo,
            }
          : item
      );
      salvarLembretesAgendados(updated);
      setLembretes(updated);
      showToast('success', `Lembrete de ${lem.nomeAssociado} disparado no navegador com sucesso!`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Cancelar lembrete
  const handleCancelar = (id: string) => {
    cancelarLembrete(id);
    loadData();
    showToast('info', 'Lembrete cancelado com sucesso.');
  };

  // Salvar configurações
  const handleSaveConfig = (updates: Partial<ConfiguracaoLembretesAutomaticos>) => {
    const updated = salvarConfiguracaoLembretes(updates);
    setConfig(updated);
    showToast('success', 'Configurações de lembretes automáticos salvas!');
  };

  // Métricas
  const totalLembretes = lembretes.length;
  const agendadosCount = lembretes.filter((l) => l.status === 'agendado').length;
  const disparadosCount = lembretes.filter((l) => l.status === 'disparado').length;
  const canceladosCount = lembretes.filter((l) => l.status === 'cancelado').length;

  // Filtragem da lista
  const lembretesFiltrados = lembretes.filter((l) => {
    if (statusFilter !== 'todos' && l.status !== statusFilter) return false;
    if (tipoFilter !== 'todos' && l.tipoLembrete !== tipoFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNome = l.nomeAssociado.toLowerCase().includes(q);
      const matchComp = l.competencia.toLowerCase().includes(q);
      const matchNum = l.numeroAssociado ? l.numeroAssociado.toLowerCase().includes(q) : false;
      if (!matchNome && !matchComp && !matchNum) return false;
    }
    return true;
  });

  const getTipoBadge = (tipo: TipoLembreteMensalidade) => {
    switch (tipo) {
      case 'preventivo_5d':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            Preventivo (5 dias)
          </span>
        );
      case 'preventivo_2d':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Atenção (2 dias)
          </span>
        );
      case 'dia_vencimento':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Dia do Vencimento
          </span>
        );
      case 'cobranca_atraso':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
            Cobrança em Atraso
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            Personalizado
          </span>
        );
    }
  };

  const getStatusBadge = (status: LembreteMensalidadeAgendado['status']) => {
    switch (status) {
      case 'agendado':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Agendado
          </span>
        );
      case 'disparado':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Disparado
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] bg-zinc-900 border-2 border-amber-500/50 rounded-3xl flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-100 font-heading">
                  Agendamento Automático de Lembretes de Mensalidades
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-zinc-950">
                  Web Notifications API
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Disparo programado no navegador para integrantes com mensalidades a vencer e em atraso
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div
            className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shrink-0 border ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : feedbackToast.type === 'error'
                ? 'bg-red-500/15 text-red-300 border-red-500/40'
                : 'bg-sky-500/15 text-sky-300 border-sky-500/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackToast.msg}</span>
          </div>
        )}

        {/* Browser Permission Banner */}
        <div className="px-4 py-3 bg-zinc-950/70 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-300">Status das Notificações do Navegador:</span>
            {permission === 'granted' ? (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Permissão Concedida (Nativa)
              </span>
            ) : permission === 'denied' ? (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                <X className="w-3 h-3 text-red-400" />
                Bloqueado no Navegador
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Pendente de Autorização
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={loadingAction === 'permission'}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Ativar Notificações no Navegador</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestarAlertaNavegador}
              disabled={loadingAction === 'teste'}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
              title="Disparar um alerta de teste imediato no navegador"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Testar no Navegador</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-zinc-950/40 border-b border-zinc-800 shrink-0">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
              Total no Cronograma
            </span>
            <div className="text-xl font-black text-zinc-100 mt-1 font-mono">{totalLembretes}</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">
              Lembretes Agendados
            </span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">{agendadosCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">
              Disparados c/ Sucesso
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{disparadosCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
              Cancelados (Pagos)
            </span>
            <div className="text-xl font-black text-zinc-400 mt-1 font-mono">{canceladosCount}</div>
          </div>
        </div>

        {/* Tab & Action Bar */}
        <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-900 shrink-0">
          {/* Subtab buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'lista'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cronograma de Lembretes ({lembretesFiltrados.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('configuracoes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'configuracoes'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Regras de Automação</span>
            </button>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGerarLembretes}
              disabled={loadingAction === 'gerar'}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Escaneia mensalidades abertas e programa lembretes preventivos, dia do vencimento e cobrança"
            >
              <BellRing className={`w-3.5 h-3.5 ${loadingAction === 'gerar' ? 'animate-spin' : ''}`} />
              <span>Agendar para Mensalidades Abertas</span>
            </button>

            <button
              type="button"
              onClick={handleVerificarAgora}
              disabled={loadingAction === 'verificar'}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Executa verificação de horários agora e dispara no navegador"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingAction === 'verificar' ? 'animate-spin' : ''}`} />
              <span>Verificar &amp; Disparar Agora</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'lista' ? (
            <div className="space-y-4">
              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-2.5 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por integrante, competência ou nº..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="agendado">Somente Agendados</option>
                    <option value="disparado">Somente Disparados</option>
                    <option value="cancelado">Cancelados</option>
                  </select>

                  <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="todos">Todos os Tipos</option>
                    <option value="preventivo_5d">Preventivo (5 dias)</option>
                    <option value="preventivo_2d">Atenção (2 dias)</option>
                    <option value="dia_vencimento">Dia do Vencimento</option>
                    <option value="cobranca_atraso">Cobrança em Atraso</option>
                  </select>
                </div>
              </div>

              {/* Reminders List */}
              {lembretesFiltrados.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-200">Nenhum Lembrete no Filtro Selecionado</h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Clique em <strong>&ldquo;Agendar para Mensalidades Abertas&rdquo;</strong> acima para gerar automaticamente o cronograma inteligente de notificações para todos os associados com parcelas pendentes.
                  </p>
                  <button
                    type="button"
                    onClick={handleGerarLembretes}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md cursor-pointer"
                  >
                    Gerar Agendamentos Agora
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lembretesFiltrados.map((lem) => {
                    const dataAgendada = new Date(lem.dataHoraAgendada);
                    const isFuturo = !isNaN(dataAgendada.getTime()) && dataAgendada.getTime() > Date.now();

                    return (
                      <div
                        key={lem.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          lem.status === 'disparado'
                            ? 'bg-zinc-950/40 border-emerald-500/30'
                            : lem.status === 'cancelado'
                            ? 'bg-zinc-950/30 border-zinc-800 opacity-60'
                            : 'bg-zinc-900 border-zinc-700/80 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-zinc-100 truncate">
                              {lem.nomeAssociado}
                            </span>
                            {lem.numeroAssociado && (
                              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-amber-400">
                                {lem.numeroAssociado}
                              </span>
                            )}
                            {getTipoBadge(lem.tipoLembrete)}
                            {getStatusBadge(lem.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span className="flex items-center gap-1 text-zinc-300">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              Competência: <strong>{lem.competencia}</strong> (R$ {lem.valor.toFixed(2)})
                            </span>
                            <span>&bull;</span>
                            <span>Vencimento da Parcela: <strong className="text-zinc-200">{lem.vencimento}</strong></span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 text-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Horário Agendado:{' '}
                              <strong>
                                {!isNaN(dataAgendada.getTime())
                                  ? dataAgendada.toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : lem.dataHoraAgendada}
                              </strong>
                              {isFuturo && lem.status === 'agendado' && (
                                <span className="text-[10px] text-zinc-400 font-normal">
                                  (em breve)
                                </span>
                              )}
                            </span>
                          </div>

                          {lem.mensagemPersonalizada && (
                            <p className="text-[11px] text-zinc-300 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80 italic">
                              &ldquo;{lem.mensagemPersonalizada}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                          {lem.status === 'agendado' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDispararLembreteIndividual(lem)}
                                disabled={loadingAction === `disp-${lem.id}`}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
                                title="Disparar este lembrete imediatamente no navegador do associado"
                              >
                                <Send className="w-3 h-3" />
                                <span>Disparar Agora</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCancelar(lem.id)}
                                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                                title="Cancelar lembrete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {lem.status === 'disparado' && lem.disparadoEm && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Enviado às{' '}
                              {new Date(lem.disparadoEm).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* CONFIGURAÇÕES DE REGRAS DE AUTOMAÇÃO */
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-black text-amber-400 font-heading uppercase tracking-wide flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Parâmetros de Disparo Automático
                </h4>
                <p className="text-xs text-zinc-400">
                  Defina quando o sistema deve calcular e agendar os avisos automáticos integrados ao navegador dos associados.
                </p>

                {/* Switch Ativo Geral */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">
                      Sistema de Lembretes Automáticos Ativo
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Habilita o loop em segundo plano e disparo de notificações
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.ativo}
                    onChange={(e) => handleSaveConfig({ ativo: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Integração Nativa Navegador */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">
                      Integrar com Notificações do Navegador (Web Notification API)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Dispara alertas pop-up nativos no Windows, Mac e Android
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.integrarNotificacaoNavegador}
                    onChange={(e) => handleSaveConfig({ integrarNotificacaoNavegador: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Notificar no Vencimento */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">
                      Alerta no Dia Exato do Vencimento
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Dispara aviso de tolerância final e chave PIX para quitação imediata
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.notificarNoVencimento}
                    onChange={(e) => handleSaveConfig({ notificarNoVencimento: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Notificar em caso de atraso */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">
                      Alerta de Cobrança Pós-Vencimento (Inadimplência)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Dispara cobrança fraternal alertando sobre restrições de viagens
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.notificarAtraso}
                    onChange={(e) => handleSaveConfig({ notificarAtraso: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Horário de Disparo */}
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <label className="text-xs font-bold text-zinc-200 block">
                    Horário Preferencial de Envio:
                  </label>
                  <input
                    type="time"
                    value={config.horarioPreferencialEnvio || '09:00'}
                    onChange={(e) => handleSaveConfig({ horarioPreferencialEnvio: e.target.value })}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-[10px] text-zinc-400 block">
                    Horário recomendado: entre 08h e 10h da manhã para máxima visualização.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Notificações em conformidade com LGPD &amp; Estatuto Social</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
