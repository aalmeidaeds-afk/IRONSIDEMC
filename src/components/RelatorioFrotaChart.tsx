import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Veiculo, Manutencao, Associado, ConfiguracaoClube } from '../types';
import {
  Bike,
  Gauge,
  Wrench,
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  BarChart3,
  SlidersHorizontal,
  ExternalLink,
  FileDown,
} from 'lucide-react';
import { exportFrotaPdf } from '../services/pdfExportService';

interface Props {
  veiculos?: Veiculo[];
  manutencoes?: Manutencao[];
  associados?: Associado[];
  config?: ConfiguracaoClube;
  onNavigateTab?: (tab: string) => void;
}

// Fallback demo fleet if vehicles array is empty
const DEMO_FLEET_FALLBACK: Veiculo[] = [
  {
    id: 'veic-demo-01',
    associadoId: 'demo-1',
    marca: 'BMW',
    modelo: 'R 1250 GS Adventure',
    versao: 'Triple Black',
    ano: '2024',
    cor: 'Preto',
    placa: 'BRA2E19',
    kmAtual: 14500,
    tipo: 'moto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veic-demo-02',
    associadoId: 'demo-2',
    marca: 'Harley-Davidson',
    modelo: 'Ultra Limited 114',
    versao: 'Touring Glide',
    ano: '2023',
    cor: 'Vivid Black',
    placa: 'HD8X23',
    kmAtual: 28300,
    tipo: 'moto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veic-demo-03',
    associadoId: 'demo-3',
    marca: 'Triumph',
    modelo: 'Tiger 900 Rally Pro',
    versao: 'Sandstorm',
    ano: '2023',
    cor: 'Areia / Grafite',
    placa: 'TRI9E24',
    kmAtual: 18900,
    tipo: 'moto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veic-demo-04',
    associadoId: 'demo-4',
    marca: 'Honda',
    modelo: 'CRF 1100L Africa Twin',
    versao: 'Adventure Sports',
    ano: '2022',
    cor: 'Tricolor HRC',
    placa: 'ATW4M22',
    kmAtual: 34200,
    tipo: 'moto',
    createdAt: new Date().toISOString(),
  },
];

const DEMO_MANUTENCOES_FALLBACK: Manutencao[] = [
  {
    id: 'manu-demo-01',
    associadoId: 'demo-1',
    veiculoId: 'veic-demo-01',
    data: '10/10/2026',
    km: 14000,
    tipoServico: 'Revisão Periódica',
    descricao: 'Óleo Motul 7100, filtro K&N e revisão geral.',
    oficina: 'MotoTech Campinas',
    valor: 890,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manu-demo-02',
    associadoId: 'demo-1',
    veiculoId: 'veic-demo-01',
    data: '15/08/2026',
    km: 12200,
    tipoServico: 'Pneus e Balanceamento',
    descricao: 'Par de pneus Michelin Anakee Adventure.',
    oficina: 'Borracharia Alemão',
    valor: 2450,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manu-demo-03',
    associadoId: 'demo-2',
    veiculoId: 'veic-demo-02',
    data: '05/09/2026',
    km: 26500,
    tipoServico: 'Revisão Primária & Fluidos',
    descricao: 'Óleos de motor e primária, filtro cromado.',
    oficina: 'Oficina Custom',
    valor: 1850,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manu-demo-04',
    associadoId: 'demo-3',
    veiculoId: 'veic-demo-03',
    data: '22/09/2026',
    km: 18500,
    tipoServico: 'Pastilhas de Freio',
    descricao: 'Pastilhas sinterizadas Brembo dianteiras/traseiras.',
    oficina: 'MotoTech',
    valor: 640,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manu-demo-05',
    associadoId: 'demo-4',
    veiculoId: 'veic-demo-04',
    data: '18/07/2026',
    km: 30000,
    tipoServico: 'Kit Transmissão & Revisão 30k',
    descricao: 'Corrente DID Gold, coroa, pinhão e velas Iridium.',
    oficina: 'Oficina Central Duas Rodas',
    valor: 2190,
    createdAt: new Date().toISOString(),
  },
];

