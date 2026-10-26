import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Associado,
  AssociadoStatus,
  ConfiguracaoClube,
  Veiculo,
  Mensalidade,
  ContatoEmergencia,
  Evento,
} from '../types';
import { FichaCadastralModal } from './FichaCadastralModal';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import {
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  Droplet,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  Clock,
  AlertTriangle,
  UserX,
  Ban,
  FileCheck,
  CheckCircle2,
  Loader2,
  HeartPulse,
  Info,
  FileDown,
  SlidersHorizontal,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { exportAssociadosPdf } from '../services/pdfExportService';
import { VisualizadorFichaCadastralPdfModal } from './VisualizadorFichaCadastralPdfModal';

interface Props {
  associados: Associado[];
  veiculos: Veiculo[];
  mensalidades: Mensalidade[];
  eventos?: Evento[];
  config: ConfiguracaoClube;
  onApprove: (id: string) => Promise<void>;
  onApproveFiliacao?: (
    id: string,
    dados: {
      dataFiliacao: string;
      aprovadoPorDiretoria: string;
      numeroAtaFiliacao: string;
      cargo: string;
    }
  ) => Promise<void>;
  onReject: (id: string, motivo: string) => Promise<void>;
  onDesligar?: (
    id: string,
    cpf: string,
    dados: {
      dataDesligamento: string;
      motivoDesligamento: string;
      desligadoPor: string;
    }
  ) => Promise<void>;
  onSaveNew: (data: Omit<Associado, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Associado>) => Promise<void>;
}

export const AssociadosView: React.FC<Props> = ({
  associados,
  veiculos,
  mensalidades,
  eventos = [],
  config,
  onApprove,
  onApproveFiliacao,
  onReject,
  onDesligar,
  onSaveNew,
  onUpdate,
}) => {
  const { activeRole, currentAssociado } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedRegional, setSelectedRegional] = useState<string>('todas');
  const [selectedCargo, setSelectedCargo] = useState<string>('todos');
  const [selectedAnoIngresso, setSelectedAnoIngresso] = useState<string>('todos');
  const [selectedTipoSanguineo, setSelectedTipoSanguineo] = useState<string>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modals
  const [selectedAssociado, setSelectedAssociado] = useState<Associado | null>(null);
  const [isFichaCadastralOpen, setIsFichaCadastralOpen] = useState(false);
  const [pdfDirectAssociado, setPdfDirectAssociado] = useState<Associado | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFiliacaoModalOpen, setIsFiliacaoModalOpen] = useState(false);
  const [isDesligamentoModalOpen, setIsDesligamentoModalOpen] = useState(false);

  // ViaCEP State
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);

  // Filiação Form State
  const [filiacaoForm, setFiliacaoForm] = useState({
    dataFiliacao: new Date().toLocaleDateString('pt-BR'),
    aprovadoPorDiretoria: 'Diretoria Executiva Iron Side Road Rider M.C.',
    numeroAtaFiliacao: 'Ata de Reunião nº 01/2026',
    cargo: 'Membro Efetivo',
  });

  // Desligamento Form State (com até 3000 caracteres de motivo)
  const [desligamentoForm, setDesligamentoForm] = useState({
    dataDesligamento: new Date().toLocaleDateString('pt-BR'),
    desligadoPor: 'Diretoria Executiva / Conselho Disciplinar',
    motivoDesligamento: '',
  });

  // New member form state
  const [newForm, setNewForm] = useState({
    nome: '',
    nomeGuerra: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    estadoCivil: 'Casado(a)',
    tipoSanguineo: 'O+',
    email: '',
    telefone: '',
    whatsapp: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    cnhNumero: '',
    cnhCategoria: 'A',
    cnhValidade: '',
    regional: 'São Paulo - Matriz',
    cargo: 'Membro Associado',
    fotoUrl: '',
    dataAssociacao: new Date().toLocaleDateString('pt-BR'),
    observacoes: '',
    // 2 Contatos de Emergência
    emergencia1Nome: '',
    emergencia1Parentesco: 'Esposa',
    emergencia1Telefone: '',
    emergencia2Nome: '',
    emergencia2Parentesco: 'Irmão de Estrada',
    emergencia2Telefone: '',
    // Saúde & Alergias & PCD
    alergiaMedicamentoSim: false,
    alergiaMedicamentoDescricao: '',
    alergiaAlimentacaoSim: false,
    alergiaAlimentacaoDescricao: '',
    problemaSaudeSim: false,
    problemaSaudeDescricao: '',
    pcdSim: false,
    pcdDescricao: '',
    // LGPD & LAI consent
    termoLgpdAceito: true,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    nome: '',
    nomeGuerra: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    estadoCivil: 'Casado(a)',
    tipoSanguineo: 'O+',
    email: '',
    telefone: '',
    whatsapp: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    regional: '',
    cargo: '',
    emergencia1Nome: '',
    emergencia1Parentesco: '',
    emergencia1Telefone: '',
    emergencia2Nome: '',
    emergencia2Parentesco: '',
    emergencia2Telefone: '',
    alergiaMedicamentoSim: false,
    alergiaMedicamentoDescricao: '',
    alergiaAlimentacaoSim: false,
    alergiaAlimentacaoDescricao: '',
    problemaSaudeSim: false,
    problemaSaudeDescricao: '',
    pcdSim: false,
    pcdDescricao: '',
  });

  // ViaCEP lookup function
  const handleBuscarCep = async (cepInput: string, isEdit = false) => {
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length !== 8) {
      setCepMessage('O CEP deve conter 8 dígitos.');
      return;
    }

    try {
      setCepLoading(true);
      setCepMessage(null);
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepMessage('CEP não encontrado na base dos Correios.');
        return;
      }

      const formattedCep = clean.replace(/(\d{5})(\d{3})/, '$1-$2');

      if (isEdit) {
        setEditForm((prev) => ({
          ...prev,
          cep: formattedCep,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      } else {
        setNewForm((prev) => ({
          ...prev,
          cep: formattedCep,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }

      setCepMessage('✓ Endereço preenchido automaticamente via internet (ViaCEP)!');
    } catch (err) {
      console.warn('Erro ao consultar CEP:', err);
      setCepMessage('Erro ao consultar o serviço de CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  // Filter list
  const filteredAssociados = associados.filter((a) => {
    // If role is Associado, can only view own record
    if (activeRole === 'associado' && currentAssociado) {
      return a.id === currentAssociado.id || a.uid === currentAssociado.uid;
    }

    const matchesSearch =
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nomeGuerra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numeroAssociado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.cpf || '').includes(searchTerm) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'todos' ? true : a.status === selectedStatus;

    const matchesRegional =
      selectedRegional === 'todas' ? true : a.regional === selectedRegional;

    const matchesCargo =
      selectedCargo === 'todos'
        ? true
        : (a.cargo || '').toLowerCase().includes(selectedCargo.toLowerCase());

    const matchesIngresso =
      selectedAnoIngresso === 'todos'
        ? true
        : (a.dataAssociacao || '').includes(selectedAnoIngresso) ||
          (a.dataFiliacao || '').includes(selectedAnoIngresso) ||
          (a.createdAt || '').includes(selectedAnoIngresso);

    const matchesSangue =
      selectedTipoSanguineo === 'todos'
        ? true
        : (a.tipoSanguineo || '').toUpperCase() === selectedTipoSanguineo.toUpperCase();

    return matchesSearch && matchesStatus && matchesRegional && matchesCargo && matchesIngresso && matchesSangue;
  });

  const totalPages = Math.ceil(filteredAssociados.length / pageSize) || 1;
  const paginatedList = filteredAssociados.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const regionais = Array.from(
    new Set(associados.map((a) => a.regional).filter(Boolean))
  );

  const cargos = Array.from(
    new Set(associados.map((a) => a.cargo).filter(Boolean))
  );

  const anosIngresso = Array.from(
    new Set(
      associados
        .map((a) => {
          const d = a.dataAssociacao || a.dataFiliacao || a.createdAt || '';
          const match = d.match(/\d{4}/);
          return match ? match[0] : null;
        })
        .filter(Boolean) as string[]
    )
  ).sort().reverse();

  const activeFiltersCount =
    (selectedStatus !== 'todos' ? 1 : 0) +
    (selectedRegional !== 'todas' ? 1 : 0) +
    (selectedCargo !== 'todos' ? 1 : 0) +
    (selectedAnoIngresso !== 'todos' ? 1 : 0) +
    (selectedTipoSanguineo !== 'todos' ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('todos');
    setSelectedRegional('todas');
    setSelectedCargo('todos');
    setSelectedAnoIngresso('todos');
    setSelectedTipoSanguineo('todos');
  };

  const handleOpenFicha = (a: Associado) => {
    setSelectedAssociado(a);
    setIsFichaCadastralOpen(true);
  };

  const handleOpenEdit = (a: Associado) => {
    setSelectedAssociado(a);
    const cont1 = a.contatosEmergencia?.[0];
    const cont2 = a.contatosEmergencia?.[1];

    setEditForm({
      nome: a.nome,
      nomeGuerra: a.nomeGuerra,
      cpf: a.cpf,
      rg: a.rg || '',
      dataNascimento: a.dataNascimento,
      estadoCivil: a.estadoCivil || 'Casado(a)',
      tipoSanguineo: a.tipoSanguineo || 'O+',
      email: a.email,
      telefone: a.telefone,
      whatsapp: a.whatsapp,
      cep: a.cep,
      logradouro: a.logradouro,
      numero: a.numero,
      complemento: a.complemento || '',
      bairro: a.bairro,
      cidade: a.cidade,
      estado: a.estado,
      regional: a.regional,
      cargo: a.cargo,
      emergencia1Nome: cont1?.nome || '',
      emergencia1Parentesco: cont1?.parentesco || 'Esposa',
      emergencia1Telefone: cont1?.telefone || '',
      emergencia2Nome: cont2?.nome || '',
      emergencia2Parentesco: cont2?.parentesco || 'Irmão de Estrada',
      emergencia2Telefone: cont2?.telefone || '',
      alergiaMedicamentoSim: a.alergiaMedicamento?.possui || false,
      alergiaMedicamentoDescricao: a.alergiaMedicamento?.descricao || '',
      alergiaAlimentacaoSim: a.alergiaAlimentacao?.possui || false,
      alergiaAlimentacaoDescricao: a.alergiaAlimentacao?.descricao || '',
      problemaSaudeSim: a.problemaSaude?.possui || false,
      problemaSaudeDescricao: a.problemaSaude?.descricao || '',
      pcdSim: a.pcd?.possui || false,
      pcdDescricao: a.pcd?.descricao || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.nome || !newForm.email) return;

    const contatos: ContatoEmergencia[] = [];
    if (newForm.emergencia1Nome) {
      contatos.push({
        nome: newForm.emergencia1Nome,
        parentesco: newForm.emergencia1Parentesco,
        telefone: newForm.emergencia1Telefone,
      });
    }
    if (newForm.emergencia2Nome) {
      contatos.push({
        nome: newForm.emergencia2Nome,
        parentesco: newForm.emergencia2Parentesco,
        telefone: newForm.emergencia2Telefone,
      });
    }

    await onSaveNew({
      uid: `manual-${Date.now()}`,
      numeroAssociado: 'PENDENTE',
      nome: newForm.nome,
      nomeGuerra: newForm.nomeGuerra || newForm.nome.split(' ')[0],
      cpf: newForm.cpf,
      rg: newForm.rg,
      dataNascimento: newForm.dataNascimento,
      estadoCivil: newForm.estadoCivil,
      tipoSanguineo: newForm.tipoSanguineo,
      email: newForm.email,
      telefone: newForm.telefone,
      whatsapp: newForm.whatsapp,
      cep: newForm.cep,
      logradouro: newForm.logradouro,
      numero: newForm.numero,
      complemento: newForm.complemento,
      bairro: newForm.bairro,
      cidade: newForm.cidade,
      estado: newForm.estado,
      cnhNumero: newForm.cnhNumero,
      cnhCategoria: newForm.cnhCategoria,
      cnhValidade: newForm.cnhValidade,
      regional: newForm.regional,
      cargo: newForm.cargo,
      status: activeRole === 'administrador' ? 'ativo' : 'pendente',
      fotoUrl:
        newForm.fotoUrl ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      dataAssociacao: newForm.dataAssociacao,
      observacoes: newForm.observacoes,
      contatosEmergencia: contatos,
      alergiaMedicamento: {
        possui: newForm.alergiaMedicamentoSim,
        descricao: newForm.alergiaMedicamentoSim
          ? newForm.alergiaMedicamentoDescricao
          : 'Nenhuma alergia conhecida a medicamentos.',
      },
      alergiaAlimentacao: {
        possui: newForm.alergiaAlimentacaoSim,
        descricao: newForm.alergiaAlimentacaoSim
          ? newForm.alergiaAlimentacaoDescricao
          : 'Nenhuma alergia alimentar.',
      },
      problemaSaude: {
        possui: newForm.problemaSaudeSim,
        descricao: newForm.problemaSaudeSim
          ? newForm.problemaSaudeDescricao
          : 'Sem problemas de saúde limitantes.',
      },
      pcd: {
        possui: newForm.pcdSim,
        descricao: newForm.pcdSim ? newForm.pcdDescricao : 'Não se aplica.',
      },
      consentimentoLgpd: newForm.termoLgpdAceito,
      dataConsentimentoLgpd: new Date().toLocaleDateString('pt-BR'),
      createdAt: new Date().toISOString(),
    });

    setIsNewModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssociado) return;

    const contatos: ContatoEmergencia[] = [];
    if (editForm.emergencia1Nome) {
      contatos.push({
        nome: editForm.emergencia1Nome,
        parentesco: editForm.emergencia1Parentesco,
        telefone: editForm.emergencia1Telefone,
      });
    }
    if (editForm.emergencia2Nome) {
      contatos.push({
        nome: editForm.emergencia2Nome,
        parentesco: editForm.emergencia2Parentesco,
        telefone: editForm.emergencia2Telefone,
      });
    }

    await onUpdate(selectedAssociado.id, {
      nome: editForm.nome,
      nomeGuerra: editForm.nomeGuerra,
      cpf: editForm.cpf,
      rg: editForm.rg,
      dataNascimento: editForm.dataNascimento,
      estadoCivil: editForm.estadoCivil,
      tipoSanguineo: editForm.tipoSanguineo,
      email: editForm.email,
      telefone: editForm.telefone,
      whatsapp: editForm.whatsapp,
      cep: editForm.cep,
      logradouro: editForm.logradouro,
      numero: editForm.numero,
      complemento: editForm.complemento,
      bairro: editForm.bairro,
      cidade: editForm.cidade,
      estado: editForm.estado,
      regional: editForm.regional,
      cargo: editForm.cargo,
      contatosEmergencia: contatos,
      alergiaMedicamento: {
        possui: editForm.alergiaMedicamentoSim,
        descricao: editForm.alergiaMedicamentoSim
          ? editForm.alergiaMedicamentoDescricao
          : 'Nenhuma alergia conhecida a medicamentos.',
      },
      alergiaAlimentacao: {
        possui: editForm.alergiaAlimentacaoSim,
        descricao: editForm.alergiaAlimentacaoSim
          ? editForm.alergiaAlimentacaoDescricao
          : 'Nenhuma alergia alimentar.',
      },
      problemaSaude: {
        possui: editForm.problemaSaudeSim,
        descricao: editForm.problemaSaudeSim
          ? editForm.problemaSaudeDescricao
          : 'Sem problemas de saúde.',
      },
      pcd: {
        possui: editForm.pcdSim,
        descricao: editForm.pcdSim ? editForm.pcdDescricao : 'Não.',
      },
    });

    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
              {activeRole === 'associado' ? 'Minha Ficha Cadastral Oficial' : 'Quadro Geral de Associados'}
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              LGPD &amp; LAI Ativos
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {activeRole === 'associado'
              ? 'Visualize sua ficha cadastral completa com dados de saúde, motos, filiação e histórico de comprovantes.'
              : `Total de ${associados.length} membros cadastrados com conformidade estatutária e proteção legal.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              exportAssociadosPdf(
                filteredAssociados,
                config,
                activeFiltersCount > 0 ? `${activeFiltersCount} filtro(s) ativo(s)` : undefined
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold transition shadow-sm"
            title="Exportar Relatório Geral de Associados em PDF"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>Exportar em PDF</span>
          </button>
          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Novo Membro
            </button>
          )}
        </div>
      </div>

      {/* LGPD & LAI Notice Card */}
      <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-zinc-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>Proteção de Dados &amp; Transparência:</strong> Todas as fichas seguem a{' '}
            <strong className="text-amber-400">LGPD (Lei nº 13.709/2018)</strong> e a{' '}
            <strong className="text-amber-400">LAI (Lei nº 12.527/2011)</strong>. Dados sensíveis de saúde são restritos ao socorro médico rodoviário.
          </span>
        </div>
      </div>

      {/* Banner para Associado com Cadastro em Análise / Pendente com botão para editar tudo */}
      {currentAssociado && (currentAssociado.status === 'pendente' || currentAssociado.status === 'em_analise') && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-amber-300">
                Status da Filiação: Em Análise pela Diretoria Executiva
              </p>
              <p className="text-xs text-zinc-300 mt-0.5">
                Seu cadastro foi recebido com sucesso. Você tem permissão total para atualizar seus dados pessoais, fotos da moto e foto oficial de perfil a qualquer momento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => currentAssociado && handleOpenEdit(currentAssociado)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition shadow flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar Meu Cadastro Completo</span>
          </button>
        </div>
      )}

      {/* Advanced Search & Filters (Admin & Diretoria) */}
      {activeRole !== 'associado' && (
        <div className="space-y-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, apelido/guerra, matrícula oficial ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativos Regulares</option>
                <option value="pendente">Aguardando Filiação</option>
                <option value="desligado">Desligados (Bloqueados)</option>
                <option value="suspenso">Suspensos</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition border ${
                  showAdvancedFilters || activeFiltersCount > 1
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Filtros Avançados</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-2.5 py-2.5 rounded-xl bg-zinc-950 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 transition"
                  title="Limpar todos os filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs animate-fade-in">
              {/* Filtro por Cargo */}
              <div>
                <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                  Filtrar por Cargo:
                </label>
                <select
                  value={selectedCargo}
                  onChange={(e) => setSelectedCargo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="todos">Todos os Cargos</option>
                  {cargos.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Data/Ano de Ingresso */}
              <div>
                <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                  Data de Ingresso (Ano):
                </label>
                <select
                  value={selectedAnoIngresso}
                  onChange={(e) => setSelectedAnoIngresso(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="todos">Qualquer Ano</option>
                  {anosIngresso.map((yr) => (
                    <option key={yr} value={yr}>
                      Ano {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Regional */}
              <div>
                <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                  Regional / Facção:
                </label>
                <select
                  value={selectedRegional}
                  onChange={(e) => setSelectedRegional(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="todas">Todas as Regionais</option>
                  {regionais.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Tipo Sanguíneo */}
              <div>
                <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                  Tipo Sanguíneo (SOS):
                </label>
                <select
                  value={selectedTipoSanguineo}
                  onChange={(e) => setSelectedTipoSanguineo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedList.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500">
            Nenhum associado encontrado para os filtros selecionados.
          </div>
        ) : (
          paginatedList.map((a) => (
            <div
              key={a.id}
              className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                a.status === 'desligado'
                  ? 'bg-red-950/20 border-red-900/80 hover:border-red-600'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-amber-500/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-amber-500/40 bg-zinc-950 shrink-0 shadow-md">
                      <img
                        src={
                          a.fotoUrl ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={a.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        {a.numeroAssociado}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-100 leading-tight">
                        {a.nome}
                      </h3>
                      <p className="text-xs text-amber-300 font-semibold italic">
                        &ldquo;{a.nomeGuerra}&rdquo;
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      a.status === 'ativo'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : a.status === 'desligado'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 font-black'
                        : a.status === 'pendente' || a.status === 'em_analise'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {a.status === 'desligado' ? 'DESLIGADO' : a.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-zinc-300 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{a.cargo || 'Membro'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>Sangue {a.tipoSanguineo || 'O+'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{a.cidade || a.regional}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate font-mono">{a.whatsapp || a.telefone}</span>
                  </div>
                </div>

                {activeRole !== 'associado' && (a.status === 'pendente' || a.status === 'em_analise') && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <span>Cadastro Pendente</span>
                    </div>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onApprove(a.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition shadow-md shadow-emerald-500/20 cursor-pointer"
                      title="Aprovar cadastro e liberar acesso ao perfil associado"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprovar Cadastro</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenFicha(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ver Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPdfDirectAssociado(a)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                    title="Abrir Ficha Cadastral em PDF (Visualização, WhatsApp, E-mail e Código de Autenticidade 20 caracteres)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {activeRole !== 'associado' && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(a)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition"
                      title="Editar Informações"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {activeRole !== 'associado' && a.status !== 'desligado' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssociado(a);
                        setDesligamentoForm({
                          dataDesligamento: new Date().toLocaleDateString('pt-BR'),
                          desligadoPor: 'Diretoria Executiva / Conselho Disciplinar',
                          motivoDesligamento: '',
                        });
                        setIsDesligamentoModalOpen(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                      title="Desligar e Bloquear por CPF"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-400">
          <span>
            Mostrando {paginatedList.length} de {filteredAssociados.length} associados
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 text-zinc-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-zinc-200">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 text-zinc-200 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de Associados */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />

      {/* FULL COMPREHENSIVE FICHA CADASTRAL MODAL */}
      {isFichaCadastralOpen && selectedAssociado && (
        <FichaCadastralModal
          associado={selectedAssociado}
          veiculos={veiculos}
          mensalidades={mensalidades}
          eventos={eventos}
          config={config}
          onClose={() => setIsFichaCadastralOpen(false)}
          onApprove={onApprove}
          onEdit={
            activeRole !== 'associado'
              ? () => {
                  setIsFichaCadastralOpen(false);
                  handleOpenEdit(selectedAssociado);
                }
              : undefined
          }
        />
      )}

      {/* MODAL DE VISUALIZAÇÃO DIRETA DA FICHA CADASTRAL EM PDF */}
      {pdfDirectAssociado && (
        <VisualizadorFichaCadastralPdfModal
          associado={pdfDirectAssociado}
          veiculos={veiculos}
          mensalidades={mensalidades}
          eventos={eventos}
          config={config}
          onClose={() => setPdfDirectAssociado(null)}
        />
      )}

      {/* MODAL DE FILIAÇÃO DA DIRETORIA */}
      {isFiliacaoModalOpen && selectedAssociado && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-900 border border-emerald-500/50 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold mb-1 flex items-center gap-2 text-emerald-400">
              <FileCheck className="w-5 h-5" />
              Homologação de Filiação pela Diretoria
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Filiação oficial de <strong>{selectedAssociado.nome} ({selectedAssociado.nomeGuerra})</strong>.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onApproveFiliacao) {
                  await onApproveFiliacao(selectedAssociado.id, filiacaoForm);
                } else {
                  await onApprove(selectedAssociado.id);
                }
                setIsFiliacaoModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Data da Filiação *</label>
                  <input
                    type="text"
                    required
                    value={filiacaoForm.dataFiliacao}
                    onChange={(e) => setFiliacaoForm({ ...filiacaoForm, dataFiliacao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Cargo Oficial Inicial</label>
                  <input
                    type="text"
                    required
                    value={filiacaoForm.cargo}
                    onChange={(e) => setFiliacaoForm({ ...filiacaoForm, cargo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Aprovado por (Diretoria) *</label>
                <input
                  type="text"
                  required
                  value={filiacaoForm.aprovadoPorDiretoria}
                  onChange={(e) => setFiliacaoForm({ ...filiacaoForm, aprovadoPorDiretoria: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Número da Ata de Reunião da Diretoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ata nº 012/2026 de Filiação Oficial"
                  value={filiacaoForm.numeroAtaFiliacao}
                  onChange={(e) => setFiliacaoForm({ ...filiacaoForm, numeroAtaFiliacao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300">
                Ao confirmar, o sistema gerará a matrícula oficial sequencial <strong>MC-XXXXXX</strong> e ativará o acesso do associado.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFiliacaoModalOpen(false)}
                  className="px-3.5 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl shadow-md transition"
                >
                  Confirmar Filiação Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DESLIGAMENTO E BLOQUEIO POR CPF (COM BASE DE 3000 CARACTERES) */}
      {isDesligamentoModalOpen && selectedAssociado && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-xl bg-zinc-900 border-2 border-red-600 rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold mb-1 flex items-center gap-2 text-red-400 font-heading">
              <UserX className="w-5 h-5 text-red-500" />
              Desligamento &amp; Bloqueio do Associado por CPF
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Associado: <strong className="text-white">{selectedAssociado.nome} ({selectedAssociado.nomeGuerra})</strong> • CPF:{' '}
              <span className="font-mono text-amber-400 font-bold">{selectedAssociado.cpf}</span>
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!desligamentoForm.motivoDesligamento.trim()) return;

                if (onDesligar) {
                  await onDesligar(selectedAssociado.id, selectedAssociado.cpf, desligamentoForm);
                }
                setIsDesligamentoModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Data do Desligamento *</label>
                  <input
                    type="text"
                    required
                    value={desligamentoForm.dataDesligamento}
                    onChange={(e) => setDesligamentoForm({ ...desligamentoForm, dataDesligamento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Determinado por *</label>
                  <input
                    type="text"
                    required
                    value={desligamentoForm.desligadoPor}
                    onChange={(e) => setDesligamentoForm({ ...desligamentoForm, desligadoPor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 font-semibold">
                    Motivo Formal do Desligamento (Até 3000 Caracteres) *
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      desligamentoForm.motivoDesligamento.length > 2800 ? 'text-amber-400 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    {desligamentoForm.motivoDesligamento.length} / 3000 caracteres
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  maxLength={3000}
                  placeholder="Descreva detalhadamente o motivo da expulsão ou desligamento referenciando o estatuto..."
                  value={desligamentoForm.motivoDesligamento}
                  onChange={(e) => setDesligamentoForm({ ...desligamentoForm, motivoDesligamento: e.target.value })}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 leading-relaxed focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDesligamentoModalOpen(false)}
                  className="px-3.5 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!desligamentoForm.motivoDesligamento.trim()}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition disabled:opacity-50"
                >
                  Homologar Desligamento &amp; Bloquear CPF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW MEMBER REGISTRATION MODAL WITH VIACEP & FULL REQUIREMENTS */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 font-heading">
                  Cadastro Completo de Associado
                </h3>
                <p className="text-xs text-zinc-400">
                  Preencha a ficha cadastral com endereço via busca CEP, contatos e dados de saúde.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            {/* LGPD Banner */}
            <div className="mt-3 p-3 bg-zinc-950 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Cadastramento resguardado pela <strong>LGPD (Lei nº 13.709/2018)</strong> e <strong>LAI (Lei nº 12.527/2011)</strong>.
              </span>
            </div>

            <form onSubmit={handleSaveSubmit} className="py-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {/* SEÇÃO 1: DADOS BÁSICOS */}
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  1. Identificação Pessoal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-semibold">NOME COMPLETO *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Roberto da Silva"
                      value={newForm.nome}
                      onChange={(e) => setNewForm({ ...newForm, nome: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">APELIDO / NOME DE GUERRA *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Trovão Negro, Lobo Solitário..."
                      value={newForm.nomeGuerra}
                      onChange={(e) => setNewForm({ ...newForm, nomeGuerra: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">CPF *</label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={newForm.cpf}
                      onChange={(e) => setNewForm({ ...newForm, cpf: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">RG</label>
                    <input
                      type="text"
                      placeholder="00.000.000-0"
                      value={newForm.rg}
                      onChange={(e) => setNewForm({ ...newForm, rg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Data de Nascimento *</label>
                    <input
                      type="text"
                      required
                      placeholder="DD/MM/AAAA"
                      value={newForm.dataNascimento}
                      onChange={(e) => setNewForm({ ...newForm, dataNascimento: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">ESTADO CIVIL *</label>
                    <select
                      value={newForm.estadoCivil}
                      onChange={(e) => setNewForm({ ...newForm, estadoCivil: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    >
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">E-mail *</label>
                    <input
                      type="email"
                      required
                      value={newForm.email}
                      onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      value={newForm.whatsapp}
                      onChange={(e) => setNewForm({ ...newForm, whatsapp: e.target.value, telefone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: ENDEREÇO COMPLETO VIA CEP NA INTERNET */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    2. Endereço Completo (Começando com o CEP - Pesquisa Online)
                  </h4>
                  {cepMessage && (
                    <span className="text-[11px] font-semibold text-emerald-400">
                      {cepMessage}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">CEP *</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="00000-000"
                        value={newForm.cep}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewForm({ ...newForm, cep: val });
                          if (val.replace(/\D/g, '').length === 8) {
                            handleBuscarCep(val);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleBuscarCep(newForm.cep)}
                        disabled={cepLoading}
                        className="px-2.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shrink-0 transition"
                        title="Buscar endereço na internet"
                      >
                        {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-semibold">Logradouro (Rua / Av.) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Preenchido pela busca do CEP..."
                      value={newForm.logradouro}
                      onChange={(e) => setNewForm({ ...newForm, logradouro: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="1000"
                      value={newForm.numero}
                      onChange={(e) => setNewForm({ ...newForm, numero: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Complemento</label>
                    <input
                      type="text"
                      placeholder="Apto, Bloco..."
                      value={newForm.complemento}
                      onChange={(e) => setNewForm({ ...newForm, complemento: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Bairro *</label>
                    <input
                      type="text"
                      required
                      value={newForm.bairro}
                      onChange={(e) => setNewForm({ ...newForm, bairro: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Cidade *</label>
                    <input
                      type="text"
                      required
                      value={newForm.cidade}
                      onChange={(e) => setNewForm({ ...newForm, cidade: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Estado (UF) *</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={newForm.estado}
                      onChange={(e) => setNewForm({ ...newForm, estado: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: SAÚDE, TIPO SANGUÍNEO COM FATOR, ALERGIAS & PCD */}
              <div className="pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" />
                  3. Dados Médicos, Tipo Sanguíneo com Fator, Alergias &amp; PCD (Protegido por LGPD)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">TIPO SANGUÍNEO COM FATOR *</label>
                    <select
                      value={newForm.tipoSanguineo}
                      onChange={(e) => setNewForm({ ...newForm, tipoSanguineo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-bold text-amber-400"
                    >
                      <option value="O+">O+ (O Positivo)</option>
                      <option value="O-">O- (O Negativo)</option>
                      <option value="A+">A+ (A Positivo)</option>
                      <option value="A-">A- (A Negativo)</option>
                      <option value="B+">B+ (B Positivo)</option>
                      <option value="B-">B- (B Negativo)</option>
                      <option value="AB+">AB+ (AB Positivo)</option>
                      <option value="AB-">AB- (AB Negativo)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-semibold">
                      ALERGIA A ALGUM MEDICAMENTO?
                    </label>
                    <div className="flex items-center gap-3 mb-1.5">
                      <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                        <input
                          type="radio"
                          name="alergiaMed"
                          checked={!newForm.alergiaMedicamentoSim}
                          onChange={() => setNewForm({ ...newForm, alergiaMedicamentoSim: false, alergiaMedicamentoDescricao: '' })}
                        />
                        Não
                      </label>
                      <label className="flex items-center gap-1.5 text-red-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="alergiaMed"
                          checked={newForm.alergiaMedicamentoSim}
                          onChange={() => setNewForm({ ...newForm, alergiaMedicamentoSim: true })}
                        />
                        Sim (Especificar)
                      </label>
                    </div>
                    {newForm.alergiaMedicamentoSim && (
                      <input
                        type="text"
                        required
                        placeholder="Qual medicamento? Ex: Dipirona, Penicilina..."
                        value={newForm.alergiaMedicamentoDescricao}
                        onChange={(e) => setNewForm({ ...newForm, alergiaMedicamentoDescricao: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-red-500/40 text-red-200"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">
                      ALERGIA ALIMENTAÇÃO?
                    </label>
                    <div className="flex items-center gap-3 mb-1.5">
                      <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                        <input
                          type="radio"
                          name="alergiaAlim"
                          checked={!newForm.alergiaAlimentacaoSim}
                          onChange={() => setNewForm({ ...newForm, alergiaAlimentacaoSim: false, alergiaAlimentacaoDescricao: '' })}
                        />
                        Não
                      </label>
                      <label className="flex items-center gap-1.5 text-red-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="alergiaAlim"
                          checked={newForm.alergiaAlimentacaoSim}
                          onChange={() => setNewForm({ ...newForm, alergiaAlimentacaoSim: true })}
                        />
                        Sim (Especificar)
                      </label>
                    </div>
                    {newForm.alergiaAlimentacaoSim && (
                      <input
                        type="text"
                        required
                        placeholder="Quais alimentos? Ex: Frutos do mar, Amendoim..."
                        value={newForm.alergiaAlimentacaoDescricao}
                        onChange={(e) => setNewForm({ ...newForm, alergiaAlimentacaoDescricao: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-red-500/40 text-red-200"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">
                      ALGUM PROBLEMA DE SAÚDE, FÍSICO OU MENTAL?
                    </label>
                    <div className="flex items-center gap-3 mb-1.5">
                      <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                        <input
                          type="radio"
                          name="probSaude"
                          checked={!newForm.problemaSaudeSim}
                          onChange={() => setNewForm({ ...newForm, problemaSaudeSim: false, problemaSaudeDescricao: '' })}
                        />
                        Não
                      </label>
                      <label className="flex items-center gap-1.5 text-amber-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="probSaude"
                          checked={newForm.problemaSaudeSim}
                          onChange={() => setNewForm({ ...newForm, problemaSaudeSim: true })}
                        />
                        Sim (Especificar)
                      </label>
                    </div>
                    {newForm.problemaSaudeSim && (
                      <input
                        type="text"
                        required
                        placeholder="Descreva o problema de saúde..."
                        value={newForm.problemaSaudeDescricao}
                        onChange={(e) => setNewForm({ ...newForm, problemaSaudeDescricao: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-amber-500/40 text-amber-200"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">
                      PCD (PESSOA COM DEFICIÊNCIA)? QUAL O PROBLEMA?
                    </label>
                    <div className="flex items-center gap-3 mb-1.5">
                      <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                        <input
                          type="radio"
                          name="pcdOpt"
                          checked={!newForm.pcdSim}
                          onChange={() => setNewForm({ ...newForm, pcdSim: false, pcdDescricao: '' })}
                        />
                        Não
                      </label>
                      <label className="flex items-center gap-1.5 text-sky-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="pcdOpt"
                          checked={newForm.pcdSim}
                          onChange={() => setNewForm({ ...newForm, pcdSim: true })}
                        />
                        Sim (Especificar qual)
                      </label>
                    </div>
                    {newForm.pcdSim && (
                      <input
                        type="text"
                        required
                        placeholder="Qual a deficiência ou condição PCD?"
                        value={newForm.pcdDescricao}
                        onChange={(e) => setNewForm({ ...newForm, pcdDescricao: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-sky-500/40 text-sky-200"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 4: 2 CONTATOS PARA EMERGÊNCIA (NOME E FONE/WHATSAPP) */}
              <div className="pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  4. 2 Contatos para Emergência (Nome e Fone / WhatsApp)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* CONTATO 1 */}
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 block">Contato de Emergência 1 *</span>
                    <div>
                      <label className="block text-zinc-500 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Maria Silveira"
                        value={newForm.emergencia1Nome}
                        onChange={(e) => setNewForm({ ...newForm, emergencia1Nome: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-500 mb-1">Parentesco</label>
                        <input
                          type="text"
                          placeholder="Esposa, Mãe..."
                          value={newForm.emergencia1Parentesco}
                          onChange={(e) => setNewForm({ ...newForm, emergencia1Parentesco: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-500 mb-1">Fone / WhatsApp</label>
                        <input
                          type="text"
                          required
                          placeholder="(11) 99999-8888"
                          value={newForm.emergencia1Telefone}
                          onChange={(e) => setNewForm({ ...newForm, emergencia1Telefone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CONTATO 2 */}
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 block">Contato de Emergência 2 *</span>
                    <div>
                      <label className="block text-zinc-500 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Santos (Irmão de Estrada)"
                        value={newForm.emergencia2Nome}
                        onChange={(e) => setNewForm({ ...newForm, emergencia2Nome: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-500 mb-1">Parentesco / Relação</label>
                        <input
                          type="text"
                          placeholder="Vice-Presidente, Irmão..."
                          value={newForm.emergencia2Parentesco}
                          onChange={(e) => setNewForm({ ...newForm, emergencia2Parentesco: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-500 mb-1">Fone / WhatsApp</label>
                        <input
                          type="text"
                          required
                          placeholder="(11) 98888-7777"
                          value={newForm.emergencia2Telefone}
                          onChange={(e) => setNewForm({ ...newForm, emergencia2Telefone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONSENTIMENTO OBRIGATÓRIO LGPD & LAI */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={newForm.termoLgpdAceito}
                    onChange={(e) => setNewForm({ ...newForm, termoLgpdAceito: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-zinc-200 text-[11px] leading-relaxed">
                    <strong>DECLARAÇÃO LGPD &amp; LAI:</strong> Declaro ciência e autorizo expressamente o tratamento dos meus dados cadastrais e dados sensíveis de saúde pelo <strong>{config.nomeClube}</strong> em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e a Lei de Acesso à Informação (Lei nº 12.527/2011), estritamente para gestão associativa e atendimento emergencial de tráfego.
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition shadow-md"
                >
                  Salvar Ficha do Associado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL COM ATUALIZAÇÃO COMPLETA */}
      {isEditModalOpen && selectedAssociado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 text-zinc-100 my-8">
            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-400" />
              Editar Ficha: {selectedAssociado.nomeGuerra || selectedAssociado.nome} ({selectedAssociado.numeroAssociado})
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Nome de Guerra (Apelido)</label>
                  <input
                    type="text"
                    required
                    value={editForm.nomeGuerra}
                    onChange={(e) => setEditForm({ ...editForm, nomeGuerra: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Estado Civil</label>
                  <select
                    value={editForm.estadoCivil}
                    onChange={(e) => setEditForm({ ...editForm, estadoCivil: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  >
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="União Estável">União Estável</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Tipo Sanguíneo</label>
                  <select
                    value={editForm.tipoSanguineo}
                    onChange={(e) => setEditForm({ ...editForm, tipoSanguineo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-amber-400 font-bold"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.whatsapp}
                    onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value, telefone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Regional</label>
                  <input
                    type="text"
                    value={editForm.regional}
                    onChange={(e) => setEditForm({ ...editForm, regional: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              {/* Endereço com busca CEP */}
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  Endereço &amp; CEP (Pesquisa na Internet)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">CEP</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={editForm.cep}
                        onChange={(e) => setEditForm({ ...editForm, cep: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleBuscarCep(editForm.cep, true)}
                        className="px-2.5 py-2 bg-amber-500 text-zinc-950 rounded-xl shrink-0 font-bold"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1">Logradouro</label>
                    <input
                      type="text"
                      value={editForm.logradouro}
                      onChange={(e) => setEditForm({ ...editForm, logradouro: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Número</label>
                    <input
                      type="text"
                      value={editForm.numero}
                      onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={editForm.bairro}
                      onChange={(e) => setEditForm({ ...editForm, bairro: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Cidade - UF</label>
                    <input
                      type="text"
                      value={`${editForm.cidade} - ${editForm.estado}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        setEditForm({
                          ...editForm,
                          cidade: parts[0]?.trim() || editForm.cidade,
                          estado: parts[1]?.trim() || editForm.estado,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              {/* Contatos Emergência */}
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block mb-2">
                  2 Contatos para Emergência
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                    <span className="text-[10px] text-amber-400 font-bold block">Contato 1</span>
                    <input
                      type="text"
                      placeholder="Nome"
                      value={editForm.emergencia1Nome}
                      onChange={(e) => setEditForm({ ...editForm, emergencia1Nome: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Telefone / WhatsApp"
                      value={editForm.emergencia1Telefone}
                      onChange={(e) => setEditForm({ ...editForm, emergencia1Telefone: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono"
                    />
                  </div>

                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                    <span className="text-[10px] text-amber-400 font-bold block">Contato 2</span>
                    <input
                      type="text"
                      placeholder="Nome"
                      value={editForm.emergencia2Nome}
                      onChange={(e) => setEditForm({ ...editForm, emergencia2Nome: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Telefone / WhatsApp"
                      value={editForm.emergencia2Telefone}
                      onChange={(e) => setEditForm({ ...editForm, emergencia2Telefone: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
