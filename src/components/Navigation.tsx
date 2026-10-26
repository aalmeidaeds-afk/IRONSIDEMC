import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ConfiguracaoClube } from '../types';
import { isModuleVisible } from '../utils/moduleVisibility';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bike,
  Wrench,
  DollarSign,
  Calendar,
  Bell,
  LifeBuoy,
  Settings,
  ShieldAlert,
  HeartHandshake,
  Shield,
  Newspaper,
  Layers,
  Landmark,
  HelpCircle,
  FileText,
  Trophy,
} from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount?: number;
  config?: ConfiguracaoClube;
  onOpenManualAjuda?: () => void;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onTabChange,
  pendingCount = 0,
  config,
  onOpenManualAjuda,
}) => {
  const { activeRole } = useAuth();

  const menuItems = [
    {
      id: 'hub_modulos',
      label: 'Central de Módulos',
      icon: Layers,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'cadastro_institucional',
      label: 'Módulo 0: Institucional',
      icon: Landmark,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'associados',
      label: activeRole === 'associado' ? 'Meu Cadastro' : 'Associados',
      icon: Users,
      roles: ['administrador', 'diretoria', 'associado'],
      badge: activeRole !== 'associado' && pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'carteirinha',
      label: 'Carteirinha Digital',
      icon: CreditCard,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'veiculos',
      label: activeRole === 'associado' ? 'Minhas Motos' : 'Motos & Frota',
      icon: Bike,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'manutencao_abastecimento',
      label: 'Manutenção & Combustível',
      icon: Wrench,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'mensalidades',
      label: activeRole === 'associado' ? 'Minhas Mensalidades' : 'Financeiro & Mensalidades',
      icon: DollarSign,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'eventos',
      label: 'Passeios & Eventos',
      icon: Calendar,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'comunicados',
      label: 'Mural Oficial',
      icon: Bell,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'campanhas',
      label: 'Campanhas & Doações',
      icon: HeartHandshake,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'amigos_mc',
      label: 'Amigos & Moto Clubes',
      icon: Shield,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'sos',
      label: 'SOS & Resgate na Estrada',
      icon: LifeBuoy,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'noticias_motos',
      label: 'Notícias & Dicas',
      icon: Newspaper,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'rank_estradas',
      label: 'Rank de Estradas',
      icon: Trophy,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'relatorios_central',
      label: 'Módulo 14: Relatórios PDF',
      icon: FileText,
      roles: ['administrador', 'diretoria', 'associado'],
    },
    {
      id: 'configuracoes',
      label: 'Configurações & Auditoria',
      icon: Settings,
      roles: ['administrador'],
    },
  ];

  const visibleItems = menuItems.filter((item) => {
    if (item.id === 'hub_modulos' || item.id === 'dashboard') {
      return item.roles.includes(activeRole);
    }
    return item.roles.includes(activeRole) && isModuleVisible(item.id, activeRole, config);
  });

  return (
    <nav className="bg-zinc-950/80 border-b border-zinc-800/80 sticky top-16 z-30 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 sm:gap-2 py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10 font-bold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {onOpenManualAjuda && (
          <button
            type="button"
            onClick={onOpenManualAjuda}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap text-emerald-400 hover:text-emerald-300 hover:bg-zinc-900 border border-emerald-500/30 transition-all select-none ml-auto cursor-pointer"
            title="Manual & Guia de Ajuda com Imagens de Todas as Telas"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guia de Telas</span>
          </button>
        )}
      </div>
    </nav>
  );
};
