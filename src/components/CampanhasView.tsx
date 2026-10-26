import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Campanha, DoacaoRegistro, ConfiguracaoClube } from '../types';
import {
  HeartHandshake,
  Calendar,
  MapPin,
  Share2,
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Copy,
  Check,
  TrendingUp,
  Image,
  Sparkles,
  History,
  Archive,
  Info,
  Gift,
  Coins,
  ShieldCheck,
  ChevronRight,
  Eye,
  X,
  Phone,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';

interface Props {
  campanhas: Campanha[];
  config: ConfiguracaoClube;
  onSaveCampanha: (campanha: Omit<Campanha, 'id'>) => Promise<void>;
  onUpdateCampanha?: (id: string, campanha: Partial<Campanha>) => Promise<void>;
  onDeleteCampanha?: (id: string) => Promise<void>;
  onRegistrarDoacao: (campanhaId: string, doacao: Omit<DoacaoRegistro, 'id'>) => Promise<void>;
  onEncerrarCampanha: (campanhaId: string, relato: string, fotos?: string[]) => Promise<void>;
}

export const CampanhasView: React.FC<Props> = ({
  campanhas,
  config,
  onSaveCampanha,
  onUpdateCampanha,
  onDeleteCampanha,
  onRegistrarDoacao,
  onEncerrarCampanha,
}) => {
  const { activeRole, currentAssociado } = useAuth();
  const isDiretoriaOrAdmin = activeRole === 'administrador' || activeRole === 'diretoria';

  // Tabs: 'ativas' | 'historico'
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedBannerCampanha, setSelectedBannerCampanha] = useState<Campanha | null>(null);
  const [selectedDoacaoCampanha, setSelectedDoacaoCampanha] = useState<Campanha | null>(null);
  const [selectedEncerrarCampanha, setSelectedEncerrarCampanha] = useState<Campanha | null>(null);
  const [selectedHistoricoCampanha, setSelectedHistoricoCampanha] = useState<Campanha | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // New campaign form state
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipoCampanha: 'agasalhos' as Campanha['tipoCampanha'],
    dataInicio: '01/10/2026',
    dataFinal: '20/12/2026',
    metaArrecadacaoValor: 5000,
    metaArrecadacaoItens: 300,
    unidadeMeta: 'peças de agasalho',
    instituicaoNome: '',
    instituicaoCnpj: '',
    instituicaoResponsavel: '',
    instituicaoTelefone: '',
    instituicaoCidade: config.cidadeSede || 'São Paulo',
    instituicaoBairro: '',
    instituicaoEndereco: '',
    imagemMaterialUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    enderecoEntrega: `Sede Social Iron Side M.C. - Av. dos Bandeirantes, 1900 - Bairro Planalto, ${config.cidadeSede || 'São Paulo'} - SP`,
    chavePixDoacao: config.chavePix || 'social@ironsideroadrider.com.br',
  });

  // Donation form state
  const [doacaoForm, setDoacaoForm] = useState({
    autorNome: currentAssociado?.nomeGuerra || currentAssociado?.nome || 'Irmão de Estrada',
    autorIdentificador: currentAssociado?.numeroAssociado || 'COLABORADOR',
    tipo: 'financeiro' as DoacaoRegistro['tipo'],
    valor: 100,
    descricaoItens: '',
    observacoes: '',
  });

  // End campaign form state
  const [relatoEncerramento, setRelatoEncerramento] = useState('');
  const [fotosEntregaUrls, setFotosEntregaUrls] = useState(
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80'
  );

  const campanhasAtivas = campanhas.filter((c) => c.status !== 'encerrada');
  const campanhasHistorico = campanhas.filter((c) => c.status === 'encerrada');

  const filteredAtivas = campanhasAtivas.filter((c) => {
    if (tipoFilter === 'todos') return true;
    return c.tipoCampanha === tipoFilter;
  });

  // Generate WhatsApp Share Message
  const getWhatsAppShareUrl = (camp: Campanha) => {
    const text =
      `🏍️ *${config.nomeClube || 'IRON SIDE ROAD RIDER M.C.'} - AÇÃO SOCIAL SOLIDÁRIA* ❤️\n\n` +
      `📣 *CAMPANHA: ${camp.titulo.toUpperCase()}*\n\n` +
      `📝 *Sobre:* ${camp.descricao}\n\n` +
      `📅 *Período de Arrecadação:* ${camp.dataInicio} até ${camp.dataFinal}\n` +
      `🎯 *Meta:* ${
        camp.metaArrecadacaoValor ? `R$ ${camp.metaArrecadacaoValor.toLocaleString('pt-BR')} | ` : ''
      }${camp.metaArrecadacaoItens} ${camp.unidadeMeta}\n` +
      `🏢 *Instituição que Receberá:* ${camp.instituicaoRecebera.nome} (${camp.instituicaoRecebera.cidade})\n` +
      `📍 *Ponto de Coleta / Sede:* ${camp.enderecoEntrega}\n` +
      `🔑 *Chave PIX Solidária:* ${camp.chavePixDoacao || config.chavePix}\n\n` +
      `🖼️ *Cartaz Oficial da Campanha:* ${camp.imagemMaterialUrl}\n\n` +
      `✊ _"${config.lema || 'Os melhores são de ferro'}"_ - Faça parte desta corrente de solidariedade!`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleCopyShareText = (camp: Campanha) => {
    const text =
      `🏍️ ${config.nomeClube || 'IRON SIDE ROAD RIDER M.C.'} - AÇÃO SOCIAL SOLIDÁRIA\n` +
      `CAMPANHA: ${camp.titulo}\n` +
      `${camp.descricao}\n\n` +
      `Período: ${camp.dataInicio} a ${camp.dataFinal}\n` +
      `Instituição: ${camp.instituicaoRecebera.nome}\n` +
      `Ponto de Coleta: ${camp.enderecoEntrega}\n` +
      `Chave PIX: ${camp.chavePixDoacao || config.chavePix}\n` +
      `Cartaz: ${camp.imagemMaterialUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitNewCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveCampanha({
      titulo: formData.titulo,
      descricao: formData.descricao,
      tipoCampanha: formData.tipoCampanha,
      dataInicio: formData.dataInicio,
      dataFinal: formData.dataFinal,
      metaArrecadacaoValor: Number(formData.metaArrecadacaoValor) || 0,
      metaArrecadacaoItens: Number(formData.metaArrecadacaoItens) || 0,
      unidadeMeta: formData.unidadeMeta || 'itens arrecadados',
      arrecadadoValor: 0,
      arrecadadoItensCount: 0,
      instituicaoRecebera: {
        nome: formData.instituicaoNome,
        cnpj: formData.instituicaoCnpj,
        responsavel: formData.instituicaoResponsavel,
        telefone: formData.instituicaoTelefone,
        cidade: formData.instituicaoCidade,
        bairro: formData.instituicaoBairro,
        endereco: formData.instituicaoEndereco,
      },
      imagemMaterialUrl: formData.imagemMaterialUrl,
      enderecoEntrega: formData.enderecoEntrega,
      chavePixDoacao: formData.chavePixDoacao,
      status: 'ativa',
      createdAt: new Date().toISOString(),
    });
    setIsNewModalOpen(false);
  };

  const handleConfirmDoacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoacaoCampanha) return;

    await onRegistrarDoacao(selectedDoacaoCampanha.id, {
      autorNome: doacaoForm.autorNome,
      autorIdentificador: doacaoForm.autorIdentificador,
      tipo: doacaoForm.tipo,
      valor: doacaoForm.tipo === 'financeiro' ? Number(doacaoForm.valor) : undefined,
      descricaoItens: doacaoForm.tipo !== 'financeiro' ? doacaoForm.descricaoItens : undefined,
      data: new Date().toLocaleDateString('pt-BR'),
      observacoes: doacaoForm.observacoes,
    });

    setSelectedDoacaoCampanha(null);
  };

  const handleConfirmEncerrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncerrarCampanha) return;

    const fotos = fotosEntregaUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await onEncerrarCampanha(
      selectedEncerrarCampanha.id,
      relatoEncerramento ||
        'Campanha concluída com êxito e mantimentos entregues à instituição beneficiária pelo comboio do moto clube.',
      fotos
    );

    setSelectedEncerrarCampanha(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Ação Social & Irmandade sobre Duas Rodas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 font-heading">
              Campanhas & Doações Solidárias
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Arrecadações oficiais promovidas pelo {config.nomeClube}. Mobilizamos nossos comboios
              de motocicletas para apoiar instituições, lares e famílias em vulnerabilidade.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isDiretoriaOrAdmin && (
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Campanha
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher: Ativas x Histórico */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('ativas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ativas'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Campanhas Ativas</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'ativas' ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {campanhasAtivas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'historico'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Campanhas</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'historico' ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {campanhasHistorico.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter by Category */}
      {activeTab === 'ativas' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-zinc-500 font-semibold uppercase text-[10px] mr-1">Filtrar:</span>
          {[
            { id: 'todos', label: 'Todas as Ações' },
            { id: 'agasalhos', label: 'Agasalhos & Frio' },
            { id: 'brinquedos', label: 'Brinquedos & Crianças' },
            { id: 'alimentos', label: 'Alimentos & Cestas' },
            { id: 'financeira', label: 'Financeira / PIX' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTipoFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                tipoFilter === cat.id
                  ? 'bg-zinc-800 text-amber-400 border border-amber-500/40 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: CAMPANHAS ATIVAS */}
      {activeTab === 'ativas' && (
        <div className="space-y-6">
          {filteredAtivas.length === 0 ? (
            <div className="py-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800">
              <HeartHandshake className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-300 text-sm font-semibold">
                Nenhuma campanha ativa no momento.
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Acesse a aba &quot;Histórico de Campanhas&quot; para conferir ações anteriores
                realizadas com sucesso.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAtivas.map((camp) => {
                const percItens = camp.metaArrecadacaoItens
                  ? Math.min(100, Math.round((camp.arrecadadoItensCount / camp.metaArrecadacaoItens) * 100))
                  : 0;
                const percValor = camp.metaArrecadacaoValor
                  ? Math.min(100, Math.round((camp.arrecadadoValor / camp.metaArrecadacaoValor) * 100))
                  : 0;
                const percPrincipal = Math.max(percItens, percValor);

                return (
                  <div
                    key={camp.id}
                    className="rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg group"
                  >
                    <div>
                      {/* Banner Material Header */}
                      <div className="relative h-52 sm:h-60 w-full bg-zinc-950 overflow-hidden">
                        <img
                          src={camp.imagemMaterialUrl}
                          alt={camp.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow">
                            {camp.tipoCampanha}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Em Andamento
                          </span>
                        </div>

                        {/* Banner preview button */}
                        <button
                          type="button"
                          onClick={() => setSelectedBannerCampanha(camp)}
                          className="absolute top-3 right-3 p-2 rounded-xl bg-zinc-950/80 hover:bg-amber-500 text-zinc-300 hover:text-zinc-950 text-xs backdrop-blur-md border border-zinc-800 transition"
                          title="Ver material completo do cartaz"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Dates Banner Bottom */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 bg-zinc-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800/80">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <div>
                              <span className="text-[10px] text-zinc-400 block leading-tight">
                                Período Oficial
                              </span>
                              <span className="font-bold text-zinc-100">
                                {camp.dataInicio} até {camp.dataFinal}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                            Solidariedade Ativa
                          </span>
                        </div>
                      </div>

                      {/* Content Card */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-zinc-100 group-hover:text-amber-400 transition-colors font-heading">
                            {camp.titulo}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">
                            {camp.descricao}
                          </p>
                        </div>

                        {/* Arrecadação Progress Bar */}
                        <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                              Arrecadação Atual
                            </span>
                            <span className="font-black text-amber-400 font-mono">
                              {percPrincipal}% da meta
                            </span>
                          </div>

                          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-1000"
                              style={{ width: `${percPrincipal}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800/60">
                            {camp.metaArrecadacaoItens ? (
                              <div>
                                <span className="text-[10px] text-zinc-500 block">Itens Físicos</span>
                                <span className="font-bold text-zinc-200">
                                  {camp.arrecadadoItensCount} / {camp.metaArrecadacaoItens}{' '}
                                  <span className="text-[10px] text-zinc-400 font-normal">
                                    {camp.unidadeMeta}
                                  </span>
                                </span>
                              </div>
                            ) : null}

                            {camp.metaArrecadacaoValor ? (
                              <div>
                                <span className="text-[10px] text-zinc-500 block">Valor Financeiro</span>
                                <span className="font-bold text-emerald-400 font-mono">
                                  R$ {camp.arrecadadoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  <span className="text-[10px] text-zinc-500 font-normal ml-1">
                                    / R$ {camp.metaArrecadacaoValor.toLocaleString('pt-BR')}
                                  </span>
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Instituição Que Receberá */}
                        <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/70 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Instituição Que Receberá a Doação:</span>
                          </div>
                          <p className="text-zinc-200 font-semibold">
                            {camp.instituicaoRecebera.nome}
                          </p>
                          <div className="text-[11px] text-zinc-400 space-y-0.5">
                            {camp.instituicaoRecebera.responsavel && (
                              <p>Responsável: {camp.instituicaoRecebera.responsavel}</p>
                            )}
                            {camp.instituicaoRecebera.endereco && (
                              <p>
                                {camp.instituicaoRecebera.endereco} -{' '}
                                {camp.instituicaoRecebera.cidade}
                              </p>
                            )}
                            {camp.instituicaoRecebera.telefone && (
                              <p className="text-zinc-300 font-mono">
                                Contato: {camp.instituicaoRecebera.telefone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Endereço de Entrega ou Sede Matriz */}
                        <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/70 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Endereço de Entrega ou Sede Matriz:</span>
                          </div>
                          <p className="text-zinc-300 font-medium leading-relaxed">
                            {camp.enderecoEntrega}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="p-5 sm:p-6 pt-0 space-y-3">
                      {/* WhatsApp Share & Donation Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        {/* WhatsApp Share Button */}
                        <a
                          href={getWhatsAppShareUrl(camp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-900/30"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Compartilhar no WhatsApp</span>
                        </a>

                        {/* Doar Agora Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoacaoCampanha(camp);
                            setDoacaoForm({
                              ...doacaoForm,
                              tipo: 'financeiro',
                              valor: 100,
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                        >
                          <Gift className="w-4 h-4" />
                          <span>Doar / Registrar Apoio</span>
                        </button>
                      </div>

                      {/* Secondary Action Row: Copy Text & Diretoria Controls */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => handleCopyShareText(camp)}
                          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition text-[11px]"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Texto copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Chamada Solidária</span>
                            </>
                          )}
                        </button>

                        {isDiretoriaOrAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEncerrarCampanha(camp);
                                setRelatoEncerramento(
                                  `Ação solidária "${camp.titulo}" finalizada com sucesso. Agradecemos a todos os motociclistas, voluntários e apoiadores que tornaram essa entrega de carinho possível.`
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[11px] font-semibold transition"
                              title="Encerrar campanha e enviar para o histórico"
                            >
                              Encerrar & Mover p/ Histórico
                            </button>
                            {onDeleteCampanha && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Deseja realmente remover esta campanha?')) {
                                    onDeleteCampanha(camp.id);
                                  }
                                }}
                                className="text-zinc-500 hover:text-red-400 p-1"
                                title="Excluir"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE CAMPANHAS APÓS A DATA FINAL */}
      {activeTab === 'historico' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 text-xs text-zinc-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-400" />
              <span>
                Histórico oficial de campanhas sociais concluídas. Registro de impacto comunitário e
                prestação de contas às instituições parceiras.
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Total: {campanhasHistorico.length} ações
            </span>
          </div>

          {campanhasHistorico.length === 0 ? (
            <div className="py-16 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800">
              <History className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-300 text-sm font-semibold">
                Nenhuma campanha arquivada no histórico ainda.
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Quando uma campanha passar da data final ou for encerrada pela diretoria, seus
                resultados serão listados aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campanhasHistorico.map((camp) => (
                <div
                  key={camp.id}
                  className="rounded-3xl bg-zinc-900/90 border border-zinc-800/90 overflow-hidden flex flex-col justify-between shadow-md"
                >
                  <div>
                    {/* Header with grayscale photo & completion badge */}
                    <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                      <img
                        src={camp.imagemMaterialUrl}
                        alt={camp.titulo}
                        className="w-full h-full object-cover filter brightness-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-zinc-900/90 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                          {camp.tipoCampanha}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-extrabold flex items-center gap-1 shadow">
                          <CheckCircle2 className="w-3 h-3" />
                          Missão Cumprida
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800">
                        <span>Período: {camp.dataInicio} a {camp.dataFinal}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">100% Concluído</span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100 font-heading">
                          {camp.titulo}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {camp.descricao}
                        </p>
                      </div>

                      {/* Total Arrecadado no Histórico */}
                      <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Itens Doados</span>
                          <span className="text-base font-bold text-zinc-100">
                            {camp.arrecadadoItensCount}{' '}
                            <span className="text-xs text-zinc-400 font-normal">
                              {camp.unidadeMeta}
                            </span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 block">Recursos Arrecadados</span>
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            R$ {camp.arrecadadoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Instituição Beneficiada */}
                      <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60 text-xs">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                          Instituição Beneficiada
                        </span>
                        <p className="text-zinc-200 font-semibold mt-0.5">
                          {camp.instituicaoRecebera.nome}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {camp.instituicaoRecebera.cidade} - {camp.instituicaoRecebera.endereco}
                        </p>
                      </div>

                      {/* Relato de Encerramento e Entrega */}
                      {camp.relatoEncerramento && (
                        <div className="bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/20 text-xs space-y-1">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                            Relato Oficial da Entrega
                          </span>
                          <p className="text-zinc-300 italic leading-relaxed text-[11px]">
                            &ldquo;{camp.relatoEncerramento}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Fotos da Entrega Solidária */}
                      {camp.fotosEntrega && camp.fotosEntrega.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                            Registros Fotográficos da Entrega Solidária
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {camp.fotosEntrega.map((foto, idx) => (
                              <div
                                key={idx}
                                className="h-28 rounded-xl bg-zinc-950 overflow-hidden border border-zinc-800"
                              >
                                <img
                                  src={foto}
                                  alt="Entrega solidária"
                                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Histórico Details Button */}
                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedHistoricoCampanha(camp)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Prestação de Contas Completa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CRIAR NOVA CAMPANHA */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-zinc-950">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">
                    Criar Nova Campanha Solidária
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Preencha os dados oficiais da campanha para divulgação aos associados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCampanha} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Título da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Campanha do Agasalho Iron Side 2026 - Nenhum Irmão no Frio"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Descrição e Chamada de Ação *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o propósito da ação, público atendido e importância da doação..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Tipo de Ação</label>
                  <select
                    value={formData.tipoCampanha}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipoCampanha: e.target.value as Campanha['tipoCampanha'],
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                  >
                    <option value="agasalhos">Agasalhos / Frio</option>
                    <option value="brinquedos">Brinquedos / Crianças</option>
                    <option value="alimentos">Alimentos / Cestas</option>
                    <option value="financeira">Financeira / PIX</option>
                    <option value="medicamentos">Medicamentos</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Data Início *</label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/AAAA"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Data Final *</label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/AAAA"
                    value={formData.dataFinal}
                    onChange={(e) => setFormData({ ...formData, dataFinal: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Metas de Arrecadação */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <span className="text-amber-400 font-bold block text-[11px] uppercase tracking-wider">
                  Metas de Arrecadação
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Meta em Reais (R$)</label>
                    <input
                      type="number"
                      placeholder="Ex: 5000"
                      value={formData.metaArrecadacaoValor}
                      onChange={(e) =>
                        setFormData({ ...formData, metaArrecadacaoValor: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Meta em Itens</label>
                    <input
                      type="number"
                      placeholder="Ex: 500"
                      value={formData.metaArrecadacaoItens}
                      onChange={(e) =>
                        setFormData({ ...formData, metaArrecadacaoItens: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Unidade da Meta</label>
                    <input
                      type="text"
                      placeholder="peças de agasalho, cestas..."
                      value={formData.unidadeMeta}
                      onChange={(e) => setFormData({ ...formData, unidadeMeta: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              {/* Instituição Que Receberá */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <span className="text-amber-400 font-bold block text-[11px] uppercase tracking-wider">
                  Instituição Que Receberá a Doação
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Nome da Instituição *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lar São Vicente de Paulo"
                      value={formData.instituicaoNome}
                      onChange={(e) => setFormData({ ...formData, instituicaoNome: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={formData.instituicaoCnpj}
                      onChange={(e) => setFormData({ ...formData, instituicaoCnpj: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Responsável / Contato</label>
                    <input
                      type="text"
                      placeholder="Nome do diretor ou responsável"
                      value={formData.instituicaoResponsavel}
                      onChange={(e) =>
                        setFormData({ ...formData, instituicaoResponsavel: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={formData.instituicaoTelefone}
                      onChange={(e) =>
                        setFormData({ ...formData, instituicaoTelefone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1">Endereço da Instituição</label>
                    <input
                      type="text"
                      placeholder="Rua, número, bairro e cidade"
                      value={formData.instituicaoEndereco}
                      onChange={(e) =>
                        setFormData({ ...formData, instituicaoEndereco: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega & Imagem */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Endereço de Entrega ou Sede Matriz *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Endereço oficial para entrega das doações..."
                  value={formData.enderecoEntrega}
                  onChange={(e) => setFormData({ ...formData, enderecoEntrega: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Imagem/Cartaz de Divulgação (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.imagemMaterialUrl}
                    onChange={(e) => setFormData({ ...formData, imagemMaterialUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Chave PIX para Doações
                  </label>
                  <input
                    type="text"
                    placeholder="social@ironsideroadrider.com.br"
                    value={formData.chavePixDoacao}
                    onChange={(e) => setFormData({ ...formData, chavePixDoacao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition"
                >
                  Publicar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER MATERIAL / CARTAZ DA CAMPANHA */}
      {selectedBannerCampanha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Cartaz Oficial da Campanha
                </h3>
                <p className="text-xs text-zinc-400">{selectedBannerCampanha.titulo}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBannerCampanha(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="max-h-[60vh] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                <img
                  src={selectedBannerCampanha.imagemMaterialUrl}
                  alt={selectedBannerCampanha.titulo}
                  className="w-full h-full object-contain max-h-[60vh]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <a
                  href={getWhatsAppShareUrl(selectedBannerCampanha)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </a>

                <a
                  href={selectedBannerCampanha.imagemMaterialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Abrir Imagem</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DOAR / REGISTRAR APOIO */}
      {selectedDoacaoCampanha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500 text-zinc-950">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Apoiar Ação Solidária
                  </h3>
                  <p className="text-xs text-zinc-400">{selectedDoacaoCampanha.titulo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoacaoCampanha(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDoacao} className="py-4 space-y-4 text-xs">
              {/* Chave PIX Card */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Coins className="w-4 h-4" />
                    Chave PIX Oficial para Doações:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedDoacaoCampanha.chavePixDoacao || config.chavePix
                      );
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 2000);
                    }}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedPix ? 'Copiado!' : 'Copiar Chave'}
                  </button>
                </div>
                <p className="text-zinc-200 font-mono font-bold text-sm bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 select-all">
                  {selectedDoacaoCampanha.chavePixDoacao || config.chavePix}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Favorecido: {config.nomeClube} • Conta Social de Solidariedade
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Seu Nome ou Nome de Guerra *
                </label>
                <input
                  type="text"
                  required
                  value={doacaoForm.autorNome}
                  onChange={(e) => setDoacaoForm({ ...doacaoForm, autorNome: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Tipo de Doação</label>
                  <select
                    value={doacaoForm.tipo}
                    onChange={(e) =>
                      setDoacaoForm({
                        ...doacaoForm,
                        tipo: e.target.value as DoacaoRegistro['tipo'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  >
                    <option value="financeiro">Financeira (PIX / Transferência)</option>
                    <option value="agasalhos">Agasalhos & Cobertores</option>
                    <option value="brinquedos">Brinquedos Novos</option>
                    <option value="alimentos">Alimentos / Cestas Básicas</option>
                    <option value="outros">Outros Itens</option>
                  </select>
                </div>

                {doacaoForm.tipo === 'financeiro' ? (
                  <div>
                    <label className="block text-zinc-400 mb-1">Valor Doado (R$) *</label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={doacaoForm.valor}
                      onChange={(e) =>
                        setDoacaoForm({ ...doacaoForm, valor: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-zinc-400 mb-1">Quantidade / Descrição *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 5 jaquetas e 2 cobertores"
                      value={doacaoForm.descricaoItens}
                      onChange={(e) =>
                        setDoacaoForm({ ...doacaoForm, descricaoItens: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Mensagem ou Observações</label>
                <input
                  type="text"
                  placeholder="Deixe uma palavra fraterna para a instituição..."
                  value={doacaoForm.observacoes}
                  onChange={(e) => setDoacaoForm({ ...doacaoForm, observacoes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoacaoCampanha(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition"
                >
                  Confirmar Apoio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENCERRAR CAMPANHA & MOVER PARA HISTÓRICO */}
      {selectedEncerrarCampanha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">
                Encerrar Campanha & Gerar Histórico
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEncerrarCampanha(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEncerrar} className="py-4 space-y-4 text-xs">
              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 text-amber-300">
                Ao encerrar, a campanha &quot;{selectedEncerrarCampanha.titulo}&quot; será transferida
                para a aba permanente de Histórico e Prestação de Contas.
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Relato Oficial de Impacto & Entrega Solidária *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Relate como foi a entrega pelo comboio, agradecimentos e resultados..."
                  value={relatoEncerramento}
                  onChange={(e) => setRelatoEncerramento(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Fotos da Entrega (URLs separadas por linha)
                </label>
                <textarea
                  rows={2}
                  placeholder="https://..."
                  value={fotosEntregaUrls}
                  onChange={(e) => setFotosEntregaUrls(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEncerrarCampanha(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition"
                >
                  Concluir & Arquivar no Histórico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRESTAÇÃO DE CONTAS DETALHADA NO HISTÓRICO */}
      {selectedHistoricoCampanha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Dossiê de Prestação de Contas
                </span>
                <h3 className="text-lg font-bold text-zinc-100 font-heading">
                  {selectedHistoricoCampanha.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoricoCampanha(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Arrecadação Financeira</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    R${' '}
                    {selectedHistoricoCampanha.arrecadadoValor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Arrecadação de Mantimentos</span>
                  <span className="text-base font-bold text-zinc-200">
                    {selectedHistoricoCampanha.arrecadadoItensCount}{' '}
                    {selectedHistoricoCampanha.unidadeMeta}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-zinc-300">
                  Instituição Beneficiária:
                </span>
                <p className="text-zinc-200 font-semibold">
                  {selectedHistoricoCampanha.instituicaoRecebera.nome}
                </p>
                <p className="text-zinc-400 text-[11px]">
                  {selectedHistoricoCampanha.instituicaoRecebera.endereco} -{' '}
                  {selectedHistoricoCampanha.instituicaoRecebera.cidade}
                </p>
              </div>

              {selectedHistoricoCampanha.doacoes &&
                selectedHistoricoCampanha.doacoes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-300">
                      Registro de Apoiadores & Doações:
                    </span>
                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                      {selectedHistoricoCampanha.doacoes.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px]"
                        >
                          <div>
                            <span className="font-semibold text-zinc-200">{d.autorNome}</span>
                            <span className="text-zinc-500 text-[10px] ml-1.5">({d.data})</span>
                          </div>
                          <span className="font-bold text-amber-400">
                            {d.tipo === 'financeiro'
                              ? `R$ ${d.valor?.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}`
                              : d.descricaoItens}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoricoCampanha(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de Campanhas & Ações Solidárias */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
