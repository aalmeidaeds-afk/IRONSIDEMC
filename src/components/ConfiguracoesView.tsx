import React, { useState, useRef } from 'react';
import { ConfiguracaoClube, AuditoriaLog } from '../types';
import {
  Settings,
  Shield,
  Save,
  CheckCircle,
  FileText,
  Clock,
  User,
  AlertTriangle,
  Award,
  BarChart3,
  Server,
  Sparkles,
  RefreshCw,
  Monitor,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  Palette,
  Camera,
  Image as ImageIcon,
  Play,
  Apple,
  Store,
  Upload,
  Wrench,
  Layers,
  KeyRound,
  RotateCcw,
  Database,
  Zap,
  Type,
  HelpCircle,
  FileCode2,
  Trash2,
} from 'lucide-react';
import { AuditoriaAnalyticsPanel } from './AuditoriaAnalyticsPanel';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { useAuth } from '../context/AuthContext';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { GaleriaLogoModal } from './GaleriaLogoModal';
import { AVAILABLE_FONTS, FONT_SCALE_OPTIONS, applyGlobalFont } from '../utils/fontLoader';
import { PainelControleModulos } from './PainelControleModulos';
import { AdminExecutiveControlCenter } from './AdminExecutiveControlCenter';
import { PainelSenhasAssociados } from './PainelSenhasAssociados';
import { PainelDiagnosticoCorrecoes } from './PainelDiagnosticoCorrecoes';
import { PainelBackupContingencia } from './PainelBackupContingencia';
import { SistemaArquivamentoFalhasCorrecoes } from './SistemaArquivamentoFalhasCorrecoes';
import { DispararBackupFirestoreModal } from './DispararBackupFirestoreModal';
import { AdminQuickActionHub } from './AdminQuickActionHub';
import { ModalResetBancoDados } from './ModalResetBancoDados';
import { ManualAjudaUsuarioModal } from './ManualAjudaUsuarioModal';
import { ManualProgramacaoAdminModal } from './ManualProgramacaoAdminModal';
import { processUniversalImageFile } from '../utils/imageUploadHelper';
import {
  Associado,
  UserRole,
  Veiculo,
  Manutencao,
  Abastecimento,
  Evento,
  Mensalidade,
  Comunicado,
  ParceiroServico,
} from '../types';

interface Props {
  config: ConfiguracaoClube;
  auditoriaLogs: AuditoriaLog[];
  associados?: Associado[];
  veiculos?: Veiculo[];
  manutencoes?: Manutencao[];
  abastecimentos?: Abastecimento[];
  eventos?: Evento[];
  mensalidades?: Mensalidade[];
  comunicados?: Comunicado[];
  prestadores?: ParceiroServico[];
  onSaveConfig: (data: Partial<ConfiguracaoClube>) => Promise<void>;
  onUpdateAssociadoSenha?: (associadoId: string, novaSenha: string) => Promise<void>;
  onApproveAssociado?: (associadoId: string) => Promise<void>;
  onReloadAssociados?: () => Promise<void>;
  onOpenDeploymentModal?: () => void;
  onTestRole?: (role: UserRole) => void;
}

