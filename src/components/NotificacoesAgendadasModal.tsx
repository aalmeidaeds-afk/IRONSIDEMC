import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Volume2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { Evento, Mensalidade, Associado } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventos: Evento[];
  mensalidades: Mensalidade[];
  currentAssociado?: Associado | null;
  onNavigateTab: (tab: string) => void;
}

export interface ScheduledAlert {
  id: string;
  type: 'evento_48h' | 'evento_proximo' | 'mensalidade_vencendo' | 'mensalidade_atrasada';
  title: string;
  description: string;
  timeLabel: string;
  severity: 'urgent' | 'warning' | 'info';
  targetTab: string;
  dataRef?: any;
}

export const NotificacoesAgendadasModal: React.FC<Props> = ({
  isOpen,
  onClose,
  eventos,
  mensalidades,
  currentAssociado,
  onNavigateTab,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [alerts, setAlerts] = useState<ScheduledAlert[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dinastia_read_alerts') || '[]');
    } catch {
      return [];
    }
  });

  // Calculate alerts based on events and dues
  useEffect(() => {
    const list: ScheduledAlert[] = [];
    const now = new Date();

    // 1. Process Events (next 48h and upcoming week)
    eventos.forEach((ev) => {
      let evDate: Date | null = null;
      if (ev.data && ev.data.includes('/')) {
        const [d, m, y] = ev.data.split('/').map(Number);
        evDate = new Date(y, m - 1, d);
      } else if (ev.data) {
        evDate = new Date(ev.data);
      }

      // Check if scheduled
      if (ev.status === 'agendado') {
        const diffHours = evDate ? (evDate.getTime() - now.getTime()) / (1000 * 60 * 60) : 36;

        if (diffHours >= -4 && diffHours <= 48) {
          list.push({
            id: `ev_48h_${ev.id}`,
            type: 'evento_48h',
            title: `🚨 Evento nas Próximas 48 Horas: ${ev.titulo}`,
            description: `Partida confirmada para ${ev.data} às ${ev.hora} em ${ev.local}. Prepare sua moto e equipamento!`,
            timeLabel: diffHours > 0 ? `Em aproximadamente ${Math.round(diffHours)}h` : 'Acontecendo hoje!',
            severity: 'urgent',
            targetTab: 'eventos',
            dataRef: ev,
          });
        } else if (diffHours > 48 && diffHours <= 168) {
          list.push({
            id: `ev_prox_${ev.id}`,
            type: 'evento_proximo',
            title: `Passeio Agendado: ${ev.titulo}`,
            description: `Data: ${ev.data} às ${ev.hora} (${ev.local}). Confirme sua presença e vaga no comboio.`,
            timeLabel: `Em ${Math.round(diffHours / 24)} dias`,
            severity: 'info',
            targetTab: 'eventos',
            dataRef: ev,
          });
        }
      }
    });

    // 2. Process Mensalidades (Dues)
    const targetMensalidades = currentAssociado
      ? mensalidades.filter((m) => m.associadoId === currentAssociado.id || m.associadoId === currentAssociado.uid)
      : mensalidades;

    targetMensalidades.forEach((m) => {
      if (m.status === 'atrasado') {
        list.push({
          id: `mens_atraso_${m.id}`,
          type: 'mensalidade_atrasada',
          title: `Mensalidade em Atraso (${m.competencia})`,
          description: `O título de R$ ${m.valor.toFixed(2)} venceu em ${m.vencimento}. Efetue o pagamento via PIX para manter a regularidade do colete.`,
          timeLabel: 'Vencida',
          severity: 'urgent',
          targetTab: 'financeiro',
          dataRef: m,
        });
      } else if (m.status === 'pendente') {
        list.push({
          id: `mens_pend_${m.id}`,
          type: 'mensalidade_vencendo',
          title: `Lembrete de Vencimento: ${m.competencia}`,
          description: `Mensalidade no valor de R$ ${m.valor.toFixed(2)} com vencimento em ${m.vencimento}. Pague via QR Code PIX.`,
          timeLabel: `Vence ${m.vencimento}`,
          severity: 'warning',
          targetTab: 'financeiro',
          dataRef: m,
        });
      }
    });

    setAlerts(list);
  }, [eventos, mensalidades, currentAssociado]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result === 'granted') {
        new Notification('Dinastia System • Iron Side M.C.', {
          body: 'Notificações ativadas! Você receberá alertas de eventos e vencimentos.',
          icon: '/ironside-logo.svg',
        });
      }
    }
  };

  const handleMarkAsRead = (id: string) => {
    const updated = [...readAlertIds, id];
    setReadAlertIds(updated);
    try {
      localStorage.setItem('dinastia_read_alerts', JSON.stringify(updated));
    } catch {}
  };

  const handleMarkAllAsRead = () => {
    const allIds = alerts.map((a) => a.id);
    setReadAlertIds(allIds);
    try {
      localStorage.setItem('dinastia_read_alerts', JSON.stringify(allIds));
    } catch {}
  };

  if (!isOpen) return null;

  const unreadCount = alerts.filter((a) => !readAlertIds.includes(a.id)).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-2xl bg-zinc-950 border-t border-amber-500/40 sm:border sm:border-amber-500/40 rounded-t-3xl sm:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.85)] sm:shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-safe"
      >
        {/* Mobile Drag / Touch Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mt-3 sm:hidden" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100 font-heading">
                  Central de Notificações &amp; Lembretes Agendados
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black">
                    {unreadCount} novos
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Avisos automáticos de eventos nas próximas 48h e vencimento de mensalidades.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Push Notification Activation Card */}
        {permissionStatus !== 'granted' && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-950 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-zinc-300">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Ativar Notificações Push do Navegador / Celular:</strong> Seja avisado com antecedência sobre comboios e vencimentos mesmo com o app minimizado.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRequestPushPermission}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 transition shadow-sm"
            >
              Permitir Alertas
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-xs text-zinc-400">
          <span>{alerts.length} alertas agendados para seu perfil</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-amber-400 hover:underline text-[11px] font-semibold"
            >
              Marcar todos como lidos
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {alerts.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
              Nenhuma notificação ou lembrete pendente no momento. Tudo em dia na estrada!
            </div>
          ) : (
            alerts.map((alert) => {
              const isRead = readAlertIds.includes(alert.id);
              const isUrgent = alert.severity === 'urgent';
              const isWarning = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isRead
                      ? 'bg-zinc-900/40 border-zinc-800/60 opacity-75'
                      : isUrgent
                      ? 'bg-red-950/20 border-red-500/50 shadow-md'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                      : 'bg-zinc-900/80 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isUrgent
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {alert.type.includes('evento') ? (
                        <Calendar className="w-4 h-4" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-zinc-100">{alert.title}</h4>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            isUrgent
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {alert.timeLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="px-2.5 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
                      >
                        Lido
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab(alert.targetTab);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-sm"
                    >
                      <span>Abrir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Lembretes integrados com o calendário oficial e cofre financeiro
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
