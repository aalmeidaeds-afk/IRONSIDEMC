import React from 'react';
import { Crown, Shield, Sparkles } from 'lucide-react';

interface Props {
  variant?: 'minimal' | 'card' | 'footer' | 'pill';
  className?: string;
}

export const DinastiaBrandBadge: React.FC<Props> = ({
  variant = 'footer',
  className = '',
}) => {
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/10 border border-amber-500/30 text-[11px] text-zinc-300 font-medium ${className}`}
      >
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span>Powered by</span>
        <strong className="text-amber-400 font-black tracking-wider">Dinastia System</strong>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-medium ${className}`}>
        <Crown className="w-3.5 h-3.5 text-amber-500/70" />
        <span>Desenvolvido por</span>
        <span className="font-black text-amber-400 tracking-wider">Dinastia System</span>
        <span>•</span>
        <span>Tecnologia & Gestão</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/20 flex items-center justify-between gap-3 text-xs shadow-md ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <p className="font-black text-zinc-100 tracking-wide text-xs">
              Dinastia System
            </p>
            <p className="text-[10px] text-zinc-400">
              Engenharia de Software, Soluções & Gestão de Moto Clubes
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 font-semibold">
          OFICIAL
        </span>
      </div>
    );
  }

  // Default 'footer' variant
  return (
    <div
      className={`pt-4 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-400 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
          <Crown className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px]">
          Plataforma desenvolvida e mantida por{' '}
          <strong className="text-amber-400 font-black tracking-wider uppercase">
            Dinastia System
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-amber-500/60" />
          <span>Segurança & Alta Disponibilidade</span>
        </span>
        <span>•</span>
        <span className="text-zinc-400 font-semibold">© 2026 Dinastia System</span>
      </div>
    </div>
  );
};
