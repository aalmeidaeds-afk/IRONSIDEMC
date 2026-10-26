import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Megaphone,
  CreditCard,
  Shield,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  ClubNotification,
  getNotificationsHistory,
  markAllNotificationsAsRead,
  clearNotificationsHistory,
  requestNotificationPermission,
  getNotificationPermission,
  sendClubNotification,
  dispararNotificacaoNavegador,
} from '../services/notificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const loadNotifications = () => {
    setNotifications(getNotificationsHistory());
    setPermission(getNotificationPermission());
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleNewNotif = () => loadNotifications();
    window.addEventListener('ironside-new-notification', handleNewNotif);
    return () => window.removeEventListener('ironside-new-notification', handleNewNotif);
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      sendClubNotification({
        title: '🔔 Notificações Ativadas!',
        body: 'Você receberá avisos sobre novos comboios, comunicados e mensalidades do Iron Side M.C.',
        type: 'sistema',
      });
    }
  };

  const handleTestNotification = async () => {
    sendClubNotification({
      title: '🏍️ Alerta de Comboio de Teste',
      body: 'Passeio teste para a Serra do Mar no sábado às 08h. Tanques cheios!',
      type: 'evento',
      targetTab: 'eventos',
    });
    await dispararNotificacaoNavegador('🏍️ Alerta de Comboio de Teste', {
      body: 'Passeio teste para a Serra do Mar no sábado às 08h. Tanques cheios!',
      tag: `teste-header-${Date.now()}`,
    });
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleClear = () => {
    clearNotificationsHistory();
    setNotifications([]);
  };

  const handleItemClick = (notif: ClubNotification) => {
    if (notif.targetTab) {
      onNavigateTab(notif.targetTab);
      onClose();
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'agora mesmo';
      if (diffSec < 3600) return `há ${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `há ${Math.floor(diffSec / 3600)} h`;
      return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const getIcon = (type: ClubNotification['type']) => {
    switch (type) {
      case 'evento':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'comunicado':
        return <Megaphone className="w-4 h-4 text-sky-400" />;
      case 'mensalidade':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      default:
        return <Shield className="w-4 h-4 text-purple-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Central de Notificações
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-zinc-950">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Avisos locais, comboios e comunicados do Iron Side M.C.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Banner */}
        {permission !== 'granted' && (
          <div className="p-3.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <BellRing className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
              <span>Deseja receber alertas sonoros na tela do celular/computador?</span>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 shadow-sm"
            >
              Ativar
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-[11px] transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Testar Notificação
            </button>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="hover:text-zinc-200 transition flex items-center gap-1 text-[11px]"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar lidas
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-red-400 transition flex items-center gap-1 text-[11px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/80 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">
                Nenhuma notificação no histórico.
              </p>
              <p className="text-[11px] text-zinc-500">
                Você será avisado quando houver novos comunicados ou comboios.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 rounded-2xl transition cursor-pointer flex items-start gap-3 ${
                  n.read ? 'hover:bg-zinc-800/40 opacity-80' : 'bg-zinc-800/60 hover:bg-zinc-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-zinc-200 truncate">{n.title}</h4>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {formatRelativeTime(n.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                    {n.body}
                  </p>
                  {n.targetTab && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 mt-1 font-semibold hover:underline">
                      Ver no app <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-center text-[10px] text-zinc-500">
          Notificações locais compatíveis com PWA, Chrome, Safari, Edge e Android/iOS
        </div>
      </div>
    </div>
  );
};
