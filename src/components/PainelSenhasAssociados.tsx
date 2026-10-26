import React, { useState } from 'react';
import {
  KeyRound,
  Shield,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Lock,
  UserCheck,
  UserX,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  FileText,
  User,
  Sliders,
} from 'lucide-react';
import { Associado } from '../types';
import { verifyAssociadoLogin } from '../services/db';

interface Props {
  associados: Associado[];
  onUpdateSenha: (associadoId: string, novaSenha: string) => Promise<void>;
  onReload?: () => Promise<void>;
}

export const PainelSenhasAssociados: React.FC<Props> = ({
  associados,
  onUpdateSenha,
  onReload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCargo, setFilterCargo] = useState('todos');

  // Mapa local de senhas digitadas por associado
  const [novasSenhas, setNovasSenhas] = useState<Record<string, string>>({});
  // Mapa de visibilidade da senha (mostrar/ocultar)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  // Status de salvamento por associado
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [successMap, setSuccessMap] = useState<Record<string, string>>({});
  // Status de teste de autenticação
  const [testResultMap, setTestResultMap] = useState<
    Record<string, { success: boolean; msg: string }>
  >({});

  // Operação em lote
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  // Copiado
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInputChange = (id: string, val: string) => {
    setNovasSenhas((prev) => ({ ...prev, [id]: val }));
    // Limpa feedback anterior do associado
    setSuccessMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setTestResultMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Preenchimentos rápidos individuais
  const setQuickPassword = (assoc: Associado, type: 'padrao' | 'gerar' | 'ano' | 'cpf') => {
    let pass = '123456';
    if (type === 'padrao') {
      pass = '123456';
    } else if (type === 'gerar') {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      pass = `ROAD#${randomNum}`;
    } else if (type === 'ano') {
      pass = assoc.dataNascimento ? assoc.dataNascimento.slice(-4) : '2026';
    } else if (type === 'cpf') {
      pass = (assoc.cpf || '').replace(/\D/g, '').slice(0, 4) || '1234';
    }
    handleInputChange(assoc.id, pass);
  };

  // Salvar senha individual
  const handleSaveIndividual = async (assoc: Associado) => {
    const passwordToSave = (novasSenhas[assoc.id] || '').trim();
    if (!passwordToSave) {
      alert('Informe ou preencha a nova senha antes de salvar.');
      return;
    }

    setSavingMap((prev) => ({ ...prev, [assoc.id]: true }));
    try {
      await onUpdateSenha(assoc.id, passwordToSave);
      setSuccessMap((prev) => ({
        ...prev,
        [assoc.id]: `Senha salva com sucesso!`,
      }));
      // Testa automaticamente a senha recém-salva
      const testRes = await verifyAssociadoLogin(assoc.cpf || assoc.numeroAssociado, passwordToSave);
      if (testRes.success) {
        setTestResultMap((prev) => ({
          ...prev,
          [assoc.id]: { success: true, msg: 'Login 100% verificado e apto no sistema!' },
        }));
      }
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      alert('Falha ao atualizar senha no banco de dados.');
    } finally {
      setSavingMap((prev) => ({ ...prev, [assoc.id]: false }));
    }
  };

  // Testar senha individual
  const handleTestLogin = async (assoc: Associado) => {
    // Usa a nova senha digitada ou a senha atual registrada no associado
    const passToTest = (novasSenhas[assoc.id] || assoc.senha || '123456').trim();
    const result = await verifyAssociadoLogin(assoc.cpf || assoc.numeroAssociado, passToTest);

    if (result.success) {
      setTestResultMap((prev) => ({
        ...prev,
        [assoc.id]: {
          success: true,
          msg: `Senha "${passToTest}" validada com sucesso! Acesso liberado ao aplicativo.`,
        },
      }));
    } else {
      setTestResultMap((prev) => ({
        ...prev,
        [assoc.id]: {
          success: false,
          msg: result.error || 'Senha incorreta para autenticação.',
        },
      }));
    }
  };

  // ================= AÇÕES EM LOTE (PREENCHIMENTO RÁPIDO GLOBAL) =================
  const handleBatchResetToDefault = async () => {
    if (
      !window.confirm(
        'Tem certeza que deseja redefinir a senha de TODOS os associados para a senha padrão (123456)?'
      )
    ) {
      return;
    }

    setIsBatchProcessing(true);
    setBatchFeedback('Atualizando senhas de todos os associados para 123456...');
    try {
      for (const assoc of associados) {
        await onUpdateSenha(assoc.id, '123456');
      }
      // Preenche os campos locais
      const updatedMap: Record<string, string> = {};
      associados.forEach((a) => {
        updatedMap[a.id] = '123456';
      });
      setNovasSenhas(updatedMap);
      setBatchFeedback('✅ Todas as senhas foram redefinidas para 123456 com sucesso!');
      if (onReload) await onReload();
    } catch (err) {
      console.error('Erro no reset em lote:', err);
      setBatchFeedback('Falha ao redefinir algumas senhas.');
    } finally {
      setIsBatchProcessing(false);
      setTimeout(() => setBatchFeedback(null), 5000);
    }
  };

  const handleBatchTestAll = async () => {
    setIsBatchProcessing(true);
    setBatchFeedback('Executando bateria de testes de login em todos os associados...');
    let passed = 0;
    let failed = 0;

    const newTestMap: Record<string, { success: boolean; msg: string }> = {};

    for (const assoc of associados) {
      const pass = (novasSenhas[assoc.id] || assoc.senha || '123456').trim();
      const res = await verifyAssociadoLogin(assoc.cpf || assoc.numeroAssociado, pass);
      if (res.success) {
        passed++;
        newTestMap[assoc.id] = { success: true, msg: `Login OK com senha "${pass}"` };
      } else {
        failed++;
        newTestMap[assoc.id] = { success: false, msg: res.error || 'Falha de login' };
      }
    }

    setTestResultMap(newTestMap);
    setIsBatchProcessing(false);
    setBatchFeedback(
      `🧪 Bateria Concluída: ${passed} associados com login 100% apto${
        failed > 0 ? `, ${failed} reprovados/bloqueados` : '.'
      }`
    );
  };

  // Copiar credenciais para clipboard
  const handleCopyCredentials = (assoc: Associado) => {
    const pass = (novasSenhas[assoc.id] || assoc.senha || '123456').trim();
    const text = `Credenciais Iron Side M.C.:\nAssociado: ${assoc.nome} (${assoc.nomeGuerra || ''})\nNº: ${assoc.numeroAssociado}\nCPF: ${assoc.cpf}\nSenha: ${pass}`;
    navigator.clipboard.writeText(text);
    setCopiedId(assoc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredAssociados = associados.filter((a) => {
    if (filterCargo !== 'todos' && a.cargo !== filterCargo) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.nome.toLowerCase().includes(q) ||
      (a.nomeGuerra && a.nomeGuerra.toLowerCase().includes(q)) ||
      a.numeroAssociado.toLowerCase().includes(q) ||
      (a.cpf && a.cpf.includes(q))
    );
  });

  const cargosUnicos = Array.from(new Set(associados.map((a) => a.cargo).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header do Painel */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  MÓDULO 12 • EXCLUSIVO ADMINISTRADOR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {associados.length} Associados Cadastrados
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-100 font-heading mt-1">
                Gestão Central de Senhas dos Associados
              </h3>
              <p className="text-xs text-zinc-400 max-w-2xl mt-0.5">
                Altere a senha de acesso de qualquer integrante de forma direta e segura. Teste logins,
                redefina senhas em lote e garanta que todos consigam acessar o aplicativo e carteirinha.
              </p>
            </div>
          </div>

          {/* Botões Globais de Ação em Lote */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={handleBatchResetToDefault}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/40 transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Redefine a senha de todos os associados para 123456"
            >
              <Zap className="w-4 h-4" />
              <span>Redefinir Todos para 123456</span>
            </button>

            <button
              type="button"
              onClick={handleBatchTestAll}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Roda bateria de testes em todos os associados"
            >
              <Play className="w-4 h-4" />
              <span>Testar Todos os Logins</span>
            </button>
          </div>
        </div>

        {/* Feedback em Lote */}
        {batchFeedback && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{batchFeedback}</span>
          </div>
        )}
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, nome de guerra, CPF ou número do associado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400">Cargo:</span>
          <select
            value={filterCargo}
            onChange={(e) => setFilterCargo(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:border-amber-500 outline-none"
          >
            <option value="todos">Todos os Cargos</option>
            {cargosUnicos.map((cargo) => (
              <option key={cargo} value={cargo}>
                {cargo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Associados com Troca Direta de Senha */}
      <div className="space-y-3">
        {filteredAssociados.length === 0 ? (
          <div className="p-10 text-center bg-zinc-950/60 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
            Nenhum associado encontrado para os critérios de busca.
          </div>
        ) : (
          filteredAssociados.map((assoc) => {
            const senhaAtual = assoc.senha || '123456';
            const novaSenhaDigitada = novasSenhas[assoc.id] || '';
            const isSaving = savingMap[assoc.id] || false;
            const successMsg = successMap[assoc.id];
            const testResult = testResultMap[assoc.id];
            const showPass = showPasswordMap[assoc.id] || false;

            return (
              <div
                key={assoc.id}
                className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/30 transition shadow-sm space-y-4"
              >
                {/* Linha Superior: Perfil do Integrante */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {assoc.fotoUrl ? (
                      <img
                        src={assoc.fotoUrl}
                        alt={assoc.nome}
                        className="w-11 h-11 rounded-full object-cover border-2 border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-sm shrink-0">
                        {assoc.nome.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-100 text-sm">
                          {assoc.nome}
                        </span>
                        {assoc.nomeGuerra && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            "{assoc.nomeGuerra}"
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {assoc.cargo || 'Integrante'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <span className="text-amber-400 font-bold">{assoc.numeroAssociado}</span>
                        <span>&bull;</span>
                        <span>CPF: {assoc.cpf}</span>
                        <span>&bull;</span>
                        <span
                          className={`font-semibold ${
                            assoc.status === 'ativo'
                              ? 'text-emerald-400'
                              : assoc.status === 'desligado'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          Status: {assoc.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informação da Senha Atual */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">
                        Senha Atual:
                      </span>
                      <span className="font-mono font-bold text-zinc-200">
                        {showPass ? senhaAtual : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleShowPassword(assoc.id)}
                        className="text-zinc-400 hover:text-white p-0.5"
                        title={showPass ? 'Ocultar' : 'Exibir'}
                      >
                        {showPass ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(assoc)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition"
                      title="Copiar dados de acesso do associado"
                    >
                      {copiedId === assoc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Linha Inferior: Campo Nova Senha + Preenchimento Rápido + Botão Salvar e Testar */}
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Digite a nova senha de acesso..."
                        value={novaSenhaDigitada}
                        onChange={(e) => handleInputChange(assoc.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 outline-none font-mono"
                      />
                    </div>

                    {/* Botões de Preenchimento Rápido */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase mr-0.5">
                        Rápido:
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuickPassword(assoc, 'padrao')}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition"
                        title="Preencher com a senha padrão 123456"
                      >
                        123456
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickPassword(assoc, 'gerar')}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-sky-400 border border-zinc-700 transition"
                        title="Gerar senha aleatória segura"
                      >
                        Gerar Segura
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickPassword(assoc, 'ano')}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition"
                        title="Preencher com ano de nascimento"
                      >
                        Ano Nasc.
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickPassword(assoc, 'cpf')}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-purple-400 border border-zinc-700 transition"
                        title="Preencher com 4 primeiros dígitos do CPF"
                      >
                        4 Dig. CPF
                      </button>
                    </div>
                  </div>

                  {/* Ações: Salvar e Testar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveIndividual(assoc)}
                      disabled={isSaving || !novaSenhaDigitada}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-md shadow-amber-500/10 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gravando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar Senha</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestLogin(assoc)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 transition active:scale-95 flex items-center gap-1.5"
                      title="Testar se esta senha funciona no login do aplicativo"
                    >
                      <Play className="w-3 h-3 text-amber-400" />
                      <span>Testar Login</span>
                    </button>
                  </div>
                </div>

                {/* Notificações de Sucesso ou Teste */}
                {successMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {testResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-500/15 border border-red-500/40 text-red-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{testResult.msg}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
