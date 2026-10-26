import {
  Mensalidade,
  LembreteMensalidadeAgendado,
  ConfiguracaoLembretesAutomaticos,
  TipoLembreteMensalidade,
} from '../types';

export interface ClubNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  timestamp: string;
  read: boolean;
  type: 'evento' | 'comunicado' | 'mensalidade' | 'sistema';
  targetTab?: string;
  url?: string;
}

const STORAGE_KEY = 'ironside_notifications_history';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return 'denied';
  }
}

export function getNotificationsHistory(): ClubNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultWelcomeNotifications();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultWelcomeNotifications();
  } catch {
    return getDefaultWelcomeNotifications();
  }
}

function getDefaultWelcomeNotifications(): ClubNotification[] {
  return [
    {
      id: 'notif-init-1',
      title: 'Bem-vindo ao Iron Side Road Rider M.C.',
      body: 'Sistema oficial de gestão, carteirinha digital e segurança na estrada ativado.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'sistema',
      targetTab: 'dashboard',
    },
    {
      id: 'notif-init-2',
      title: 'Novo Passeio Oficial Agendado',
      body: 'Confira os detalhes e confirme sua presença no Módulo 06 - Eventos & Passeios.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      type: 'evento',
      targetTab: 'eventos',
    },
  ];
}

export function saveNotificationsHistory(list: ClubNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (err) {
    console.warn('Erro ao salvar historico de notificacoes:', err);
  }
}

export function getUnreadNotificationsCount(): number {
  const list = getNotificationsHistory();
  return list.filter((n) => !n.read).length;
}

export function markAllNotificationsAsRead(): ClubNotification[] {
  const list = getNotificationsHistory().map((n) => ({ ...n, read: true }));
  saveNotificationsHistory(list);
  return list;
}

export function clearNotificationsHistory(): void {
  saveNotificationsHistory([]);
}

export async function sendClubNotification(params: {
  title: string;
  body: string;
  icon?: string;
  type?: 'evento' | 'comunicado' | 'mensalidade' | 'sistema';
  targetTab?: string;
  url?: string;
}): Promise<ClubNotification> {
  const notif: ClubNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: params.title,
    body: params.body,
    icon: params.icon || '/ironside-logo.svg',
    timestamp: new Date().toISOString(),
    read: false,
    type: params.type || 'sistema',
    targetTab: params.targetTab || 'dashboard',
    url: params.url,
  };

  // 1. Salvar no histórico local
  const current = getNotificationsHistory();
  saveNotificationsHistory([notif, ...current]);

  // 2. Disparar notificação nativa do navegador se houver permissão
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(notif.title, {
          body: notif.body,
          icon: notif.icon,
          badge: '/ironside-logo.svg',
          tag: notif.id,
          data: { targetTab: notif.targetTab, url: notif.url },
        } as any);
      } else {
        new Notification(notif.title, {
          body: notif.body,
          icon: notif.icon,
          tag: notif.id,
        });
      }
    } catch (err) {
      console.warn('Aviso ao disparar notificacao nativa:', err);
    }
  }

  // 3. Emitir evento customizado no window para re-render imediato
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ironside-new-notification', { detail: notif }));
  }

  return notif;
}

export function notifyNovoEvento(eventoTitulo: string, dataHora: string): void {
  sendClubNotification({
    title: '🏍️ Novo Evento / Passeio Agendado!',
    body: `"${eventoTitulo}" foi marcado para ${dataHora}. Garanta sua vaga no comboio!`,
    type: 'evento',
    targetTab: 'eventos',
  });
}

export function notifyNovoComunicado(comunicadoTitulo: string, autor: string): void {
  sendClubNotification({
    title: '📢 Comunicado Oficial da Diretoria',
    body: `${autor}: "${comunicadoTitulo}". Acesse o Mural de Comunicação.`,
    type: 'comunicado',
    targetTab: 'comunicados',
  });
}