export const RelatorioFrotaChart: React.FC<Props> = ({
  veiculos = [],
  manutencoes = [],
  associados = [],
  config,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'individual' | 'marca' | 'custo_km'>('individual');
  const [sortBy, setSortBy] = useState<'km' | 'custo' | 'placa'>('km');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('todas');

  // Resolved datasets
  const activeVehicles = useMemo(() => {
    const list = veiculos.length > 0 ? veiculos : DEMO_FLEET_FALLBACK;
    // Filter only motorcycles or motorized club fleet
    return list.filter((v) => !v.tipo || v.tipo === 'moto' || v.tipo === 'outro');
  }, [veiculos]);

  const activeMaintenances = useMemo(() => {
    return manutencoes.length > 0 ? manutencoes : DEMO_MANUTENCOES_FALLBACK;
  }, [manutencoes]);

  // Unique brands
  const availableBrands = useMemo(() => {
    return Array.from(new Set(activeVehicles.map((v) => v.marca).filter(Boolean)));
  }, [activeVehicles]);

  // Map of maintenance totals per vehicle
  const maintenanceMap = useMemo(() => {
    const map = new Map<string, { totalGasto: number; qtdServicos: number; ultimoServico?: string }>();
    activeMaintenances.forEach((m) => {
      if (!m.veiculoId) return;
      const current = map.get(m.veiculoId) || { totalGasto: 0, qtdServicos: 0 };
      current.totalGasto += m.valor || 0;
      current.qtdServicos += 1;
      if (!current.ultimoServico || m.data) {
        current.ultimoServico = m.data;
      }
      map.set(m.veiculoId, current);
    });
    return map;
  }, [activeMaintenances]);

  // Process data per motorcycle
  const motorcycleData = useMemo(() => {
    let data = activeVehicles.map((v) => {
      const stats = maintenanceMap.get(v.id) || { totalGasto: 0, qtdServicos: 0 };
      // Find owner war name or civil name
      const owner = associados.find(
        (a) => a.id === v.associadoId || a.uid === v.associadoId
      );
      const ownerName = owner?.nomeGuerra || owner?.nome || v.associadoNome || 'Associado';

      // Short label for chart X-Axis: "Modelo (Placa)"
      const shortModel = v.modelo.length > 18 ? `${v.modelo.slice(0, 16)}...` : v.modelo;
      const label = `${v.marca} ${shortModel} (${v.placa})`;
      const custoPorKm = v.kmAtual > 0 ? Number((stats.totalGasto / v.kmAtual).toFixed(3)) : 0;

      return {
        id: v.id,
        marca: v.marca,
        modelo: v.modelo,
        versao: v.versao,
        placa: v.placa,
        ano: v.ano,
        cor: v.cor,
        kmAtual: v.kmAtual || 0,
        custoTotal: stats.totalGasto,
        qtdServicos: stats.qtdServicos,
        ultimoServico: stats.ultimoServico || 'Não registrado',
        ownerName,
        label,
        custoPorKm,
      };
    });

    // Apply Brand filter if set
    if (selectedBrandFilter !== 'todas') {
      data = data.filter((d) => d.marca === selectedBrandFilter);
    }

    // Sort data
    if (sortBy === 'km') {
      data.sort((a, b) => b.kmAtual - a.kmAtual);
    } else if (sortBy === 'custo') {
      data.sort((a, b) => b.custoTotal - a.custoTotal);
    } else {
      data.sort((a, b) => a.placa.localeCompare(b.placa));
    }

    return data;
  }, [activeVehicles, maintenanceMap, associados, selectedBrandFilter, sortBy]);

  // Process data grouped by Brand
  const brandGroupedData = useMemo(() => {
    const map = new Map<string, { marca: string; totalKm: number; totalCusto: number; count: number }>();
    activeVehicles.forEach((v) => {
      const brand = v.marca || 'Outras';
      const stats = maintenanceMap.get(v.id) || { totalGasto: 0, qtdServicos: 0 };
      const current = map.get(brand) || { marca: brand, totalKm: 0, totalCusto: 0, count: 0 };
      current.totalKm += v.kmAtual || 0;
      current.totalCusto += stats.totalGasto;
      current.count += 1;
      map.set(brand, current);
    });

    return Array.from(map.values()).sort((a, b) => b.totalKm - a.totalKm);
  }, [activeVehicles, maintenanceMap]);

  // Global fleet metrics
  const totalKmFrota = useMemo(() => {
    return activeVehicles.reduce((acc, curr) => acc + (curr.kmAtual || 0), 0);
  }, [activeVehicles]);

  const totalCustoManutencaoFrota = useMemo(() => {
    return activeMaintenances.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  }, [activeMaintenances]);

  const mediaKmPorMoto = activeVehicles.length > 0 ? Math.round(totalKmFrota / activeVehicles.length) : 0;
  const mediaCustoPorMoto = activeVehicles.length > 0 ? totalCustoManutencaoFrota / activeVehicles.length : 0;
  const custoMedioPorKm = totalKmFrota > 0 ? totalCustoManutencaoFrota / totalKmFrota : 0;

  // Custom Recharts Tooltip for the Fleet Chart
  const CustomFleetTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="rounded-2xl bg-zinc-950 border border-amber-500/50 p-4 shadow-2xl text-xs space-y-2 min-w-[240px]">
          <div className="border-b border-zinc-800 pb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
              {config?.nomeClube || 'Iron Side Road Rider M.C.'} • Relatório de Frota
            </span>
            <h4 className="text-sm font-extrabold text-zinc-100 font-heading mt-0.5">
              {item.marca} {item.modelo}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-300 font-bold">
                Placa: {item.placa}
              </span>
              <span className="text-[11px] text-zinc-400">
                Pilotada por: <strong className="text-zinc-200">{item.ownerName}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> Quilometragem:
              </span>
              <strong className="font-mono text-xs text-sky-300">
                {(item.kmAtual || 0).toLocaleString('pt-BR')} km
              </strong>
            </div>

            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Custo Manutenções:
              </span>
              <strong className="font-mono text-xs text-emerald-300">
                R$ {(item.custoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/80">
              <span>Serviços / Revisões:</span>
              <span className="font-mono font-semibold text-zinc-300">
                {item.qtdServicos || 0} registro(s)
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Custo Médio / KM:</span>
              <span className="font-mono font-semibold text-amber-400">
                R$ {(item.custoPorKm || 0).toFixed(3)}/km
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Brand Tooltip
  const CustomBrandTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 shadow-xl text-xs space-y-1 min-w-[180px]">
          <h5 className="font-bold text-amber-400 border-b border-zinc-800 pb-1">{item.marca}</h5>
          <p className="text-zinc-300">
            Motos no Clube: <strong className="font-mono text-zinc-100">{item.count}</strong>
          </p>
          <p className="text-sky-400">
            KM Total da Marca: <strong className="font-mono">{item.totalKm.toLocaleString()} km</strong>
          </p>
          <p className="text-emerald-400">
            Total em Manutenção: <strong className="font-mono">R$ {item.totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Bike className="w-3 h-3 text-amber-400" />
              Módulo de Telemetria &amp; Frota
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Recharts Dual-Axis Analytics
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-zinc-100 font-heading flex items-center gap-2">
            <span>Relatório de Frota: Quilometragem &amp; Custos de Manutenção</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Acompanhe o desgaste quilométrico e o custo acumulado em revisões de todas as motocicletas cadastradas no Moto Clube para prevenção de falhas e planejamento de comboios.
          </p>
        </div>

        {/* View Controls & Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'individual'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Por Motocicleta
            </button>
            <button
              type="button"
              onClick={() => setViewMode('marca')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'marca'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Por Marca
            </button>
          </div>

          {/* Export Fleet PDF Button with Official Branding Header */}
          {config && (
            <button
              type="button"
              onClick={() => {
                exportFrotaPdf(
                  activeVehicles,
                  activeMaintenances,
                  config,
                  viewMode === 'marca' ? 'Visão Agrupada por Montadora' : undefined
                );
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-semibold transition"
              title="Exportar Relatório Oficial da Frota em PDF com Brasão e Contatos"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar em PDF</span>
            </button>
          )}

          {/* Quick link to Maintenance Module */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('manutencao_abastecimento')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-semibold transition"
              title="Abrir Módulo Completo de Manutenção & Abastecimento"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Gerenciar Manutenções</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Motos na Frota */}
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>Motos Cadastradas</span>
            <Bike className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
              {activeVehicles.length}
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Frota operacional</p>
          </div>
        </div>

        {/* KPI 2: Total KM Rodados */}
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>Quilometragem Total</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
              {totalKmFrota.toLocaleString('pt-BR')}
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">KM acumulados na estrada</p>
          </div>
        </div>

        {/* KPI 3: Custo Total Manutenções */}
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>Total em Manutenções</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              R$ {totalCustoManutencaoFrota.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Revisões e peças</p>
          </div>
        </div>

        {/* KPI 4: Média KM / Moto */}
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>Média KM / Moto</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
              {mediaKmPorMoto.toLocaleString('pt-BR')} <span className="text-xs text-zinc-400 font-normal">km</span>
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Uso médio do clube</p>
          </div>
        </div>

        {/* KPI 5: Custo Médio / KM */}
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>Custo / KM Rodado</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              R$ {custoMedioPorKm.toFixed(2)}
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Eficiência operacional</p>
          </div>
        </div>
      </div>

      {/* Filter and Sort Subbar (when in Individual view) */}
      {viewMode === 'individual' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-zinc-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-500" /> Filtrar Marca:
            </span>
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="todas">Todas as Marcas ({activeVehicles.length})</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Ordenar por:</span>
            <button
              type="button"
              onClick={() => setSortBy('km')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                sortBy === 'km'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              Maior Quilometragem
            </button>
            <button
              type="button"
              onClick={() => setSortBy('custo')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                sortBy === 'custo'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              Maior Custo Manutenção
            </button>
          </div>
        </div>
      )}

      {/* Main Chart Area */}
      <div className="pt-2">
        {viewMode === 'individual' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-500" />
                <strong className="text-zinc-200">Quilometragem (KM)</strong> — Eixo Esquerdo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <strong className="text-zinc-200">Custos de Manutenção (R$)</strong> — Eixo Direito
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={motorcycleData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#3f3f46' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  {/* Left Axis: Mileage in KM */}
                  <YAxis
                    yAxisId="left"
                    stroke="#38bdf8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#0284c7' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k km`}
                  />
                  {/* Right Axis: Maintenance Cost in R$ */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#059669' }}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomFleetTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  />
                  <Bar
                    yAxisId="left"
                    name="Quilometragem Atual (KM)"
                    dataKey="kmAtual"
                    fill="#0ea5e9"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    yAxisId="right"
                    name="Custo Total Manutenções (R$)"
                    dataKey="custoTotal"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* By Brand Mode */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <strong className="text-zinc-200">Quilometragem Acumulada por Fabricante (KM)</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <strong className="text-zinc-200">Gasto em Revisões por Fabricante (R$)</strong>
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={brandGroupedData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="marca"
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#3f3f46' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#f59e0b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#d97706' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k km`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#059669' }}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomBrandTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  />
                  <Bar
                    yAxisId="left"
                    name="Quilometragem Total (KM)"
                    dataKey="totalKm"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  />
                  <Bar
                    yAxisId="right"
                    name="Total Gasto em Manutenções (R$)"
                    dataKey="totalCusto"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Summary Table of All Registered Motorcycles */}
      <div className="pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Quadro Detalhado da Frota ({motorcycleData.length} motocicletas listadas)
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            Validação de Odômetro &amp; Histórico
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 uppercase text-[10px] text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Placa &amp; Modelo</th>
                <th className="py-2.5 px-3">Piloto (Associado)</th>
                <th className="py-2.5 px-3">Quilometragem</th>
                <th className="py-2.5 px-3">Custos de Manutenção</th>
                <th className="py-2.5 px-3">Revisões</th>
                <th className="py-2.5 px-3">Custo / KM</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {motorcycleData.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-zinc-100 font-sans">{m.marca} {m.modelo}</div>
                    <span className="text-[10px] text-amber-400 font-mono">{m.placa} • {m.ano}</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-zinc-200">
                    {m.ownerName}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-sky-400">
                    {m.kmAtual.toLocaleString('pt-BR')} km
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    R$ {m.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300">
                    {m.qtdServicos} {m.qtdServicos === 1 ? 'serviço' : 'serviços'}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    R$ {m.custoPorKm.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Apta para Estrada
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
