import React, { useState } from 'react';
import {
  Trash2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  X,
  KeyRound,
  RotateCcw,
  ShieldAlert,
  Loader2,
  Check,
  Download,
  ShieldCheck,
  ArrowRight,
  Database,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import {
  executarResetGeralBancoDados,
  salvarResetOperacoesSenha,
  ResetGeralResultado,
} from '../services/db';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete?: () => Promise<void> | void;
  onSuccess?: () => Promise<void> | void;
}

type Step = 'confirmacao_destrutiva' | 'dupla_validacao' | 'executando' | 'relatorio_conclusao';

export const ModalResetBancoDados: React.FC<Props> = ({
  isOpen,
  onClose,
  onResetComplete,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>('confirmacao_destrutiva');

  // Input states for Step 2
  const [fraseConfirmacao, setFraseConfirmacao] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [etapaProgresso, setEtapaProgresso] = useState('Iniciando...');
  const [percentualProgresso, setPercentualProgresso] = useState(0);

  // Error / Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetResultado, setResetResultado] = useState<ResetGeralResultado | null>(null);

  // Password alteration sub-mode
  const [isTrocarSenhaMode, setIsTrocarSenhaMode] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState('');
  const [trocaSuccess, setTrocaSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancelar = () => {
    if (loading) return;
    setStep('confirmacao_destrutiva');
    setFraseConfirmacao('');
    setSenhaInput('');
    setErrorMessage(null);
    setIsTrocarSenhaMode(false);
    onClose();
  };

  const handleAvancarParaValidacao = () => {
    setErrorMessage(null);
    setStep('dupla_validacao');
  };

  const handleExecutarResetFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fraseConfirmacao.trim().toUpperCase() !== 'RESET GERAL') {
      setErrorMessage('Digite exatamente a frase "RESET GERAL" em maiúsculas para continuar.');
      return;
    }

    if (!senhaInput.trim()) {
      setErrorMessage('Digite a senha mestra ou a senha do Administrador.');
      return;
    }

    try {
      setLoading(true);
      setStep('executando');
      setPercentualProgresso(5);
      setEtapaProgresso('Preparando rotina destrutiva de segurança...');

      const resultado = await executarResetGeralBancoDados(
        senhaInput.trim(),
        currentUser?.uid || 'admin-geral',
        currentUser?.email || 'admin@ironsidemc.com.br',
        (etapa, pct) => {
          setEtapaProgresso(etapa);
          setPercentualProgresso(pct);
        }
      );

      if (!resultado.success) {
        setErrorMessage(resultado.message);
        setStep('dupla_validacao');
        return;
      }

      setResetResultado(resultado);
      setStep('relatorio_conclusao');

      // Call callbacks to clear in-memory App states
      if (onResetComplete) {
        await onResetComplete();
      }
      if (onSuccess) {
        await onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Erro ao processar o reset: ${msg}`);
      setStep('dupla_validacao');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTrocaSuccess(null);

    if (!novaSenha.trim()) {
      setErrorMessage('A nova senha não pode ser vazia.');
      return;
    }

    if (novaSenha !== confirmaNovaSenha) {
      setErrorMessage('A confirmação da nova senha não confere.');
      return;
    }

    try {
      setLoading(true);
      await salvarResetOperacoesSenha(novaSenha.trim());
      setTrocaSuccess('Senha de autorização do reset atualizada com sucesso!');
      setNovaSenha('');
      setConfirmaNovaSenha('');
      setTimeout(() => {
        setIsTrocarSenhaMode(false);
        setTrocaSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Erro ao atualizar senha: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarEFechar = () => {
    handleCancelar();
  };

  const isFraseCorreta = fraseConfirmacao.trim().toUpperCase() === 'RESET GERAL';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-red-500/80 rounded-3xl p-5 sm:p-7 text-zinc-100 shadow-[0_0_60px_rgba(239,68,68,0.35)] overflow-hidden my-6">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-400">
              <RotateCcw className="w-6 h-6 animate-spin-reverse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 font-heading tracking-wide">
                RESET GERAL DO BANCO DE DADOS
              </h3>
              <p className="text-xs text-red-400 font-semibold">
                Limpeza Completa para Início das Operações Oficiais do Moto Clube
              </p>
            </div>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={handleCancelar}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="my-4 p-3.5 bg-red-950/90 border border-red-500 rounded-2xl text-red-200 text-xs flex items-center gap-2.5 animate-shake">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 1: AVISO DETALHADO & CONFIRMAÇÃO DESTRUTIVA             */}
        {/* ============================================================ */}
        {step === 'confirmacao_destrutiva' && (
          <div className="space-y-5 my-4">
            {/* Texto Exato Solicitado pelo Usuário */}
            <div className="p-4 sm:p-5 bg-gradient-to-b from-red-950/70 to-red-900/30 border-2 border-red-500/60 rounded-2xl space-y-3 text-red-100">
              <div className="flex items-center gap-2.5 text-red-400 font-black text-sm uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5" />
                <span>ATENÇÃO: ESTA OPERAÇÃO É DESTRUTIVA!</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-200">
                Você está prestes a apagar todos os dados operacionais do sistema, incluindo associados, cadastros, movimentações financeiras, mensalidades, relatórios, históricos operacionais e dados de exemplo de todos os módulos.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-emerald-300 font-medium">
                Serão preservados o login, a imagem da tela de acesso, as contas de Administrador e Diretor, suas senhas e permissões, além da estrutura técnica e das configurações essenciais do sistema.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-amber-300 font-bold">
                Esta operação poderá ser irreversível sem um backup.
              </p>
              <p className="text-xs sm:text-sm font-black text-white pt-1">
                Deseja realmente continuar?
              </p>
            </div>

            {/* Destaque Visual das Regras de Limpeza vs Preservação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1.5">
                <span className="font-bold text-red-400 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Dados que serão apagados:
                </span>
                <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside">
                  <li>Associados, usuários comuns e fichas</li>
                  <li>Motos, veículos, manutenções e km</li>
                  <li>Mensalidades, caixa e extrato bancário</li>
                  <li>Eventos, fotos, campanhas e doações</li>
                  <li>Todos os dados de teste e relatórios antigos</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Preservados obrigatoriamente:
                </span>
                <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside">
                  <li>Logotipo oficial e identidade de login</li>
                  <li>Conta e senha do Administrador</li>
                  <li>Conta e senha da Diretoria</li>
                  <li>Módulo 0 (Cadastro Institucional/Estatuto)</li>
                  <li>Backup JSON gerado automaticamente</li>
                </ul>
              </div>
            </div>

            {/* Ações: Cancelar e Confirmar Reset Geral */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleCancelar}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
              >
                CANCELAR
              </button>

              <button
                type="button"
                onClick={handleAvancarParaValidacao}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>CONFIRMAR RESET GERAL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2: DUPLA CONFIRMAÇÃO DE SEGURANÇA (FRASE + SENHA)       */}
        {/* ============================================================ */}
        {step === 'dupla_validacao' && (
          <div className="space-y-4 my-4">
            {!isTrocarSenhaMode ? (
              <form onSubmit={handleExecutarResetFinal} className="space-y-4">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Etapa 2 de 2: Para prosseguir com a exclusão definitiva, digite a frase de confirmação e a senha administrativa.
                  </p>
                </div>

                {/* 1. Frase de Confirmação Obrigatória */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200">
                      1. Digite a frase de confirmação:
                    </label>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      RESET GERAL
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Digite aqui: RESET GERAL"
                    value={fraseConfirmacao}
                    onChange={(e) => setFraseConfirmacao(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl bg-zinc-950 border text-sm font-mono tracking-wider focus:outline-none uppercase ${
                      isFraseCorreta
                        ? 'border-emerald-500 text-emerald-300'
                        : 'border-zinc-700 text-zinc-100 focus:border-red-500'
                    }`}
                  />
                  {isFraseCorreta ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Frase confirmada com sucesso.
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      Digite exatamente <strong className="text-zinc-300">RESET GERAL</strong> (em maiúsculas).
                    </p>
                  )}
                </div>

                {/* 2. Senha Administrativa Mascarada */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      2. Senha Mestra / Administrador:
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Entrada mascarada
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="••••••••••••"
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm font-mono tracking-widest focus:border-red-500 focus:outline-none text-center"
                  />
                  <p className="text-[11px] text-zinc-500">
                    A senha autorizada padrão é <code className="text-amber-400/80">Disnatia2026</code> ou a sua senha de Administrador.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrocarSenhaMode(true);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium transition cursor-pointer"
                  >
                    Trocar Senha do Reset (Sem exigir senha anterior)
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setStep('confirmacao_destrutiva')}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>

                    <button
                      type="submit"
                      disabled={!isFraseCorreta || !senhaInput.trim() || loading}
                      className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-600/40 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>EXECUTAR RESET GERAL AGORA</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* MODO: TROCA DE SENHA MASTER DO RESET SEM EXIGIR SENHA ANTERIOR */
              <form onSubmit={handleSalvarNovaSenha} className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
                  <strong>Troca Segura de Senha do Reset:</strong> Você pode redefinir a senha de autorização do reset geral sem precisar informar a senha anterior.
                </div>

                {trocaSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{trocaSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-zinc-200 block mb-1">
                    Nova Senha de Reset:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Digite a nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-200 block mb-1">
                    Confirme a Nova Senha:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a nova senha"
                    value={confirmaNovaSenha}
                    onChange={(e) => setConfirmaNovaSenha(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrocarSenhaMode(false);
                      setErrorMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !novaSenha.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-black text-black bg-amber-400 hover:bg-amber-300 transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Salvar Nova Senha</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 3: INDICADOR VISUAL DE PROGRESSO DA EXCLUSÃO           */}
        {/* ============================================================ */}
        {step === 'executando' && (
          <div className="space-y-6 my-6 py-4 text-center">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
              <RotateCcw className="w-8 h-8 text-red-400" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-black text-white tracking-wide">
                Executando Reset Geral do Banco de Dados...
              </h4>
              <p className="text-xs text-red-300 font-mono animate-pulse">
                {etapaProgresso}
              </p>
            </div>

            {/* Barra de Progresso com Porcentagem Real */}
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-3.5 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentualProgresso}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>Progresso da operação</span>
                <span>{percentualProgresso}%</span>
              </div>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-[11px] text-zinc-400 max-w-md mx-auto">
              ⚠️ Não feche a página nem desconecte da internet durante este procedimento de contingência e limpeza.
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 4: RELATÓRIO DETALHADO DE CONCLUSÃO & PÓS-RESET       */}
        {/* ============================================================ */}
        {step === 'relatorio_conclusao' && resetResultado && (
          <div className="space-y-5 my-3 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header de Sucesso */}
            <div className="p-4 bg-emerald-950/60 border-2 border-emerald-500/60 rounded-2xl flex items-start gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-emerald-300">
                  Reset Geral Concluído com Sucesso!
                </h4>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  Todos os dados operacionais foram limpos. O sistema está em estado inicial limpo e pronto para iniciar as operações oficiais do Moto Clube.
                </p>
              </div>
            </div>

            {/* Metadados do Backup Preventivo Automático */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Backup Preventivo de Contingência:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                  Baixado Localmente
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 break-all">
                Arquivo: <strong className="text-white">{resetResultado.backupNomeArquivo}</strong>
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                Hash Integridade: {resetResultado.backupIntegridadeHash}
              </p>
            </div>

            {/* Resumo dos 14 Módulos Limpos */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span>Módulos Operacionais Limpos (Estado Zerado):</span>
                <span className="text-[11px] text-zinc-400">
                  Total de registros apagados: <strong className="text-red-400">{resetResultado.totalDocumentosApagados}</strong>
                </span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {resetResultado.resumoModulos.map((mod) => (
                  <div
                    key={mod.modulo}
                    className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between"
                  >
                    <span className="text-zinc-300 font-medium truncate pr-2">
                      {mod.nome}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-emerald-400 font-mono font-bold shrink-0">
                      0 registros
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Elementos Preservados com Sucesso */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-emerald-500/30 space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Estrutura &amp; Credenciais Preservadas:
              </span>
              <ul className="text-[11px] text-zinc-300 space-y-1">
                {resetResultado.itensPreservados.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão Final de Conclusão */}
            <div className="pt-2 flex justify-end border-t border-zinc-800">
              <button
                type="button"
                onClick={handleFinalizarEFechar}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black text-black bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>CONCLUIR &amp; ATUALIZAR SISTEMA</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
