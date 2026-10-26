import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  subscribeToOfflineQueue,
  syncOfflineQueueToFirestore,
} from '../services/offlineDb';

export const OfflineBanner: React.FC = () => {
  const { isOnline, justReconnected } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncedMessage, setSyncedMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOfflineQueue((count) => {
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      const result = await syncOfflineQueueToFirestore();
      if (result.synced > 0) {
        setSyncedMessage(`${result.synced} alteração(ões) sincronizada(s) com sucesso!`);
        setTimeout(() => setSyncedMessage(null), 4000);
      }
    } finally {
      setSyncing(false);
    }
  };

  // If online, no pending queue and no reconnection notification, stay hidden
  if (isOnline && !justReconnected && pendingCount === 0 && !syncedMessage) {
    return null;
  }

  if (syncedMessage) {
    return (
      <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between gap-2 shadow-md animate-fade-in sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span className="font-medium">{syncedMessage}</span>
        </div>
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    return (
      <div className="bg-sky-600/95 text-white text-xs px-4 py-2 flex items-center justify-between gap-2 shadow-md sticky top-0 z-50 border-b border-sky-400/40">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-200 animate-pulse" />
          <span className="font-semibold">
            {pendingCount} registro(s) offline pendente(s) no banco local IndexedDB.
          </span>
        </div>
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-950/40 hover:bg-zinc-950/60 text-white text-[11px] font-bold tracking-wide transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
        </button>
      </div>
    );
  }

  if (justReconnected) {
    return (
      <div className="bg-emerald-600/90 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 backdrop-blur-sm transition-all animate-fade-in shadow-md sticky top-0 z-50">
        <Wifi className="w-4 h-4 text-emerald-200 animate-pulse" />
        <span className="font-medium">
          Conexão restabelecida! Banco de dados local Dexie sincronizado com o Firestore.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-amber-600/95 text-zinc-950 text-xs px-4 py-2.5 flex items-center justify-between gap-3 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-amber-500/30">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-full bg-zinc-950/20">
          <WifiOff className="w-4 h-4 text-zinc-950" />
        </span>
        <div>
          <span className="font-bold uppercase tracking-wider text-[11px] block">
            Modo Estrada (Offline Dexie.js Ativo)
          </span>
          <span className="text-[11px] font-medium text-zinc-900">
            {pendingCount > 0
              ? `${pendingCount} alteração(ões) gravada(s) no celular aguardando sinal.`
              : 'Sem internet na rodovia. Carteirinha, motos e formulários salvam no celular.'}
          </span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950/15 text-[10px] font-semibold uppercase tracking-wider">
        <RefreshCw className="w-3 h-3 animate-spin text-zinc-950" />
        Auto-Sync
      </div>
    </div>
  );
};