export function notifyLembreteMensalidade(competencia: string, valor: number): void {
  sendClubNotification({
    title: '💰 Lembrete de Mensalidade',
    body: `A mensalidade de ${competencia} (R$ ${valor.toFixed(2)}) está disponível para quitação via PIX.`,
    type: 'mensalidade',
    targetTab: 'financeiro',
  });
}

// =====================================================================
// SISTEMA AVANÇADO DE AGENDAMENTO AUTOMÁTICO DE LEMBRETES DE MENSALIDADE
// & INTEGRAÇÃO COM NOTIFICAÇÃO NATIVA DO NAVEGADOR (WEB NOTIFICATIONS API)
// =====================================================================

export const LEMBRETES_STORAGE_KEY = 'ironside_lembretes_mensalidades_agendados';
export const CONFIG_LEMBRETES_KEY = 'ironside_config_lembretes_automaticos';

export const DEFAULT_CONFIG_LEMBRETES: ConfiguracaoLembretesAutomaticos = {
  ativo: true,
  diasPreventivos: [5, 2],
  notificarNoVencimento: true,
  notificarAtraso: true,
  diasAposVencimentoAtraso: 2,
  integrarNotificacaoNavegador: true,
  horarioPreferencialEnvio: '09:00',
};

/**
 * Retorna as configurações de disparo automático de lembretes
 */
export function getConfiguracaoLembretes(): ConfiguracaoLembretesAutomaticos {
  if (typeof window === 'undefined') return DEFAULT_CONFIG_LEMBRETES;
  try {
    const raw = localStorage.getItem(CONFIG_LEMBRETES_KEY);
    if (!raw) return DEFAULT_CONFIG_LEMBRETES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG_LEMBRETES, ...parsed };
  } catch {
    return DEFAULT_CONFIG_LEMBRETES;
  }
}

/**
 * Salva as configurações de disparo automático
 */
export function salvarConfiguracaoLembretes(
  config: Partial<ConfiguracaoLembretesAutomaticos>
): ConfiguracaoLembretesAutomaticos {
  const current = getConfiguracaoLembretes();
  const updated = { ...current, ...config };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONFIG_LEMBRETES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ironside-config-lembretes-updated', { detail: updated }));
    } catch (e) {
      console.warn('Erro ao salvar configuração de lembretes:', e);
    }
  }
  return updated;
}

/**
 * Converte strings de data de vencimento (DD/MM/AAAA ou AAAA-MM-DD) para objeto Date
 */
export function parseDataVencimento(venc: string): Date | null {
  if (!venc || typeof venc !== 'string') return null;
  const trimmed = venc.trim();

  // Formato DD/MM/AAAA
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    const date = new Date(y, m - 1, d, 9, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // Formato AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const date = new Date(trimmed);
    date.setHours(9, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // Outros formatos ISO
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Dispara uma notificação nativa diretamente na API do navegador (Chrome, Edge, Safari, Firefox, Android)
 */
export async function dispararNotificacaoNavegador(
  titulo: string,
  opcoes: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  // Solicita permissão se ainda estiver como 'default'
  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await requestNotificationPermission();
  }

  if (perm !== 'granted') {
    return false;
  }

  const iconUrl = opcoes.icon || '/ironside-logo.svg';

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(titulo, {
        body: opcoes.body,
        icon: iconUrl,
        badge: opcoes.badge || '/ironside-logo.svg',
        tag: opcoes.tag || `lembrete-${Date.now()}`,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: opcoes.data,
      } as any);
      return true;
    } else {
      new Notification(titulo, {
        body: opcoes.body,
        icon: iconUrl,
        tag: opcoes.tag || `lembrete-${Date.now()}`,
      });
      return true;
    }
  } catch (err) {
    console.warn('Aviso ao disparar notificação do navegador:', err);
    return false;
  }
}

/**
 * Retorna todos os lembretes agendados no banco local
 */
export function getLembretesAgendados(): LembreteMensalidadeAgendado[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEMBRETES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Salva a lista de lembretes agendados
 */
export function salvarLembretesAgendados(lista: LembreteMensalidadeAgendado[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEMBRETES_STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent('ironside-lembretes-updated', { detail: lista }));
  } catch (err) {
    console.warn('Erro ao salvar lembretes agendados:', err);
  }
}

