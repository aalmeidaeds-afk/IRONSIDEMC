import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AmigoMotoClube } from '../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Building,
  UserPlus,
  Share2,
  Trash2,
  Edit3,
  ExternalLink,
  Shield,
  Download,
  Check,
  X,
  Compass,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';

interface Props {
  amigos: AmigoMotoClube[];
  onSaveNew: (data: Omit<AmigoMotoClube, 'id'>) => Promise<void>;
  onUpdate?: (id: string, data: Partial<AmigoMotoClube>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const AmigosMcView: React.FC<Props> = ({
  amigos,
  onSaveNew,
  onUpdate,
  onDelete,
}) => {
  const { activeRole, currentAssociado } = useAuth();
  const isDiretoriaOrAdmin = activeRole === 'administrador' || activeRole === 'diretoria';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmigo, setEditingAmigo] = useState<AmigoMotoClube | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialForm = {
    nome: '',
    tipo: 'moto_clube' as AmigoMotoClube['tipo'],
    presidenteOuContato: '',
    telefone: '',
    whatsapp: '',
    cidade: 'São Paulo',
    estado: 'SP',
    enderecoSede: '',
    fotoOuBrasaoUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
    anoFundacao: '2010',
    aniversarioMc: '',
    email: '',
    instagram: '',
    observacoes: '',
  };

  const [form, setForm] = useState(initialForm);

  const cleanPhoneDigits = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  // Filter list
  const filtered = amigos.filter((item) => {
    const matchesSearch =
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.presidenteOuContato &&
        item.presidenteOuContato.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === 'todos' ? true : item.tipo === filterTipo;

    return matchesSearch && matchesTipo;
  });

  // Export & Download Contact as .vcf (vCard 3.0) for native phone address book
  const handleDownloadVCard = (amigo: AmigoMotoClube) => {
    const phoneClean = cleanPhoneDigits(amigo.telefone || amigo.whatsapp);
    const orgType =
      amigo.tipo === 'moto_clube'
        ? 'Moto Clube Amigo'
        : amigo.tipo === 'moto_grupo'
        ? 'Moto Grupo Amigo'
        : amigo.tipo === 'faccao_regional'
        ? 'Facção / Regional'
        : 'Irmão de Estrada';

    const vCardContent = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${amigo.nome}`,
      `N:${amigo.nome};;;;`,
      `ORG:${orgType};`,
      amigo.presidenteOuContato ? `TITLE:Contato: ${amigo.presidenteOuContato}` : '',
      `TEL;TYPE=CELL,VOICE:${amigo.telefone || amigo.whatsapp}`,
      amigo.whatsapp ? `TEL;TYPE=WORK,MSG:${amigo.whatsapp}` : '',
      `ADR;TYPE=WORK:;;${amigo.enderecoSede || ''};${amigo.cidade};${amigo.estado};;Brasil`,
      amigo.email ? `EMAIL;TYPE=INTERNET:${amigo.email}` : '',
      `NOTE:Contato de Moto Clube Amigo cadastrado no Iron Side Road Rider M.C. Localidade: ${amigo.cidade} - ${amigo.estado}. ${amigo.observacoes || ''}`,
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\r\n');

    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFilename = amigo.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.setAttribute('download', `${safeFilename}_contato.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedId(amigo.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // WhatsApp Share / Direct Chat Link
  const getWhatsAppChatUrl = (amigo: AmigoMotoClube) => {
    const rawNumber = cleanPhoneDigits(amigo.whatsapp || amigo.telefone);
    const fullNumber = rawNumber.startsWith('55') ? rawNumber : `55${rawNumber}`;
    const myName = currentAssociado?.nomeGuerra || currentAssociado?.nome || 'Irmão de Estrada';
    const text = `Olá, irmãos do ${amigo.nome}! Aqui é o ${myName} do Iron Side Road Rider M.C. Forte abraço e saudações motociclísticas! 🏍️⚡`;
    return `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodeURIComponent(text)}`;
  };

  const handleOpenNew = () => {
    setEditingAmigo(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (amigo: AmigoMotoClube) => {
    setEditingAmigo(amigo);
    setForm({
      nome: amigo.nome,
      tipo: amigo.tipo,
      presidenteOuContato: amigo.presidenteOuContato || '',
      telefone: amigo.telefone,
      whatsapp: amigo.whatsapp,
      cidade: amigo.cidade,
      estado: amigo.estado,
      enderecoSede: amigo.enderecoSede || '',
      fotoOuBrasaoUrl: amigo.fotoOuBrasaoUrl || '',
      anoFundacao: amigo.anoFundacao || '',
      aniversarioMc: amigo.aniversarioMc || '',
      email: amigo.email || '',
      instagram: amigo.instagram || '',
      observacoes: amigo.observacoes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) return;

    if (editingAmigo && onUpdate) {
      await onUpdate(editingAmigo.id, {
        ...form,
        estado: form.estado.toUpperCase(),
      });
    } else {
      await onSaveNew({
        ...form,
        estado: form.estado.toUpperCase(),
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Rede de Irmandade & Aliança Duas Rodas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 font-heading">
              Amigos & Moto Clubes Parceiros
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Cadastro oficial de Moto Clubes amigos, grupos e parceiros de estrada. Salve os
              contatos diretamente na agenda do seu smartphone com 1 clique e envie mensagens no
              WhatsApp.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo MC / Amigo
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'todos', label: 'Todos os Contatos' },
            { id: 'moto_clube', label: 'Moto Clubes (MC)' },
            { id: 'moto_grupo', label: 'Moto Grupos (MG)' },
            { id: 'faccao_regional', label: 'Facções / Regionais' },
            { id: 'irmao_amigo', label: 'Irmãos & Amigos de Estrada' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterTipo(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                filterTipo === cat.id
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nome do MC, presidente, cidade ou UF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Grid of Friends & Motorcycle Clubs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-300 text-sm font-semibold">
              Nenhum Moto Clube ou amigo encontrado.
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Clique no botão &quot;Cadastrar Novo MC / Amigo&quot; para registrar novos parceiros de
              estrada.
            </p>
          </div>
        ) : (
          filtered.map((amigo) => {
            const waUrl = getWhatsAppChatUrl(amigo);
            const isCopied = copiedId === amigo.id;

            return (
              <div
                key={amigo.id}
                className="rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition overflow-hidden shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header with Crest / Photo */}
                  <div className="relative h-40 w-full bg-zinc-950 overflow-hidden">
                    <img
                      src={
                        amigo.fotoOuBrasaoUrl ||
                        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={amigo.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow">
                        {amigo.tipo === 'moto_clube'
                          ? 'Moto Clube'
                          : amigo.tipo === 'moto_grupo'
                          ? 'Moto Grupo'
                          : amigo.tipo === 'faccao_regional'
                          ? 'Facção'
                          : 'Irmão de Estrada'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-700 text-[11px] font-bold text-amber-400">
                      {amigo.cidade} - {amigo.estado}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-bold text-zinc-100 font-heading truncate drop-shadow">
                        {amigo.nome}
                      </h3>
                      {amigo.presidenteOuContato && (
                        <p className="text-xs text-amber-300 drop-shadow">
                          Contato / Liderança: {amigo.presidenteOuContato}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5 text-xs">
                    {/* Location & Address */}
                    <div className="flex items-start gap-2 text-zinc-400">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-200 font-medium block">
                          {amigo.cidade} - {amigo.estado}
                        </span>
                        {amigo.enderecoSede && (
                          <span className="text-[11px] text-zinc-400 block line-clamp-1">
                            {amigo.enderecoSede}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone & WhatsApp display */}
                    <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">
                          Telefone / WhatsApp
                        </span>
                        {amigo.anoFundacao && (
                          <span className="text-[10px] text-zinc-500">
                            Fundado em: {amigo.anoFundacao}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-100 font-mono font-bold text-sm">
                        {amigo.whatsapp || amigo.telefone}
                      </p>
                    </div>

                    {amigo.observacoes && (
                      <p className="text-[11px] text-zinc-400 italic line-clamp-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                        &ldquo;{amigo.observacoes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="p-5 pt-0 space-y-2.5">
                  {/* Two Main Requested Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* BUTTON 1: ADICIONAR NA AGENDA DO CELULAR */}
                    <button
                      type="button"
                      onClick={() => handleDownloadVCard(amigo)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition shadow-md ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                      }`}
                      title="Salvar na agenda de contatos do seu celular (.vcf)"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Salvo na Agenda!</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 text-amber-400" />
                          <span>Salvar na Agenda</span>
                        </>
                      )}
                    </button>

                    {/* BUTTON 2: PASSAR MENSAGEM WHATSAPP */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-950/40"
                      title="Enviar mensagem fraterna no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Mensagem WhatsApp</span>
                    </a>
                  </div>

                  {/* Secondary Quick Actions */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${cleanPhoneDigits(amigo.telefone || amigo.whatsapp)}`}
                        className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1"
                        title="Ligar"
                      >
                        <Phone className="w-3 h-3 text-amber-400" />
                        Ligar
                      </a>

                      {amigo.enderecoSede && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${amigo.enderecoSede} ${amigo.cidade} ${amigo.estado}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1 ml-2"
                        >
                          <Compass className="w-3 h-3 text-emerald-400" />
                          Ver Sede
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(amigo)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja remover ${amigo.nome} da lista de amigos?`)) {
                              onDelete(amigo.id);
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: CADASTRO / EDIÇÃO DE AMIGO & MOTO CLUBE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-zinc-950">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 font-heading">
                    {editingAmigo ? 'Editar Contato MC / Amigo' : 'Cadastrar Moto Clube / Amigo'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Registre os dados do MC para comunicação rápida e compartilhamento de contatos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Nome do Moto Clube ou Amigo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abutres do Asfalto M.C., Águias de Aço, etc."
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Categoria de Irmandade</label>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipo: e.target.value as AmigoMotoClube['tipo'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                  >
                    <option value="moto_clube">Moto Clube (M.C.)</option>
                    <option value="moto_grupo">Moto Grupo (M.G.)</option>
                    <option value="faccao_regional">Facção / Regional</option>
                    <option value="irmao_amigo">Irmão de Estrada / Amigo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Presidente / Contato Líder</label>
                  <input
                    type="text"
                    placeholder="Nome do presidente ou diretor"
                    value={form.presidenteOuContato}
                    onChange={(e) => setForm({ ...form, presidenteOuContato: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={form.telefone}
                    onChange={(e) =>
                      setForm({ ...form, telefone: e.target.value, whatsapp: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Instagram ou E-mail</label>
                  <input
                    type="text"
                    placeholder="@motoclube ou email"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 font-semibold mb-1">Cidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Campinas, São Paulo, Curitiba"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="SP"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Endereço da Sede / Ponto de Encontro</label>
                <input
                  type="text"
                  placeholder="Rua, número e bairro da sede"
                  value={form.enderecoSede}
                  onChange={(e) => setForm({ ...form, enderecoSede: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Foto / Brasão do Moto Clube (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.fotoOuBrasaoUrl}
                  onChange={(e) => setForm({ ...form, fotoOuBrasaoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Observações / Dias de Encontro</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, dias de confraternização..."
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition"
                >
                  {editingAmigo ? 'Atualizar Contato' : 'Salvar Moto Clube'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de Amigos & Moto Clubes */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
