import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Zap,
  Database,
  Trash2,
  CheckCircle,
  Upload,
  KeyRound,
  Eye,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Command,
  CornerDownLeft,
  X,
  AlertTriangle,
  RotateCcw,
  Check,
  Landmark,
  FileText,
  Clock,
  HardDrive,
  Users,
} from 'lucide-react';
import {
  Associado,
  ConfiguracaoClube,
  AuditoriaLog,
  UserRole,
} from '../types';
import { limparAuditoriaLogs } from '../services/db';

export interface CommandAction {
  id: string;
  titulo: string;
  subtitulo: string;
  categoria: 'acoes_rapidas' | 'governanca' | 'pessoas' | 'navegacao';
  categoriaNome: string;
  icone: React.ElementType;
  iconeCor: string;
  badge?: string;
  atalho?: string;
  keywords: string[];
  destaque?: boolean;
  executar: () => void | Promise<void>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: ConfiguracaoClube;
  associados?: Associado[];
  auditoriaLogs?: AuditoriaLog[];
  onTriggerBackup: () => void;
  onTriggerUploadLogo: () => void;
  onApproveAllPending?: () => Promise<void>;
  onNavigateTab: (tabId: string) => void;
  onTestRole?: (role: UserRole) => void;
  onReloadData?: () => Promise<void>;
}

