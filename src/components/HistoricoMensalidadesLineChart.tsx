import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Percent,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { Mensalidade, UserRole } from '../types';

interface Props {
  mensalidades: Mensalidade[];
  activeRole: UserRole;
  isAssociadoView?: boolean;
  associadoNome?: string;
  className?: string;
}

export interface MesHistoricoData {
  mesLabel: string;
  fullLabel: string;
  mes: number;
  ano: number;
  valorPago: number;
  valorPendente: number;
  totalValor: number;
  qtdPagas: number;
  qtdPendentes: number;
  totalQtd: number;
  taxaAdimplencia: number;
  mensalidadesMes: Mensalidade[];
}

export const HistoricoMensalidadesLineChart: React.FC<Props> = ({
  mensalidades,
  activeRole,
  isAssociadoView = false,
  associadoNome,
  className = '',
}) => {
  const [metric, setMetric] = useState<'valor' | 'quantidade'>('valor');
  const [showPagas, setShowPagas] = useState(true);
  const [showPendentes, setShowPendentes] = useState(true);
  const [showTaxaLinha, setShowTaxaLinha] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Calcula os últimos 6 meses cronológicos baseados na data atual (Outubro/2026 de referência)
  const ultimos6MesesData: MesHistoricoData[] = useMemo(() => {
    const dataRef = new Date();
    const mesesArr: { mes: number; ano: number; label: string; fullLabel: string }[] = [];

    const shortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const fullNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(dataRef.getFullYear(), dataRef.getMonth() - i, 1);
      const m = d.getMonth() + 1; // 1 a 12
      const y = d.getFullYear();
      mesesArr.push({
        mes: m,
        ano: y,
        label: `${shortNames[m - 1]}/${String(y).slice(-2)}`,
        fullLabel: `${fullNames[m - 1]} de ${y}`,
      });
    }

    return mesesArr.map((mObj) => {
      const doMes = mensalidades.filter((item) => {
        const itemMes = Number(item.mes);
        const itemAno = Number(item.ano);
        if (itemMes === mObj.mes && itemAno === mObj.ano) return true;
        if (item.competencia && item.competencia.toLowerCase().includes(mObj.label.toLowerCase())) return true;
        if (item.competencia && item.competencia.toLowerCase().includes(fullNames[mObj.mes - 1].toLowerCase())) return true;
        return false;
      });

      const pagas = doMes.filter((item) => item.status === 'pago');
      const pendentes = doMes.filter((item) => item.status === 'pendente' || item.status === 'atrasado');

      const valorPago = pagas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
      const valorPendente = pendentes.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
      const totalValor = valorPago + valorPendente;
      const taxaAdimplencia =
        totalValor > 0
          ? Math.round((valorPago / totalValor) * 100)
          : pagas.length > 0
          ? 100
          : 0;

      return {
        mesLabel: mObj.label,
        fullLabel: mObj.fullLabel,
        mes: mObj.mes,
        ano: mObj.ano,
        valorPago: Number(valorPago.toFixed(2)),
        valorPendente: Number(valorPendente.toFixed(2)),
        totalValor: Number(totalValor.toFixed(2)),
        qtdPagas: pagas.length,
        qtdPendentes: pendentes.length,
        totalQtd: doMes.length,
        taxaAdimplencia,
        mensalidadesMes: doMes,
      };
    });
  }, [mensalidades]);

  // Estatísticas consolidadas dos 6 meses
  const kpis6Meses = useMemo(() => {
    const totalPago = ultimos6MesesData.reduce((acc, curr) => acc + curr.valorPago, 0);
    const totalPendente = ultimos6MesesData.reduce((acc, curr) => acc + curr.valorPendente, 0);
    const totalQtdPagas = ultimos6MesesData.reduce((acc, curr) => acc + curr.qtdPagas, 0);
    const totalQtdPendentes = ultimos6MesesData.reduce((acc, curr) => acc + curr.qtdPendentes, 0);
    const somaTotal = totalPago + totalPendente;
    const taxaGeral = somaTotal > 0 ? Math.round((totalPago / somaTotal) * 100) : 0;

    // Melhor mês (maior valor arrecadado)
    const melhorMes = [...ultimos6MesesData].sort((a, b) => b.valorPago - a.valorPago)[0];

    return {
      totalPago,
      totalPendente,
      totalQtdPagas,
      totalQtdPendentes,
      taxaGeral,
      melhorMesLabel: melhorMes ? `${melhorMes.mesLabel} (R$ ${melhorMes.valorPago.toFixed(2)})` : 'N/A',
    };
  }, [ultimos6MesesData]);

  // Detalhe do mês selecionado
  const mesSelecionadoData = useMemo(() => {
    if (!selectedMonth) return null;
    return ultimos6MesesData.find((d) => d.mesLabel === selectedMonth) || null;
  }, [selectedMonth, ultimos6MesesData]);

  return (
    <div
      className={`rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden transition-all backdrop-blur-md ${className}`}
    >
      {/* Header do Gráfico */}
      <div className="p-5 sm:p-6 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-zinc-100 font-heading">
              {isAssociadoView
                ? `Histórico Pessoal de Mensalidades (Últimos 6 Meses)`
                : `Histórico de Mensalidades (Últimos 6 Meses)`}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Recharts Interativo
            </span>
            {associadoNome && isAssociadoView && (
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                &bull; Integrante: <strong className="text-zinc-200">{associadoNome}</strong>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Comparativo cronológico de mensalidades quitadas vs. pendentes/atrasadas com taxa de adimplência.
          </p>
        </div>

        {/* Controles de Visualização: Métrica e Colapso */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Seletor de Métrica: Valores (R$) vs Quantidade */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setMetric('valor')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                metric === 'valor'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Exibir curvas em Valores Monetários (R$)"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Valores (R$)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric('quantidade')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                metric === 'quantidade'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Exibir curvas em Quantidade de Títulos"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Nº Títulos</span>
            </button>
          </div>

          {/* Botão de Expandir / Recolher */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer"
            title={isExpanded ? 'Recolher gráfico' : 'Expandir gráfico'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* KPIs Resumo dos Últimos 6 Meses */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Total Pago */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Total Pago (6m)
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {kpis6Meses.totalQtdPagas} títulos
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                R$ {kpis6Meses.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-zinc-500">Recursos confirmados no caixa</p>
            </div>

            {/* KPI 2: Total Pendente */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5" /> Pendente / Atraso (6m)
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {kpis6Meses.totalQtdPendentes} títulos
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                R$ {kpis6Meses.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-zinc-500">Valores em aberto ou aguardando PIX</p>
            </div>

            {/* KPI 3: Taxa de Adimplência */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-sky-400">
                  <Percent className="w-3.5 h-3.5" /> Média Adimplência
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    kpis6Meses.taxaGeral >= 80
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-amber-400 bg-amber-500/10'
                  }`}
                >
                  Meta: 85%
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-sky-400 font-mono">
                {kpis6Meses.taxaGeral}%
              </div>
              {/* Barra de Progresso */}
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    kpis6Meses.taxaGeral >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, kpis6Meses.taxaGeral))}%` }}
                />
              </div>
            </div>

            {/* KPI 4: Destaque */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" /> Mês com Maior Receita
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                  Pico 6m
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-zinc-100 font-mono truncate">
                {kpis6Meses.melhorMesLabel}
              </div>
              <p className="text-[10px] text-zinc-500 truncate">Melhor histórico do período</p>
            </div>
          </div>

          {/* Toggles das Linhas / Filtro Interativo */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
                Linhas do Gráfico:
              </span>

              {/* Toggle Linha Pagas */}
              <button
                type="button"
                onClick={() => setShowPagas((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer border ${
                  showPagas
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                    : 'bg-zinc-950 text-zinc-600 border-zinc-800 line-through opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>Pagas {metric === 'valor' ? '(R$)' : '(Qtd)'}</span>
              </button>

              {/* Toggle Linha Pendentes */}
              <button
                type="button"
                onClick={() => setShowPendentes((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer border ${
                  showPendentes
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                    : 'bg-zinc-950 text-zinc-600 border-zinc-800 line-through opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Pendentes / Atrasadas {metric === 'valor' ? '(R$)' : '(Qtd)'}</span>
              </button>

              {/* Toggle Linha Taxa Adimplência */}
              <button
                type="button"
                onClick={() => setShowTaxaLinha((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer border ${
                  showTaxaLinha
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 hover:bg-sky-500/25'
                    : 'bg-zinc-950 text-zinc-600 border-zinc-800 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                <span>Taxa de Adimplência (%)</span>
              </button>
            </div>

            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Limpar filtro ({selectedMonth})</span>
                <span className="text-zinc-500">&times;</span>
              </button>
            )}
          </div>

          {/* Gráfico de Linhas Recharts */}
          <div className="w-full h-80 sm:h-96 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ultimos6MesesData}
                margin={{ top: 20, right: showTaxaLinha ? 30 : 15, left: 10, bottom: 10 }}
                onClick={(e: any) => {
                  if (e && e.activeLabel) {
                    setSelectedMonth((prev) => (prev === e.activeLabel ? null : e.activeLabel));
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="mesLabel"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(val: number) =>
                    metric === 'valor' ? `R$ ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}` : `${val}`
                  }
                />
                {showTaxaLinha && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    stroke="#38bdf8"
                    tick={{ fill: '#38bdf8', fontSize: 11 }}
                    axisLine={{ stroke: '#0284c7' }}
                    tickFormatter={(val: number) => `${val}%`}
                  />
                )}
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload || !payload.length) return null;
                    const itemData: MesHistoricoData | undefined = ultimos6MesesData.find(
                      (d) => d.mesLabel === label
                    );
                    if (!itemData) return null;

                    return (
                      <div className="p-4 rounded-2xl bg-zinc-950/95 border border-zinc-700 shadow-2xl backdrop-blur-md min-w-[240px] text-zinc-100 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <div>
                            <span className="text-xs font-black uppercase text-amber-400 font-heading">
                              {itemData.fullLabel}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block">
                              Competência Oficial {itemData.mesLabel}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                            {itemData.totalQtd} títulos
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono">
                          {/* Linha Pagas */}
                          <div className="flex items-center justify-between text-emerald-400">
                            <span className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pagas:
                            </span>
                            <span className="font-black">
                              {metric === 'valor'
                                ? `R$ ${itemData.valorPago.toFixed(2)}`
                                : `${itemData.qtdPagas} título(s)`}
                            </span>
                          </div>

                          {/* Linha Pendentes */}
                          <div className="flex items-center justify-between text-amber-400">
                            <span className="flex items-center gap-1.5 font-bold">
                              <Clock className="w-3.5 h-3.5" /> Pendentes:
                            </span>
                            <span className="font-black">
                              {metric === 'valor'
                                ? `R$ ${itemData.valorPendente.toFixed(2)}`
                                : `${itemData.qtdPendentes} título(s)`}
                            </span>
                          </div>

                          {/* Total do Mês */}
                          <div className="flex items-center justify-between text-zinc-300 pt-1 border-t border-zinc-800/80">
                            <span className="font-semibold text-zinc-400">Total Previsto:</span>
                            <span className="font-bold">
                              {metric === 'valor'
                                ? `R$ ${itemData.totalValor.toFixed(2)}`
                                : `${itemData.totalQtd} título(s)`}
                            </span>
                          </div>
                        </div>

                        {/* Adimplência Badge */}
                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Percent className="w-3 h-3 text-sky-400" />
                            Taxa de Adimplência:
                          </span>
                          <span
                            className={`font-black font-mono ${
                              itemData.taxaAdimplencia >= 80 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {itemData.taxaAdimplencia}%
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value: string) => (
                    <span className="text-xs font-semibold text-zinc-300">{value}</span>
                  )}
                />

                {/* Linha de Mensalidades Pagas */}
                {showPagas && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={metric === 'valor' ? 'valorPago' : 'qtdPagas'}
                    name={metric === 'valor' ? 'Mensalidades Pagas (R$)' : 'Mensalidades Pagas (Qtd)'}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: '#10b981',
                      stroke: '#064e3b',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 8,
                      fill: '#34d399',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    animationDuration={1200}
                  />
                )}

                {/* Linha de Mensalidades Pendentes */}
                {showPendentes && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={metric === 'valor' ? 'valorPendente' : 'qtdPendentes'}
                    name={
                      metric === 'valor'
                        ? 'Mensalidades Pendentes / Atraso (R$)'
                        : 'Mensalidades Pendentes (Qtd)'
                    }
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: '#f59e0b',
                      stroke: '#78350f',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 8,
                      fill: '#fbbf24',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    animationDuration={1200}
                  />
                )}

                {/* Linha Opcional de Adimplência (%) */}
                {showTaxaLinha && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="taxaAdimplencia"
                    name="Taxa de Adimplência (%)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{
                      r: 4,
                      fill: '#38bdf8',
                      stroke: '#0369a1',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 7,
                      fill: '#7dd3fc',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    animationDuration={1200}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Grade de 6 Cartões Interativos por Mês (Toque para Filtrar/Inspecionar) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Selecione um mês para inspecionar os títulos detalhadamente:
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                Toque nos cards para filtrar a grade
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {ultimos6MesesData.map((m) => {
                const isSelected = selectedMonth === m.mesLabel;
                return (
                  <button
                    key={m.mesLabel}
                    type="button"
                    onClick={() => setSelectedMonth(isSelected ? null : m.mesLabel)}
                    className={`p-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : 'bg-zinc-950/70 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-zinc-200">
                        {m.mesLabel}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                          m.taxaAdimplencia >= 80
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {m.taxaAdimplencia}%
                      </span>
                    </div>

                    <div className="space-y-0.5 text-[11px] font-mono">
                      <div className="text-emerald-400 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Pago:</span>
                        <span className="font-bold">
                          {metric === 'valor' ? `R$ ${m.valorPago.toFixed(0)}` : `${m.qtdPagas} un`}
                        </span>
                      </div>
                      <div className="text-amber-400 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Pend:</span>
                        <span className="font-bold">
                          {metric === 'valor' ? `R$ ${m.valorPendente.toFixed(0)}` : `${m.qtdPendentes} un`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor ativo: Detalhamento do Mês Selecionado */}
          {mesSelecionadoData && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/40 animate-fade-in space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-sm font-black text-amber-300 font-heading">
                    Detalhamento do Mês: {mesSelecionadoData.fullLabel} ({mesSelecionadoData.mesLabel})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(null)}
                  className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  Fechar Detalhes
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Total Quitado</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    R$ {mesSelecionadoData.valorPago.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-zinc-400">({mesSelecionadoData.qtdPagas} pagas)</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Total em Aberto / Atrasado</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    R$ {mesSelecionadoData.valorPendente.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-zinc-400">({mesSelecionadoData.qtdPendentes} pendentes)</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Aderência de Pagamento</span>
                  <span className="text-base font-black text-sky-400 font-mono">
                    {mesSelecionadoData.taxaAdimplencia}% de adimplência
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
