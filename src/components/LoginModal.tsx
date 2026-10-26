import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCredencialDiretoria, checkCpfBloqueado } from '../services/db';
import { Associado, ConfiguracaoClube } from '../types';
import {
  Lock,
  User,
  Shield,
  KeyRound,
  AlertOctagon,
  CheckCircle,
  X,
  LogIn,
  AlertTriangle,
  Fingerprint,
  ShieldCheck,
  CreditCard,
  Search,
} from 'lucide-react';

interface Props {
  config: ConfiguracaoClube;
  onClose: () => void;
  onOpenTrocaSenha: () => void;
  onSuccessLogin?: (destTab: string) => void;
}

export const LoginModal: React.FC<Props> = ({
  config,
  onClose,
  onOpenTrocaSenha,
  onSuccessLogin,
}) => {
  const { signInWithGoogle, switchRolePersona, loginWithCpfOrCode } = useAuth();
  const [tab, setTab] = useState<'diretoria' | 'associado' | 'google'>('associado');

  // Diretoria login state
  const [loginDiretoria, setLoginDiretoria] = useState('DIRETORIA');
  const [senhaDiretoria, setSenhaDiretoria] = useState('DIR202627');
  const [diretoriaError, setDiretoriaError] = useState<string | null>(null);

  // Associado CPF ou Código state
  const [loginIdentificador, setLoginIdentificador] = useState('');
  const [associadoError, setAssociadoError] = useState<string | null>(null);
  const [blockedInfo, setBlockedInfo] = useState<Associado | null>(null);

  const [loading, setLoading] = useState(false);

  const handleLoginDiretoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiretoriaError(null);
    setLoading(true);

    try {
      const cred = await getCredencialDiretoria();
      const inputLoginUpper = loginDiretoria.trim().toUpperCase();
      const expectedLoginUpper = cred.login.trim().toUpperCase();

      if (inputLoginUpper !== expectedLoginUpper || senhaDiretoria.trim() !== cred.senha.trim()) {
        setDiretoriaError('Login ou senha da Diretoria incorretos. A senha padrão inicial é DIR202627.');
        setLoading(false);
        return;
      }

      // Successful Diretoria Login
      switchRolePersona('diretoria');
      if (onSuccessLogin) onSuccessLogin('dashboard');
      onClose();
    } catch {
      setDiretoriaError('Erro ao consultar credenciais da diretoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAssociado = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssociadoError(null);
    setBlockedInfo(null);

    const inputVal = loginIdentificador.trim();
    if (!inputVal) {
      setAssociadoError('Informe o CPF ou o Código do Associado (Ex: MC-000001).');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithCpfOrCode(inputVal);

      if (!result.success) {
        if (result.blocked) {
          // ASSOCIADO DESLIGADO - BLOQUEIO RIGOROSO
          setBlockedInfo(result.blocked);
          setLoading(false);
          return;
        }

        setAssociadoError(
          result.error ||
            'Não foi encontrado nenhum associado com esse CPF ou Código. Verifique os números digitados.'
        );
        setLoading(false);
        return;
      }

      // Successful Member Login -> Direciona ao Dashboard de Pagamentos e Competências!
      if (onSuccessLogin) {
        onSuccessLogin('mensalidades');
      }
      onClose();
    } catch {
      setAssociadoError('Erro ao consultar dados do associado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-zinc-900 border-t border-amber-500/50 sm:border sm:border-amber-500/60 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 text-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl max-h-[90vh] overflow-y-auto pb-safe pb-6 sm:pb-6"
      >
        {/* Mobile Drag / Touch Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mb-3.5 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pb-4 border-b border-zinc-800">
          <div className="w-14 h-14 mx-auto mb-2 p-1 rounded-xl bg-zinc-950 border border-amber-500/50 shadow-lg flex items-center justify-center">
            <img
              src="/ironside-logo.svg"
              alt={config.nomeClube}
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-base font-bold text-zinc-100 font-heading">
            Acesso ao Sistema do Clube
          </h3>
          <p className="text-[11px] text-amber-400 font-semibold">{config.nomeClube}</p>
          <p className="text-[10px] text-zinc-400 italic mt-0.5">&ldquo;{config.lema}&rdquo;</p>
        </div>

        {/* CRITICAL: BLOCKED CPF SCREEN (DESLIGAMENTO) */}
        {blockedInfo ? (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-red-950/70 border-2 border-red-600 rounded-2xl text-red-200 text-center space-y-2 shadow-2xl">
              <div className="inline-flex p-3 rounded-full bg-red-600/30 text-red-400 border border-red-500/50">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                ACESSO BLOQUEADO POR CPF
              </h4>
              <p className="text-xs font-bold text-red-300">
                Associado Oficialmente Desligado do Moto Clube
              </p>
              <div className="text-[11px] text-zinc-300 bg-zinc-950/80 p-2.5 rounded-xl border border-red-900/60 text-left space-y-1">
                <div>
                  <span className="text-zinc-500">Nome:</span>{' '}
                  <strong className="text-white">{blockedInfo.nome} ({blockedInfo.nomeGuerra})</strong>
                </div>
                <div>
                  <span className="text-zinc-500">CPF Controlado:</span>{' '}
                  <strong className="text-amber-400 font-mono">{blockedInfo.cpf}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Data do Desligamento:</span>{' '}
                  <strong className="text-red-400">{blockedInfo.dataDesligamento || 'Registrada'}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Determinado por:</span>{' '}
                  <strong className="text-zinc-200">{blockedInfo.desligadoPor || 'Diretoria Executiva'}</strong>
                </div>
              </div>

              {/* MOTIVO DETALHADO (Até 3000 caracteres) */}
              <div className="text-left mt-2">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                  Motivo Oficial do Desligamento Registrado em Ata:
                </span>
                <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-zinc-950 border border-red-900/80 text-[11px] text-zinc-300 leading-relaxed italic whitespace-pre-wrap">
                  {blockedInfo.motivoDesligamento || 'Desligamento homologado pela diretoria com base no estatuto do clube.'}
                </div>
              </div>

              <div className="p-2.5 bg-red-900/30 rounded-xl text-[10px] text-red-200 font-semibold border border-red-800/40">
                Este CPF está irrevogavelmente impedido de acessar o sistema web e o aplicativo Android do clube conforme deliberação da diretoria.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setBlockedInfo(null);
                setLoginIdentificador('');
              }}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          /* REGULAR LOGIN FORM */
          <div className="py-4 space-y-4">
            {/* Login Type Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTab('associado')}
                className={`py-2 rounded-lg transition ${
                  tab === 'associado'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Associado
              </button>
              <button
                type="button"
                onClick={() => setTab('diretoria')}
                className={`py-2 rounded-lg transition ${
                  tab === 'diretoria'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Diretoria
              </button>
              <button
                type="button"
                onClick={() => setTab('google')}
                className={`py-2 rounded-lg transition ${
                  tab === 'google'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Google
              </button>
            </div>

            {/* TAB 1: LOGIN ASSOCIADO POR CPF OU CÓDIGO */}
            {tab === 'associado' && (
              <form onSubmit={handleLoginAssociado} className="space-y-3.5 text-xs">
                {associadoError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{associadoError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">
                    CPF ou Código do Associado *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: 123.456.789-00 ou MC-000001"
                      value={loginIdentificador}
                      onChange={(e) => setLoginIdentificador(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-sm focus:border-amber-500"
                    />
                    <Fingerprint className="w-5 h-5 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                    Acesse seu <strong>Dashboard dos Pagamentos &amp; Competências</strong>, envie comprovantes em PDF e consulte sua situação financeira.
                  </p>
                </div>

                {/* Quick Shortcuts for Testing & Demo */}
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Atalhos de Demonstração / Teste:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLoginIdentificador('123.456.789-00')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono text-[10px]"
                    >
                      CPF: 123.456.789-00
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginIdentificador('MC-000001')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono text-[10px]"
                    >
                      Código: MC-000001
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginIdentificador('789.456.123-00')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sky-300 font-mono text-[10px]"
                    >
                      Carlos (Próspero)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginIdentificador('987.654.321-99')}
                      className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-900/60 text-red-400 font-mono text-[10px] border border-red-800/50"
                      title="Testar bloqueio estatutário de CPF desligado"
                    >
                      CPF Desligado
                    </button>
                  </div>
                </div>

                {/* LGPD & LAI Badge */}
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Acesso autenticado e seguro em conformidade com a <strong>LGPD (Lei 13.709/2018)</strong> e <strong>LAI (Lei 12.527/2011)</strong>.
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {loading ? 'Consultando associado...' : 'Acessar Dashboard de Pagamentos'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: LOGIN DIRETORIA */}
            {tab === 'diretoria' && (
              <form onSubmit={handleLoginDiretoria} className="space-y-3 text-xs">
                {diretoriaError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{diretoriaError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">
                    Identificador de Login *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="DIRETORIA"
                      value={loginDiretoria}
                      onChange={(e) => setLoginDiretoria(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 uppercase"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400 font-mono">
                      Oficial
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-400 font-semibold">Senha de Acesso *</label>
                    <button
                      type="button"
                      onClick={onOpenTrocaSenha}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <KeyRound className="w-3 h-3" />
                      Trocar Senha
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="DIR202627"
                    value={senhaDiretoria}
                    onChange={(e) => setSenhaDiretoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Senha de fábrica: <strong className="text-amber-400 font-mono">DIR202627</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    {loading ? 'Validando...' : 'Entrar como Diretoria'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: LOGIN GOOGLE */}
            {tab === 'google' && (
              <div className="space-y-3 text-center py-2 text-xs">
                <p className="text-zinc-400">
                  Faça login seguro com sua conta Google cadastrada na administração.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await signInWithGoogle();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar com Conta Google
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
