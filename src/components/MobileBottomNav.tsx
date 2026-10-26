import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Bike,
  Calendar,
  HeartHandshake,
  Menu,
  X,
  LifeBuoy,
  Users,
  Newspaper,
  Bell,
  Settings,
  ShieldCheck,
  ChevronRight,
  Smartphone,
  LogOut,
  Sparkles,
  Server,
  Layers,
  Lock,
  Landmark,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallModal } from './PWAInstallModal';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { ConfiguracaoClube } from '../types';
import { isModuleVisible } from '../utils/moduleVisibility';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  config?: ConfiguracaoClube;
  onOpenDeploymentModal?: () => void;
  onLockOrLogout?: () => void;
  onOpenManualAjuda?: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  unreadCount = 0,
  config,
  onOpenDeploymentModal,
  onLockOrLogout,
  onOpenManualAjuda,
}) => {
  const { activeRole, signOut, currentAssociado } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDiretoriaOrAdmin = activeRole === 'administrador' || activeRole === 'diretoria';

  // Primary 4 tabs + 1 "Mais" menu button for one-handed thumb ergonomics
  const primaryTabs = [
    {
      id: 'carteirinha',
      label: 'Carteirinha',
      icon: CreditCard,
    },
    {
      id: 'veiculos',
      label: 'Motos',
      icon: Bike,
    },
    {
      id: 'eventos',
      label: 'Eventos',
      icon: Calendar,
    },
    {
      id: 'campanhas',
      label: 'Doações',
      icon: HeartHandshake,
    },
  ];

  // Secondary items shown in the "Mais" bottom sheet
  const secondaryItems = [
    {
      id: 'hub_modulos',
      label: 'Central de Telas & Módulos',
      desc: 'Grade completa com as 14 telas e módulos do moto clube',
      icon: Layers,
      color: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
    },
    {
      id: 'cadastro_institucional',
      label: 'Módulo 0: Cadastro Institucional',
      desc: 'Razão social, CNPJ, diretoria legal, dados bancários e estatuto',
      icon: Landmark,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'sos',
      label: 'SOS Estrada & Socorro',
      desc: 'Emergência 190/Samu/PRF, guinchos, mecânicos e postos',
      icon: LifeBuoy,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
    },
    {
      id: 'amigos_mc',
      label: 'Amigos & Outros MCs',
      desc: 'Rede de motoclubes parceiros e contatos de estrada',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      id: 'noticias_motos',
      label: 'Notícias & Novidades',
      desc: 'Tendências do mundo duas rodas, lançamentos e dicas',
      icon: Newspaper,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'mensalidades',
      label: 'Mensalidades & Finanças',
      desc: 'Histórico de contribuições e comprovantes Pix',
      icon: CreditCard,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'comunicados',
      label: 'Mural Oficial & Avisos',
      desc: 'Comunicados da diretoria para a irmandade',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    ...(isDiretoriaOrAdmin
      ? [
          {
            id: 'associados',
            label: 'Quadro de Integrantes',
            desc: 'Fichas cadastrais completas, dados LGPD e cargos',
            icon: Users,
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          },
        ]
      : []),
    ...(activeRole === 'administrador'
      ? [
          {
            id: 'configuracoes',
            label: 'Módulo 12: Configurações & Auditoria',
            desc: 'Parâmetros do clube, auditoria e gráficos (Exclusivo Admin)',
            icon: Settings,
            color: 'text-zinc-400 bg-zinc-800 border-zinc-700',
          },
        ]
      : []),
    ...(activeRole === 'administrador'
      ? [
          {
            id: 'hostinger-apk',
            label: 'Módulo 13: Hostinger & APK',
            desc: 'Instalador Windows .exe, APK celular e guia Hostinger (Exclusivo Admin)',
            icon: Server,
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
            isAction: true,
            onClick: () => {
              setIsMenuOpen(false);
              onOpenDeploymentModal?.();
            },
          },
        ]
      : []),
  ];

  const visibleSecondaryItems = secondaryItems.filter((item) => {
    if (item.id === 'hub_modulos') return true;
    return isModuleVisible(item.id, activeRole, config);
  });

  const handleSelectTab = (target: string | (typeof secondaryItems)[number]) => {
    if (typeof target !== 'string' && 'onClick' in target && target.onClick) {
      target.onClick();
      return;
    }
    const tabId = typeof target === 'string' ? target : target.id;
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  const isMaisActive = isMenuOpen || visibleSecondaryItems.some((s) => s.id === activeTab);

  return (
    <>
      {/* Floating PWA Install Prompt (Prominente quando standalone mode não está ativo) */}
      <div className="md:hidden fixed bottom-18 left-2.5 right-2.5 z-30 pointer-events-auto">
        <PWAInstallModal variant="floating_strip" />
      </div>

      {/* Fixed Bottom Navigation Bar for Mobile with Native Spring Physics */}
      <nav
        aria-label="Navegação Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1.5 relative">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !isMenuOpen;

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                whileTap={{ scale: 0.88 }}
                className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors select-none ${
                  isActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {/* Smooth Animated Sliding Indicator Pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActivePill"
                    className="absolute inset-x-2 inset-y-1 bg-amber-500/15 border border-amber-500/30 rounded-xl -z-10 shadow-sm shadow-amber-500/20"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}

                {/* Animated Icon with Spring Bounce */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 25,
                  }}
                  className="relative p-1"
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.85,
                    fontWeight: isActive ? 700 : 500,
                  }}
                  className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap truncate max-w-[58px]"
                >
                  {tab.label}
                </motion.span>

                {/* Animated Active Dot Indicator */}
                {isActive && (
                  <motion.span
                    layoutId="mobileActiveDot"
                    className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* "Mais" Menu Button with Spring Indicator */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.88 }}
            className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors select-none ${
              isMaisActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isMaisActive && (
              <motion.div
                layoutId="mobileActivePill"
                className="absolute inset-x-2 inset-y-1 bg-amber-500/15 border border-amber-500/30 rounded-xl -z-10 shadow-sm shadow-amber-500/20"
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                }}
              />
            )}

            <motion.div
              animate={{
                scale: isMaisActive ? 1.15 : 1,
                rotate: isMenuOpen ? 90 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25,
              }}
              className="relative p-1"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {unreadCount > 0 && !isMenuOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-zinc-950 animate-pulse" />
              )}
            </motion.div>

            <span className="text-[10px] tracking-tight mt-0.5">
              {isMenuOpen ? 'Fechar' : 'Mais'}
            </span>

            {isMaisActive && (
              <motion.span
                layoutId="mobileActiveDot"
                className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                }}
              />
            )}
          </motion.button>
        </div>
      </nav>

      {/* "Mais" Full Drawer / Bottom Sheet with Spring Physics */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop with Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />

            {/* Sliding Drawer Container with Native Spring */}
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 32,
                stiffness: 350,
              }}
              className="relative z-10 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-safe shadow-2xl"
            >
              {/* Grab handle with drag affordance */}
              <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto mb-4" />

              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-100">Menu do Integrante</h3>
                      {onOpenDeploymentModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenDeploymentModal();
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        >
                          v1.2.0
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {currentAssociado?.nomeGuerra || currentAssociado?.nome || 'Irmão de Estrada'} ·{' '}
                      <span className="text-amber-400 capitalize">{activeRole}</span>
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* PWA Install Banner inside Drawer */}
              <div className="mb-4">
                <PWAInstallModal variant="banner" />
              </div>

              {/* Central de Ajuda & Guia Ilustrado de Todas as Telas */}
              {onOpenManualAjuda && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenManualAjuda();
                  }}
                  className="w-full flex items-center justify-between p-3.5 mb-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-left cursor-pointer active:scale-95 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-emerald-500/40 bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-black flex items-center gap-2 text-emerald-300">
                        Central de Ajuda &amp; Guia das Telas
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500 text-zinc-950">
                          15 Módulos
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        Manual passo a passo com ilustrações de cada tela
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                </motion.button>
              )}

              {/* Secondary Destinations List */}
              <div className="space-y-2 mb-6">
                {visibleSecondaryItems.map((item, index) => {
                  const Icon = item.icon;
                  const isItemActive = activeTab === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.15 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectTab(item)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                        isItemActive
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            {item.label}
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-zinc-950">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Bloquear / Trocar Perfil */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onLockOrLogout) {
                    onLockOrLogout();
                  } else {
                    signOut();
                  }
                }}
                className={`w-full py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  activeRole === 'associado'
                    ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                    : 'border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-300'
                }`}
              >
                {activeRole === 'associado' ? (
                  <>
                    <LogOut className="w-4 h-4 text-zinc-400" />
                    <span>Sair da Conta</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-red-400" />
                    <span>Bloquear / Trocar Perfil de Acesso</span>
                  </>
                )}
              </motion.button>

              {/* Marca Dinastia System no rodapé de todas as partes do sistema */}
              <DinastiaBrandBadge variant="footer" className="mt-4" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