export const AdminQuickActionHub: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  associados = [],
  auditoriaLogs = [],
  onTriggerBackup,
  onTriggerUploadLogo,
  onApproveAllPending,
  onNavigateTab,
  onTestRole,
  onReloadData,
}) => {
  const [busca, setBusca] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    titulo: string;
    mensagem: string;
    acaoConfirmar: () => Promise<void>;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [executando, setExecutando] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const pendentes = useMemo(() => {
    return associados.filter((a) => a.status === 'pendente' || a.status === 'em_analise');
  }, [associados]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. AÇÃO RÁPIDA: LIMPAR LOGS DE AUDITORIA
  const handleLimparLogs = async () => {
    try {
      setExecutando(true);
      const res = await limparAuditoriaLogs();
      if (onReloadData) await onReloadData();
      showToast(`Limpeza concluída! ${res.apagados} registros de auditoria foram expurgados.`);
      setConfirmDialog(null);
    } catch (err: any) {
      alert(err?.message || 'Erro ao limpar logs de auditoria.');
    } finally {
      setExecutando(false);
    }
  };

  // 2. AÇÃO RÁPIDA: APROVAR TODOS OS PENDENTES
  const handleAprovarPendentes = async () => {
    if (pendentes.length === 0) {
      showToast('Nenhum cadastro pendente no momento!');
      return;
    }
    try {
      setExecutando(true);
      if (onApproveAllPending) {
        await onApproveAllPending();
      }
      if (onReloadData) await onReloadData();
      showToast(`${pendentes.length} associado(s) pendente(s) aprovado(s) com sucesso!`);
      setConfirmDialog(null);
    } catch (err: any) {
      alert(err?.message || 'Erro ao aprovar cadastros pendentes.');
    } finally {
      setExecutando(false);
    }
  };

  // LISTA DE COMANDOS DA PALETTE
  const comandos: CommandAction[] = useMemo(() => {
    const list: CommandAction[] = [
      // 1. GERAR BACKUP
      {
        id: 'gerar_backup',
        titulo: 'Disparar Backup Completo do Firestore (JSON)',
        subtitulo: 'Extrai todas as 16 coleções para arquivo JSON com integridade SHA-256',
        categoria: 'acoes_rapidas',
        categoriaNome: 'Ações Rápidas (1-Clique)',
        icone: Database,
        iconeCor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: 'Exportar JSON',
        atalho: 'B',
        keywords: ['backup', 'exportar', 'json', 'firestore', 'banco', 'download', 'copia', 'segurança'],
        destaque: true,
        executar: () => {
          onClose();
          onTriggerBackup();
        },
      },

      // 2. APROVAR PENDENTES
      {
        id: 'aprovar_pendentes',
        titulo: `Aprovar Todos os Cadastros Pendentes (${pendentes.length})`,
        subtitulo:
          pendentes.length > 0
            ? `Libera o acesso de ${pendentes.length} novo(s) associado(s) com matrícula oficial imediata`
            : 'Nenhum associado aguardando aprovação no momento',
        categoria: 'acoes_rapidas',
        categoriaNome: 'Ações Rápidas (1-Clique)',
        icone: CheckCircle,
        iconeCor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: `${pendentes.length} Pendente(s)`,
        atalho: 'A',
        keywords: ['aprovar', 'pendente', 'cadastro', 'associado', 'membro', 'liberar', 'homologar'],
        destaque: pendentes.length > 0,
        executar: () => {
          if (pendentes.length === 0) {
            showToast('Nenhum associado pendente para aprovar.');
            return;
          }
          setConfirmDialog({
            titulo: `Aprovar ${pendentes.length} Cadastro(s) Pendente(s)?`,
            mensagem: `Esta ação gerará matrículas oficiais e liberará o acesso imediato de: ${pendentes
              .map((p) => p.nome)
              .slice(0, 3)
              .join(', ')}${pendentes.length > 3 ? ` e mais ${pendentes.length - 3}...` : ''}.`,
            acaoConfirmar: handleAprovarPendentes,
          });
        },
      },

      // 3. ATUALIZAR LOGO
      {
        id: 'atualizar_logo',
        titulo: 'Atualizar Logotipo Oficial do Clube',
        subtitulo: 'Carregar nova imagem da Área de Trabalho ou Galeria (JPEG, PNG, BMP, GIF, HEIC)',
        categoria: 'acoes_rapidas',
        categoriaNome: 'Ações Rápidas (1-Clique)',
        icone: Upload,
        iconeCor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        badge: 'Universal Upload',
        atalho: 'L',
        keywords: ['logo', 'logotipo', 'brasão', 'imagem', 'foto', 'upload', 'area de trabalho', 'galeria', 'heic'],
        destaque: true,
        executar: () => {
          onClose();
          onTriggerUploadLogo();
        },
      },

      // 4. LIMPAR LOGS DE AUDITORIA
      {
        id: 'limpar_logs',
        titulo: 'Limpar / Expurgar Logs de Auditoria Antigos',
        subtitulo: `Remove logs temporários da base (${auditoriaLogs.length} registros) e grava log oficial de expurgo`,
        categoria: 'acoes_rapidas',
        categoriaNome: 'Ações Rápidas (1-Clique)',
        icone: Trash2,
        iconeCor: 'text-red-400 bg-red-500/10 border-red-500/30',
        badge: `${auditoriaLogs.length} Logs`,
        atalho: 'C',
        keywords: ['limpar', 'logs', 'auditoria', 'expurgar', 'deletar', 'zerar', 'otimizar', 'manutenção'],
        destaque: false,
        executar: () => {
          setConfirmDialog({
            titulo: 'Confirmar Limpeza de Logs de Auditoria?',
            mensagem:
              'Atenção: Todos os registros de auditoria antigos serão expurgados da base de dados para otimizar o desempenho. Um novo registro oficial de expurgo será gravado na trilha.',
            acaoConfirmar: handleLimparLogs,
          });
        },
      },

      // 5. GERENCIAR SENHAS DOS ASSOCIADOS
      {
        id: 'gerenciar_senhas',
        titulo: `Central de Senhas dos Associados (${associados.length})`,
        subtitulo: 'Visualizar, redefinir ou copiar senhas mestras de acesso de todos os membros',
        categoria: 'pessoas',
        categoriaNome: 'Gestão de Integrantes & Acessos',
        icone: KeyRound,
        iconeCor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        badge: 'Senhas',
        atalho: 'S',
        keywords: ['senha', 'senhas', 'associado', 'redefinir', 'recuperar', 'login', 'acesso'],
        executar: () => {
          onClose();
          onNavigateTab('senhas_associados');
        },
      },

      // 6. SIMULAR PERFIL ASSOCIADO
      {
        id: 'simular_associado',
        titulo: 'Simular Visão como Associado (Membro)',
        subtitulo: 'Inspecione a interface exatamente como aparece para o motociclista sem deslogar',
        categoria: 'pessoas',
        categoriaNome: 'Gestão de Integrantes & Acessos',
        icone: Users,
        iconeCor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: 'Live Preview',
        atalho: '1',
        keywords: ['simular', 'associado', 'membro', 'preview', 'perfil', 'testar'],
        executar: () => {
          onClose();
          if (onTestRole) onTestRole('associado');
        },
      },

      // 7. SIMULAR PERFIL DIRETORIA
      {
        id: 'simular_diretoria',
        titulo: 'Simular Visão como Diretoria',
        subtitulo: 'Inspecione a interface com os módulos executivos e homologações de ata',
        categoria: 'pessoas',
        categoriaNome: 'Gestão de Integrantes & Acessos',
        icone: Shield,
        iconeCor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        badge: 'Live Preview',
        atalho: '2',
        keywords: ['simular', 'diretoria', 'preview', 'perfil', 'testar', 'executivo'],
        executar: () => {
          onClose();
          if (onTestRole) onTestRole('diretoria');
        },
      },

      // 8. MÓDULO 0: INSTITUCIONAL
      {
        id: 'modulo_0_institucional',
        titulo: 'Módulo 0: Ata de Fundação, CNPJ & Diretoria Legal',
        subtitulo: 'Gerencie estatuto, representação em ata, contas bancárias PJ e chave PIX oficial',
        categoria: 'governanca',
        categoriaNome: 'Governança & Institucional',
        icone: Landmark,
        iconeCor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: 'Módulo 0',
        atalho: '0',
        keywords: ['institucional', 'cnpj', 'ata', 'estatuto', 'banco', 'sede', 'diretoria legal', 'modulo 0'],
        executar: () => {
          onClose();
          onNavigateTab('cadastro_institucional');
        },
      },

      // 9. CONTROLE GERAL DE MÓDULOS (MATRIZ)
      {
        id: 'matriz_modulos',
        titulo: 'Matriz de Controle Geral de Módulos (Habilitar / Desabilitar)',
        subtitulo: 'Ligue ou desligue módulos operacionais em tempo real para Associados e Diretoria',
        categoria: 'governanca',
        categoriaNome: 'Governança & Institucional',
        icone: Layers,
        iconeCor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: 'Módulo 12',
        atalho: 'M',
        keywords: ['modulos', 'matriz', 'habilitar', 'desabilitar', 'permissões', 'rbac', 'visibilidade'],
        executar: () => {
          onClose();
          onNavigateTab('controle_modulos');
        },
      },

      // 10. ARQUIVAMENTO DE FALHAS & CORREÇÕES (LAUDO)
      {
        id: 'arquivamento_falhas',
        titulo: 'Arquivamento de Falhas & Emissão de Laudo Técnico (PDF)',
        subtitulo: 'Painel com falhas críticas (vermelho) e correções validadas (verde) com exportação',
        categoria: 'governanca',
        categoriaNome: 'Governança & Institucional',
        icone: FileText,
        iconeCor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: 'Laudo PDF',
        atalho: 'F',
        keywords: ['falhas', 'exceções', 'laudo', 'pdf', 'erros', 'diagnostico', 'auditoria'],
        executar: () => {
          onClose();
          onNavigateTab('diagnostico_sistema');
        },
      },

      // 11. FINANCEIRO & EXTRATO BANCÁRIO
      {
        id: 'financeiro_extrato',
        titulo: 'Financeiro, Mensalidades & Extrato Bancário',
        subtitulo: 'Controle de baixas, conciliação bancária crédito (azul) / débito (vermelho)',
        categoria: 'navegacao',
        categoriaNome: 'Navegação Rápida',
        icone: Sparkles,
        iconeCor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: 'Módulo 5',
        atalho: '5',
        keywords: ['financeiro', 'extrato', 'mensalidades', 'banco', 'pix', 'caixa', 'modulo 5'],
        executar: () => {
          onClose();
          onNavigateTab('mensalidades');
        },
      },

      // 12. CENTRAL DE LOJAS & HOSTINGER
      {
        id: 'lojas_hostinger',
        titulo: 'Módulo 13: Central Google Play, App Store & Hostinger',
        subtitulo: 'Verificação de versão PWA, manifest.json e instruções de publicação TWA',
        categoria: 'navegacao',
        categoriaNome: 'Navegação Rápida',
        icone: HardDrive,
        iconeCor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        badge: 'Módulo 13',
        atalho: 'H',
        keywords: ['lojas', 'play store', 'app store', 'hostinger', 'publicação', 'versão', 'modulo 13'],
        executar: () => {
          onClose();
          onNavigateTab('versao_publicacao');
        },
      },
    ];

    return list;
  }, [pendentes, auditoriaLogs, associados, onTriggerBackup, onTriggerUploadLogo, onNavigateTab, onTestRole]);

  // Filtro de Comandos pela Busca
  const comandosFiltrados = useMemo(() => {
    if (!busca.trim()) return comandos;
    const q = busca.toLowerCase().trim();
    return comandos.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.subtitulo.toLowerCase().includes(q) ||
        c.categoriaNome.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [comandos, busca]);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setBusca('');
      setSelectedIndex(0);
      setConfirmDialog(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Navegação por teclado dentro do modal (ArrowDown, ArrowUp, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (confirmDialog) {
      if (e.key === 'Escape') {
        setConfirmDialog(null);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, comandosFiltrados.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + comandosFiltrados.length) % Math.max(1, comandosFiltrados.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = comandosFiltrados[selectedIndex];
      if (selected) {
        selected.executar();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Garante scroll visível do item selecionado
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmDialog) {
          onClose();
        }
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
      >
        {/* Barra de Busca estilo Spotlight / Command Palette */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Quick Action Hub: digite um comando (backup, logs, aprovar, logo)..."
              className="w-full bg-transparent text-sm sm:text-base font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          {busca && (
            <button
              type="button"
              onClick={() => {
                setBusca('');
                inputRef.current?.focus();
              }}
              className="p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            <Command className="w-3 h-3 text-amber-400" />
            <span>ESC para sair</span>
          </div>
        </div>

        {/* Toast Notifier Interno */}
        {toastMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-5 py-2.5 text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Lista de Comandos */}
        <div
          ref={listRef}
          className="divide-y divide-zinc-800/60 overflow-y-auto custom-scrollbar p-2 space-y-1"
        >
          {comandosFiltrados.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-400">Nenhum comando encontrado para &ldquo;{busca}&rdquo;</p>
              <p className="text-xs text-zinc-500">Tente buscar por &ldquo;backup&rdquo;, &ldquo;logs&rdquo;, &ldquo;aprovar&rdquo; ou &ldquo;logo&rdquo;.</p>
            </div>
          ) : (
            comandosFiltrados.map((cmd, idx) => {
              const Icon = cmd.icone;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => cmd.executar()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-3.5 rounded-2xl transition-all text-left flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20 scale-[1.01]'
                      : 'hover:bg-zinc-800/60 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-zinc-950 text-amber-400 border-zinc-800'
                          : cmd.iconeCor
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? 'text-zinc-950 font-black' : 'text-zinc-100'
                          }`}
                        >
                          {cmd.titulo}
                        </span>
                        {cmd.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                              isSelected
                                ? 'bg-zinc-950 text-amber-400'
                                : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                            }`}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-zinc-900 font-medium' : 'text-zinc-400'
                        }`}
                      >
                        {cmd.subtitulo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.atalho && (
                      <kbd
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                          isSelected
                            ? 'bg-zinc-950 text-amber-300'
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {cmd.atalho}
                      </kbd>
                    )}
                    <CornerDownLeft
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-zinc-950 translate-x-0.5' : 'text-zinc-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Rodapé de Dicas de Teclado */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400 font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">↓</kbd>
              <span className="text-zinc-500">Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">↵ Enter</kbd>
              <span className="text-zinc-500">Executar</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Produtividade Master &bull; 1-Click Execution</span>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Ações Críticas (Limpeza de Logs / Aprovação em Massa) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-amber-500/50 p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-zinc-100 font-heading">
                {confirmDialog.titulo}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {confirmDialog.mensagem}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={executando}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDialog.acaoConfirmar}
                disabled={executando}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {executando ? (
                  <span>Executando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Agora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
