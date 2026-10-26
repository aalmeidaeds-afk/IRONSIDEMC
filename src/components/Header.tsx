import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoadTheme } from '../context/RoadThemeContext';
import { ConfiguracaoClube, UserRole } from '../types';
import {
  Shield,
  Users,
  UserCheck,
  LogIn,
  LogOut,
  Award,
  ChevronDown,
  KeyRound,
  Server,
  Layers,
  Lock,
  Bell,
  Sun,
  Moon,
  Gauge,
  Camera,
  Loader2,
  UploadCloud,
  HelpCircle,
} from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';
import { NotificationCenterModal } from './NotificationCenterModal';
import { getUnreadNotificationsCount } from '../services/notificationService';
import { useLogoUpload } from '../hooks/useLogoUpload';

interface Props {
  config: ConfiguracaoClube;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenLoginModal?: () => void;
  onOpenTrocaSenhaModal?: () => void;
  onOpenDeploymentModal?: () => void;
  onOpenHubModulos?: () => void;
  onLockOrLogout?: () => void;
  onSaveConfig?: (data: Partial<ConfiguracaoClube>) => Promise<void> | void;
  onOpenManualAjuda?: () => void;
}

export const Header: React.FC<Props> = ({
  config,
  activeTab,
  onTabChange,
  onOpenLoginModal,
  onOpenTrocaSenhaModal,
  onOpenDeploymentModal,
  onOpenHubModulos,
  onLockOrLogout,
  onSaveConfig,
  onOpenManualAjuda,
}) => {
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
  const { theme, cycleTheme, themeLabel } = useRoadTheme();

  const {
    isUploading: isUploadingLogo,
    uploadProgress: logoProgress,
    triggerFileDialog: triggerLogoDialog,
    fileInputRef: logoInputRef,
    handleInputChange: handleLogoChange,
  } = useLogoUpload({
    onSuccess: (newUrl) => {
      if (onSaveConfig) {
        onSaveConfig({ logotipoUrl: newUrl });
      }
      setLogoUploadSuccess(true);
      setTimeout(() => setLogoUploadSuccess(false), 3000);
    },
  });

  useEffect(() => {
    setUnreadNotifs(getUnreadNotificationsCount());
    const handleUpdate = () => setUnreadNotifs(getUnreadNotificationsCount());
    window.addEventListener('ironside-new-notification', handleUpdate);
    return () => window.removeEventListener('ironside-new-notification', handleUpdate);
  }, []);
  const {
    currentUser,
    activeRole,
    currentAssociado,
    isDemoMode,
    signInWithGoogle,
    signOut,
    switchRolePersona,
  } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo (Ao clicar retorna à tela de Login e Senha) */}
        <div
          onClick={() => {
            if (onLockOrLogout) {
              onLockOrLogout();
            } else {
              onTabChange('dashboard');
            }
          }}
          className="flex items-center gap-3 cursor-pointer group select-none hover:opacity-90 active:scale-95 transition-all"
          title="Clique para voltar à tela de login e senha"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (onLockOrLogout) onLockOrLogout();
            }
          }}
        >
          {/* Input oculto para File API */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />

          <div className="relative group/logo shrink-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/60 bg-zinc-950 flex items-center justify-center p-0.5 shadow-md group-hover:border-amber-400 group-hover:shadow-amber-500/30 transition-all shrink-0">
              {isUploadingLogo ? (
                <div className="flex flex-col items-center justify-center text-amber-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[8px] font-mono font-bold mt-0.5">{logoProgress}%</span>
                </div>
              ) : config.logotipoUrl ? (
                <img
                  src={config.logotipoUrl}
                  alt={config.nomeClube}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Award className="w-6 h-6 text-amber-500" />
              )}
            </div>

            {/* Botão de upload/redimensionamento File API para Administrador e Diretoria */}
            {(activeRole === 'administrador' || activeRole === 'diretoria') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerLogoDialog();
                }}
                disabled={isUploadingLogo}
                title="Carregar e redimensionar nova logo via File API e salvar no Firebase Storage"
                className="absolute -bottom-1 -right-1 p-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 border border-zinc-900 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-club text-sm sm:text-base font-extrabold tracking-wider text-amber-400 block leading-tight group-hover:text-amber-300 transition-colors">
                {config.nomeClube}
              </span>
              <Lock className="w-3 h-3 text-amber-500/70 group-hover:text-amber-400 transition-colors hidden sm:inline" />
              {logoUploadSuccess && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 animate-pulse">
                  Logo atualizado!
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wider hidden sm:block">
              {config.lema}
            </span>
          </div>
        </div>

        {/* Right side: Role Switcher Persona + Auth Status */}
        <div className="flex items-center gap-3">
          {/* Quick Role Tester Switcher (Exclusivo Diretoria / Administrador - Oculto para Associado) */}
          {activeRole !== 'associado' ? (
            <div className="relative group">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-amber-500/60 transition cursor-pointer text-xs">
                {activeRole === 'administrador' && (
                  <Shield className="w-4 h-4 text-amber-400" />
                )}
                {activeRole === 'diretoria' && (
                  <Users className="w-4 h-4 text-sky-400" />
                )}
                <span className="font-bold text-zinc-200 capitalize hidden md:inline">
                  Perfil:
                </span>
                <span className="font-extrabold text-amber-300 capitalize">
                  {activeRole}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-3 py-2 text-[11px] font-semibold text-zinc-400 border-b border-zinc-800">
                  Trocar Perfil de Acesso:
                </div>
                <button
                  type="button"
                  onClick={() => switchRolePersona('administrador')}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                    activeRole === 'administrador'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Administrador</span>
                  </div>
                  {activeRole === 'administrador' && (
                    <span className="text-[10px] text-amber-400">Ativo</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => switchRolePersona('diretoria')}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                    activeRole === 'diretoria'
                      ? 'bg-sky-500/20 text-sky-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Diretoria</span>
                  </div>
                  {activeRole === 'diretoria' && (
                    <span className="text-[10px] text-sky-400">Ativo</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-emerald-500/40 text-xs shadow-sm">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-400 hidden md:inline">Perfil:</span>
              <span className="font-black text-emerald-300">Associado</span>
            </div>
          )}

          {/* User Status / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div
                onClick={() => onTabChange('carteirinha')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-800 border border-amber-500/40 shrink-0">
                  <img
                    src={
                      currentUser.photoURL ||
                      currentAssociado?.fotoUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={currentUser.displayName || 'Usuário'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-zinc-100 truncate max-w-[120px]">
                    {currentAssociado?.nomeGuerra || currentUser.displayName || 'Irmão'}
                  </p>
                  <p className="text-[10px] font-mono text-amber-400">
                    {currentAssociado?.numeroAssociado || 'Conectado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Desconectar da conta Google"
                className="p-2 text-zinc-400 hover:text-red-400 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {/* Trocar Senha Shortcut for Diretoria */}
          {activeRole === 'diretoria' && onOpenTrocaSenhaModal && (
            <button
              type="button"
              onClick={onOpenTrocaSenhaModal}
              title="Trocar Senha da Diretoria"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/50 text-sky-300 text-xs font-bold transition shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Trocar Senha</span>
            </button>
          )}

          {/* Hostinger, Google Play TWA, App Store & Windows Deployment Center (Módulo 13 - Exclusivo Administrador) */}
          {activeRole === 'administrador' && onOpenDeploymentModal && (
            <button
              type="button"
              onClick={onOpenDeploymentModal}
              title="Módulo 13: Central de Publicação Google Play (TWA), Apple App Store, Hostinger e Windows (Exclusivo Administrador)"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-semibold transition shadow-sm"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Módulo 13: Lojas &amp; Hostinger</span>
            </button>
          )}

          {/* PWA Mobile App Install Button - Prominente para Web & Mobile */}
          <PWAInstallModal variant="prominent_header" />

          {/* Alternador de Modo Estrada (Padrão / Noturno Tático / Solar Alto Contraste) */}
          <button
            type="button"
            onClick={cycleTheme}
            title={`Tema de Estrada: ${themeLabel}. Clique para alternar (Padrão / Noturno Tático / Solar Alto Contraste)`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition text-xs font-bold cursor-pointer ${
              theme === 'noturno_tatico'
                ? 'bg-red-950/60 border-red-500/50 text-red-300 shadow-sm'
                : theme === 'solar_alto_contraste'
                ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md font-black'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            {theme === 'noturno_tatico' ? (
              <Moon className="w-3.5 h-3.5 text-red-400" />
            ) : theme === 'solar_alto_contraste' ? (
              <Sun className="w-3.5 h-3.5 text-zinc-950" />
            ) : (
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden xl:inline">{themeLabel}</span>
          </button>

          {/* Central de Notificações com Sino & Contador de Não Lidas */}
          <button
            type="button"
            onClick={() => setNotifModalOpen(true)}
            title="Central de Notificações e Avisos do Clube"
            className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                {unreadNotifs}
              </span>
            )}
          </button>

          {/* Central de Ajuda & Guia Ilustrado de Todas as Telas */}
          {onOpenManualAjuda && (
            <button
              type="button"
              onClick={onOpenManualAjuda}
              title="Central de Ajuda: Guia Ilustrado de Todas as Telas"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 transition cursor-pointer text-xs font-semibold shadow-sm"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">Ajuda</span>
            </button>
          )}

          {/* Botão de Retorno à Central de Módulos */}
          {activeTab !== 'hub_modulos' && (
            <button
              type="button"
              onClick={() => {
                if (onOpenHubModulos) onOpenHubModulos();
                else onTabChange('hub_modulos');
              }}
              title="Voltar ao Menu com Todas as Telas Montadas"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Central de Módulos</span>
            </button>
          )}

          {/* Bloquear / Trocar de Perfil (Exclusivo Diretoria e Admin; Associado possui somente Sair) */}
          {onLockOrLogout && (
            activeRole === 'associado' ? (
              <button
                type="button"
                onClick={onLockOrLogout}
                title="Sair do aplicativo"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-red-500/40 text-zinc-300 hover:text-red-300 text-xs font-semibold transition shadow-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden md:inline">Sair</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLockOrLogout}
                title="Bloquear aplicativo e trocar de perfil"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-red-500/30 text-red-300 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">Bloquear / Trocar Perfil</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Modal da Central de Notificações */}
      <NotificationCenterModal
        isOpen={notifModalOpen}
        onClose={() => {
          setNotifModalOpen(false);
          setUnreadNotifs(getUnreadNotificationsCount());
        }}
        onNavigateTab={onTabChange}
      />
    </header>
  );
};
