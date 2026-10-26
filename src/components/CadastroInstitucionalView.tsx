import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CadastroInstitucional,
  MembroDiretoriaLegal,
  DocumentoChecklist,
  ConfiguracaoClube,
} from '../types';
import {
  Landmark,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  CreditCard,
  QrCode,
  DollarSign,
  Copy,
  Check,
  Award,
  Sparkles,
  Edit2,
  Save,
  Printer,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Lock,
  Eye,
  Info,
  Palette,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { GaleriaLogoModal } from './GaleriaLogoModal';

interface Props {
  dadosInstitucionais: CadastroInstitucional;
  config: ConfiguracaoClube;
  onSave: (dados: Partial<CadastroInstitucional>) => Promise<void>;
  onSaveConfig?: (dados: Partial<ConfiguracaoClube>) => Promise<void>;
}

export const CadastroInstitucionalView: React.FC<Props> = ({
  dadosInstitucionais,
  config,
  onSave,
  onSaveConfig,
}) => {
  const { activeRole, currentUser } = useAuth();
  const isDiretoriaOrAdmin = activeRole === 'administrador' || activeRole === 'diretoria';

  // Form State
  const [formData, setFormData] = useState<CadastroInstitucional>(dadosInstitucionais);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // CEP Lookup State
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  // Sync when prop updates
  useEffect(() => {
    setFormData(dadosInstitucionais);
  }, [dadosInstitucionais]);

  // Formatar CNPJ
  const formatCnpj = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
  };

  // Formatar Telefone/WhatsApp
  const formatPhone = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  // Formatar CPF
  const formatCpf = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  };

  // ViaCEP Lookup
  const handleBuscarCep = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepError('Informe um CEP válido com 8 dígitos.');
      return;
    }

    try {
      setCepLoading(true);
      setCepError(null);
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepError('CEP não encontrado nos Correios.');
        return;
      }

      setFormData((prev) => {
        const logradouro = data.logradouro || prev.logradouro;
        const bairro = data.bairro || prev.bairro;
        const cidade = data.localidade || prev.cidade;
        const estado = data.uf || prev.estado;
        const num = prev.numero || '1900';
        const enderecoCompleto = `${logradouro}, ${num} - ${bairro}, ${cidade} - ${estado}, CEP ${cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2')}`;

        return {
          ...prev,
          logradouro,
          bairro,
          cidade,
          estado,
          enderecoCompletoSede: enderecoCompleto,
        };
      });
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setCepError('Falha ao consultar CEP online.');
    } finally {
      setCepLoading(false);
    }
  };

  // Diretoria item change
  const handleDiretoriaChange = (index: number, field: keyof MembroDiretoriaLegal, val: string) => {
    if (!isDiretoriaOrAdmin) return;
    setFormData((prev) => {
      const updated = [...prev.diretoriaAtual];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, diretoriaAtual: updated };
    });
  };

  const handleAddDiretoriaMember = () => {
    if (!isDiretoriaOrAdmin) return;
    const newMember: MembroDiretoriaLegal = {
      id: `dir-${Date.now()}`,
      cargo: 'Conselheiro Fiscal / Diretor Adjunto',
      nomeCompleto: '',
      cpf: '',
      whatsapp: '',
      dataInicio: new Date().toLocaleDateString('pt-BR'),
    };
    setFormData((prev) => ({
      ...prev,
      diretoriaAtual: [...prev.diretoriaAtual, newMember],
    }));
  };

  const handleRemoveDiretoriaMember = (index: number) => {
    if (!isDiretoriaOrAdmin) return;
    setFormData((prev) => ({
      ...prev,
      diretoriaAtual: prev.diretoriaAtual.filter((_, i) => i !== index),
    }));
  };

  // Checklist toggle
  const handleChecklistToggle = (key: keyof DocumentoChecklist) => {
    if (!isDiretoriaOrAdmin) return;
    setFormData((prev) => ({
      ...prev,
      checklistDocumentos: {
        ...prev.checklistDocumentos,
        [key]: !prev.checklistDocumentos[key],
      },
    }));
  };

  // Save changes
  const handleSaveSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDiretoriaOrAdmin) return;

    try {
      setIsSaving(true);
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao salvar cadastro institucional:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Pix
  const handleCopyPix = () => {
    if (!formData.chavePixInstitucional) return;
    navigator.clipboard.writeText(formData.chavePixInstitucional);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12 print:p-0 print:m-0 print:space-y-4">
      {/* HEADER PRINCIPAL DO MÓDULO 0 */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 border border-amber-500/40 shadow-2xl relative overflow-hidden print:border-zinc-300 print:bg-white print:p-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border-2 border-amber-500/60 flex items-center justify-center p-2 shrink-0 shadow-lg print:border-zinc-800">
              <img
                src={config.logotipoUrl || '/ironside-logo.svg'}
                alt={formData.nomeFantasia}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider">
                  MÓDULO 00
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Fundação &amp; Conformidade Jurídica
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-club tracking-wide text-zinc-100 mt-1 print:text-zinc-900">
                CADASTRO INSTITUCIONAL — MOTO CLUBE
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 print:text-zinc-600">
                {formData.razaoSocial} • CNPJ: {formData.cnpj}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto print:hidden">
            {/* PERMISSION STATUS BADGE */}
            {isDiretoriaOrAdmin ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/40 text-sky-300 text-xs font-semibold">
                <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Permissão: Diretoria / Admin (Edição Liberada)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Perfil Associado (Somente Visualização)</span>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition border border-zinc-700 cursor-pointer shadow-sm"
              title="Imprimir dossiê institucional oficial do clube"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            {isDiretoriaOrAdmin && (
              <button
                type="button"
                onClick={() => handleSaveSubmit()}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Gravando...' : 'Salvar Alterações'}</span>
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK DE SALVAMENTO */}
        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Dados institucionais e checklist oficial atualizados com sucesso e salvos nos registros!
            </span>
          </div>
        )}

        {/* AVISO DO PERFIL ASSOCIADO */}
        {!isDiretoriaOrAdmin && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Transparência para o Associado:</strong> Os dados institucionais, sede, representação da diretoria e finanças oficiais estão disponíveis para sua consulta. Atualizações são restritas à Diretoria Executiva e Administração.
            </span>
          </div>
        )}
      </div>

      {/* FORMULÁRIO / DOSSIÊ INSTITUCIONAL EM 6 SEÇÕES */}
      <div className="space-y-6">
        {/* 1. DADOS INSTITUCIONAIS BÁSICOS */}
        <section className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 print:bg-white print:border-zinc-300 print:p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:border-zinc-300">
            <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-heading uppercase tracking-wider print:text-zinc-900">
              <Landmark className="w-4 h-4" />
              <span>1. Dados Institucionais Básicos</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Pessoa Jurídica
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1">
                Razão Social (Nome Oficial) *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 disabled:bg-zinc-950/60 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: ASSOCIAÇÃO MOTO CLUBE IRON SIDE ROAD RIDER"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Nome Fantasia (Moto Clube) *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 disabled:bg-zinc-950/60 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: IRON SIDE ROAD RIDER M.C."
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Data de Fundação *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.dataFundacao}
                onChange={(e) => setFormData({ ...formData, dataFundacao: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 disabled:bg-zinc-950/60 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="DD/MM/AAAA (Ex: 15/03/2016)"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono font-bold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 disabled:bg-zinc-950/60 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Inscrição Estadual / Municipal
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.inscricaoEstadualMunicipal}
                onChange={(e) => setFormData({ ...formData, inscricaoEstadualMunicipal: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 disabled:bg-zinc-950/60 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Isento ou Nº de inscrição municipal"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-zinc-400 font-semibold mb-1">
                Natureza Jurídica *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.naturezaJuridica}
                onChange={(e) => setFormData({ ...formData, naturezaJuridica: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 disabled:bg-zinc-950/60 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: 399-9 - Associação Privada Sem Fins Lucrativos"
              />
            </div>
          </div>
        </section>

        {/* 2. SEDE E LOCALIZAÇÃO */}
        <section className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 print:bg-white print:border-zinc-300 print:p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:border-zinc-300">
            <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-heading uppercase tracking-wider print:text-zinc-900">
              <MapPin className="w-4 h-4" />
              <span>2. Sede e Localização</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Endereço Físico &amp; Canais
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* CEP COM BUSCA VIACEP */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">CEP da Sede *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={!isDiretoriaOrAdmin}
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                />
                {isDiretoriaOrAdmin && (
                  <button
                    type="button"
                    onClick={handleBuscarCep}
                    disabled={cepLoading}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer print:hidden"
                    title="Buscar endereço nos Correios pelo CEP"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{cepLoading ? '...' : 'ViaCEP'}</span>
                  </button>
                )}
              </div>
              {cepError && <span className="text-[10px] text-red-400 mt-1 block">{cepError}</span>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1">Logradouro / Avenida / Rua</label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: Avenida dos Bandeirantes"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Número</label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: 1900"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Complemento</label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Galpão, Sala, Andar"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Bairro</label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: Planalto"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Cidade</label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="São Paulo"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Estado (UF)</label>
              <input
                type="text"
                maxLength={2}
                disabled={!isDiretoriaOrAdmin}
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 uppercase font-mono text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="SP"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-zinc-400 font-semibold mb-1">
                Endereço Completo Formatado da Sede
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.enderecoCompletoSede}
                onChange={(e) => setFormData({ ...formData, enderecoCompletoSede: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black font-semibold"
                placeholder="Rua, Número, Complemento, Bairro, Cidade, Estado, CEP"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-1">
              <label className="block text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Telefone Institucional
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.telefoneInstitucional}
                onChange={(e) => setFormData({ ...formData, telefoneInstitucional: formatPhone(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-1">
              <label className="block text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                E-mail Oficial
              </label>
              <input
                type="email"
                disabled={!isDiretoriaOrAdmin}
                value={formData.emailOficial}
                onChange={(e) => setFormData({ ...formData, emailOficial: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="contato@motoclube.com"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                Redes Sociais / Site Oficial
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.redesSociaisSite}
                onChange={(e) => setFormData({ ...formData, redesSociaisSite: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="@Instagram / Facebook / Site Oficial"
              />
            </div>
          </div>
        </section>

        {/* 3. DIRETORIA ATUAL (REPRESENTAÇÃO LEGAL COM CPF E WHATSAPP) */}
        <section className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 print:bg-white print:border-zinc-300 print:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3 print:border-zinc-300">
            <div>
              <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-heading uppercase tracking-wider print:text-zinc-900">
                <Users className="w-4 h-4" />
                <span>3. Diretoria Atual (Representação Legal)</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5 print:text-zinc-600">
                Membros com poder estatutário de representação, registros de CPF e WhatsApp direto.
              </p>
            </div>

            {isDiretoriaOrAdmin && (
              <button
                type="button"
                onClick={handleAddDiretoriaMember}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700 cursor-pointer self-start sm:self-auto print:hidden"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Adicionar Cargo</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.diretoriaAtual.map((membro, index) => {
              const cleanWa = membro.whatsapp.replace(/\D/g, '');
              const waUrl = cleanWa ? `https://wa.me/55${cleanWa}` : undefined;

              return (
                <div
                  key={membro.id || index}
                  className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/40 transition space-y-3 print:bg-zinc-50 print:border-zinc-300"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 print:border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <input
                        type="text"
                        disabled={!isDiretoriaOrAdmin}
                        value={membro.cargo}
                        onChange={(e) => handleDiretoriaChange(index, 'cargo', e.target.value)}
                        className="font-bold text-xs text-amber-300 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 disabled:opacity-90 print:text-black"
                        placeholder="Cargo Oficial"
                      />
                    </div>
                    {isDiretoriaOrAdmin && formData.diretoriaAtual.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDiretoriaMember(index)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition cursor-pointer print:hidden"
                        title="Remover cargo da diretoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase font-semibold">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        disabled={!isDiretoriaOrAdmin}
                        value={membro.nomeCompleto}
                        onChange={(e) => handleDiretoriaChange(index, 'nomeCompleto', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-semibold focus:border-amber-400 focus:outline-none disabled:opacity-90 print:bg-white print:border-zinc-300 print:text-black"
                        placeholder="Nome do Diretor"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-semibold">
                          CPF
                        </label>
                        <input
                          type="text"
                          disabled={!isDiretoriaOrAdmin}
                          value={membro.cpf}
                          onChange={(e) => handleDiretoriaChange(index, 'cpf', formatCpf(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-[11px] focus:border-amber-400 focus:outline-none disabled:opacity-90 print:bg-white print:border-zinc-300 print:text-black"
                          placeholder="000.000.000-00"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-semibold">
                          Início Mandato
                        </label>
                        <input
                          type="text"
                          disabled={!isDiretoriaOrAdmin}
                          value={membro.dataInicio}
                          onChange={(e) => handleDiretoriaChange(index, 'dataInicio', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] focus:border-amber-400 focus:outline-none disabled:opacity-90 print:bg-white print:border-zinc-300 print:text-black"
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] text-zinc-500 uppercase font-semibold">
                          WhatsApp
                        </label>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold print:hidden"
                          >
                            <span>Conversar</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={!isDiretoriaOrAdmin}
                        value={membro.whatsapp}
                        onChange={(e) => handleDiretoriaChange(index, 'whatsapp', formatPhone(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-300 font-mono text-[11px] focus:border-amber-400 focus:outline-none disabled:opacity-90 print:bg-white print:border-zinc-300 print:text-black"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. DADOS BANCÁRIOS E FINANCEIROS */}
        <section className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 print:bg-white print:border-zinc-300 print:p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:border-zinc-300">
            <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-heading uppercase tracking-wider print:text-zinc-900">
              <DollarSign className="w-4 h-4" />
              <span>4. Dados Bancários e Financeiros</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Tesouraria PJ Oficial
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Código Bancário (COMPE) *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.codigoBancario || '001'}
                onChange={(e) => setFormData({ ...formData, codigoBancario: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: 001, 237, 341, 104"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-3">
              <label className="block text-zinc-400 font-semibold mb-1">
                Nome do Banco *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: Banco do Brasil S.A."
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Agência Bancária *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="Agência: 1820-1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Conta Corrente PJ *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                placeholder="Conta: 45290-8"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Limite da Conta (Cheque Especial / Crédito)
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.limiteConta || '15.000,00'}
                onChange={(e) => setFormData({ ...formData, limiteConta: e.target.value })}
                placeholder="Ex: 15.000,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono font-bold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Telefone do Banco / Agência
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.telefoneBanco || '(11) 4004-0001'}
                onChange={(e) => setFormData({ ...formData, telefoneBanco: e.target.value })}
                placeholder="(00) 0000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1">
                Nome do Gerente de Conta PJ
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.nomeGerente || 'Carlos Eduardo Fontes (Gerente Corporate PJ)'}
                onChange={(e) => setFormData({ ...formData, nomeGerente: e.target.value })}
                placeholder="Nome do Gerente"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1">
                Tipo de Conta *
              </label>
              <input
                type="text"
                disabled={!isDiretoriaOrAdmin}
                value={formData.tipoConta}
                onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                placeholder="Ex: Conta Corrente PJ"
              />
            </div>

            {/* CHAVE PIX INSTITUCIONAL COM BOTÃO DE COPIAR */}
            <div className="sm:col-span-2 lg:col-span-4 p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:bg-zinc-50 print:border-zinc-300">
              <div className="flex-1 w-full sm:w-auto">
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Chave Pix Institucional para Mensalidades e Doações</span>
                </label>
                <input
                  type="text"
                  disabled={!isDiretoriaOrAdmin}
                  value={formData.chavePixInstitucional}
                  onChange={(e) => setFormData({ ...formData, chavePixInstitucional: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-300 font-mono font-bold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-90 print:bg-white print:border-zinc-300 print:text-black"
                  placeholder="CNPJ, E-mail ou chave aleatória"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyPix}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md print:hidden"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Chave Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Pix Oficial</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 5. IDENTIDADE DO MOTO CLUBE (SÍMBOLOS) */}
        <section className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 print:bg-white print:border-zinc-300 print:p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:border-zinc-300">
            <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-heading uppercase tracking-wider print:text-zinc-900">
              <Sparkles className="w-4 h-4" />
              <span>5. Identidade do Moto Clube (Símbolos)</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Brasão, Lema &amp; Tradição
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Lema / Slogan Oficial *
                </label>
                <input
                  type="text"
                  disabled={!isDiretoriaOrAdmin}
                  value={formData.lemaSlogan}
                  onChange={(e) => setFormData({ ...formData, lemaSlogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-300 font-bold text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                  placeholder="Ex: Irmandade, Estrada e Respeito"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Significado das Cores / Brasão Oficial *
                </label>
                <textarea
                  rows={4}
                  disabled={!isDiretoriaOrAdmin}
                  value={formData.significadoCoresBrasao}
                  onChange={(e) => setFormData({ ...formData, significadoCoresBrasao: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs leading-relaxed focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                  placeholder="Descreva a história e simbologia das cores, caveira, águia ou elementos do brasão..."
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Sub-sedes / Regionais Oficiais
                </label>
                <input
                  type="text"
                  disabled={!isDiretoriaOrAdmin}
                  value={formData.subsedesRegionais}
                  onChange={(e) => setFormData({ ...formData, subsedesRegionais: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-400 focus:outline-none disabled:opacity-80 print:bg-white print:border-zinc-300 print:text-black"
                  placeholder="Cidades ou Estados com representação ou facção regional"
                />
              </div>
            </div>

            {/* PREVIEW DO BRASÃO / LOGOTIPO */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3 print:bg-white print:border-zinc-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Logotipo / Brasão Oficial
              </span>
              <div className="w-28 h-28 rounded-2xl bg-zinc-900 border border-amber-500/40 p-2 flex items-center justify-center shadow-inner">
                <img
                  src={config.logotipoUrl || '/ironside-logo.svg'}
                  alt="Brasão Oficial"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-[11px] font-bold text-zinc-200">
                {formData.nomeFantasia}
              </p>
              <p className="text-[10px] text-amber-400 font-mono italic">
                &ldquo;{formData.lemaSlogan}&rdquo;
              </p>
              {isDiretoriaOrAdmin && onSaveConfig && (
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(true)}
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-black transition shadow-sm print:hidden"
                  title="Trocar Logotipo ou Escolher na Galeria de Artes"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Trocar pela Galeria de Artes</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 6. DOCUMENTAÇÃO OFICIAL (CHECKLIST) */}
        <section className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 print:bg-white print:border-zinc-300 print:p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:border-zinc-300">
            <div>
              <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-heading uppercase tracking-wider print:text-zinc-900">
                <FileCheck2 className="w-4 h-4" />
                <span>6. Documentação Oficial (Checklist Institucional)</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5 print:text-zinc-600">
                Status de regularidade jurídica e arquivo documental arquivado em cartório e na sede.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              Conformidade Cartorial
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                key: 'estatutoSocialRegistrado' as const,
                label: 'Estatuto Social Registrado em Cartório',
                desc: 'Registrado sob fé pública com normas de filiação',
              },
              {
                key: 'ataFundacaoEleicao' as const,
                label: 'Ata de Fundação e Eleição da Diretoria Atual',
                desc: 'Ata de posse da representação jurídica em vigor',
              },
              {
                key: 'cartaoCnpj' as const,
                label: 'Cartão do CNPJ',
                desc: 'Comprovante de Inscrição e Situação Cadastral Ativa',
              },
              {
                key: 'comprovanteEnderecoSede' as const,
                label: 'Comprovante de Endereço da Sede',
                desc: 'Água/Luz/IPTU comprovando a localização física',
              },
              {
                key: 'regimentoInterno' as const,
                label: 'Regimento Interno (Normas de Coletes e Conduta)',
                desc: 'Código disciplinar de estrada e hierarquia',
              },
              {
                key: 'logotipoBrasaoVetorizado' as const,
                label: 'Logotipo / Brasão Oficial (Vetorizado)',
                desc: 'Arquivo em alta definição para estamparia e coletes',
              },
            ].map((docItem) => {
              const isChecked = Boolean(formData.checklistDocumentos[docItem.key]);

              return (
                <div
                  key={docItem.key}
                  onClick={() => {
                    if (isDiretoriaOrAdmin) handleChecklistToggle(docItem.key);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all select-none ${
                    isDiretoriaOrAdmin ? 'cursor-pointer hover:border-amber-500/50' : 'cursor-default'
                  } ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-zinc-100 print:bg-zinc-50 print:border-zinc-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-bold'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-bold leading-snug text-zinc-200 print:text-black">
                        {docItem.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 leading-tight print:text-zinc-600">
                        {docItem.desc}
                      </p>
                      <span
                        className={`inline-block text-[9px] font-bold uppercase mt-1 px-1.5 py-0.2 rounded ${
                          isChecked
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {isChecked ? 'Regularizado / Arquivado' : 'Pendente de Atualização'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* BOTÃO FLUTUANTE INFERIOR DE SALVAMENTO PARA DIRETORIA/ADMIN */}
      {isDiretoriaOrAdmin && (
        <div className="pt-4 flex items-center justify-between border-t border-zinc-800/80 print:hidden">
          <p className="text-xs text-zinc-400">
            Última atualização registrada: <strong className="text-zinc-200">{new Date(formData.updatedAt).toLocaleString('pt-BR')}</strong>
          </p>
          <button
            type="button"
            onClick={() => handleSaveSubmit()}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition cursor-pointer shadow-xl shadow-amber-500/20 active:scale-98 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando Dados...' : 'Salvar Alterações do Cadastro Institucional'}</span>
          </button>
        </div>
      )}

      {/* MODAL DE TROCA DE LOGO PELA GALERIA DE ARTES */}
      {onSaveConfig && (
        <GaleriaLogoModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          currentLogoUrl={config.logotipoUrl}
          onSelectLogo={async (url) => {
            await onSaveConfig({ logotipoUrl: url });
          }}
        />
      )}

      {/* MARCA DA EMPRESA DINASTIA SYSTEM NO FINAL DO MÓDULO 0 */}
      <DinastiaBrandBadge variant="footer" className="mt-8 print:hidden" />
    </div>
  );
};
