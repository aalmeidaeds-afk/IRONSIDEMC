import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ParceiroServico } from '../types';
import {
  LifeBuoy,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Truck,
  Wrench,
  Disc,
  HeartPulse,
  Navigation,
  Compass,
  KeyRound,
  Fuel,
  Settings2,
  Users,
  ShieldAlert,
  Flame,
  Radio,
  ExternalLink,
  LocateFixed,
  AlertTriangle,
  CheckCircle2,
  X,
  Share2,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';

interface Props {
  prestadores: ParceiroServico[];
  onSaveNew: (data: Omit<ParceiroServico, 'id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const SosServicosView: React.FC<Props> = ({ prestadores, onSaveNew, onDelete }) => {
  const { activeRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Geolocation state
  const [userLocation, setUserLocation] = useState<string>('São Paulo - SP');
  const [geoCoordinates, setGeoCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    categoria: 'guincho' as ParceiroServico['categoria'],
    telefone: '',
    whatsapp: '',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: '',
    descontoAssociado: '15% de desconto para associados com carteirinha',
    horario24h: true,
    observacoes: '',
  });

  const categories = [
    { id: 'todas', label: 'Todos os Serviços', icon: LifeBuoy },
    { id: 'guincho', label: 'Guincho & Reboque', icon: Truck },
    { id: 'oficina', label: 'Mecânicos & Oficinas', icon: Wrench },
    { id: 'chaveiro', label: 'Chaveiros 24h', icon: KeyRound },
    { id: 'posto', label: 'Postos de Gasolina', icon: Fuel },
    { id: 'autopecas', label: 'Auto & Moto Peças', icon: Settings2 },
    { id: 'clube', label: 'Clubes de Motos Próximos', icon: Users },
    { id: 'borracharia', label: 'Borracharias 24h', icon: Disc },
    { id: 'hospital', label: 'Hospitais & UPAs', icon: HeartPulse },
  ];

  // Geolocation Detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setLocating(true);
    setLocationSuccess(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoCoordinates({ lat: latitude, lng: longitude });
        setUserLocation(`Localização GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setLocationSuccess('Localização GPS detectada com sucesso!');
        setLocating(false);
        setTimeout(() => setLocationSuccess(null), 4000);
      },
      (error) => {
        console.warn('Erro ao obter geolocalização:', error);
        setLocating(false);
        setUserLocation('São Paulo - SP');
        setLocationSuccess('Não foi possível obter GPS. Usando localização padrão.');
        setTimeout(() => setLocationSuccess(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Google Nearby Search URL Generator
  const getGoogleMapsSearchUrl = (serviceTerm: string) => {
    if (geoCoordinates) {
      return `https://www.google.com/maps/search/${encodeURIComponent(
        serviceTerm
      )}/@${geoCoordinates.lat},${geoCoordinates.lng},14z`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(
      `${serviceTerm} ${userLocation}`
    )}`;
  };

  const getGoogleWebSearchUrl = (serviceTerm: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(
      `${serviceTerm} em ${userLocation} proximo a mim`
    )}`;
  };

  const filtered = prestadores.filter((p) => {
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.observacoes && p.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'todas' ? true : p.categoria === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const cleanPhoneForWa = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const cleanPhoneDigits = (val: string) => {
    return val.replace(/\D/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) return;

    await onSaveNew({
      ...form,
      estado: form.estado.toUpperCase(),
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: CONTATOS OFICIAIS DE EMERGÊNCIA (193, 191, 190, 192) */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950/90 via-zinc-950 to-red-950/90 border-2 border-red-600/70 p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg animate-pulse shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-600/30 border border-red-500/50 text-red-300 text-[10px] font-black uppercase tracking-wider">
                  DISCAGEM RÁPIDA 24H
                </span>
                <span className="text-[11px] text-zinc-400">Emergência Nacional</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-red-100 font-heading">
                Contatos Imediatos de Resgate & Polícia
              </h2>
            </div>
          </div>
          <p className="text-xs text-zinc-300 max-w-md">
            Em caso de acidente na rodovia ou ameaça à segurança, acione os órgãos oficiais com 1 toque.
          </p>
        </div>

        {/* 4 Emergency Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* BOMBEIRO 193 */}
          <a
            href="tel:193"
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg transition flex flex-col items-center text-center justify-between group active:scale-95"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-950/40 mb-1 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black font-mono tracking-wider block">
                193
              </span>
              <span className="text-xs font-bold block uppercase tracking-wide">
                BOMBEIROS
              </span>
              <span className="text-[10px] text-red-200 block">Resgate & Incêndio</span>
            </div>
            <div className="mt-2 text-[10px] font-extrabold bg-red-950/60 px-2.5 py-0.5 rounded-full">
              LIGAR AGORA
            </div>
          </a>

          {/* PRF 191 */}
          <a
            href="tel:191"
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-sky-700 to-sky-850 hover:from-sky-600 hover:to-sky-750 text-white shadow-lg transition flex flex-col items-center text-center justify-between group active:scale-95"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-950/40 mb-1 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black font-mono tracking-wider block">
                191
              </span>
              <span className="text-xs font-bold block uppercase tracking-wide">
                PRF (RODOVIAS)
              </span>
              <span className="text-[10px] text-sky-200 block">Polícia Federal</span>
            </div>
            <div className="mt-2 text-[10px] font-extrabold bg-sky-950/60 px-2.5 py-0.5 rounded-full">
              LIGAR AGORA
            </div>
          </a>

          {/* POLÍCIA MILITAR 190 */}
          <a
            href="tel:190"
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-blue-700 to-blue-850 hover:from-blue-600 hover:to-blue-750 text-white shadow-lg transition flex flex-col items-center text-center justify-between group active:scale-95"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-950/40 mb-1 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black font-mono tracking-wider block">
                190
              </span>
              <span className="text-xs font-bold block uppercase tracking-wide">
                POLÍCIA 190
              </span>
              <span className="text-[10px] text-blue-200 block">Segurança Pública</span>
            </div>
            <div className="mt-2 text-[10px] font-extrabold bg-blue-950/60 px-2.5 py-0.5 rounded-full">
              LIGAR AGORA
            </div>
          </a>

          {/* SAMU 192 */}
          <a
            href="tel:192"
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-emerald-700 to-emerald-850 hover:from-emerald-600 hover:to-emerald-750 text-white shadow-lg transition flex flex-col items-center text-center justify-between group active:scale-95"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-950/40 mb-1 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black font-mono tracking-wider block">
                192
              </span>
              <span className="text-xs font-bold block uppercase tracking-wide">
                SAMU 192
              </span>
              <span className="text-[10px] text-emerald-200 block">Atendimento Médico</span>
            </div>
            <div className="mt-2 text-[10px] font-extrabold bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
              LIGAR AGORA
            </div>
          </a>
        </div>

        {/* Emergency First Aid Guidelines */}
        <div className="p-3 rounded-xl bg-black/40 border border-red-500/30 text-[11px] text-zinc-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Atenção em caso de queda de motocicleta:</strong> Sinalize a pista a 50m com o
            triângulo ou lanternas, <strong>NUNCA retire o capacete da vítima</strong> sem socorrista
            especializado e ligue imediatamente para 192 (SAMU) ou 193 (Bombeiros).
          </span>
        </div>
      </div>

      {/* SECTION 2: BUSCA NO GOOGLE DE SERVIÇOS PRÓXIMOS DA LOCALIZAÇÃO */}
      <div className="rounded-3xl bg-zinc-950 border border-amber-500/40 p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-zinc-100 font-heading">
                Pesquisa de Serviços Próximos de Você no Google
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Guincho de moto, mecânicos, chaveiros, postos de combustível, motopeças e sedes de
              clubes com busca integrada ao Google Maps.
            </p>
          </div>

          {/* GPS Location Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userLocation}
                onChange={(e) => setUserLocation(e.target.value)}
                placeholder="Sua cidade ou rodovia..."
                className="pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none w-48 sm:w-60 font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow"
              title="Detectar localização GPS automática do celular"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'GPS...' : 'Usar GPS'}</span>
            </button>
          </div>
        </div>

        {locationSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{locationSuccess}</span>
          </div>
        )}

        {/* 6 Quick Nearby Categories Search Grid with Direct Google Maps & Web Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {[
            {
              id: 'guincho',
              label: 'Guincho de Moto',
              desc: 'Resgate plataforma 24h',
              icon: Truck,
              query: 'guincho para moto 24 horas',
              color: 'text-amber-400',
            },
            {
              id: 'mecanicos',
              label: 'Mecânicos de Moto',
              desc: 'Oficinas especializadas',
              icon: Wrench,
              query: 'oficina mecanica de moto',
              color: 'text-sky-400',
            },
            {
              id: 'chaveiros',
              label: 'Chaveiros 24h',
              desc: 'Chave codificada & moto',
              icon: KeyRound,
              query: 'chaveiro 24 horas moto',
              color: 'text-yellow-400',
            },
            {
              id: 'postos',
              label: 'Posto de Gasolina',
              desc: 'Combustível e calibrador',
              icon: Fuel,
              query: 'posto de gasolina',
              color: 'text-emerald-400',
            },
            {
              id: 'autopecas',
              label: 'Auto & Moto Peças',
              desc: 'Pastilhas, óleo e pneus',
              icon: Settings2,
              query: 'loja de motopeças auto peças moto',
              color: 'text-indigo-400',
            },
            {
              id: 'clubes',
              label: 'Clubes de Motos',
              desc: 'Sedes e pontos de apoio',
              icon: Users,
              query: 'moto clube sede',
              color: 'text-amber-300',
            },
          ].map((item) => {
            const Icon = item.icon;
            const mapsUrl = getGoogleMapsSearchUrl(item.query);
            const webUrl = getGoogleWebSearchUrl(item.query);

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition flex flex-col justify-between group shadow"
              >
                <div>
                  <div className={`p-2 rounded-xl bg-zinc-950 w-fit mb-2 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-zinc-100 text-xs">{item.label}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{item.desc}</p>
                </div>

                <div className="mt-3 space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold transition shadow"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>No Google Maps</span>
                  </a>

                  <a
                    href={webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold transition"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    <span>Ver no Google</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: PRESTADORES CREDENCIADOS DO CLUBE & FILTRO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 font-heading">
              Rede Credenciada & Parceiros com Desconto do Moto Clube
            </h3>
            <p className="text-xs text-zinc-400">
              Profissionais recomendados e parceiros de estrada cadastrados na rede Iron Side.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Parceiro SOS
          </button>
        </div>

        {/* Category Pills & Search Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap select-none ${
                    categoryFilter === c.id
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, cidade ou tipo de serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Grid of Providers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800 text-zinc-500 text-xs">
              Nenhum prestador encontrado com os filtros atuais.
            </div>
          ) : (
            filtered.map((p) => {
              const waNumber = cleanPhoneForWa(p.whatsapp || p.telefone);
              const telClean = cleanPhoneDigits(p.telefone);
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${p.nome} ${p.endereco} ${p.cidade}`
              )}`;

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-zinc-950 text-amber-400 border border-zinc-800">
                          {p.categoria === 'guincho' && <Truck className="w-5 h-5" />}
                          {p.categoria === 'oficina' && <Wrench className="w-5 h-5" />}
                          {p.categoria === 'chaveiro' && <KeyRound className="w-5 h-5" />}
                          {p.categoria === 'posto' && <Fuel className="w-5 h-5" />}
                          {p.categoria === 'autopecas' && <Settings2 className="w-5 h-5" />}
                          {p.categoria === 'clube' && <Users className="w-5 h-5" />}
                          {p.categoria === 'borracharia' && <Disc className="w-5 h-5" />}
                          {p.categoria === 'hospital' && (
                            <HeartPulse className="w-5 h-5 text-red-400" />
                          )}
                          {p.categoria === 'outro' && <LifeBuoy className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-100 font-heading">{p.nome}</h4>
                          <span className="text-[10px] text-amber-400 font-semibold uppercase">
                            {p.categoria}
                          </span>
                        </div>
                      </div>

                      {p.horario24h && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          24 Horas
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-start gap-1.5 text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          {p.endereco} - {p.cidade} / {p.estado}
                        </span>
                      </div>

                      {p.descontoAssociado && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{p.descontoAssociado}</span>
                        </div>
                      )}

                      {p.observacoes && (
                        <p className="text-[11px] text-zinc-400 italic">&ldquo;{p.observacoes}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${telClean}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
                      >
                        <Phone className="w-3 h-3 text-amber-400" />
                        Ligar
                      </a>

                      {p.whatsapp && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${cleanPhoneForWa(
                            p.whatsapp
                          )}&text=${encodeURIComponent(
                            'Olá! Sou associado do Iron Side Road Rider M.C. e preciso de suporte.'
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition"
                      title="Ver localização no Google Maps"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: CADASTRAR NOVO PRESTADOR SOS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-100 font-heading">
                Cadastrar Parceiro SOS / Rede de Estrada
              </h3>
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
                  Nome do Estabelecimento ou Prestador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Guincho Moto Express 24h"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Categoria de Serviço</label>
                  <select
                    value={form.categoria}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoria: e.target.value as ParceiroServico['categoria'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  >
                    <option value="guincho">Guincho & Reboque</option>
                    <option value="oficina">Mecânico / Oficina</option>
                    <option value="chaveiro">Chaveiro 24h</option>
                    <option value="posto">Posto de Gasolina</option>
                    <option value="autopecas">Auto & Moto Peças</option>
                    <option value="clube">Clube de Motos Parceiro</option>
                    <option value="borracharia">Borracharia</option>
                    <option value="hospital">Hospital / Pronto Socorro</option>
                    <option value="outro">Outro Serviço</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Horário de Atendimento</label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.horario24h}
                      onChange={(e) => setForm({ ...form, horario24h: e.target.checked })}
                      className="rounded text-amber-500 focus:ring-0"
                    />
                    <span>Atendimento 24 Horas</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Telefone Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-400 mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="São Paulo, Campinas..."
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Endereço / Rodovia / Ponto de Referência</label>
                <input
                  type="text"
                  placeholder="Av., Rua ou Rodovia com km"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Desconto / Benefício para o Membro</label>
                <input
                  type="text"
                  placeholder="Ex: 15% de desconto apresentando carteirinha digital"
                  value={form.descontoAssociado}
                  onChange={(e) => setForm({ ...form, descontoAssociado: e.target.value })}
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
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
                >
                  Salvar Parceiro SOS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de SOS & Resgate na Estrada */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
