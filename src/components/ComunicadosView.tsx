import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Comunicado } from '../types';
import { Bell, Plus, Pin, AlertTriangle, Info, Calendar, User } from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';

interface Props {
  comunicados: Comunicado[];
  onSaveNew: (data: Omit<Comunicado, 'id'>) => Promise<void>;
}

export const ComunicadosView: React.FC<Props> = ({ comunicados, onSaveNew }) => {
  const { activeRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    conteudo: '',
    prioridade: 'normal' as const,
    autor: 'Diretoria Executiva',
    fixado: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.conteudo) return;

    await onSaveNew({
      titulo: form.titulo,
      conteudo: form.conteudo,
      data: new Date().toLocaleDateString('pt-BR'),
      prioridade: form.prioridade,
      autor: form.autor,
      fixado: form.fixado,
      createdAt: new Date().toISOString(),
    });

    setForm({
      titulo: '',
      conteudo: '',
      prioridade: 'normal',
      autor: 'Diretoria Executiva',
      fixado: false,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
            Mural Oficial de Comunicados
          </h2>
          <p className="text-xs text-zinc-400">
            Avisos de interesse público do moto clube, regras de estrada e resoluções da diretoria.
          </p>
        </div>

        {activeRole !== 'associado' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Novo Comunicado
          </button>
        )}
      </div>

      <div className="space-y-4">
        {comunicados.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
            Nenhum comunicado publicado no momento.
          </div>
        ) : (
          comunicados.map((c) => (
            <div
              key={c.id}
              className={`p-6 rounded-2xl bg-zinc-900/80 border transition shadow-sm space-y-3 ${
                c.fixado
                  ? 'border-amber-500/50 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-amber-950/20'
                  : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {c.fixado && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
                      FIXADO
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      c.prioridade === 'urgente'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                        : c.prioridade === 'alta'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    Prioridade {c.prioridade}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{c.data}</span>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 font-heading">
                  {c.titulo}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed whitespace-pre-line">
                  {c.conteudo}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 font-semibold text-amber-400/90">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  {c.autor}
                </span>
                <span className="text-[10px] text-zinc-500">
                  Comunicação Oficial Registrada
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Publicar Comunicado Oficial
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Título do Comunicado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pauta da Assembleia Geral..."
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Conteúdo Completo *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mensagem oficial aos associados..."
                  value={form.conteudo}
                  onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={(e) => setForm({ ...form, prioridade: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Órgão Emissor</label>
                  <input
                    type="text"
                    value={form.autor}
                    onChange={(e) => setForm({ ...form, autor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-zinc-950/60 rounded-xl border border-zinc-800">
                <input
                  type="checkbox"
                  id="fixarAviso"
                  checked={form.fixado}
                  onChange={(e) => setForm({ ...form, fixado: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="fixarAviso" className="text-zinc-300 font-semibold cursor-pointer">
                  Fixar no topo do mural oficial
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
                >
                  Publicar no Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de Comunicados */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
