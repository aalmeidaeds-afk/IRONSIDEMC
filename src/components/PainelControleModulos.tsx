import React, { useState } from 'react';
import {
  Shield,
  Layers,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  CheckCircle2,
  Lock,
  UserCheck,
  Users,
  Search,
  RotateCcw,
  Zap,
  Smartphone,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ConfiguracaoClube, UserRole, ModuloVisibilidadePermissao } from '../types';
import {
  LISTA_MODULOS_SISTEMA,
  DEFAULT_MODULOS_VISIBILIDADE,
  ModuloInfo,
} from '../utils/moduleVisibility';

interface Props {
  config: ConfiguracaoClube;
  onSaveConfig: (data: Partial<ConfiguracaoClube>) => Promise<void>;
  onTestRole?: (role: UserRole) => void;
}

export const PainelControleModulos: React.FC<Props> = ({
  config,
  onSaveConfig,
  onTestRole,
}) => {
  // Inicia estado com as permissões atuais ou defaults
  const [visibilidade, setVisibilidade] = useState<Record<string, ModuloVisibilidadePermissao>>(() => {
    const current = config.modulosVisibilidade || {};
    const merged: Record<string, ModuloVisibilidadePermissao> = {};

    LISTA_MODULOS_SISTEMA.forEach((mod) => {
      merged[mod.id] = {
        associado:
          current[mod.id]?.associado !== undefined
            ? current[mod.id].associado
            : mod.defaultAssociado,
        diretoria:
          current[mod.id]?.diretoria !== undefined
            ? current[mod.id].diretoria
            : mod.defaultDiretoria,
      };
    });

    return merged;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testModalInfo, setTestModalInfo] = useState<{
    moduleId: string;
    title: string;
    associadoVisible: boolean;
    diretoriaVisible: boolean;
  } | null>(null);

  // Toggle individual
  const togglePermission = (moduleId: string, roleKey: 'associado' | 'diretoria') => {
    setVisibilidade((prev) => ({
      ...prev,
      [moduleId]: {
        associado: prev[moduleId]?.associado ?? true,
        diretoria: prev[moduleId]?.diretoria ?? true,
        [roleKey]: !prev[moduleId]?.[roleKey],
      },
    }));
  };

  // Preenchimentos Rápidos
  const handleEnableAll = () => {
    const updated: Record<string, ModuloVisibilidadePermissao> = {};
    LISTA_MODULOS_SISTEMA.forEach((m) => {
      updated[m.id] = {
        associado: !m.adminOnly,
        diretoria: !m.adminOnly,
      };
    });
    setVisibilidade(updated);
  };

  const handleRestoreDefaults = () => {
    const updated: Record<string, ModuloVisibilidadePermissao> = {};
    LISTA_MODULOS_SISTEMA.forEach((m) => {
      updated[m.id] = {
        associado: m.defaultAssociado,
        diretoria: m.defaultDiretoria,
      };
    });
    setVisibilidade(updated);
  };

  const handleSetRoadEssentialMode = () => {
    // Modo Estrada: Apenas Carteirinha, SOS, Veículos e Mural ativos para associados
    const roadEssential = ['carteirinha', 'sos', 'veiculos', 'comunicados'];
    const updated: Record<string, ModuloVisibilidadePermissao> = {};
    LISTA_MODULOS_SISTEMA.forEach((m) => {
      updated[m.id] = {
        associado: roadEssential.includes(m.id),
        diretoria: !m.adminOnly,
      };
    });
    setVisibilidade(updated);
  };

  // Salvar no Firebase / Config
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveConfig({
        modulosVisibilidade: visibilidade,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao salvar permissões de módulos:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredModulos = LISTA_MODULOS_SISTEMA.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.subtitle.toLowerCase().includes(q) ||
      m.number.includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  const totalModulos = LISTA_MODULOS_SISTEMA.length;
  const totalAssociadoAtivos = Object.values(visibilidade).filter((v) => v.associado).length;
  const totalDiretoriaAtivos = Object.values(visibilidade).filter((v) => v.diretoria).length;

  return (
    <div className="space-y-6">
      {/* Banner Principal com Identificação */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  MÓDULO 12 • EXCLUSIVO ADMINISTRADOR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {totalModulos} Módulos Gerenciáveis
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-100 font-heading mt-1">
                Painel de Controle Geral do Aplicativo
              </h3>
              <p className="text-xs text-zinc-400 max-w-2xl mt-0.5">
                Habilite ou desabilite módulos individualmente. Módulos desabilitados são totalmente ocultados
                da barra de navegação, da Central de Módulos (Hub) e do menu mobile para os perfis selecionados.
              </p>
            </div>
          </div>

          {/* Botão de Salvar Alterações */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gravando no Banco...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                  <span>Configurações Salvas!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Regras de Visibilidade</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Estatísticas Rápidas de Acesso */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Módulos no Perfil Associado
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {totalAssociadoAtivos}
              </span>
              <span className="text-xs text-zinc-500">
                de {totalModulos - 2} habilitados
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Módulos no Perfil Diretoria
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-sky-400 font-mono">
                {totalDiretoriaAtivos}
              </span>
              <span className="text-xs text-zinc-500">
                de {totalModulos - 1} habilitados
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Acesso Administrador
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {totalModulos}
              </span>
              <span className="text-xs text-zinc-500">100% irrestrito e soberano</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PREENCHIMENTO RÁPIDO & AÇÕES DE TESTE */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Preenchimento Rápido:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-amber-500/40 transition active:scale-95"
            >
              Habilitar Todos
            </button>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 transition active:scale-95 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Padrão Oficial
            </button>
            <button
              type="button"
              onClick={handleSetRoadEssentialMode}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 text-orange-400 border border-orange-500/30 hover:border-orange-500/50 transition active:scale-95"
            >
              Modo Estrada (Essencial)
            </button>
          </div>
        </div>

        {/* Botões de Teste de Perfil */}
        {onTestRole && (
          <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-zinc-800">
            <span className="text-xs text-zinc-400">Testar Visibilidade:</span>
            <button
              type="button"
              onClick={() => onTestRole('associado')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1"
              title="Muda temporariamente para a visão do Associado para testar"
            >
              <Eye className="w-3 h-3" />
              Ver como Associado
            </button>
            <button
              type="button"
              onClick={() => onTestRole('diretoria')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition flex items-center gap-1"
              title="Muda temporariamente para a visão da Diretoria para testar"
            >
              <Eye className="w-3 h-3" />
              Ver como Diretoria
            </button>
          </div>
        )}
      </div>

      {/* Campo de Busca nos Módulos */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filtrar módulo por nome, categoria ou número (ex: 04, Mensalidades, SOS)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* Tabela / Cards de Controle de Módulos */}
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Matriz de Permissões de Acesso por Módulo
            </h4>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            {filteredModulos.length} módulos listados
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {filteredModulos.map((modulo) => {
            const isAssocActive = visibilidade[modulo.id]?.associado ?? modulo.defaultAssociado;
            const isDirActive = visibilidade[modulo.id]?.diretoria ?? modulo.defaultDiretoria;
            const isPermanentAdminOnly = modulo.id === 'configuracoes';

            return (
              <div
                key={modulo.id}
                className="p-4 sm:p-5 hover:bg-zinc-900/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Dados do Módulo */}
                <div className="flex items-start gap-3.5 max-w-lg">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-amber-400 font-mono font-black text-sm shrink-0">
                    {modulo.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                        {modulo.category}
                      </span>
                      {isPermanentAdminOnly && (
                        <span className="px-2 py-0.2 rounded-md text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Protegido
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-bold text-zinc-100 mt-0.5">
                      {modulo.title}
                    </h5>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                      {modulo.subtitle}
                    </p>
                  </div>
                </div>

                {/* Controles de Visibilidade (Associado & Diretoria) */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/60">
                  {/* Switch Associado */}
                  <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Associado
                    </span>
                    {isPermanentAdminOnly ? (
                      <div className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-500 flex items-center gap-1 cursor-not-allowed">
                        <Lock className="w-3 h-3 text-red-400" />
                        Oculto
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => togglePermission(modulo.id, 'associado')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                          isAssocActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <span>{isAssocActive ? 'Ativo' : 'Oculto'}</span>
                        <div
                          className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            isAssocActive ? 'bg-emerald-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                              isAssocActive ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Switch Diretoria */}
                  <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Diretoria
                    </span>
                    {isPermanentAdminOnly ? (
                      <div className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-500 flex items-center gap-1 cursor-not-allowed">
                        <Lock className="w-3 h-3 text-red-400" />
                        Oculto
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => togglePermission(modulo.id, 'diretoria')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                          isDirActive
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <span>{isDirActive ? 'Ativo' : 'Oculto'}</span>
                        <div
                          className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            isDirActive ? 'bg-sky-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                              isDirActive ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Botão de Testar Visualização */}
                  <button
                    type="button"
                    onClick={() =>
                      setTestModalInfo({
                        moduleId: modulo.id,
                        title: modulo.title,
                        associadoVisible: isAssocActive,
                        diretoriaVisible: isDirActive,
                      })
                    }
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                    title="Testar e inspecionar status deste módulo"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Teste / Diagnóstico do Módulo */}
      {testModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Layers className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  Diagnóstico de Visibilidade
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setTestModalInfo(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  Módulo Selecionado
                </span>
                <p className="text-sm font-bold text-zinc-100">
                  {testModalInfo.title}
                </p>
                <code className="text-[11px] text-amber-400 font-mono">
                  ID do Módulo: {testModalInfo.moduleId}
                </code>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <span className="text-zinc-300 font-medium">Perfil Associado:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full ${
                      testModalInfo.associadoVisible
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {testModalInfo.associadoVisible ? '✅ Habilitado (Acessível)' : '🚫 Oculto (Inacessível)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <span className="text-zinc-300 font-medium">Perfil Diretoria:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full ${
                      testModalInfo.diretoriaVisible
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {testModalInfo.diretoriaVisible ? '✅ Habilitado (Acessível)' : '🚫 Oculto (Inacessível)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <span className="text-zinc-300 font-medium">Perfil Administrador:</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    👑 Sempre Habilitado (Gestor)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTestModalInfo(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition"
            >
              Fechar Diagnóstico
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
