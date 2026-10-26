import { useState, useEffect, useCallback } from 'react';

export interface VersionInfo {
  version: string;
  buildDate: string;
  buildNumber: number;
  changelog: string[];
}

export const CURRENT_APP_VERSION = '1.2.2';
export const CURRENT_BUILD_NUMBER = 14;

/**
 * Compara duas versões semânticas (ex: "1.2.2" vs "1.2.1")
 * Retorna > 0 se v1 > v2, < 0 se v1 < v2, 0 se iguais
 */
function compareSemVer(v1: string, v2: string): number {
  const parts1 = (v1 || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const parts2 = (v2 || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function useVersionCheck() {
  const [currentVersion] = useState<string>(CURRENT_APP_VERSION);
  const [latestInfo, setLatestInfo] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [swWaiting, setSwWaiting] = useState<ServiceWorker | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setChecking(true);
    try {
      // 1. Fetch version.json from the server with cache-busting timestamp
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });

      if (res.ok) {
        const info: VersionInfo = await res.json();
        setLatestInfo(info);
        setLastChecked(new Date());

        // Identifica versão ativa instalada no cliente
        const activeVersion = localStorage.getItem('ironside_active_version') || CURRENT_APP_VERSION;
        const activeBuild = parseInt(
          localStorage.getItem('ironside_active_build') || String(CURRENT_BUILD_NUMBER),
          10
        );

        // Somente acender o aviso quando houver real diferença de versão ou build mais recente
        const isServerNewerSemver = compareSemVer(info.version, activeVersion) > 0;
        const isSameSemverWithNewerBuild =
          compareSemVer(info.version, activeVersion) === 0 &&
          (info.buildNumber || 0) > activeBuild;

        if (isServerNewerSemver || isSameSemverWithNewerBuild) {
          setHasUpdate(true);
        } else {
          setHasUpdate(false);
        }
      }

      // 2. Check Service Worker registration update
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
          if (reg.waiting) {
            setSwWaiting(reg.waiting);
            setHasUpdate(true);
          }
        }
      }
    } catch {
      // Ignore network errors when offline
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check for updates on mount
    checkForUpdates();

    // Listen for Service Worker update found
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        if (reg.waiting) {
          setSwWaiting(reg.waiting);
          setHasUpdate(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwWaiting(newWorker);
                setHasUpdate(true);
              }
            });
          }
        });
      });

      // Reload when controller changes
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // Check when user refocuses the app window (e.g. returns from background or road trip)
    const handleFocus = () => checkForUpdates();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic check every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [checkForUpdates]);

  // Apply update: activates new service worker, stores active version, purges cache and reloads
  const applyUpdate = useCallback(async () => {
    // Salva a versão atualizada no armazenamento local para suprimir alertas pós-atualização
    if (latestInfo?.version) {
      localStorage.setItem('ironside_active_version', latestInfo.version);
      localStorage.setItem('ironside_active_build', String(latestInfo.buildNumber || CURRENT_BUILD_NUMBER));
    }
    setHasUpdate(false);

    if (swWaiting) {
      swWaiting.postMessage({ type: 'SKIP_WAITING' });
    }

    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.update();
        }
      } catch (err) {
        console.warn('Aviso ao sincronizar Service Worker:', err);
      }
    }

    // Purge browser caches to guarantee instant fresh code
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (err) {
        console.warn('Aviso ao limpar caches:', err);
      }
    }

    // Hard reload with cache buster
    window.location.reload();
  }, [swWaiting, latestInfo]);

  // Simulate update to test the notification and banner UI
  const simulateUpdateNotification = useCallback((testVersion = '1.2.3') => {
    setLatestInfo({
      version: testVersion,
      buildDate: new Date().toISOString(),
      buildNumber: CURRENT_BUILD_NUMBER + 1,
      changelog: [
        'Novo Painel de Diagnóstico do Sistema no Módulo 12',
        'Seletor universal de imagens para desktop e celular',
        'Otimização do bloqueio de segurança com 1 clique no cabeçalho',
      ],
    });
    setHasUpdate(true);
  }, []);

  return {
    currentVersion,
    latestVersion: latestInfo?.version || currentVersion,
    latestInfo,
    hasUpdate,
    checking,
    lastChecked,
    checkForUpdates,
    applyUpdate,
    simulateUpdateNotification,
  };
}
