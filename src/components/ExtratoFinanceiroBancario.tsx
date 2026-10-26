import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Building2,
  Phone,
  UserCheck,
  CreditCard,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Eye,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  CadastroInstitucional,
  LancamentoExtrato,
  Mensalidade,
  ConfiguracaoClube,
} from '../types';
import {
  getLancamentosExtrato,
  createLancamentoExtrato,
  deleteLancamentoExtrato,
} from '../services/db';

interface Props {
  dadosInstitucionais: CadastroInstitucional;
  mensalidades: Mensalidade[];
  config: ConfiguracaoClube;
  onOpenPixModal?: (m: Mensalidade) => void;
}

export const ExtratoFinanceiroBancario: React.FC<Props> = ({
  dadosInstitucionais,
  mensalidades,
  config,
  onOpenPixModal,
}) => {
  const { activeRole, currentUser } = useAuth();
  const isDiretoriaOrAdmin = activeRole === 'administrador' || activeRole === 'diretoria';

  const [lancamentos, setLancamentos] = useState<LancamentoExtrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'credito' | 'debito'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos');

  // Modal de Novo Lançamento Manual (Diretoria e Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [novoLancamento, setNovoLancamento] = useState({
    data: new Date().toLocaleDateString('pt-BR'),
    tipo: 'credito' as 'credito' | 'debito',
    categoria: 'Mensalidades',
    descricao: '',
    valor: '',
    documento: '',
  });

  // Carregar lançamentos
  const carregarLancamentos = async () => {
    try {
      setLoading(true);
      const data = await getLancamentosExtrato();
      setLancamentos(data);
    } catch (err) {
      console.warn('Erro ao carregar extrato:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLancamentos();
    const handleUpdate = () => carregarLancamentos();
    window.addEventListener('ironside-extrato-updated', handleUpdate);
    return () => window.removeEventListener('ironside-extrato-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sincronizar mensalidades pagas que ainda não constam no extrato
  const handleSincronizarMensalidades = async () => {
    const pagas = mensalidades.filter((m) => m.status === 'pago');
    let importadas = 0;

    for (const m of pagas) {
      const docCode = `MENS-${m.id.replace(/\D/g, '') || m.id}`;
      const jaExiste = lancamentos.some(
        (l) => l.documento === docCode || l.descricao.includes(m.nomeAssociado) && l.descricao.includes(m.competencia)
      );

      if (!jaExiste) {
        await createLancamentoExtrato({
          data: m.dataPagamento || new Date().toLocaleDateString('pt-BR'),
          timestamp: new Date().getTime(),
          tipo: 'credito',
          categoria: 'Mensalidades',
          descricao: `Recebimento Mensalidade ${m.competencia} — ${m.nomeAssociado} (${m.numeroAssociado})`,
          valor: m.valor,
          documento: docCode,
          origem: 'mensalidade_automatica',
          autorNome: 'Sincronização Automática Tesouraria',
          createdAt: new Date().toISOString(),
        });
        importadas++;
      }
    }

    await carregarLancamentos();
    if (importadas > 0) {
      showToast(`${importadas} mensalidade(s) paga(s) integrada(s) ao extrato com sucesso!`);
    } else {
      showToast('Todas as mensalidades pagas já constam integradas no extrato bancário.');
    }
  };

  // Salvar novo lançamento manual
  const handleSalvarLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(novoLancamento.valor.replace(',', '.'));
    if (isNaN(v) || v <= 0) {
      alert('Informe um valor numérico válido maior que zero.');
      return;
    }
    if (!novoLancamento.descricao.trim()) {
      alert('Informe a descrição da movimentação.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createLancamentoExtrato({
        data: novoLancamento.data || new Date().toLocaleDateString('pt-BR'),
        timestamp: new Date().getTime(),
        tipo: novoLancamento.tipo,
        categoria: novoLancamento.categoria,
        descricao: novoLancamento.descricao.trim(),
        valor: v,
        documento: novoLancamento.documento.trim() || undefined,
        origem: 'manual',
        autorNome: currentUser?.email?.split('@')[0] || (activeRole === 'administrador' ? 'Administrador' : 'Diretoria'),
        autorEmail: currentUser?.email || 'diretoria@ironsidemc.com.br',
        createdAt: new Date().toISOString(),
      });

      setIsModalOpen(false);
      setNovoLancamento({
        data: new Date().toLocaleDateString('pt-BR'),
        tipo: 'credito',
        categoria: 'Mensalidades',
        descricao: '',
        valor: '',
        documento: '',
      });
      await carregarLancamentos();
      showToast('Movimentação bancária lançada e contabilizada no extrato!');
    } catch (err) {
      console.error('Erro ao criar lançamento:', err);
      alert('Erro ao salvar movimentação bancária.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir lançamento (somente diretoria/admin)
  const handleExcluirLancamento = async (id: string, descricao: string) => {
    if (!isDiretoriaOrAdmin) return;
    if (confirm(`Deseja realmente estornar/remover o lançamento "${descricao}" do extrato bancário?`)) {
      await deleteLancamentoExtrato(id);
      await carregarLancamentos();
      showToast('Lançamento removido do extrato bancário.');
    }
  };

  // Dados bancários do Módulo 00
  const codigoBancario = dadosInstitucionais?.codigoBancario || '001';
  const nomeBanco = dadosInstitucionais?.banco || 'Banco do Brasil S.A.';
  const agencia = dadosInstitucionais?.agencia || '1820-1';
  const contaCorrente = dadosInstitucionais?.conta || '45290-8';
  const limiteContaStr = dadosInstitucionais?.limiteConta || '15.000,00';
  const telefoneBanco = dadosInstitucionais?.telefoneBanco || '(11) 4004-0001 / 0800 729 0001';
  const nomeGerente = dadosInstitucionais?.nomeGerente || 'Carlos Eduardo Fontes (Gerente Corporate PJ)';

  // Parse do limite da conta
  const limiteContaNum = useMemo(() => {
    if (typeof limiteContaStr === 'number') return limiteContaStr;
    const clean = String(limiteContaStr).replace(/\D/g, '');
    const num = parseFloat(clean) / 100;
    return isNaN(num) ? 15000 : num;
  }, [limiteContaStr]);

  // Filtragem dos lançamentos
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((item) => {
      // Busca
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const match =
          item.descricao.toLowerCase().includes(s) ||
          item.categoria.toLowerCase().includes(s) ||
          (item.documento && item.documento.toLowerCase().includes(s)) ||
          item.data.includes(s) ||
          (item.autorNome && item.autorNome.toLowerCase().includes(s));
        if (!match) return false;
      }

      // Tipo (credito / debito)
      if (tipoFilter !== 'todos' && item.tipo !== tipoFilter) {
        return false;
      }

      // Categoria
      if (categoriaFilter !== 'todos' && item.categoria !== categoriaFilter) {
        return false;
      }

      return true;
    });
  }, [lancamentos, searchTerm, tipoFilter, categoriaFilter]);

  // Cálculos de Totais e Saldo Final
  const { totalCreditos, totalDebitos, saldoFinal, saldoDisponivelTotal } = useMemo(() => {
    let cred = 0;
    let deb = 0;

    lancamentosFiltrados.forEach((l) => {
      if (l.tipo === 'credito') {
        cred += Number(l.valor) || 0;
      } else {
        deb += Number(l.valor) || 0;
      }
    });

    const saldo = cred - deb;
    const disponivel = saldo + limiteContaNum;

    return {
      totalCreditos: cred,
      totalDebitos: deb,
      saldoFinal: saldo,
      saldoDisponivelTotal: disponivel,
    };
  }, [lancamentosFiltrados, limiteContaNum]);

  // Categorias disponíveis para filtro
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set(lancamentos.map((l) => l.categoria));
    return Array.from(set).sort();
  }, [lancamentos]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xl backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* CABEÇALHO DO EXTRATO BANCÁRIO (CÓPIA FIEL DOS DADOS DO MÓDULO 00) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/30 p-6 shadow-2xl space-y-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-lg shadow-amber-500/10">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
                  COMPE: {codigoBancario}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {dadosInstitucionais?.tipoConta || 'Conta Corrente PJ Oficial'}
                </span>
                {activeRole === 'associado' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Transparência Fiscal (Somente Leitura)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Gestão Autorizada de Lançamentos
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading tracking-tight mt-0.5">
                {nomeBanco}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Extrato Financeiro Oficial de Conta Corrente Institucional — Dados espelhados do Módulo 00.
              </p>
            </div>
          </div>

          {/* Botões de Ação para Diretoria e Administrador */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isDiretoriaOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleSincronizarMensalidades}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 shadow-sm"
                  title="Integrar e somar todas as mensalidades pagas dos membros no extrato"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar Mensalidades</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Novo Lançamento Manual</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Grade com os 7 Dados Bancários Oficiais do Módulo 00 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          {/* 1. Código Bancário */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              1. Cód. Bancário
            </span>
            <span className="font-mono font-black text-amber-400 text-sm">
              {codigoBancario}
            </span>
            <span className="text-[10px] text-zinc-500 block">COMPE / SPB</span>
          </div>

          {/* 2. Nome do Banco */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-0.5 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              2. Nome do Banco
            </span>
            <span className="font-bold text-zinc-200 text-xs truncate block" title={nomeBanco}>
              {nomeBanco}
            </span>
            <span className="text-[10px] text-zinc-500 block">Rede Oficial PJ</span>
          </div>

          {/* 3. Agência */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              3. Agência
            </span>
            <span className="font-mono font-black text-zinc-100 text-sm">
              {agencia}
            </span>
            <span className="text-[10px] text-zinc-500 block">Prefixo</span>
          </div>

          {/* 4. Conta Corrente */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              4. Conta Corrente
            </span>
            <span className="font-mono font-black text-zinc-100 text-sm">
              {contaCorrente}
            </span>
            <span className="text-[10px] text-zinc-500 block">Titularidade PJ</span>
          </div>

          {/* 5. Limite da Conta */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-emerald-500/30 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              5. Limite da Conta
            </span>
            <span className="font-mono font-black text-emerald-300 text-sm">
              R$ {typeof limiteContaStr === 'number' ? limiteContaStr.toFixed(2) : limiteContaStr}
            </span>
            <span className="text-[10px] text-emerald-500/80 block">Cheque Especial / Giro</span>
          </div>

          {/* 6. Telefone do Banco */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              6. Telefone Banco
            </span>
            <span className="font-mono text-zinc-300 text-xs truncate block" title={telefoneBanco}>
              {telefoneBanco}
            </span>
            <span className="text-[10px] text-zinc-500 block">Suporte Corporate</span>
          </div>

          {/* 7. Nome do Gerente */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              7. Nome Gerente
            </span>
            <span className="font-bold text-zinc-300 text-xs truncate block" title={nomeGerente}>
              {nomeGerente}
            </span>
            <span className="text-[10px] text-zinc-500 block">Gerente de Conta</span>
          </div>
        </div>
      </div>

      {/* FILTROS E BUSCA DO EXTRATO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-zinc-400 font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Filtrar:
          </span>

          {/* Filtro por Tipo */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setTipoFilter('todos')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                tipoFilter === 'todos'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas ({lancamentos.length})
            </button>
            <button
              type="button"
              onClick={() => setTipoFilter('credito')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1.5 ${
                tipoFilter === 'credito'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-blue-400 hover:bg-blue-950/40'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              <span>Créditos (Azul)</span>
            </button>
            <button
              type="button"
              onClick={() => setTipoFilter('debito')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1.5 ${
                tipoFilter === 'debito'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                  : 'text-red-400 hover:bg-red-950/40'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Débitos (Vermelho)</span>
            </button>
          </div>

          {/* Filtro por Categoria */}
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-400 focus:outline-none"
          >
            <option value="todos">Todas as Categorias</option>
            {categoriasDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Busca por texto */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar movimentação, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* LISTA / TABELA DE TODAS AS MOVIMENTAÇÕES DA CONTA */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              Movimentações Lançadas na Conta ({lancamentosFiltrados.length})
            </h3>
            <p className="text-[11px] text-zinc-400">
              Discriminação de todas as entradas em <strong className="text-blue-400">azul</strong> e saídas em <strong className="text-red-400">vermelho</strong> com descrição detalhada em cada linha.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-blue-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Crédito: Entradas
            </span>
            <span className="flex items-center gap-1 text-red-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Débito: Saídas
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 min-w-[280px]">Descrição da Movimentação</th>
                <th className="py-3 px-4">Documento / Origem</th>
                <th className="py-3 px-4 text-right">Valor da Operação</th>
                {isDiretoriaOrAdmin && <th className="py-3 px-4 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={isDiretoriaOrAdmin ? 7 : 6} className="py-12 text-center text-zinc-500">
                    Carregando movimentações do extrato bancário...
                  </td>
                </tr>
              ) : lancamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={isDiretoriaOrAdmin ? 7 : 6} className="py-12 text-center text-zinc-500">
                    Nenhuma movimentação bancária localizada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                lancamentosFiltrados.map((item) => {
                  const isCredito = item.tipo === 'credito';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 ${
                        isCredito
                          ? 'hover:bg-blue-950/15 bg-blue-950/5'
                          : 'hover:bg-red-950/15 bg-red-950/5'
                      }`}
                    >
                      {/* Data */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>{item.data}</span>
                        </div>
                      </td>

                      {/* Tipo: Crédito em Azul / Débito em Vermelho */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isCredito ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
                            <ArrowDownLeft className="w-3 h-3 text-blue-400" />
                            <span>CRÉDITO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm">
                            <ArrowUpRight className="w-3 h-3 text-red-400" />
                            <span>DÉBITO</span>
                          </span>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {item.categoria}
                        </span>
                      </td>

                      {/* Descrição em cada linha */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-100 leading-snug">
                          {item.descricao}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-2">
                          <span>Lançado por: <strong className="text-zinc-400">{item.autorNome}</strong></span>
                          {item.origem === 'mensalidade_automatica' && (
                            <span className="text-emerald-400 font-bold">• Mensalidade Integrada</span>
                          )}
                        </div>
                      </td>

                      {/* Documento / Origem */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {item.documento || 'EXT-MANUAL'}
                        </span>
                      </td>

                      {/* Valor: Crédito em Azul / Débito em Vermelho */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-sm font-black">
                        {isCredito ? (
                          <span className="text-blue-400 drop-shadow-sm">
                            + R$ {item.valor.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-red-400 drop-shadow-sm">
                            - R$ {item.valor.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Ações (Diretoria e Admin) */}
                      {isDiretoriaOrAdmin && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleExcluirLancamento(item.id, item.descricao)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Estornar / Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* NO FINAL O SALDO FINAL SEGUINDO O MESMO PADRÃO AZUL E VERMELHO */}
        <div className="p-6 bg-zinc-950 border-t-2 border-zinc-800 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Fechamento do Extrato Bancário</span>
              </h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Posição consolidada da conta corrente em tempo real após conciliação das entradas e saídas.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              {/* Total de Entradas (Azul) */}
              <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/40 text-right">
                <span className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider block">
                  Total Créditos (Entradas)
                </span>
                <span className="text-base font-black font-mono text-blue-300 block">
                  + R$ {totalCreditos.toFixed(2)}
                </span>
              </div>

              {/* Total de Saídas (Vermelho) */}
              <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/40 text-right">
                <span className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider block">
                  Total Débitos (Saídas)
                </span>
                <span className="text-base font-black font-mono text-red-300 block">
                  - R$ {totalDebitos.toFixed(2)}
                </span>
              </div>

              {/* SALDO FINAL SEGUINDO PADRÃO AZUL (SE >= 0) OU VERMELHO (SE < 0) */}
              <div
                className={`p-3.5 rounded-2xl text-right border-2 shadow-xl ${
                  saldoFinal >= 0
                    ? 'bg-blue-950/40 border-blue-500 text-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-red-950/40 border-red-500 text-red-300 ring-2 ring-red-500/20'
                }`}
              >
                <div className="flex items-center justify-end gap-1 mb-0.5">
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                      saldoFinal >= 0
                        ? 'bg-blue-500/30 text-blue-200 border-blue-400'
                        : 'bg-red-500/30 text-red-200 border-red-400'
                    }`}
                  >
                    {saldoFinal >= 0 ? 'SALDO POSITIVO' : 'SALDO NEGATIVO'}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-90">
                  Saldo Final da Conta
                </span>
                <span
                  className={`text-xl font-black font-mono block ${
                    saldoFinal >= 0 ? 'text-blue-300' : 'text-red-300'
                  }`}
                >
                  {saldoFinal >= 0 ? '+ ' : ''}R$ {saldoFinal.toFixed(2)}
                </span>
              </div>

              {/* Saldo Total Disponível (Saldo + Limite da Conta) */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-right">
                <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider block">
                  Saldo Total Disponível
                </span>
                <span className="text-base font-black font-mono text-emerald-300 block">
                  R$ {saldoDisponivelTotal.toFixed(2)}
                </span>
                <span className="text-[9px] text-zinc-500 block">
                  (Saldo + Limite R$ {limiteContaNum.toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE NOVO LANÇAMENTO MANUAL (DIRETORIA E ADMINISTRADOR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                Novo Lançamento no Extrato Bancário
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarLancamento} className="space-y-4 text-xs">
              {/* Seletor de Tipo com Destaque: Crédito em Azul / Débito em Vermelho */}
              <div>
                <label className="block text-zinc-300 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                  Tipo da Movimentação Bancária *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNovoLancamento({ ...novoLancamento, tipo: 'credito' })}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition ${
                      novoLancamento.tipo === 'credito'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/30'
                        : 'bg-zinc-950 text-blue-400 border-blue-500/30 hover:bg-blue-950/30'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>CRÉDITO (Entrada Azul)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNovoLancamento({ ...novoLancamento, tipo: 'debito' })}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition ${
                      novoLancamento.tipo === 'debito'
                        ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30 ring-2 ring-red-500/30'
                        : 'bg-zinc-950 text-red-400 border-red-500/30 hover:bg-red-950/30'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>DÉBITO (Saída Vermelha)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Data */}
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">
                    Data do Lançamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoLancamento.data}
                    onChange={(e) => setNovoLancamento({ ...novoLancamento, data: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 85,00"
                    value={novoLancamento.valor}
                    onChange={(e) => setNovoLancamento({ ...novoLancamento, valor: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl bg-zinc-950 border text-zinc-100 font-mono font-bold focus:outline-none ${
                      novoLancamento.tipo === 'credito'
                        ? 'border-blue-500/50 text-blue-300 focus:border-blue-400'
                        : 'border-red-500/50 text-red-300 focus:border-red-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Categoria */}
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">
                    Categoria da Operação *
                  </label>
                  <select
                    value={novoLancamento.categoria}
                    onChange={(e) => setNovoLancamento({ ...novoLancamento, categoria: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Mensalidades">Mensalidades</option>
                    <option value="Doações & Solidariedade">Doações &amp; Solidariedade</option>
                    <option value="Eventos & Inscrições">Eventos &amp; Inscrições</option>
                    <option value="Sede & Infraestrutura">Sede &amp; Infraestrutura</option>
                    <option value="Consumo & Utilidades">Consumo (Energia, Água, Net)</option>
                    <option value="Identidade & Brasões">Identidade, Coletes &amp; Bordados</option>
                    <option value="Garagem & Frota">Garagem, Mecânica &amp; Frota</option>
                    <option value="Tarifas Bancárias">Tarifas &amp; Taxas Bancárias</option>
                    <option value="Alimentação & Churrasco">Alimentação &amp; Confraternização</option>
                    <option value="Outros">Outras Despesas</option>
                  </select>
                </div>

                {/* Documento / Comprovante */}
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">
                    Nº do Documento / Comprovante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PIX-9841, NF-2041, TED-11"
                    value={novoLancamento.documento}
                    onChange={(e) => setNovoLancamento({ ...novoLancamento, documento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Descrição em cada linha */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Descrição da Movimentação Bancária *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Recebimento de mensalidade com comprovante validado ou Pagamento de aluguel da sede..."
                  value={novoLancamento.descricao}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? 'Gravando...' : 'Lançar no Extrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
