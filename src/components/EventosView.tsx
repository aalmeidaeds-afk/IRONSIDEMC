import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Evento, EventoFoto, ConfiguracaoClube, Associado } from '../types';
import { exportarListaInscritosPDF } from '../utils/pdfExport';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  Share2,
  DollarSign,
  Award,
  FileDown,
  UserCheck,
  UserX,
  Search,
  ExternalLink,
  ChevronRight,
  Shield,
  FileText,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Bell,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { EventoGaleriaCarousel } from './EventoGaleriaCarousel';
import { agendarLembreteNoDispositivo } from '../utils/eventNotificationHelper';

interface Props {
  eventos: Evento[];
  associados?: Associado[];
  config: ConfiguracaoClube;
  onSaveNew: (data: Omit<Evento, 'id'>) => Promise<void>;
  onToggleInscricao: (eventoId: string, associadoId: string) => Promise<void>;
  onTogglePresenca?: (eventoId: string, associadoId: string, presente: boolean) => Promise<void>;
}

export const EventosView: React.FC<Props> = ({
  eventos,
  associados = [],
  config,
  onSaveNew,
  onToggleInscricao,
  onTogglePresenca,
}) => {
  const { activeRole, currentAssociado } = useAuth();
  const [localEventos, setLocalEventos] = useState<Evento[]>(eventos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventoModal, setSelectedEventoModal] = useState<Evento | null>(null);
  const [modalTab, setModalTab] = useState<'galeria' | 'inscritos'>('galeria');
  const [termoBuscaInscritos, setTermoBuscaInscritos] = useState('');
  const [exportandoPdfId, setExportandoPdfId] = useState<string | null>(null);
  const [toastLembrete, setToastLembrete] = useState<string | null>(null);

  const handleAgendarLembrete = async (ev: Evento) => {
    try {
      const res = await agendarLembreteNoDispositivo(ev);
      setToastLembrete(res.mensagem);
      setTimeout(() => setToastLembrete(null), 4500);
    } catch (err) {
      console.error(err);
      setToastLembrete('Erro ao agendar lembrete no dispositivo.');
      setTimeout(() => setToastLembrete(null), 4000);
    }
  };

  useEffect(() => {
    setLocalEventos(eventos);
  }, [eventos]);

  const handleFotoAdded = (novaFoto: EventoFoto) => {
    if (!selectedEventoModal) return;
    const targetId = selectedEventoModal.id;
    setLocalEventos((prev) =>
      prev.map((e) =>
        e.id === targetId ? { ...e, galeria: [novaFoto, ...(e.galeria || [])] } : e
      )
    );
    setSelectedEventoModal((prev) =>
      prev && prev.id === targetId
        ? { ...prev, galeria: [novaFoto, ...(prev.galeria || [])] }
        : prev
    );
  };

  const handleFotoDeleted = (fotoId: string) => {
    if (!selectedEventoModal) return;
    const targetId = selectedEventoModal.id;
    setLocalEventos((prev) =>
      prev.map((e) =>
        e.id === targetId
          ? { ...e, galeria: (e.galeria || []).filter((f) => f.id !== fotoId) }
          : e
      )
    );
    setSelectedEventoModal((prev) =>
      prev && prev.id === targetId
        ? { ...prev, galeria: (prev.galeria || []).filter((f) => f.id !== fotoId) }
        : prev
    );
  };

  const handleCurtidaToggled = (fotoId: string) => {
    if (!selectedEventoModal) return;
    const targetId = selectedEventoModal.id;
    const userId = currentAssociado?.id || currentAssociado?.uid || 'user-anon';
    setLocalEventos((prev) =>
      prev.map((e) => {
        if (e.id !== targetId) return e;
        const updatedGaleria = (e.galeria || []).map((f) => {
          if (f.id !== fotoId) return f;
          const curtidas = f.curtidas || [];
          const updated = curtidas.includes(userId)
            ? curtidas.filter((id) => id !== userId)
            : [...curtidas, userId];
          return { ...f, curtidas: updated };
        });
        return { ...e, galeria: updatedGaleria };
      })
    );
    setSelectedEventoModal((prev) => {
      if (!prev || prev.id !== targetId) return prev;
      const updatedGaleria = (prev.galeria || []).map((f) => {
        if (f.id !== fotoId) return f;
        const curtidas = f.curtidas || [];
        const updated = curtidas.includes(userId)
          ? curtidas.filter((id) => id !== userId)
          : [...curtidas, userId];
        return { ...f, curtidas: updated };
      });
      return { ...prev, galeria: updatedGaleria };
    });
  };

  const handleConvocarComboioWhatsApp = (ev: Evento) => {
    const nomeClube = config.nomeClube || 'IRON SIDE ROAD RIDER M.C.';
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ev.local}, ${ev.cidade || config.cidadeSede}`)}`;
    const briefing = [
      `🏍️ *COMBOIO OFICIAL - ${nomeClube.toUpperCase()}* 🏍️`,
      ``,
      `📌 *Destino:* ${ev.titulo}`,
      `📅 *Data & Horário:* ${ev.data} às ${ev.hora}`,
      `📍 *Ponto de Concentração:* ${ev.local} (${ev.cidade || config.cidadeSede})`,
      `💰 *Valor / Taxa:* ${ev.preco > 0 ? `R$ ${ev.preco.toFixed(2)}` : 'Gratuito'}`,
      ``,
      `📝 *Briefing da Rota:* ${ev.descricao}`,
      ``,
      `⚠️ *Checklist Obrigatório de Estrada:*`,
      `• Colete oficial do clube`,
      `• Tanque cheio e calibragem dos pneus conferida`,
      `• CRLV digital da moto regularizado`,
      `• Equipamento de proteção completo (capacete, luvas, bota)`,
      ``,
      `📍 *Link da Rota no Google Maps:* ${mapsLink}`,
      ``,
      `📲 Confirmem presença no aplicativo oficial do clube!`,
      `_Irmandade, Honra, Liberdade e o Ronco dos Motores!_`,
    ].join('\n');

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(briefing)}`;
    window.open(url, '_blank');
  };

  // Form state
  const [form, setForm] = useState({
    titulo: 'Expedição Serra da Graciosa & Morretes',
    descricao:
      'Passeio oficial em comboio com almoço típico de barreado. Parada para fotos no mirante histórico e briefing técnico antes da descida.',
    data: '22/11/2026',
    hora: '07:30',
    local: 'Sede Regional ou Posto Shell Km 18',
    cidade: 'Curitiba - PR',
    preco: 0,
    vagasLimite: 40,
    imagemUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    organizador: 'Diretoria de Estradas',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveNew({
      titulo: form.titulo,
      descricao: form.descricao,
      data: form.data,
      hora: form.hora,
      local: form.local,
      cidade: form.cidade,
      preco: Number(form.preco) || 0,
      vagasLimite: Number(form.vagasLimite) || 50,
      participantesCount: 0,
      imagemUrl: form.imagemUrl,
      status: 'agendado',
      organizador: form.organizador,
      inscritos: [],
      presencas: {},
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  const handleExportPDF = (evento: Evento) => {
    setExportandoPdfId(evento.id);
    try {
      exportarListaInscritosPDF(evento, associados, config);
    } catch (err) {
      console.error('Erro ao gerar PDF de inscritos:', err);
    } finally {
      setTimeout(() => setExportandoPdfId(null), 600);
    }
  };

  // Mantém o evento selecionado sincronizado se houver atualização de fotos ou presença
  const eventoAtivoModal = selectedEventoModal
    ? localEventos.find((ev) => ev.id === selectedEventoModal.id) || selectedEventoModal
    : null;

  return (
    <div className="space-y-6">
      {toastLembrete && (
        <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>{toastLembrete}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastLembrete(null)}
            className="text-zinc-400 hover:text-zinc-100 text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
            Passeios, Encontros & Eventos Oficiais
          </h2>
          <p className="text-xs text-zinc-400">
            Agenda de comboios, encontros mensais, controle de presença e galeria de fotos oficial.
          </p>
        </div>

        {activeRole !== 'associado' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Criar Novo Evento
          </button>
        )}
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localEventos.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-semibold">
              Nenhum evento programado.
            </p>
          </div>
        ) : (
          localEventos.map((ev) => {
            const isInscrito =
              currentAssociado &&
              ev.inscritos &&
              (ev.inscritos.includes(currentAssociado.id) ||
                ev.inscritos.includes(currentAssociado.uid));

            const totalInscritos = ev.inscritos ? ev.inscritos.length : 0;
            const presencasMap = ev.presencas || {};
            const totalPresentes = (ev.inscritos || []).filter(
              (id) => presencasMap[id] === true
            ).length;
            const totalFotos = (ev.galeria || []).length;

            return (
              <div
                key={ev.id}
                className="rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 w-full bg-zinc-950 relative overflow-hidden group">
                    <img
                      src={
                        ev.imagemUrl ||
                        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={ev.titulo}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] font-bold text-amber-400">
                      {ev.data} • {ev.hora}
                    </div>
                    <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] font-bold text-emerald-400 font-mono">
                      {ev.preco > 0 ? `R$ ${ev.preco.toFixed(2)}` : 'GRATUITO'}
                    </div>

                    {/* Badge de Fotos na Imagem com Acesso com 1 clique */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventoModal(ev);
                        setModalTab('galeria');
                      }}
                      className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950/90 hover:bg-amber-500 hover:text-zinc-950 border border-zinc-700/80 hover:border-amber-400 text-[11px] font-bold text-amber-400 transition shadow-lg backdrop-blur-md"
                      title="Abrir Galeria & Carrossel de Fotos"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400 group-hover:text-zinc-950" />
                      <span>{totalFotos} {totalFotos === 1 ? 'Foto' : 'Fotos'}</span>
                    </button>

                    {/* Quick PDF button right on banner for administrators */}
                    {activeRole !== 'associado' && (
                      <button
                        type="button"
                        onClick={() => handleExportPDF(ev)}
                        title="Exportar Lista de Inscritos para PDF"
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950/90 hover:bg-amber-500 hover:text-zinc-950 border border-zinc-700 hover:border-amber-400 text-[11px] font-bold text-zinc-200 transition shadow-lg backdrop-blur-md"
                      >
                        <FileDown className="w-3.5 h-3.5 text-amber-400 group-hover:text-zinc-950" />
                        <span>PDF</span>
                      </button>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-zinc-100 font-heading">
                      {ev.titulo}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-3">
                      {ev.descricao}
                    </p>

                    <div className="space-y-1.5 pt-2 text-xs text-zinc-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          {ev.local} ({ev.cidade || config.cidadeSede})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {totalInscritos} / {ev.vagasLimite} inscritos
                          </span>
                        </div>
                        {totalInscritos > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            {totalPresentes} presentes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-5 pt-3 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      {ev.organizador || 'Diretoria'}
                    </span>

                    {/* Botões de Acesso Rápido a Galeria e Inscritos */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEventoModal(ev);
                          setModalTab('galeria');
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                        title="Ver fotos do evento"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Galeria ({totalFotos})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEventoModal(ev);
                          setModalTab('inscritos');
                          setTermoBuscaInscritos('');
                        }}
                        className="text-zinc-400 hover:text-zinc-200 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>Inscritos ({totalInscritos})</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {/* Botão de Abrir Detalhes & Galeria */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventoModal(ev);
                        setModalTab('galeria');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 hover:border-amber-500/40 transition shadow-sm"
                      title="Ver Detalhes do Evento e Fotos"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Galeria</span>
                    </button>

                    {/* Botão de Convocar Comboio no WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleConvocarComboioWhatsApp(ev)}
                      className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 transition shadow-sm"
                      title="Convocar Comboio no WhatsApp com Briefing e Rota"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Botão de Agendamento Offline / Alarme no Dispositivo */}
                    <button
                      type="button"
                      onClick={() => handleAgendarLembrete(ev)}
                      className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition shadow-sm cursor-pointer"
                      title="Salvar Lembrete / Alarme Offline no Calendário do Aparelho (.ICS)"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Alerta</span>
                    </button>

                    {/* Botão de Exportar Lista em PDF solicitado pelo usuário */}
                    <button
                      type="button"
                      onClick={() => handleExportPDF(ev)}
                      disabled={exportandoPdfId === ev.id}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 hover:border-amber-500/40 transition shadow-sm"
                      title="Exportar PDF com Nome, Número do Associado e Status de Presença"
                    >
                      <FileDown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">{exportandoPdfId === ev.id ? 'Gerando...' : 'PDF'}</span>
                    </button>

                    {currentAssociado && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleInscricao(
                            ev.id,
                            currentAssociado.id || currentAssociado.uid
                          )
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                          isInscrito
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                            : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isInscrito ? 'Inscrito' : 'Inscrever-se'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALHADO DO EVENTO COM ABAS DE GALERIA / CARROSSEL & INSCRITOS */}
      {eventoAtivoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 my-8 overflow-hidden">
            {/* Header com Dados do Evento */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    EVENTO OFICIAL
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {eventoAtivoModal.data} • {eventoAtivoModal.hora}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {eventoAtivoModal.local}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mt-1">
                  {eventoAtivoModal.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventoModal(null)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            {/* ABAS DO MODAL: GALERIA DE FOTOS (CARROSSEL) & INSCRITOS */}
            <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-5 pt-3 gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab('galeria')}
                  className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition ${
                    modalTab === 'galeria'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Galeria &amp; Carrossel ({(eventoAtivoModal.galeria || []).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('inscritos')}
                  className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition ${
                    modalTab === 'inscritos'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Inscritos &amp; Presença ({(eventoAtivoModal.inscritos || []).length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleConvocarComboioWhatsApp(eventoAtivoModal)}
                className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/25 active:scale-95"
                title="Compartilhar convocação oficial de comboio no WhatsApp com rota e checklist"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Convocar no WhatsApp</span>
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="p-5">
              {modalTab === 'galeria' ? (
                /* ABA 1: GALERIA INTEGRADA AO FIREBASE STORAGE & CARROSSEL */
                <EventoGaleriaCarousel
                  evento={eventoAtivoModal}
                  currentAssociado={currentAssociado}
                  isAdminOrDiretoria={activeRole !== 'associado'}
                  onFotoAdded={handleFotoAdded}
                  onFotoDeleted={handleFotoDeleted}
                  onCurtidaToggled={handleCurtidaToggled}
                  onDestaqueToggled={(fotoId, destaque) => {
                    setLocalEventos((prev) =>
                      prev.map((e) => {
                        if (e.id !== eventoAtivoModal.id) return e;
                        const updatedGaleria = (e.galeria || []).map((f) =>
                          f.id === fotoId ? { ...f, destaqueAlbum: destaque } : f
                        );
                        return { ...e, galeria: updatedGaleria };
                      })
                    );
                    setSelectedEventoModal((prev) => {
                      if (!prev || prev.id !== eventoAtivoModal.id) return prev;
                      const updatedGaleria = (prev.galeria || []).map((f) =>
                        f.id === fotoId ? { ...f, destaqueAlbum: destaque } : f
                      );
                      return { ...prev, galeria: updatedGaleria };
                    });
                  }}
                />
              ) : (
                /* ABA 2: LISTA DE INSCRITOS & PRESENÇA */
                <div className="space-y-4">
                  {/* Barra de Ações & Estatísticas */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                          Inscritos
                        </span>
                        <span className="font-bold text-zinc-200">
                          {eventoAtivoModal.inscritos ? eventoAtivoModal.inscritos.length : 0} /{' '}
                          {eventoAtivoModal.vagasLimite}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-zinc-800" />
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                          Confirmados (Presentes)
                        </span>
                        <span className="font-bold text-emerald-400">
                          {(eventoAtivoModal.inscritos || []).filter(
                            (id) => eventoAtivoModal.presencas?.[id] === true
                          ).length}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Exportação dentro do Modal */}
                    <button
                      type="button"
                      onClick={() => handleExportPDF(eventoAtivoModal)}
                      disabled={exportandoPdfId === eventoAtivoModal.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-md shadow-amber-500/10"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>
                        {exportandoPdfId === eventoAtivoModal.id
                          ? 'Gerando Arquivo PDF...'
                          : 'Baixar Lista em PDF'}
                      </span>
                    </button>
                  </div>

              {/* Campo de Busca nos Inscritos */}
              {(eventoAtivoModal.inscritos || []).length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome, nome de guerra ou número de associado..."
                    value={termoBuscaInscritos}
                    onChange={(e) => setTermoBuscaInscritos(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 outline-none"
                  />
                </div>
              )}

              {/* Lista dos Inscritos */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {(eventoAtivoModal.inscritos || []).length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 text-xs">
                    Nenhum motociclista inscrito neste evento ainda.
                  </div>
                ) : (
                  (() => {
                    const inscritosFiltrados = (eventoAtivoModal.inscritos || []).filter(
                      (inscritoId) => {
                        const assoc = associados.find(
                          (a) => a.id === inscritoId || a.uid === inscritoId
                        );
                        if (!termoBuscaInscritos.trim()) return true;
                        const termo = termoBuscaInscritos.toLowerCase();
                        if (!assoc) return inscritoId.toLowerCase().includes(termo);
                        return (
                          assoc.nome.toLowerCase().includes(termo) ||
                          (assoc.nomeGuerra &&
                            assoc.nomeGuerra.toLowerCase().includes(termo)) ||
                          assoc.numeroAssociado.toLowerCase().includes(termo)
                        );
                      }
                    );

                    if (inscritosFiltrados.length === 0) {
                      return (
                        <div className="py-6 text-center text-zinc-500 text-xs">
                          Nenhum inscrito encontrado com o filtro "{termoBuscaInscritos}".
                        </div>
                      );
                    }

                    return inscritosFiltrados.map((inscritoId, index) => {
                      const assoc = associados.find(
                        (a) => a.id === inscritoId || a.uid === inscritoId
                      );
                      const isPresente =
                        eventoAtivoModal.presencas?.[inscritoId] === true;

                      return (
                        <div
                          key={inscritoId}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-center text-[10px] text-zinc-500 font-mono">
                              #{index + 1}
                            </span>
                            {assoc?.fotoUrl ? (
                              <img
                                src={assoc.fotoUrl}
                                alt={assoc.nome}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                                {assoc ? assoc.nome.charAt(0) : '?'}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-200">
                                  {assoc ? assoc.nome : `Inscrito ID: ${inscritoId}`}
                                </span>
                                {assoc?.nomeGuerra && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                    "{assoc.nomeGuerra}"
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                Nº Associado:{' '}
                                <span className="text-zinc-300 font-bold">
                                  {assoc ? assoc.numeroAssociado : 'N/D'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status de Presença & Toggle */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPresente
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              {isPresente ? 'Presente' : 'Não Confirmada'}
                            </span>

                            {activeRole !== 'associado' && onTogglePresenca && (
                              <button
                                type="button"
                                onClick={() =>
                                  onTogglePresenca(
                                    eventoAtivoModal.id,
                                    inscritoId,
                                    !isPresente
                                  )
                                }
                                title={
                                  isPresente
                                    ? 'Marcar como ausente'
                                    : 'Marcar como presente'
                                }
                                className={`p-1.5 rounded-lg border transition ${
                                  isPresente
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-zinc-750'
                                }`}
                              >
                                {isPresente ? (
                                  <UserCheck className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <UserX className="w-4 h-4 text-zinc-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          )}
        </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                O arquivo PDF contém Nome, Número do Associado e Status de Presença.
              </span>
              <button
                type="button"
                onClick={() => setSelectedEventoModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-100">
                Cadastrar Novo Evento / Passeio
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Título do Evento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Passeio Anual Serra da Graciosa..."
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Descrição e Roteiro</label>
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Data (DD/MM/AAAA) *</label>
                  <input
                    type="text"
                    required
                    placeholder="22/11/2026"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Horário de Saída</label>
                  <input
                    type="text"
                    placeholder="07:30"
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Ponto de Encontro / Local *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sede Central ou Posto Graal..."
                    value={form.local}
                    onChange={(e) => setForm({ ...form, local: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Cidade / Estado</label>
                  <input
                    type="text"
                    placeholder="Curitiba - PR"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Valor da Inscrição (R$ 0 se gratuito)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Limite Máximo de Motos</label>
                  <input
                    type="number"
                    value={form.vagasLimite}
                    onChange={(e) => setForm({ ...form, vagasLimite: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Foto de Capa do Passeio (URL)</label>
                <input
                  type="url"
                  value={form.imagemUrl}
                  onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })}
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
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md transition"
                >
                  Publicar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de Eventos */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
