import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  KeyRound,
  User,
  Users,
  CreditCard,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  Award,
  UserPlus,
  Fingerprint,
  ScanFace,
  Scan,
  Smartphone,
  Apple,
  X,
  HelpCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  Check,
  Camera,
  Upload,
} from 'lucide-react';
import {
  verifyAdminPassword,
  verifyDiretoriaLogin,
  verifyAssociadoLogin,
  findAssociadoByCpfOrCodigo,
  updateConfiguracao,
} from '../services/db';
import {
  detectBiometricHardware,
  performBiometricAuth,
  getSavedBiometricMember,
  removeBiometricMember,
  saveBiometricMember,
  cacheAssociadoForOfflineBiometric,
  BiometricDeviceInfo,
  SavedBiometricMember,
  BiometricType,
} from '../services/biometricService';
import { Associado, ConfiguracaoClube, UserRole } from '../types';
import { CadastroAssociadoWizard } from './CadastroAssociadoWizard';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { processUniversalImageFile } from '../utils/imageUploadHelper';

interface Props {
  config: ConfiguracaoClube;
  onSuccess: (role: UserRole, associado?: Associado, targetTab?: string) => void;
  onUpdateConfig?: (data: Partial<ConfiguracaoClube>) => Promise<void>;
}

export const InitialAuthGate: React.FC<Props> = ({ config, onSuccess, onUpdateConfig }) => {
  // Quadro de Escolha: 'associado' | 'diretoria' | 'administrador'
  const [selectedRole, setSelectedRole] = useState<UserRole>('associado');
  const [cadastroModalOpen, setCadastroModalOpen] = useState(false);

  // Fields for Associado
  const [loginAssociado, setLoginAssociado] = useState('123.456.789-00');
  const [senhaAssociado, setSenhaAssociado] = useState('123456');

  // Fields for Diretoria
  const [loginDiretoria, setLoginDiretoria] = useState('DIRETORIA');
  const [senhaDiretoria, setSenhaDiretoria] = useState('DIR202627');

  // Field for Administrador (SOMENTE A SENHA)
  const [senhaAdmin, setSenhaAdmin] = useState('ADMIN2026');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blockedInfo, setBlockedInfo] = useState<Associado | null>(null);

  // Biometrics State (TouchID / FaceID for iOS & Fingerprint for Android)
  const [deviceInfo, setDeviceInfo] = useState<BiometricDeviceInfo>(() => detectBiometricHardware());
  const [savedBiometricMember, setSavedBiometricMember] = useState<SavedBiometricMember | null>(null);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [isOfflineAuth, setIsOfflineAuth] = useState(false);
  const [rememberBiometric, setRememberBiometric] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [forgotPasswordCpf, setForgotPasswordCpf] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);

  // Troca Universal de Logotipo (Área de Trabalho ou Galeria do Celular: JPEG, PNG, BMP, GIF, HEIC)
  const [logoAtual, setLogoAtual] = useState<string>(config.logotipoUrl || '/ironside-logo.svg');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoToastMsg, setLogoToastMsg] = useState<string | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (config.logotipoUrl) {
      setLogoAtual(config.logotipoUrl);
    }
  }, [config.logotipoUrl]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setLogoToastMsg(`Processando imagem "${file.name}"...`);

      const result = await processUniversalImageFile(file);
      setLogoAtual(result.dataUrl);

      // Salva no banco de dados e localStorage imediatamente
      await updateConfiguracao({ logotipoUrl: result.dataUrl });
      if (onUpdateConfig) {
        await onUpdateConfig({ logotipoUrl: result.dataUrl });
      }

      setLogoToastMsg(`Logotipo "${result.fileName}" atualizado com sucesso (${result.format})!`);
      setTimeout(() => setLogoToastMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao trocar logotipo:', err);
      alert('Não foi possível carregar o arquivo de imagem. Verifique o formato e tente novamente.');
      setLogoToastMsg(null);
    } finally {
      setUploadingLogo(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  useEffect(() => {
    const info = detectBiometricHardware();
    setDeviceInfo(info);
    const saved = getSavedBiometricMember();
    setSavedBiometricMember(saved);
    if (saved && saved.cpf) {
      setLoginAssociado(saved.cpf);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handler de Autenticação Biométrica Rápida
  const handleTriggerBiometric = async (targetCpf?: string, directToCarteirinha = false) => {
    setErrorMsg(null);
    setBlockedInfo(null);
    setBiometricError(null);
    setBiometricScanning(true);
    setBiometricSuccess(false);
    setIsOfflineAuth(false);

    const cpfToUse = targetCpf || loginAssociado;

    try {
      const result = await performBiometricAuth(cpfToUse);

      if (result.success && result.associado) {
        setBiometricSuccess(true);
        setIsOfflineAuth(Boolean(result.isOffline || !navigator.onLine));
        // Atualiza o estado salvo no componente
        setSavedBiometricMember(getSavedBiometricMember());

        setTimeout(() => {
          setBiometricScanning(false);
          onSuccess('associado', result.associado, directToCarteirinha ? 'carteirinha' : undefined);
        }, 700);
      } else {
        setBiometricScanning(false);
        setErrorMsg(result.error || 'Falha na leitura biométrica. Tente novamente ou use a senha.');
      }
    } catch (err) {
      console.error('Erro na biometria:', err);
      setBiometricScanning(false);
      setErrorMsg('Erro inesperado durante a leitura biométrica do dispositivo.');
    }
  };

  const [biometricError, setBiometricError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBlockedInfo(null);
    setLoading(true);

    try {
      if (selectedRole === 'administrador') {
        if (!senhaAdmin.trim()) {
          setErrorMsg('Por favor, informe a senha do Administrador.');
          setLoading(false);
          return;
        }

        const isValid = await verifyAdminPassword(senhaAdmin);
        if (!isValid) {
          setErrorMsg('Senha do Administrador incorreta. A senha mestra padrão é ADMIN2026.');
          setLoading(false);
          return;
        }

        onSuccess('administrador');
      } else if (selectedRole === 'diretoria') {
        if (!loginDiretoria.trim() || !senhaDiretoria.trim()) {
          setErrorMsg('Informe o login e a senha da Diretoria.');
          setLoading(false);
          return;
        }

        const result = await verifyDiretoriaLogin(loginDiretoria, senhaDiretoria);
        if (!result.success) {
          setErrorMsg(result.error || 'Credenciais da Diretoria inválidas.');
          setLoading(false);
          return;
        }

        onSuccess('diretoria');
      } else {
        if (!loginAssociado.trim()) {
          setErrorMsg('Informe o CPF ou Código de Associado (Ex: MC-000001).');
          setLoading(false);
          return;
        }
        if (!senhaAssociado.trim()) {
          setErrorMsg('Informe a senha do Associado (padrão: 123456).');
          setLoading(false);
          return;
        }

        const result = await verifyAssociadoLogin(loginAssociado, senhaAssociado);
        if (!result.success) {
          if (result.blocked) {
            setBlockedInfo(result.blocked);
            setLoading(false);
            return;
          }
          setErrorMsg(result.error || 'Dados de acesso incorretos.');
          setLoading(false);
          return;
        }

        // Salvar automaticamente a biometria para futuros acessos em 1-toque offline
        if (rememberBiometric && result.associado) {
          saveBiometricMember(result.associado, deviceInfo.type);
          cacheAssociadoForOfflineBiometric(result.associado);
          setSavedBiometricMember(getSavedBiometricMember());
        }

        onSuccess('associado', result.associado);
      }
    } catch (err) {
      console.error('Erro na autenticação inicial:', err);
      setErrorMsg('Erro inesperado ao validar credenciais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Helper de preenchimento rápido para demonstração
  const handleQuickFill = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setBlockedInfo(null);
    if (role === 'associado') {
      setLoginAssociado('123.456.789-00');
      setSenhaAssociado('123456');
    } else if (role === 'diretoria') {
      setLoginDiretoria('DIRETORIA');
      setSenhaDiretoria('DIR202627');
    } else {
      setSenhaAdmin('ADMIN2026');
    }
  };

  // Ícone dinâmico baseado na plataforma (Face ID vs Touch ID vs Android Fingerprint)
  const renderBiometricIcon = (className = 'w-5 h-5') => {
    if (deviceInfo.type === 'faceId') {
      return <ScanFace className={className} />;
    }
    return <Fingerprint className={className} />;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Toast de Sucesso da Troca de Logotipo */}
        {logoToastMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in shadow-xl backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{logoToastMsg}</span>
          </div>
        )}

        {/* Input Oculto de Arquivos para Troca Universal de Logotipo */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*,.jpeg,.jpg,.png,.bmp,.gif,.heic,.heif,.webp,.svg"
          onChange={handleLogoUpload}
          className="hidden"
        />

        {/* Brand Header com Troca de Logotipo */}
        <div className="text-center space-y-2">
          <div className="relative inline-block mb-1 group">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex items-center justify-center p-1.5 overflow-hidden transition-all duration-300 group-hover:border-amber-400">
              <img
                src={logoAtual || config.logotipoUrl || '/ironside-logo.svg'}
                alt="Iron Side Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Botão de Trocar Logotipo direto da Primeira Tela */}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-lg shadow-amber-500/40 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-zinc-950"
              title="Trocar Logotipo do Moto Clube (Buscar na Área de Trabalho ou Galeria do Celular: JPEG, PNG, BMP, GIF, HEIC)"
            >
              {uploadingLogo ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-[11px] font-bold transition shadow-sm cursor-pointer"
              title="Buscar imagem na Área de Trabalho (Windows/Mac) ou Galeria de Fotos (Android/iOS)"
            >
              <Upload className="w-3 h-3 text-amber-400" />
              <span>Trocar Logotipo (Galeria / Área de Trabalho)</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-club tracking-wider text-zinc-100">
            {config.nomeClube || 'IRON SIDE ROAD RIDER M.C.'}
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            &ldquo;{config.lema || 'Os melhores são de ferro'}&rdquo;
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Portal de Gestão Integrada &amp; Estrada &bull; Controle de Acesso</span>
          </div>
        </div>

        {/* Quadro de Escolha (ASSOCIADO | DIRETORIA | ADMINISTRADOR) */}
        <div className="p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-md">
          <p className="text-[11px] font-bold text-zinc-400 px-3 pt-2 pb-1.5 uppercase tracking-wider text-center">
            Selecione seu perfil de acesso no quadro abaixo:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* 1. ASSOCIADO */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('associado');
                setErrorMsg(null);
                setBlockedInfo(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                selectedRole === 'associado'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <CreditCard className="w-5 h-5 shrink-0" />
              <div className="leading-tight">
                <span className="text-xs block font-black tracking-wide">ASSOCIADO</span>
                <span
                  className={`text-[9px] block ${
                    selectedRole === 'associado' ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  Membro do Clube
                </span>
              </div>
            </button>

            {/* 2. DIRETORIA */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('diretoria');
                setErrorMsg(null);
                setBlockedInfo(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                selectedRole === 'diretoria'
                  ? 'bg-sky-500 text-zinc-950 border-sky-400 font-extrabold shadow-lg shadow-sky-500/20 scale-[1.02]'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Award className="w-5 h-5 shrink-0" />
              <div className="leading-tight">
                <span className="text-xs block font-black tracking-wide">DIRETORIA</span>
                <span
                  className={`text-[9px] block ${
                    selectedRole === 'diretoria' ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  Gestão &amp; Conselho
                </span>
              </div>
            </button>

            {/* 3. ADMINISTRADOR */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('administrador');
                setErrorMsg(null);
                setBlockedInfo(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                selectedRole === 'administrador'
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <KeyRound className="w-5 h-5 shrink-0" />
              <div className="leading-tight">
                <span className="text-xs block font-black tracking-wide">ADMINISTRADOR</span>
                <span
                  className={`text-[9px] block ${
                    selectedRole === 'administrador' ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  Somente a Senha
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-md">
          {/* CRITICAL: 1-TOUCH BIOMETRIC LOGIN CARD FOR ASSOCIADOS */}
          {selectedRole === 'associado' && (
            <div className="mb-5 p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-zinc-950 to-zinc-950 border border-amber-500/40 shadow-xl relative overflow-hidden">
              {/* Subtle Ambient Pulse */}
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-zinc-900 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                      {renderBiometricIcon('w-6 h-6')}
                    </div>
                    {/* Status Dot */}
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                        {deviceInfo.label} • {deviceInfo.platformName}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Biometria Pronta
                      </span>
                      {!isOnline ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                          <WifiOff className="w-2.5 h-2.5" /> Modo Estrada Offline
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                          <Wifi className="w-2.5 h-2.5 text-emerald-400" /> Sincronizado
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-300 mt-1">
                      {savedBiometricMember ? (
                        <>
                          Associado vinculado:{' '}
                          <strong className="text-white">
                            {savedBiometricMember.nome}{' '}
                            {savedBiometricMember.nomeGuerra && `(${savedBiometricMember.nomeGuerra})`}
                          </strong>
                        </>
                      ) : (
                        'Acesse sua Carteirinha Digital instantaneamente pelo sensor físico do seu celular.'
                      )}
                    </p>
                  </div>
                </div>

                {savedBiometricMember && (
                  <button
                    type="button"
                    onClick={() => {
                      removeBiometricMember();
                      setSavedBiometricMember(null);
                    }}
                    title="Desvincular este associado da biometria deste aparelho"
                    className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 transition text-[10px] shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Button: 1-Touch Biometric Login */}
              <button
                type="button"
                onClick={() => handleTriggerBiometric(savedBiometricMember?.cpf || loginAssociado, true)}
                disabled={biometricScanning}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-amber-400/50"
              >
                {renderBiometricIcon('w-4 h-4')}
                <span>
                  {savedBiometricMember
                    ? `Acessar Carteirinha com ${deviceInfo.label}`
                    : `Validar com ${deviceInfo.label} (Acesso Rápido)`}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-950/20 text-zinc-950 text-[10px] uppercase font-mono font-bold ml-1">
                  Offline OK
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 px-1">
                <span className="flex items-center gap-1 text-zinc-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  iOS (TouchID / FaceID) &bull; Android (Digital)
                </span>
                <button
                  type="button"
                  onClick={() => setForgotPasswordModalOpen(true)}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Esqueci minha senha?
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Context Banner */}
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                selectedRole === 'associado'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : selectedRole === 'diretoria'
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider block">
                  Autenticação: {selectedRole.toUpperCase()}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {selectedRole === 'administrador'
                    ? 'Perfil Administrador: acesso direto com somente a senha de segurança.'
                    : selectedRole === 'diretoria'
                    ? 'Perfil Diretoria: informe o usuário executivo e sua senha.'
                    : 'Perfil Associado: informe seu CPF/matrícula ou use a biometria nativa.'}
                </span>
              </div>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* BLOQUEIO RIGOROSO DE CPF DESLIGADO */}
            {blockedInfo && (
              <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-600 text-red-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-black text-sm uppercase">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                  ACESSO BLOQUEADO POR DESLIGAMENTO
                </div>
                <p>
                  O CPF <strong>{blockedInfo.cpf}</strong> pertencente a{' '}
                  <strong>{blockedInfo.nome}</strong> consta como{' '}
                  <span className="uppercase text-red-400 font-bold">DESLIGADO</span> do Moto Clube.
                </p>
                <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-red-900/50 font-mono text-[11px] text-zinc-300">
                  {blockedInfo.motivoDesligamento ||
                    'Desligamento compulsório registrado em ata pela diretoria executiva.'}
                </div>
              </div>
            )}

            {/* FIELDS: ASSOCIADO (Login + Senha) */}
            {selectedRole === 'associado' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      Login do Associado (CPF ou Matrícula) *
                    </span>
                    {deviceInfo.isAvailable && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        {renderBiometricIcon('w-3 h-3')}
                        Compatível com {deviceInfo.label}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={loginAssociado}
                    onChange={(e) => setLoginAssociado(e.target.value)}
                    placeholder="Ex: 123.456.789-00 ou MC-000001"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-semibold focus:border-amber-400 focus:outline-none transition-all placeholder:text-zinc-600 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Dica: Aceita número de CPF com ou sem pontos, ou código da carteirinha.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Senha do Associado *
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordModalOpen(true)}
                      className="text-[11px] text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {renderBiometricIcon('w-3 h-3')}
                      Esqueci a senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={senhaAssociado}
                      onChange={(e) => setSenhaAssociado(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full px-4 py-3 pr-11 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-semibold focus:border-amber-400 focus:outline-none transition-all placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Habilitar / Manter Biometria no Dispositivo */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 text-xs text-zinc-300 cursor-pointer hover:border-amber-500/40 transition">
                  <input
                    type="checkbox"
                    checked={rememberBiometric}
                    onChange={(e) => setRememberBiometric(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 text-[11px] leading-snug">
                    <span className="font-semibold text-zinc-200 block flex items-center gap-1.5">
                      {renderBiometricIcon('w-3.5 h-3.5 text-amber-400')}
                      Vincular Biometria {deviceInfo.label} ({deviceInfo.platformName})
                    </span>
                    <span className="text-zinc-400 block mt-0.5">
                      Salva credencial criptografada para acesso à carteirinha em 1-toque, mesmo sem conexão à internet.
                    </span>
                  </div>
                </label>

                {/* Banner Oficial: Criar Cadastro & Login de Associado */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      Não possui login ainda?
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Faça seu pedido de filiação com foto, moto e assinatura digital touch/mouse.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCadastroModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Criar Cadastro &amp; Login</span>
                  </button>
                </div>
              </>
            )}

            {/* FIELDS: DIRETORIA (Login + Senha) */}
            {selectedRole === 'diretoria' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-sky-400" />
                    Login / Usuário da Diretoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginDiretoria}
                    onChange={(e) => setLoginDiretoria(e.target.value)}
                    placeholder="DIRETORIA"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-semibold uppercase focus:border-sky-400 focus:outline-none transition-all placeholder:text-zinc-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    Senha da Diretoria *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={senhaDiretoria}
                      onChange={(e) => setSenhaDiretoria(e.target.value)}
                      placeholder="Senha da diretoria"
                      className="w-full px-4 py-3 pr-11 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-semibold focus:border-sky-400 focus:outline-none transition-all placeholder:text-zinc-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* FIELDS: ADMINISTRADOR (SOMENTE A SENHA) */}
            {selectedRole === 'administrador' && (
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <KeyRound className="w-4 h-4" />
                    Senha Mestra do Administrador *
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-300/80 uppercase">
                    (Sem necessidade de login)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={senhaAdmin}
                    onChange={(e) => setSenhaAdmin(e.target.value)}
                    placeholder="Digite a senha mestra de administrador"
                    className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-zinc-950 border border-emerald-500/50 text-zinc-100 text-sm font-mono tracking-wider focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all placeholder:text-zinc-600 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                selectedRole === 'associado'
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/25'
                  : selectedRole === 'diretoria'
                  ? 'bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/25'
              }`}
            >
              {loading ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <span>Confirmar e Acessar Módulos</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer & Dinastia System Brand */}
        <div className="space-y-3">
          <div className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Biometria TouchID/FaceID &amp; Android &bull; Criptografia de Ponta a Ponta &bull; Modo Offline</span>
          </div>

          {/* Marca Dinastia System no rodapé */}
          <DinastiaBrandBadge variant="footer" />
        </div>
      </div>

      {/* OVERLAY ANIMADO DE LEITURA BIOMÉTRICA (TOUCHID / FACEID / ANDROID FINGERPRINT) */}
      <AnimatePresence>
        {biometricScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-amber-500/50 p-6 text-center space-y-4 shadow-2xl relative overflow-hidden"
            >
              {/* Top Platform & Security Badge */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  {deviceInfo.type === 'faceId' ? <Apple className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                  {deviceInfo.platformName} &bull; {deviceInfo.label}
                </span>
                {isOfflineAuth || !isOnline ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <WifiOff className="w-2.5 h-2.5" /> Offline
                  </span>
                ) : null}
              </div>

              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                {/* Specific Visual: Face ID Target Frame vs Fingerprint Wave */}
                {deviceInfo.type === 'faceId' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Corner Brackets for Face ID */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />
                    {/* Laser Scanning Line */}
                    {!biometricSuccess && (
                      <motion.div
                        animate={{ top: ['15%', '85%', '15%'] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                        className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b]"
                      />
                    )}
                  </div>
                ) : (
                  /* Animated Scanner Glow Ring for Fingerprint */
                  <motion.div
                    animate={{
                      scale: biometricSuccess ? [1, 1.1, 1] : [1, 1.15, 1],
                      rotate: biometricSuccess ? 0 : [0, 180, 360],
                    }}
                    transition={{
                      repeat: biometricSuccess ? 0 : Infinity,
                      duration: 2,
                      ease: 'easeInOut',
                    }}
                    className={`absolute inset-0 rounded-full border-2 border-dashed ${
                      biometricSuccess ? 'border-emerald-400' : 'border-amber-500/60'
                    }`}
                  />
                )}

                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                    biometricSuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)]'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse'
                  }`}
                >
                  {biometricSuccess ? (
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  ) : (
                    renderBiometricIcon('w-10 h-10')
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {biometricSuccess
                    ? 'Identidade Confirmada com Sucesso!'
                    : `Autenticando via ${deviceInfo.label}...`}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {biometricSuccess ? (
                    <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {isOfflineAuth
                        ? 'Chave local validada! Abrindo Carteirinha Digital Offline...'
                        : 'Abrindo Carteirinha Oficial do Associado...'}
                    </span>
                  ) : deviceInfo.type === 'faceId' ? (
                    'Posicione seu rosto em frente à câmera do iPhone para validar seu Face ID.'
                  ) : deviceInfo.type === 'touchId' ? (
                    'Toque com seu dedo no sensor Touch ID para confirmar sua identidade.'
                  ) : (
                    'Toque no sensor de impressão digital do seu smartphone Android.'
                  )}
                </p>
              </div>

              {!biometricSuccess && (
                <button
                  type="button"
                  onClick={() => setBiometricScanning(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL ESQUECI MINHA SENHA: ACESSO À CARTEIRINHA COM BIOMETRIA NATIVA */}
      <AnimatePresence>
        {forgotPasswordModalOpen && (
          <div
            onClick={() => setForgotPasswordModalOpen(false)}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-md bg-zinc-900 border-t border-amber-500/50 sm:border sm:border-amber-500/50 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 text-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl max-h-[90vh] overflow-y-auto pb-safe pb-6 sm:pb-6"
            >
              {/* Mobile Drag / Touch Handle */}
              <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mb-3.5 sm:hidden" />

              <button
                type="button"
                onClick={() => setForgotPasswordModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pb-3 border-b border-zinc-800">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
                  {renderBiometricIcon('w-7 h-7')}
                </div>
                <h3 className="text-base font-bold text-zinc-100 font-heading">
                  Acesso à Carteirinha sem Senha
                </h3>
                <p className="text-xs text-zinc-400">
                  Esqueceu sua senha? Valide sua identidade com o {deviceInfo.label} do seu celular.
                </p>
              </div>

              <div className="py-4 space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  <p className="font-bold mb-0.5">Segurança Biométrica do Associado:</p>
                  <p className="text-[11px] text-zinc-300">
                    O sensor físico do seu dispositivo (Touch ID/Face ID no iOS ou Impressão Digital no Android) libera o acesso imediato à sua carteirinha e dados de emergência mesmo se você tiver esquecido os 6 dígitos da sua senha.
                  </p>
                </div>

                {forgotPasswordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{forgotPasswordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Confirme seu CPF ou Código do Associado *
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotPasswordCpf || loginAssociado}
                    onChange={(e) => setForgotPasswordCpf(e.target.value)}
                    placeholder="Ex: 123.456.789-00 ou MC-000001"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Aceita qualquer associado cadastrado no sistema do moto clube.
                  </span>
                </div>

                {/* Quick pre-fill for demo */}
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                    Atalho para teste:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordCpf('123.456.789-00')}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-amber-300 hover:bg-zinc-700"
                    >
                      Roberto (Presidente)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordCpf('789.456.123-00')}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-sky-300 hover:bg-zinc-700"
                    >
                      Carlos (Próspero)
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setForgotPasswordError(null);
                      const cpfInput = forgotPasswordCpf.trim() || loginAssociado.trim();
                      if (!cpfInput) {
                        setForgotPasswordError('Por favor, informe seu CPF.');
                        return;
                      }
                      setForgotPasswordModalOpen(false);
                      handleTriggerBiometric(cpfInput, true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {renderBiometricIcon('w-4 h-4')}
                    <span>Ler {deviceInfo.label} &amp; Acessar Carteirinha</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Sequencial e Intuitivo de Criar Cadastro & Login (Filiação com Assinatura Digital Touch/Mouse) */}
      <CadastroAssociadoWizard
        config={config}
        isOpen={cadastroModalOpen}
        onClose={() => setCadastroModalOpen(false)}
        onSuccess={(novoAssoc) => {
          setLoginAssociado(novoAssoc.cpf);
          if (novoAssoc.senha) {
            setSenhaAssociado(novoAssoc.senha);
          }
        }}
      />
    </div>
  );
};