/**
 * Cancela um lembrete específico
 */
export function cancelarLembrete(id: string): void {
  const current = getLembretesAgendados();
  const updated = current.map((lem) => (lem.id === id ? { ...lem, status: 'cancelado' as const } : lem));
  salvarLembretesAgendados(updated);
}

/**
 * Cancela todos os lembretes pendentes de uma mensalidade (ex: ao ser quitada)
 */
export function cancelarLembretesDeMensalidade(mensalidadeId: string): void {
  const current = getLembretesAgendados();
  let modified = false;
  const updated = current.map((lem) => {
    if (lem.mensalidadeId === mensalidadeId && lem.status === 'agendado') {
      modified = true;
      return { ...lem, status: 'cancelado' as const };
    }
    return lem;
  });
  if (modified) {
    salvarLembretesAgendados(updated);
  }
}

/**
 * Agenda lembretes automáticos preventivos, de vencimento e de atraso para associados com mensalidades pendentes
 */
export function agendarLembretesAutomaticosParaMensalidades(
  mensalidades: Mensalidade[],
  configCustom?: Partial<ConfiguracaoLembretesAutomaticos>
): {
  criados: number;
  total: number;
  lembretes: LembreteMensalidadeAgendado[];
} {
  const config = { ...getConfiguracaoLembretes(), ...(configCustom || {}) };
  if (!config.ativo) {
    return { criados: 0, total: 0, lembretes: getLembretesAgendados() };
  }

  const existing = getLembretesAgendados();
  const existingMap = new Set(existing.map((l) => `${l.mensalidadeId}_${l.tipoLembrete}`));
  const novosLembretes: LembreteMensalidadeAgendado[] = [];
  const now = new Date();

  // Filtrar apenas mensalidades em aberto (pendentes ou em atraso)
  const mensalidadesAbertas = mensalidades.filter(
    (m) => m.status === 'pendente' || m.status === 'atrasado'
  );

  for (const m of mensalidadesAbertas) {
    const dataVenc = parseDataVencimento(m.vencimento);
    if (!dataVenc) continue;

    const [prefHora, prefMin] = (config.horarioPreferencialEnvio || '09:00')
      .split(':')
      .map(Number);

    // 1. Lembretes Preventivos (ex: 5 dias antes e 2 dias antes)
    if (Array.isArray(config.diasPreventivos)) {
      for (const diasAntes of config.diasPreventivos) {
        const tipo: TipoLembreteMensalidade =
          diasAntes === 5 ? 'preventivo_5d' : diasAntes === 2 ? 'preventivo_2d' : 'personalizado';
        const key = `${m.id}_${tipo}`;

        if (!existingMap.has(key)) {
          const targetDate = new Date(dataVenc.getTime());
          targetDate.setDate(targetDate.getDate() - diasAntes);
          targetDate.setHours(prefHora || 9, prefMin || 0, 0, 0);

          // Se a data já passou mais de 24h, agendamos para disparo imediato se ainda não vencido
          const dataHoraAgendada =
            targetDate.getTime() < now.getTime() && now.getTime() < dataVenc.getTime()
              ? new Date(now.getTime() + 1000).toISOString()
              : targetDate.toISOString();

          // Só agenda se a data alvo for relevante
          if (targetDate.getTime() >= now.getTime() - 24 * 3600 * 1000) {
            novosLembretes.push({
              id: `lem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              mensalidadeId: m.id,
              associadoId: m.associadoId,
              nomeAssociado: m.nomeAssociado,
              numeroAssociado: m.numeroAssociado,
              competencia: m.competencia,
              valor: m.valor,
              vencimento: m.vencimento,
              dataHoraAgendada,
              tipoLembrete: tipo,
              status: 'agendado',
              canalNavegador: config.integrarNotificacaoNavegador,
              createdAt: new Date().toISOString(),
            });
            existingMap.add(key);
          }
        }
      }
    }

    // 2. Lembrete no Dia do Vencimento
    if (config.notificarNoVencimento) {
      const key = `${m.id}_dia_vencimento`;
      if (!existingMap.has(key)) {
        const targetDate = new Date(dataVenc.getTime());
        targetDate.setHours(prefHora || 9, prefMin || 0, 0, 0);

        const dataHoraAgendada =
          targetDate.getTime() < now.getTime() && now.getDate() === dataVenc.getDate()
            ? new Date(now.getTime() + 1000).toISOString()
            : targetDate.toISOString();

        if (targetDate.getTime() >= now.getTime() - 12 * 3600 * 1000) {
          novosLembretes.push({
            id: `lem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            mensalidadeId: m.id,
            associadoId: m.associadoId,
            nomeAssociado: m.nomeAssociado,
            numeroAssociado: m.numeroAssociado,
            competencia: m.competencia,
            valor: m.valor,
            vencimento: m.vencimento,
            dataHoraAgendada,
            tipoLembrete: 'dia_vencimento',
            status: 'agendado',
            canalNavegador: config.integrarNotificacaoNavegador,
            createdAt: new Date().toISOString(),
          });
          existingMap.add(key);
        }
      }
    }

    // 3. Lembrete de Cobrança em Atraso (após o vencimento)
    if (config.notificarAtraso) {
      const key = `${m.id}_cobranca_atraso`;
      if (!existingMap.has(key)) {
        const diasApos = config.diasAposVencimentoAtraso || 2;
        const targetDate = new Date(dataVenc.getTime());
        targetDate.setDate(targetDate.getDate() + diasApos);
        targetDate.setHours(prefHora || 10, prefMin || 0, 0, 0);

        // Se já está atrasado no momento
        const estaAtrasado = m.status === 'atrasado' || now.getTime() > dataVenc.getTime();
        const dataHoraAgendada =
          estaAtrasado && targetDate.getTime() <= now.getTime()
            ? new Date(now.getTime() + 1000).toISOString()
            : targetDate.toISOString();

        novosLembretes.push({
          id: `lem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          mensalidadeId: m.id,
          associadoId: m.associadoId,
          nomeAssociado: m.nomeAssociado,
          numeroAssociado: m.numeroAssociado,
          competencia: m.competencia,
          valor: m.valor,
          vencimento: m.vencimento,
          dataHoraAgendada,
          tipoLembrete: 'cobranca_atraso',
          status: 'agendado',
          canalNavegador: config.integrarNotificacaoNavegador,
          createdAt: new Date().toISOString(),
        });
        existingMap.add(key);
      }
    }
  }

  const listaCompleta = [...existing, ...novosLembretes];
  if (novosLembretes.length > 0) {
    salvarLembretesAgendados(listaCompleta);
  }

  return {
    criados: novosLembretes.length,
    total: listaCompleta.length,
    lembretes: listaCompleta,
  };
}

/**
 * Verifica os lembretes agendados cuja dataHoraAgendada já chegou e dispara tanto
 * na central do clube quanto na Notification API nativa do navegador
 */
export async function verificarEExecutarLembretesAgendados(
  mensalidadesAtuais?: Mensalidade[]
): Promise<{
  disparados: number;
  pendentes: number;
  canceladosPorPagamento: number;
}> {
  const lembretes = getLembretesAgendados();
  if (lembretes.length === 0) {
    return { disparados: 0, pendentes: 0, canceladosPorPagamento: 0 };
  }

  const now = new Date();
  let disparadosCount = 0;
  let canceladosCount = 0;
  let modificado = false;

  // Mapa de mensalidades para checar status em tempo real
  const mapMensalidades = new Map<string, Mensalidade>();
  if (Array.isArray(mensalidadesAtuais)) {
    mensalidadesAtuais.forEach((m) => mapMensalidades.set(m.id, m));
  }

  const updatedLembretes = [...lembretes];

  for (let i = 0; i < updatedLembretes.length; i++) {
    const lem = updatedLembretes[i];

    if (lem.status !== 'agendado') continue;

    // Checar se a mensalidade já foi quitada
    const mens = mapMensalidades.get(lem.mensalidadeId);
    if (mens && mens.status === 'pago') {
      updatedLembretes[i] = {
        ...lem,
        status: 'cancelado',
        mensagemPersonalizada: 'Cancelado automaticamente: mensalidade já quitada pelo associado.',
      };
      canceladosCount++;
      modificado = true;
      continue;
    }

    const agendada = new Date(lem.dataHoraAgendada);
    if (isNaN(agendada.getTime())) continue;

    // Se chegou o momento do disparo
    if (agendada.getTime() <= now.getTime()) {
      let titulo = '💰 Lembrete de Mensalidade';
      let corpo = '';

      switch (lem.tipoLembrete) {
        case 'preventivo_5d':
          titulo = '⚠️ Lembrete Preventivo (5 dias)';
          corpo = `Olá ${lem.nomeAssociado}! A mensalidade de ${lem.competencia} (R$ ${lem.valor.toFixed(2)}) vence em 5 dias (${lem.vencimento}). Pague via PIX no app.`;
          break;
        case 'preventivo_2d':
          titulo = '⏰ Atenção: Vence em 2 dias';
          corpo = `Aviso para ${lem.nomeAssociado}: mensalidade de ${lem.competencia} vence em 48h (${lem.vencimento}). Evite pendências!`;
          break;
        case 'dia_vencimento':
          titulo = '🔔 Vencimento Hoje - Iron Side M.C.';
          corpo = `Hoje é a data limite (${lem.vencimento}) da competência de ${lem.competencia} (R$ ${lem.valor.toFixed(2)}). Efetue o pagamento via PIX para manter seu cadastro ativo.`;
          break;
        case 'cobranca_atraso':
          titulo = '🚨 Mensalidade em Atraso';
          corpo = `Prezado ${lem.nomeAssociado}, consta pendência da competência de ${lem.competencia} (R$ ${lem.valor.toFixed(2)}). Regularize sua situação para viagens e comboios.`;
          break;
        default:
          titulo = '💰 Lembrete de Pagamento';
          corpo = `Mensalidade de ${lem.competencia} (R$ ${lem.valor.toFixed(2)}) para ${lem.nomeAssociado}.`;
          break;
      }

      // 1. Notificação interna do Clube
      await sendClubNotification({
        title: titulo,
        body: corpo,
        type: 'mensalidade',
        targetTab: 'mensalidades',
      });

      // 2. Notificação nativa no navegador (Web Notifications API)
      let notifBrowserSuccess = false;
      if (lem.canalNavegador) {
        notifBrowserSuccess = await dispararNotificacaoNavegador(titulo, {
          body: corpo,
          tag: lem.id,
          data: {
            mensalidadeId: lem.mensalidadeId,
            associadoId: lem.associadoId,
            targetTab: 'mensalidades',
          },
        });
      }

      updatedLembretes[i] = {
        ...lem,
        status: 'disparado',
        disparadoEm: now.toISOString(),
        notificadoNavegador: notifBrowserSuccess,
        mensagemPersonalizada: corpo,
      };

      disparadosCount++;
      modificado = true;
    }
  }

  if (modificado) {
    salvarLembretesAgendados(updatedLembretes);
  }

  const pendentesCount = updatedLembretes.filter((l) => l.status === 'agendado').length;

  return {
    disparados: disparadosCount,
    pendentes: pendentesCount,
    canceladosPorPagamento: canceladosCount,
  };
}

/**
 * Inicia o loop em segundo plano para verificação e disparo periódico de lembretes
 * Retorna função de desativação (cleanup)
 */
export function iniciarLoopVerificacaoLembretes(
  getMensalidadesFn?: () => Mensalidade[],
  intervaloMs: number = 60000
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Disparo inicial imediato
  verificarEExecutarLembretesAgendados(getMensalidadesFn ? getMensalidadesFn() : undefined).catch(() => {});

  const intervalId = window.setInterval(() => {
    const currentMensalidades = getMensalidadesFn ? getMensalidadesFn() : undefined;
    verificarEExecutarLembretesAgendados(currentMensalidades).catch(() => {});
  }, intervaloMs);

  return () => {
    window.clearInterval(intervalId);
  };
}

