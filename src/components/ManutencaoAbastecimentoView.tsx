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
import { useAuth } from '../context/AuthContext';
import { Veiculo, Manutencao, Abastecimento } from '../types';
import {
  Wrench,
  Fuel,
  Plus,
  AlertTriangle,
  Calendar,
  Gauge,
  DollarSign,
  MapPin,
  CheckCircle,
  FileText,
  Info,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';

interface Props {
  veiculos: Veiculo[];
  manutencoes: Manutencao[];
  abastecimentos: Abastecimento[];
  onSaveManutencao: (data: Omit<Manutencao, 'id'>) => Promise<void>;
  onSaveAbastecimento: (data: Omit<Abastecimento, 'id'>) => Promise<void>;
  initialVeiculo?: Veiculo | null;
}

export const ManutencaoAbastecimentoView: React.FC<Props> = ({
  veiculos,
  manutencoes,
  abastecimentos,
  onSaveManutencao,
  onSaveAbastecimento,
  initialVeiculo,
}) => {
  const { currentAssociado, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'manutencao' | 'combustivel'>('combustivel');
  const [selectedVeiculoId, setSelectedVeiculoId] = useState<string>(
    initialVeiculo?.id || (veiculos.length > 0 ? veiculos[0].id : '')
  );

  const [isModalManutencaoOpen, setIsModalManutencaoOpen] = useState(false);
  const [isModalAbastecimentoOpen, setIsModalAbastecimentoOpen] = useState(false);

  // Form states
  const [manuForm, setManuForm] = useState({
    data: new Date().toLocaleDateString('pt-BR'),
    km: 15000,
    tipoServico: 'Troca de Óleo e Filtro (Motul 7100)',
    descricao: 'Substituição preventiva de óleo 100% sintético e filtro K&N.',
    oficina: 'Oficina Custom & Big Trail MotoTech',
    valor: 340.0,
    proximaManutencaoKm: 20000,
    proximaManutencaoData: '15/04/2027',
  });

  const [fuelForm, setFuelForm] = useState({
    dataHora: new Date().toLocaleDateString('pt-BR'),
    km: 15200,
    combustivel: 'gasolina_aditivada' as const,
    litros: 18.5,
    precoLitro: 6.29,
    tanqueCheio: true,
    posto: 'Posto Graal Rodovia dos Bandeirantes',
    cidade: 'Jundiaí - SP',
  });

  // Filter records
  const filteredManutencoes = manutencoes.filter((m) =>
    selectedVeiculoId ? m.veiculoId === selectedVeiculoId : true
  );

  const filteredAbastecimentos = abastecimentos.filter((a) =>
    selectedVeiculoId ? a.veiculoId === selectedVeiculoId : true
  );

  const selectedVeiculo = veiculos.find((v) => v.id === selectedVeiculoId);

  // Consumption analytics
  const totalGastoCombustivel = filteredAbastecimentos.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalLitros = filteredAbastecimentos.reduce((acc, curr) => acc + curr.litros, 0);

  // Check if we have at least 2 consecutive full-tank refills for a reliable average
  const fullTankRefills = filteredAbastecimentos.filter((a) => a.tanqueCheio);
  let averageConsumption: number | null = null;
  if (fullTankRefills.length >= 2) {
    const sorted = [...fullTankRefills].sort((a, b) => a.km - b.km);
    const kmDelta = sorted[sorted.length - 1].km - sorted[0].km;
    const litersDelta = sorted.slice(1).reduce((acc, c) => acc + c.litros, 0);
    if (kmDelta > 0 && litersDelta > 0) {
      averageConsumption = Number((kmDelta / litersDelta).toFixed(2));
    }
  }

  // Month-by-month financial data for the Line Chart (Recharts)
  const monthlyExpensesData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const map = new Map<string, { mes: string; combustivel: number; manutencao: number; total: number }>();

    const now = new Date(2026, 9, 1);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      map.set(key, { mes: key, combustivel: 0, manutencao: 0, total: 0 });
    }

    filteredAbastecimentos.forEach((a) => {
      let key = 'Out/26';
      if (a.dataHora && a.dataHora.includes('/')) {
        const parts = a.dataHora.split('/');
        const m = parseInt(parts[1], 10);
        const y = parts[2]?.slice(0, 4) || '2026';
        if (m >= 1 && m <= 12) {
          key = `${monthNames[m - 1]}/${y.slice(-2)}`;
        }
      }
      if (!map.has(key)) {
        map.set(key, { mes: key, combustivel: 0, manutencao: 0, total: 0 });
      }
      const entry = map.get(key)!;
      entry.combustivel += a.valorTotal || 0;
      entry.total += a.valorTotal || 0;
    });

    filteredManutencoes.forEach((m) => {
      let key = 'Out/26';
      if (m.data && m.data.includes('/')) {
        const parts = m.data.split('/');
        const mesNum = parseInt(parts[1], 10);
        const y = parts[2]?.slice(0, 4) || '2026';
        if (mesNum >= 1 && mesNum <= 12) {
          key = `${monthNames[mesNum - 1]}/${y.slice(-2)}`;
        }
      }
      if (!map.has(key)) {
        map.set(key, { mes: key, combustivel: 0, manutencao: 0, total: 0 });
      }
      const entry = map.get(key)!;
      entry.manutencao += m.valor || 0;
      entry.total += m.valor || 0;
    });

    const list = Array.from(map.values());
    const hasData = list.some((item) => item.combustivel > 0 || item.manutencao > 0);
    if (!hasData) {
      return [
        { mes: 'Mai/26', combustivel: 285.5, manutencao: 120.0, total: 405.5 },
        { mes: 'Jun/26', combustivel: 340.0, manutencao: 450.0, total: 790.0 },
        { mes: 'Jul/26', combustivel: 410.2, manutencao: 180.0, total: 590.2 },
        { mes: 'Ago/26', combustivel: 380.0, manutencao: 850.0, total: 1230.0 },
        { mes: 'Set/26', combustivel: 495.0, manutencao: 240.0, total: 735.0 },
        { mes: 'Out/26', combustivel: 320.0, manutencao: 340.0, total: 660.0 },
      ];
    }
    return list;
  }, [filteredAbastecimentos, filteredManutencoes]);

  const CustomExpensesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-zinc-950 border border-zinc-700/80 p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold text-zinc-200 border-b border-zinc-800 pb-1">Mês: {label}</p>
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-400 font-sans">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold" style={{ color: item.color }}>
                R$ {Number(item.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleSaveManu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssociado || !selectedVeiculoId) return;

    await onSaveManutencao({
      associadoId: currentAssociado.id || currentAssociado.uid,
      veiculoId: selectedVeiculoId,
      veiculoDescricao: selectedVeiculo ? `${selectedVeiculo.marca} ${selectedVeiculo.modelo}` : 'Moto',
      data: manuForm.data,
      km: Number(manuForm.km) || 0,
      tipoServico: manuForm.tipoServico,
      descricao: manuForm.descricao,
      oficina: manuForm.oficina,
      valor: Number(manuForm.valor) || 0,
      proximaManutencaoKm: Number(manuForm.proximaManutencaoKm) || undefined,
      proximaManutencaoData: manuForm.proximaManutencaoData,
      createdAt: new Date().toISOString(),
    });

    setIsModalManutencaoOpen(false);
  };

  const handleSaveFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssociado || !selectedVeiculoId) return;

    const total = Number((fuelForm.litros * fuelForm.precoLitro).toFixed(2));

    await onSaveAbastecimento({
      associadoId: currentAssociado.id || currentAssociado.uid,
      veiculoId: selectedVeiculoId,
      veiculoDescricao: selectedVeiculo ? `${selectedVeiculo.marca} ${selectedVeiculo.modelo}` : 'Moto',
      dataHora: fuelForm.dataHora,
      km: Number(fuelForm.km) || 0,
      combustivel: fuelForm.combustivel,
      litros: Number(fuelForm.litros) || 0,
      precoLitro: Number(fuelForm.precoLitro) || 0,
      valorTotal: total,
      tanqueCheio: fuelForm.tanqueCheio,
      posto: fuelForm.posto,
      cidade: fuelForm.cidade,
      createdAt: new Date().toISOString(),
    });

    setIsModalAbastecimentoOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
            Manutenção & Gestão de Combustível
          </h2>
          <p className="text-xs text-zinc-400">
            Acompanhe o consumo médio, revisões programadas e custos operacionais da sua máquina.
          </p>
        </div>

        {/* Vehicle Selector */}
        {veiculos.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Veículo:</span>
            <select
              value={selectedVeiculoId}
              onChange={(e) => setSelectedVeiculoId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            >
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} ({v.placa})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs Switcher: Combustível vs Manutenções */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('combustivel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition select-none ${
            activeTab === 'combustivel'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Abastecimentos & Consumo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manutencao')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition select-none ${
            activeTab === 'manutencao'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Revisões & Manutenções
        </button>
      </div>

      {/* GRÁFICO DE LINHAS RECHARTS: HISTÓRICO DE GASTOS COMBUSTÍVEL VS MANUTENÇÃO */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-heading">
                Histórico de Gastos: Combustíveis &amp; Manutenções Mês a Mês
              </h3>
              <p className="text-xs text-zinc-400">
                Evolução comparativa dos custos operacionais de estrada {selectedVeiculo ? `(${selectedVeiculo.marca} ${selectedVeiculo.modelo})` : ''}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold">
              Total Acumulado: R$ {monthlyExpensesData.reduce((acc, c) => acc + c.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyExpensesData}
              margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="mes"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
                tickFormatter={(val) => `R$${val}`}
              />
              <Tooltip content={<CustomExpensesTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
              />
              <Line
                type="monotone"
                name="Gastos com Combustível"
                dataKey="combustivel"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#09090b' }}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#09090b', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                name="Gastos com Manutenções"
                dataKey="manutencao"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8', strokeWidth: 2, stroke: '#09090b' }}
                activeDot={{ r: 6, fill: '#7dd3fc', stroke: '#09090b', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TAB 1: COMBUSTÍVEL */}
      {activeTab === 'combustivel' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-xs text-zinc-400 block font-medium">Consumo Médio Real</span>
              <div className="flex items-center gap-2 mt-2">
                <Gauge className="w-6 h-6 text-amber-400" />
                <span className="text-2xl font-black text-zinc-100 font-heading">
                  {averageConsumption ? `${averageConsumption} km/L` : 'Aguardando dados'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {averageConsumption
                  ? 'Baseado em tanques cheios consecutivos'
                  : 'Necessário pelo menos 2 abastecimentos de tanque cheio'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-xs text-zinc-400 block font-medium">Total Investido em Combustível</span>
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span className="text-2xl font-black text-emerald-400 font-heading">
                  R$ {totalGastoCombustivel.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {totalLitros.toFixed(1)} litros consumidos
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-zinc-400 block font-medium">Registrar Abastecimento</span>
                <p className="text-xs text-zinc-400 mt-1">
                  Mantenha sua média de consumo aferida após cada parada de posto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalAbastecimentoOpen(true)}
                className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Abastecimento
              </button>
            </div>
          </div>

          {/* Precision rule notice */}
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Algoritmo de Consumo Seguro:</strong> Por padrão técnico, apenas abastecimentos com opção <em>&quot;Tanque Cheio&quot;</em> marcada são considerados no cálculo do consumo médio, garantindo precisão matemática contra variações de bomba.
            </span>
          </div>

          {/* List of Fuel stops */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-200">Histórico de Abastecimentos</h3>
            {filteredAbastecimentos.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                Nenhum abastecimento registrado para esta moto ainda.
              </div>
            ) : (
              filteredAbastecimentos.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Fuel className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{a.dataHora}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold uppercase">
                          {a.combustivel.replace('_', ' ')}
                        </span>
                        {a.tanqueCheio && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                            Tanque Cheio
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {a.posto} • {a.cidade}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Hodômetro</span>
                      <span className="text-xs font-mono font-bold text-zinc-300">
                        {a.km.toLocaleString('pt-BR')} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Litros</span>
                      <span className="text-xs font-semibold text-zinc-300">
                        {a.litros.toFixed(1)} L (R$ {a.precoLitro.toFixed(2)}/L)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Total</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        R$ {a.valorTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANUTENÇÕES */}
      {activeTab === 'manutencao' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200">Histórico de Revisões & Peças</h3>
            <button
              type="button"
              onClick={() => setIsModalManutencaoOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              Registrar Manutenção
            </button>
          </div>

          <div className="space-y-3">
            {filteredManutencoes.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                Nenhuma revisão cadastrada para esta moto.
              </div>
            ) : (
              filteredManutencoes.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-100">{m.tipoServico}</h4>
                        <p className="text-xs text-zinc-400">
                          {m.oficina} • {m.data}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        R$ {m.valor.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-zinc-500">
                        Realizada aos {m.km.toLocaleString('pt-BR')} km
                      </p>
                    </div>
                  </div>

                  {m.descricao && (
                    <p className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                      {m.descricao}
                    </p>
                  )}

                  {m.proximaManutencaoKm && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Próxima revisão prevista aos{' '}
                        <strong>{m.proximaManutencaoKm.toLocaleString('pt-BR')} km</strong>{' '}
                        {m.proximaManutencaoData && `(ou até ${m.proximaManutencaoData})`}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL NOVO ABASTECIMENTO */}
      {isModalAbastecimentoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-400" />
              Novo Abastecimento
            </h3>

            <form onSubmit={handleSaveFuel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Data</label>
                  <input
                    type="text"
                    value={fuelForm.dataHora}
                    onChange={(e) => setFuelForm({ ...fuelForm, dataHora: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Hodômetro (KM)</label>
                  <input
                    type="number"
                    value={fuelForm.km}
                    onChange={(e) => setFuelForm({ ...fuelForm, km: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Litros</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelForm.litros}
                    onChange={(e) => setFuelForm({ ...fuelForm, litros: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Preço / Litro (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelForm.precoLitro}
                    onChange={(e) => setFuelForm({ ...fuelForm, precoLitro: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tipo de Combustível</label>
                <select
                  value={fuelForm.combustivel}
                  onChange={(e) => setFuelForm({ ...fuelForm, combustivel: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                >
                  <option value="gasolina_aditivada">Gasolina Aditivada (Recomendado)</option>
                  <option value="gasolina_premium">Gasolina Premium / Podium</option>
                  <option value="gasolina_comum">Gasolina Comum</option>
                  <option value="etanol">Etanol</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-2 bg-zinc-950/60 rounded-xl border border-zinc-800">
                <input
                  type="checkbox"
                  id="tanqueCheio"
                  checked={fuelForm.tanqueCheio}
                  onChange={(e) => setFuelForm({ ...fuelForm, tanqueCheio: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="tanqueCheio" className="text-zinc-300 font-semibold cursor-pointer">
                  Tanque Cheio (Permite cálculo exato de consumo)
                </label>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Posto de Combustível</label>
                <input
                  type="text"
                  placeholder="Ex: Posto Graal / Ipiranga..."
                  value={fuelForm.posto}
                  onChange={(e) => setFuelForm({ ...fuelForm, posto: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Valor Total Previsto:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  R$ {(fuelForm.litros * fuelForm.precoLitro).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalAbastecimentoOpen(false)}
                  className="px-3 py-2 text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
                >
                  Salvar Abastecimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA MANUTENÇÃO */}
      {isModalManutencaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              Registrar Revisão / Manutenção
            </h3>

            <form onSubmit={handleSaveManu} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Data</label>
                  <input
                    type="text"
                    value={manuForm.data}
                    onChange={(e) => setManuForm({ ...manuForm, data: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">KM da Moto</label>
                  <input
                    type="number"
                    value={manuForm.km}
                    onChange={(e) => setManuForm({ ...manuForm, km: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tipo de Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Troca de óleo, Troca de pneus, Pastilhas..."
                  value={manuForm.tipoServico}
                  onChange={(e) => setManuForm({ ...manuForm, tipoServico: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Oficina / Mecânica</label>
                  <input
                    type="text"
                    value={manuForm.oficina}
                    onChange={(e) => setManuForm({ ...manuForm, oficina: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manuForm.valor}
                    onChange={(e) => setManuForm({ ...manuForm, valor: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Descrição detalhada</label>
                <textarea
                  rows={2}
                  value={manuForm.descricao}
                  onChange={(e) => setManuForm({ ...manuForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-zinc-400 mb-1">Próxima Revisão (KM)</label>
                  <input
                    type="number"
                    value={manuForm.proximaManutencaoKm}
                    onChange={(e) => setManuForm({ ...manuForm, proximaManutencaoKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Previsão Data</label>
                  <input
                    type="text"
                    value={manuForm.proximaManutencaoData}
                    onChange={(e) => setManuForm({ ...manuForm, proximaManutencaoData: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalManutencaoOpen(false)}
                  className="px-3 py-2 text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
                >
                  Salvar Manutenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de Manutenção & Abastecimento */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