export const ConfiguracoesView: React.FC<Props> = ({
  config,
  auditoriaLogs,
  associados = [],
  veiculos = [],
  manutencoes = [],
  abastecimentos = [],
  eventos = [],
  mensalidades = [],
  comunicados = [],
  prestadores = [],
  onSaveConfig,
  onUpdateAssociadoSenha,
  onApproveAssociado,
  onReloadAssociados,
  onOpenDeploymentModal,
  onTestRole,
}) => {
  const {
    currentVersion,
    latestVersion,
    hasUpdate,
    checking,
    lastChecked,
    checkForUpdates,
    applyUpdate,
    simulateUpdateNotification,
  } = useVersionCheck();
  const { activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState<
    | 'centro_comando'
    | 'controle_modulos'
    | 'senhas_associados'
    | 'diagnostico_sistema'
    | 'backup_contingencia'
    | 'tipografia_fontes'
    | 'config'
    | 'painel_auditoria'
    | 'auditoria'
    | 'versao_publicacao'
  >('centro_comando');
  const [simulatedUpdateAlert, setSimulatedUpdateAlert] = useState(false);
  const [form, setForm] = useState({
    nomeClube: config.nomeClube,
    lema: config.lema,
    anoFundacao: config.anoFundacao,
    logotipoUrl: config.logotipoUrl,
    telefoneContato: config.telefoneContato,
    whatsappContato: config.whatsappContato,
    emailContato: config.emailContato,
    cidadeSede: config.cidadeSede,
    estadoSede: config.estadoSede,
    chavePix: config.chavePix,
    tipoChavePix: config.tipoChavePix,
    valorMensalidadePadrao: config.valorMensalidadePadrao,
    diaVencimentoPadrao: config.diaVencimentoPadrao,
    fonteFamilia: config.fonteFamilia || 'Inter',
    fonteTamanhoEscala: (config.fonteTamanhoEscala || 'md') as 'sm' | 'md' | 'lg' | 'xl' | '2xl',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSuccessToast, setLogoSuccessToast] = useState<string | null>(null);
  const [backupFirestoreModalOpen, setBackupFirestoreModalOpen] = useState(false);
  const [quickActionHubOpen, setQuickActionHubOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [manualAjudaOpen, setManualAjudaOpen] = useState(false);
  const [manualProgramacaoOpen, setManualProgramacaoOpen] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTriggerLogoUpload = () => {
    logoFileInputRef.current?.click();
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const result = await processUniversalImageFile(file);
      setForm((prev) => ({ ...prev, logotipoUrl: result.dataUrl }));
      await onSaveConfig({ logotipoUrl: result.dataUrl });
      setLogoSuccessToast(`Logotipo oficial "${result.fileName}" atualizado com sucesso (${result.format})!`);
      setTimeout(() => setLogoSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Erro ao ler imagem:', err);
      alert(err.message || 'Erro ao carregar o arquivo de imagem.');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleRestaurarLogoPadrao = async () => {
    const padrao = '/ironside-logo.svg';
    setForm((prev) => ({ ...prev, logotipoUrl: padrao }));
    await onSaveConfig({ logotipoUrl: padrao });
    setLogoSuccessToast('Logotipo restaurado para a arte padrão oficial!');
    setTimeout(() => setLogoSuccessToast(null), 3000);
  };

  const handleSelectLogoFromGallery = async (url: string) => {
    setForm((prev) => ({ ...prev, logotipoUrl: url }));
    await onSaveConfig({ logotipoUrl: url });
    setLogoSuccessToast('Logotipo atualizado a partir da galeria!');
    setTimeout(() => setLogoSuccessToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveConfig(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
            Configurações Institucionais & Auditoria
          </h2>
          <p className="text-xs text-zinc-400">
            Painel restrito de personalização do clube, parâmetros financeiros e trilha de segurança.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setActiveTab('centro_comando')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'centro_comando'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]'
                  : 'bg-zinc-900 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Centro de Comando Master</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-950 text-emerald-400 border border-emerald-500/30">
                Executivo
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('controle_modulos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'controle_modulos'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Controle Geral de Módulos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('senhas_associados')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'senhas_associados'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Senhas dos Associados ({associados.length})
          </button>
          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setActiveTab('diagnostico_sistema')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'diagnostico_sistema'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Arquivamento de Falhas &amp; Correções
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-950 text-emerald-400 border border-emerald-500/30">
                Laudo PDF
              </span>
            </button>
          )}
          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setActiveTab('backup_contingencia')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'backup_contingencia'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-500/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Backup &amp; Contingência
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-950 text-purple-400 border border-purple-500/30">
                JSON/CSV
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('tipografia_fontes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'tipografia_fontes'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/50'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Tipografia &amp; Fontes
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-950 text-violet-400 border border-violet-500/30">
              Web Fonts
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Dados do Moto Clube
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('painel_auditoria')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'painel_auditoria'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Painel de Auditoria (30 dias)
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                activeTab === 'painel_auditoria'
                  ? 'bg-zinc-950 text-amber-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              Recharts
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auditoria')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'auditoria'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Trilha de Auditoria ({auditoriaLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('versao_publicacao')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'versao_publicacao'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-300 hover:text-amber-400 border border-zinc-800'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            Lojas (Play &amp; App Store) &amp; Hostinger
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-950 text-amber-300 border border-amber-500/30">
              v{currentVersion}
            </span>
          </button>
          <button
            type="button"
            onClick={handleTriggerLogoUpload}
            disabled={logoUploading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 shadow-sm"
            title="Trocar Logotipo pesquisando no PC (Windows) ou Galeria do Celular"
          >
            <Upload className={`w-3.5 h-3.5 text-amber-400 ${logoUploading ? 'animate-bounce' : ''}`} />
            <span>{logoUploading ? 'Carregando...' : 'Trocar Logotipo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setManualAjudaOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 shadow-sm cursor-pointer"
            title="Central de Ajuda & Guia Ilustrado de Todas as Telas"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guia de Telas (Ajuda)</span>
          </button>

          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setManualProgramacaoOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 shadow-sm cursor-pointer"
              title="Manual Técnico de Configuração & Programação (Exclusivo Administrador)"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manual Programação</span>
            </button>
          )}

          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-2 border-red-400 shadow-lg shadow-red-600/40 cursor-pointer active:scale-95 animate-pulse"
              title="Ação Destrutiva: Limpar banco de dados integralmente para iniciar operações oficiais"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>RESET GERAL DO BANCO DE DADOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input para Troca Universal de Logotipo */}
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.svg,.webp,.bmp,.gif,.ico,.tiff,.heic"
        onChange={handleLogoFileChange}
        className="hidden"
      />

      {/* Toast de Sucesso do Logotipo */}
      {logoSuccessToast && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{logoSuccessToast}</span>
        </div>
      )}

      {/* ABA 0: CENTRO DE COMANDO EXECUTIVO DO ADMINISTRADOR (BENCHMARK DE MERCADO) */}
      {activeTab === 'centro_comando' && (
        <AdminExecutiveControlCenter
          config={config}
          associados={associados}
          veiculos={veiculos}
          manutencoes={manutencoes}
          abastecimentos={abastecimentos}
          eventos={eventos}
          mensalidades={mensalidades}
          comunicados={comunicados}
          prestadores={prestadores}
          auditoriaLogs={auditoriaLogs}
          onSaveConfig={onSaveConfig}
          onTestRole={onTestRole}
          onNavigateTab={(tabId) => setActiveTab(tabId as any)}
          onOpenBackupModal={() => setBackupFirestoreModalOpen(true)}
          onOpenQuickActionHub={() => setQuickActionHubOpen(true)}
          onOpenResetModal={() => setResetModalOpen(true)}
          onOpenManualProgramacao={() => setManualProgramacaoOpen(true)}
          onOpenManualAjuda={() => setManualAjudaOpen(true)}
        />
      )}

      {/* ABA 1: PAINEL DE CONTROLE GERAL DE MÓDULOS (HABILITAR / DESABILITAR) */}
      {activeTab === 'controle_modulos' && (
        <PainelControleModulos
          config={config}
          onSaveConfig={onSaveConfig}
          onTestRole={onTestRole}
        />
      )}

      {/* ABA 2: GESTÃO CENTRAL DE SENHAS DOS ASSOCIADOS */}
      {activeTab === 'senhas_associados' && (
        <PainelSenhasAssociados
          associados={associados}
          onUpdateSenha={onUpdateAssociadoSenha || (async () => {})}
          onReload={onReloadAssociados}
        />
      )}

      {/* ABA 3: SISTEMA DE ARQUIVAMENTO DE FALHAS CRÍTICAS & CORREÇÕES VALIDADAS (EXCLUSIVO ADMINISTRADOR) */}
      {activeTab === 'diagnostico_sistema' && (
        <SistemaArquivamentoFalhasCorrecoes
          config={config}
          currentVersion={currentVersion}
        />
      )}

      {/* ABA 4: BACKUP COMPLETO & CONTINGÊNCIA (EXCLUSIVO ADMINISTRADOR) */}
      {activeTab === 'backup_contingencia' && (
        <PainelBackupContingencia
          associados={associados}
          veiculos={veiculos}
          manutencoes={manutencoes}
          abastecimentos={abastecimentos}
          eventos={eventos}
          mensalidades={mensalidades}
          comunicados={comunicados}
          prestadores={prestadores}
          auditoriaLogs={auditoriaLogs}
          config={config}
          onRestoreSuccess={onReloadAssociados}
        />
      )}

      {/* ABA TIPOGRAFIA & FONTES GLOBAIS DO APLICATIVO */}
      {activeTab === 'tipografia_fontes' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-violet-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                  <Type className="w-5 h-5 text-violet-400" />
                  Biblioteca de Fontes Online &amp; Escala de Tamanho
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Personalize a família tipográfica (Google Fonts) e a escala de tamanho para todo o sistema sem precisar de novo deploy.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await onSaveConfig({
                    fonteFamilia: form.fonteFamilia,
                    fonteTamanhoEscala: form.fonteTamanhoEscala,
                  });
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 3000);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                Salvar Tipografia Oficial
              </button>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Tipografia salva e aplicada instantaneamente a todo o aplicativo!
              </div>
            )}

            {/* SELETOR DE TAMANHO DA FONTE */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  1. Escala de Tamanho da Letra no Aplicativo
                </span>
                <span className="text-[11px] text-zinc-400">
                  Escala atual: <strong className="text-amber-300 font-mono">{form.fonteTamanhoEscala} ({FONT_SCALE_OPTIONS.find((s) => s.id === form.fonteTamanhoEscala)?.scalePercent})</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {FONT_SCALE_OPTIONS.map((scale) => {
                  const isSelected = form.fonteTamanhoEscala === scale.id;
                  return (
                    <button
                      key={scale.id}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, fonteTamanhoEscala: scale.id }));
                        applyGlobalFont(form.fonteFamilia, scale.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/15'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{scale.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400">
                          {scale.scalePercent}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 leading-tight">
                        {scale.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELETOR DE FAMÍLIA TIPOGRÁFICA (GOOGLE FONTS) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  2. Biblioteca de Fontes Online (Google Fonts)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Fonte ativa: <strong className="text-violet-300 font-bold">{form.fonteFamilia}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_FONTS.map((font) => {
                  const isSelected = form.fonteFamilia === font.id;
                  return (
                    <div
                      key={font.id}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, fonteFamilia: font.id }));
                        applyGlobalFont(font.id, form.fonteTamanhoEscala);
                      }}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                        isSelected
                          ? 'bg-violet-950/40 border-violet-500 shadow-lg shadow-violet-500/20 ring-1 ring-violet-500'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
                            {font.name}
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-violet-400 inline" />
                            )}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                            {font.category}
                          </span>
                        </div>

                        <div className="p-3 my-2 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-center">
                          <p
                            className="text-base sm:text-lg font-bold text-amber-300 tracking-wide"
                            style={{ fontFamily: font.cssFamily }}
                          >
                            {font.previewText}
                          </p>
                          <p
                            className="text-xs text-zinc-400 mt-1"
                            style={{ fontFamily: font.cssFamily }}
                          >
                            1234567890 • Velocidade, Respeito e Estrada
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                        <span className="line-clamp-1">{font.description}</span>
                        <span className={`text-[10px] font-bold shrink-0 ml-2 ${isSelected ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                          {isSelected ? '✓ Ativa' : 'Selecionar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PREVIEW EM TEMPO REAL DO SISTEMA */}
            <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Demonstração em Tempo Real na Interface:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Título / Cabeçalho</span>
                  <h4 className="text-base font-extrabold text-amber-400 mt-0.5">
                    {config.nomeClube}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    "{config.lema}"
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Cartão de Associado</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-zinc-200">Carlos "Trovão"</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">MC-000108</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-1">Capitão de Estrada • O+</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Telemetria &amp; Mensalidade</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-zinc-300">Outubro/2026</span>
                    <span className="text-sm font-black text-amber-300">R$ 85,00</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 block mt-1">✓ Quitado via PIX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {savedSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Configurações do Moto Clube atualizadas com sucesso e sincronizadas com o Firestore!
            </div>
          )}

          {/* Section 1: Identidade */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4" />
              Identidade Visual & Institucional
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="lg:col-span-2">
                <label className="block text-zinc-400 mb-1">Nome Oficial do Moto Clube *</label>
                <input
                  type="text"
                  required
                  value={form.nomeClube}
                  onChange={(e) => setForm({ ...form, nomeClube: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Ano de Fundação</label>
                <input
                  type="text"
                  value={form.anoFundacao}
                  onChange={(e) => setForm({ ...form, anoFundacao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">Lema / Juramento de Estrada</label>
                <input
                  type="text"
                  value={form.lema}
                  onChange={(e) => setForm({ ...form, lema: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 italic focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-amber-500/60 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xl shadow-amber-500/10">
                      <img
                        src={form.logotipoUrl || '/ironside-logo.svg'}
                        alt="Logotipo Oficial Atual"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block text-zinc-200 font-extrabold text-sm">
                          Logotipo / Brasão Oficial do Clube
                        </label>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Todo o App
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Atualiza instantaneamente no cabeçalho, carteirinha digital, tela de login e relatórios em PDF.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleTriggerLogoUpload}
                      disabled={logoUploading}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                      title="Selecionar arquivo de imagem do computador ou galeria do celular"
                    >
                      <Upload className={`w-4 h-4 ${logoUploading ? 'animate-bounce' : ''}`} />
                      <span>{logoUploading ? 'Processando...' : 'Trocar Logotipo (PC / Celular)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLogoModalOpen(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition"
                      title="Abrir Galeria de Logotipos e Artes do Clube"
                    >
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>Artes Oficiais</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestaurarLogoPadrao}
                      className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                      title="Restaurar logotipo padrão original"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2.5">
                  <Monitor className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-zinc-300">Suporte Universal de Imagem:</strong> Pesquise na Área de Trabalho ou em qualquer pasta do Windows, ou abra diretamente a Galeria de Fotos / Câmera no celular Android ou iPhone. Compatível com todas as extensões: <span className="text-amber-300 font-mono">.PNG, .JPG, .JPEG, .SVG, .WEBP, .BMP, .GIF, .ICO, .TIFF, .HEIC</span>.
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="block text-[11px] text-zinc-400 mb-1">Ou cole uma URL direta de imagem da internet:</label>
                  <input
                    type="url"
                    value={form.logotipoUrl}
                    onChange={(e) => setForm({ ...form, logotipoUrl: e.target.value })}
                    placeholder="https://exemplo.com/brasao.png"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contato e Sede */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sede Central & Canais Oficiais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Telefone Fixo / Sede</label>
                <input
                  type="text"
                  value={form.telefoneContato}
                  onChange={(e) => setForm({ ...form, telefoneContato: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">WhatsApp Oficial do Clube</label>
                <input
                  type="text"
                  value={form.whatsappContato}
                  onChange={(e) => setForm({ ...form, whatsappContato: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  value={form.emailContato}
                  onChange={(e) => setForm({ ...form, emailContato: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Cidade Sede</label>
                <input
                  type="text"
                  value={form.cidadeSede}
                  onChange={(e) => setForm({ ...form, cidadeSede: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={form.estadoSede}
                  onChange={(e) => setForm({ ...form, estadoSede: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financeiro & PIX */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              Parâmetros Financeiros & PIX
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">Chave PIX da Tesouraria *</label>
                <input
                  type="text"
                  required
                  value={form.chavePix}
                  onChange={(e) => setForm({ ...form, chavePix: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Tipo de Chave PIX</label>
                <select
                  value={form.tipoChavePix}
                  onChange={(e) => setForm({ ...form, tipoChavePix: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                >
                  <option value="E-mail">E-mail</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Aleatória">Chave Aleatória (EVP)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Valor da Mensalidade Padrão (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valorMensalidadePadrao}
                  onChange={(e) => setForm({ ...form, valorMensalidadePadrao: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Tipografia & Identidade Visual do Sistema */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-4 h-4" />
                Tipografia &amp; Escala de Letra de Todo o Aplicativo
              </h3>
              <span className="text-[11px] text-zinc-400">
                Fonte: <strong className="text-violet-300 font-bold">{form.fonteFamilia}</strong> • Escala: <strong className="text-amber-300 font-mono">{form.fonteTamanhoEscala}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Fonte da Letra (Google Fonts Online)</label>
                <select
                  value={form.fonteFamilia}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, fonteFamilia: val });
                    applyGlobalFont(val, form.fonteTamanhoEscala);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.category}) - {f.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tamanho da Letra do Sistema</label>
                <select
                  value={form.fonteTamanhoEscala}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setForm({ ...form, fonteTamanhoEscala: val });
                    applyGlobalFont(form.fonteFamilia, val);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                >
                  {FONT_SCALE_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.scalePercent}) - {s.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações Globais
            </button>
          </div>
        </form>
      )}

      {/* NOVO PAINEL ANALÍTICO DE AUDITORIA (ÚLTIMOS 30 DIAS - RECHARTS) */}
      {activeTab === 'painel_auditoria' && (
        <AuditoriaAnalyticsPanel logs={auditoriaLogs} config={config} />
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Registro Imutável de Auditoria:</strong> Todas as alterações de papel, aprovações de novos membros, emissões financeiras e exclusões são gravadas permanentemente na coleção <code>/auditoria</code> protegida pelas regras do Firestore.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBackupFirestoreModalOpen(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                title="Disparar backup completo de todas as coleções do Cloud Firestore para JSON"
              >
                <Database className="w-3.5 h-3.5" />
                Disparar Backup Firestore (JSON)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('painel_auditoria')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Ver Gráficos (30 dias)
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Autor</th>
                    <th className="py-3 px-4">Ação</th>
                    <th className="py-3 px-4">Alvo</th>
                    <th className="py-3 px-4">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {auditoriaLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        Nenhum registro de auditoria registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    auditoriaLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-200">
                          {log.autorEmail}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-400">
                          {log.acao}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">{log.alvo}</td>
                        <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                          {log.detalhes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Versão do Sistema & Publicação Hostinger */}
      {activeTab === 'versao_publicacao' && (
        <div className="space-y-6">
          {/* Card de Status da Versão */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-100">Versão do Sistema Iron Side</h3>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-500 text-zinc-950 uppercase tracking-wider">
                      v{currentVersion}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Status no Navegador e Celulares:</span>
                {hasUpdate ? (
                  <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Nova versão disponível no servidor (v{latestVersion})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sistema 100% Atualizado
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={checkForUpdates}
                disabled={checking}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Verificando...' : 'Verificar Atualizações'}
              </button>

              <button
                type="button"
                onClick={() => {
                  simulateUpdateNotification('1.2.1');
                  setSimulatedUpdateAlert(true);
                  setTimeout(() => setSimulatedUpdateAlert(false), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {simulatedUpdateAlert ? 'Aviso Ativado no Topo!' : 'Testar Notificação'}
              </button>

              {activeRole === 'administrador' ? (
                onOpenDeploymentModal && (
                  <button
                    type="button"
                    onClick={onOpenDeploymentModal}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    Módulo 13: Central Lojas (Play &amp; App Store) &amp; Hostinger
                  </button>
                )
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-500/60" />
                  <span>Módulo 13: Exclusivo Administrador</span>
                </div>
              )}
            </div>
          </div>

          {/* Cards de Atalhos e Guias Oficiais de Publicação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100">1. Google Play Store (TWA)</h4>
              <p className="text-xs text-zinc-400">
                TWA nativo sem barra de URL via <code>.well-known/assetlinks.json</code>. Compilação de <code>.aab</code> via Bubblewrap ou PWABuilder.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-emerald-300 bg-zinc-950 px-2 py-1 rounded block">
                  /.well-known/assetlinks.json
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-sky-500/30 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Apple className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100">2. Apple App Store (iOS)</h4>
              <p className="text-xs text-zinc-400">
                Empacotamento nativo em Swift e WKWebView. Aprovado na Guideline 4.2 com cache offline, câmera de CRLV e permissões no Info.plist.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-sky-300 bg-zinc-950 px-2 py-1 rounded block">
                  Xcode Workspace &bull; Swift 5
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/30 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100">3. Hospedagem Hostinger</h4>
              <p className="text-xs text-zinc-400">
                Caminho: <code>public_html/</code> no hPanel. Suporte nativo a Apache, <code>.htaccess</code>, SSL grátis e instalador Windows (.exe).
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-amber-300 bg-zinc-950 px-2 py-1 rounded block">
                  npm run build ➔ Enviar dist/
                </span>
              </div>
            </div>
          </div>

          {/* Como Funciona a Condição de Atualização */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs text-zinc-300">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Condição de Atualização Automática a Cada Modificação
            </h4>
            <p>
              Toda vez que você realizar qualquer alteração no sistema (código, novas telas, correções ou visual):
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>Incremente a versão no arquivo <code>public/version.json</code> (ex: 1.2.0 para 1.2.1);</li>
              <li>Execute <code>npm run build</code> para gerar o novo pacote compilado;</li>
              <li>Envie os arquivos da pasta <code>dist/</code> para a pasta <code>public_html/</code> da Hostinger;</li>
              <li>O sistema e o Service Worker detectarão imediatamente a alteração graças ao cabeçalho <code>no-cache</code> do <code>.htaccess</code>;</li>
              <li>Todos os celulares e computadores conectados exibirão o aviso no topo e se atualizarão com um toque, sem perda de dados!</li>
            </ol>
          </div>
        </div>
      )}

      {/* Modal de Galeria de Logotipos / Artes */}
      <GaleriaLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogoUrl={form.logotipoUrl}
        onSelectLogo={handleSelectLogoFromGallery}
      />

      {/* Modal de Disparo de Backup Completo do Cloud Firestore */}
      <DispararBackupFirestoreModal
        isOpen={backupFirestoreModalOpen}
        onClose={() => setBackupFirestoreModalOpen(false)}
      />

      {/* Quick Action Hub (Command Palette: Ctrl+K) */}
      <AdminQuickActionHub
        isOpen={quickActionHubOpen}
        onClose={() => setQuickActionHubOpen(false)}
        config={config}
        associados={associados}
        auditoriaLogs={auditoriaLogs}
        onTriggerBackup={() => setBackupFirestoreModalOpen(true)}
        onTriggerUploadLogo={handleTriggerLogoUpload}
        onApproveAllPending={
          onApproveAssociado
            ? async () => {
                const pendentes = associados.filter((a) => a.status === 'pendente' || a.status === 'em_analise');
                for (const p of pendentes) {
                  await onApproveAssociado(p.id);
                }
              }
            : undefined
        }
        onNavigateTab={(tabId) => setActiveTab(tabId as any)}
        onTestRole={onTestRole}
        onReloadData={onReloadAssociados}
      />

      {/* Modal de Reset do Banco de Dados para Início das Operações */}
      <ModalResetBancoDados
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onSuccess={() => {
          if (onReloadAssociados) {
            onReloadAssociados();
          }
        }}
      />

      {/* Modal Central de Ajuda & Guia Ilustrado de Telas */}
      <ManualAjudaUsuarioModal
        isOpen={manualAjudaOpen}
        onClose={() => setManualAjudaOpen(false)}
        config={config}
      />

      {/* Modal Manual de Programação e Arquitetura Técnica (Admin) */}
      <ManualProgramacaoAdminModal
        isOpen={manualProgramacaoOpen}
        onClose={() => setManualProgramacaoOpen(false)}
        config={config}
      />

      {/* Marca Dinastia System no rodapé de Configurações & Auditoria */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
