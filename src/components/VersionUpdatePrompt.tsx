import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, X, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { useVersionCheck } from '../hooks/useVersionCheck';

export const VersionUpdatePrompt: React.FC = () => {
  const { hasUpdate, latestVersion, currentVersion, latestInfo, applyUpdate } = useVersionCheck();
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!hasUpdate || dismissed) {
    return null;
  }

  const handleUpdate = async () => {
    setUpdating(true);
    await applyUpdate();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-zinc-900/95 border border-amber-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md text-zinc-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-100">Atualização Disponível!</h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-zinc-950 uppercase tracking-wider">
                  v{latestVersion}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Uma nova versão do sistema com melhorias e correções está pronta para uso.
              </p>
              {latestInfo?.changelog && latestInfo.changelog.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] text-zinc-300">
                  {latestInfo.changelog.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400" />
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Atualizando...' : 'Atualizar Agora'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            Depois
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
