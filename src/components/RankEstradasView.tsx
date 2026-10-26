import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Flame,
  Fuel,
  Wrench,
  Search,
  FileDown,
  Award,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Bike,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Associado, Abastecimento, Manutencao, ConfiguracaoClube } from '../types';
import { calcularRankEstradas, exportarRankEstradasPdf, RankMemberData } from '../services/rankEstradasPdfService';

interface Props {
  associados: Associado[];
  abastecimentos: Abastecimento[];
  manutencoes: Manutencao[];
  config: ConfiguracaoClube;
  onOpenManutencao?: () => void;
}

export const RankEstradasView: React.FC<Props> = ({
  associados,
  abastecimentos,
  manutencoes,
  config,
  onOpenManutencao,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'Diamante' | 'Ouro' | 'Prata' | 'Bronze'>('todos');
  const [isExporting, setIsExporting] = useState(false);

  const fullRank = useMemo(() => {
    return calcularRankEstradas(associados, abastecimentos, manutencoes);
  }, [associados, abastecimentos, manutencoes]);

  const filteredRank = useMemo(() => {
    return fullRank.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.associado.nome.toLowerCase().includes(q) ||
        (item.associado.nomeGuerra && item.associado.nomeGuerra.toLowerCase().includes(q)) ||
        (item.associado.numeroAssociado && item.associado.numeroAssociado.toLowerCase().includes(q));

      const matchFilter =
        selectedFilter === 'todos' || item.nivelElite === selectedFilter;

      return matchSearch && matchFilter;
    });
  }, [fullRank, searchTerm, selectedFilter]);

  const top3 = fullRank.slice(0, 3);
  const totalKmGeral = fullRank.reduce((acc, c) => acc + c.kmTotal, 0);
  const totalLitrosGeral = fullRank.reduce((acc, c) => acc + c.totalLitros, 0);
  const totalGastoFrota = fullRank.reduce((acc, c) => acc + c.totalGastoCombustivel + c.totalGastoManutencao, 0);

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await exportarRankEstradasPdf(fullRank, config);
    } catch (err) {
      console.error('Erro ao exportar PDF do Rank de Estradas:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-amber-400">
          <Trophy className="w-64 h-64" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>Telemetria Oficial da Estrada</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 font-heading">
              Rank de Estradas — Motoqueiros de Elite
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Consolidação de odômetro, abastecimentos e manutenções preventivas registradas. Os verdadeiros estradeiros que mantêm a bandeira do clube no asfalto!
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Gerando Relatório...' : 'Exportar Ranking (PDF)'}</span>
            </button>

            {onOpenManutencao && (
              <button
                type="button"
                onClick={onOpenManutencao}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium text-xs transition-all cursor-pointer"
              >
                <Fuel className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Lançar Odômetro</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-zinc-400">Total KM Percorridos</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
              {totalKmGeral.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">km</span>
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-zinc-400">Combustível Queimado</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-100 mt-0.5">
              {totalLitrosGeral.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-xs font-normal text-zinc-400">L</span>
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-zinc-400">Pilotos Classificados</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {fullRank.length} <span className="text-xs font-normal text-zinc-400">irmãos</span>
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-zinc-400">Investimento Total na Frota</p>
            <p className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">
              R$ {totalGastoFrota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Podium Top 3 */}
      {top3.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-zinc-100">Pódio da Estrada — Os 3 Maiores Rodadores</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1st Place */}
            {top3[0] && (
              <div className="md:order-2 bg-gradient-to-b from-amber-500/15 via-zinc-900 to-zinc-950 border-2 border-amber-500 rounded-2xl p-5 relative shadow-xl shadow-amber-500/10 flex flex-col justify-between">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>1º Lugar • Elite Diamante</span>
                </div>

                <div className="pt-2 text-center space-y-2">
                  <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg">
                    {top3[0].associado.fotoUrl ? (
                      <img
                        src={top3[0].associado.fotoUrl}
                        alt={top3[0].associado.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-amber-400 font-black text-xl">
                        {top3[0].associado.nome.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-100">{top3[0].associado.nome}</h3>
                    <p className="text-xs font-semibold text-amber-400">
                      "{top3[0].associado.nomeGuerra || 'Estradeiro'}" • {top3[0].associado.cargo || 'Membro'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Matrícula: {top3[0].associado.numeroAssociado || '---'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/20 bg-amber-500/5 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Quilometragem Acumulada</p>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">
                    {top3[0].kmTotal.toLocaleString('pt-BR')} <span className="text-sm font-normal text-zinc-300">KM</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 mt-2">
                    <span>⛽ {top3[0].totalLitros.toFixed(0)}L</span>
                    <span>🔧 R$ {top3[0].totalGastoManutencao.toFixed(0)} manut.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2nd Place */}
            {top3[1] && (
              <div className="md:order-1 bg-zinc-900 border border-zinc-700 rounded-2xl p-5 relative shadow-lg flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-zinc-300 text-zinc-950 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow">
                  <Medal className="w-3.5 h-3.5" />
                  <span>2º Lugar • Elite Ouro</span>
                </div>

                <div className="pt-2 text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full p-1 bg-gradient-to-tr from-zinc-400 to-zinc-200">
                    {top3[1].associado.fotoUrl ? (
                      <img
                        src={top3[1].associado.fotoUrl}
                        alt={top3[1].associado.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-black text-lg">
                        {top3[1].associado.nome.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">{top3[1].associado.nome}</h3>
                    <p className="text-xs font-semibold text-zinc-300">
                      "{top3[1].associado.nomeGuerra || 'Estradeiro'}" • {top3[1].associado.cargo || 'Membro'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Matrícula: {top3[1].associado.numeroAssociado || '---'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 bg-zinc-800/40 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Quilometragem Acumulada</p>
                  <p className="text-xl font-black text-zinc-200 mt-0.5">
                    {top3[1].kmTotal.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">KM</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 mt-2">
                    <span>⛽ {top3[1].totalLitros.toFixed(0)}L</span>
                    <span>🔧 R$ {top3[1].totalGastoManutencao.toFixed(0)} manut.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="md:order-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-5 relative shadow-lg flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-700 text-amber-100 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow">
                  <Medal className="w-3.5 h-3.5" />
                  <span>3º Lugar • Elite Prata</span>
                </div>

                <div className="pt-2 text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-700 to-amber-600">
                    {top3[2].associado.fotoUrl ? (
                      <img
                        src={top3[2].associado.fotoUrl}
                        alt={top3[2].associado.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 font-black text-lg">
                        {top3[2].associado.nome.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">{top3[2].associado.nome}</h3>
                    <p className="text-xs font-semibold text-amber-500">
                      "{top3[2].associado.nomeGuerra || 'Estradeiro'}" • {top3[2].associado.cargo || 'Membro'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Matrícula: {top3[2].associado.numeroAssociado || '---'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 bg-zinc-800/40 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Quilometragem Acumulada</p>
                  <p className="text-xl font-black text-amber-500 mt-0.5">
                    {top3[2].kmTotal.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">KM</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 mt-2">
                    <span>⛽ {top3[2].totalLitros.toFixed(0)}L</span>
                    <span>🔧 R$ {top3[2].totalGastoManutencao.toFixed(0)} manut.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, guerra ou matrícula..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'Diamante', 'Ouro', 'Prata', 'Bronze'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {filter === 'todos' ? 'Todos os Pilotos' : `Elite ${filter}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ranking Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center w-16">Posição</th>
                <th className="py-3 px-4">Piloto / Integrante</th>
                <th className="py-3 px-4">Cargo & Matrícula</th>
                <th className="py-3 px-4 text-right">Quilometragem Total</th>
                <th className="py-3 px-4 text-right">Combustível Total</th>
                <th className="py-3 px-4 text-right">Gasto Manutenção</th>
                <th className="py-3 px-4 text-center">Insígnia de Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredRank.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Bike className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="font-medium text-sm">Nenhum integrante encontrado</p>
                    <p className="text-xs text-zinc-600">Ajuste os filtros de busca para visualizar os registros.</p>
                  </td>
                </tr>
              ) : (
                filteredRank.map((item) => {
                  let badgeColor = 'bg-zinc-800 text-zinc-300 border-zinc-700';
                  if (item.nivelElite === 'Diamante') {
                    badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
                  } else if (item.nivelElite === 'Ouro') {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  } else if (item.nivelElite === 'Prata') {
                    badgeColor = 'bg-zinc-300/20 text-zinc-200 border-zinc-400/40';
                  } else if (item.nivelElite === 'Bronze') {
                    badgeColor = 'bg-amber-700/20 text-amber-400 border-amber-700/40';
                  }

                  return (
                    <tr key={item.associado.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        {item.posicao === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-zinc-950 font-black text-xs shadow-md">
                            🥇
                          </span>
                        ) : item.posicao === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-300 text-zinc-950 font-black text-xs shadow-md">
                            🥈
                          </span>
                        ) : item.posicao === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs shadow-md">
                            🥉
                          </span>
                        ) : (
                          <span className="font-bold text-zinc-400 text-xs">#{item.posicao}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.associado.fotoUrl ? (
                              <img
                                src={item.associado.fotoUrl}
                                alt={item.associado.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-zinc-400 text-xs">
                                {item.associado.nome.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-100">{item.associado.nome}</p>
                            <p className="text-[11px] text-amber-400 font-medium">
                              "{item.associado.nomeGuerra || 'Estradeiro'}"
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-zinc-200 font-medium">{item.associado.cargo || 'Membro'}</p>
                        <p className="text-[11px] text-zinc-500">{item.associado.numeroAssociado || '---'}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-amber-400 text-sm">
                          {item.kmTotal.toLocaleString('pt-BR')}
                        </span>{' '}
                        <span className="text-[11px] text-zinc-500">km</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-zinc-200">{item.totalLitros.toFixed(1)}</span>{' '}
                        <span className="text-[11px] text-zinc-500">L</span>
                        <p className="text-[10px] text-zinc-500">
                          R$ {item.totalGastoCombustivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-zinc-200">
                          R$ {item.totalGastoManutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeColor}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Elite {item.nivelElite}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
