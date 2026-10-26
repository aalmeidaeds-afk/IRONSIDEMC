import React, { useState } from 'react';
import { updateSenhaDiretoria, getCredencialDiretoria } from '../services/db';
import { KeyRound, Check, X, AlertTriangle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const TrocaSenhaDiretoriaModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha !== confirmaSenha) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const cred = await getCredencialDiretoria();
      if (cred.senha !== senhaAtual) {
        setError('A senha atual informada está incorreta.');
        setLoading(false);
        return;
      }

      await updateSenhaDiretoria(novaSenha, 'DIRETORIA');
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setError('Erro ao atualizar a senha no servidor. Tente novamente.');
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

        <div className="text-center pb-3 border-b border-zinc-800">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
            <KeyRound className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">
            Trocar Senha da Diretoria
          </h3>
          <p className="text-xs text-zinc-400">
            Login oficial: <span className="font-mono text-amber-400 font-bold">DIRETORIA</span>
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-emerald-400">Senha Alterada com Sucesso!</h4>
            <p className="text-xs text-zinc-400">A nova credencial já está ativa no sistema.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">
                Senha Atual *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Digite a senha atual (padrão: DIR202627)"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">
                Nova Senha *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">
                Confirmar Nova Senha *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repita a nova senha"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Gravando...' : 'Gravar Nova Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
