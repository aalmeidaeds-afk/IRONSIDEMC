import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NoticiaMoto } from '../types';
import {
  Newspaper,
  Compass,
  Sparkles,
  Wrench,
  Globe,
  ExternalLink,
  Search,
  BookOpen,
  Shield,
  Tag,
  Calendar,
  Plus,
  Share2,
  X,
  ChevronRight,
  Bookmark,
  Check,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';

interface Props {
  noticias: NoticiaMoto[];
  onSaveNew?: (data: Omit<NoticiaMoto, 'id'>) => Promise<void>;
}

// Recommended motorcycle parts and gear guide
const MARCAS_PECAS_GUIA = [
  {
    categoria: 'Pneus de Alta Performance',
    marcas: [
      {
        nome: 'Michelin',
        destaque: 'Road 6 / Anakee Adventure',
        descricao: 'Referência absoluta em drenagem de água e durabilidade sob chuva.',
      },
      {
        nome: 'Pirelli',
        destaque: 'Angel GT II / Scorpion Trail II',
        descricao: 'Excelente estabilidade em curvas rápidas e aderência esportiva.',
      },
      {
        nome: 'Metzeler',
        destaque: 'Tourance Next 2 / Karoo 4',
        descricao: 'Tradição alemã para Big Trails e longas travessias em asfalto e terra.',
      },
    ],
  },
  {
    categoria: 'Freios & Pastilhas',
    marcas: [
      {
        nome: 'Brembo',
        destaque: 'Sinterizadas Linha Vermelha / Ouro',
        descricao: 'Poder de frenagem de competição e baixíssimo fading em descidas de serra.',
      },
      {
        nome: 'Cobreq',
        destaque: 'Linha Racing Sinterizada',
        descricao: 'Fabricação nacional de ponta com ótimo custo-benefício e durabilidade.',
      },
      {
        nome: 'EBC Brakes',
        destaque: 'Double-H Sintered',
        descricao: 'Excelente modulação térmica e frenagem progressiva para motos pesadas.',
      },
    ],
  },
  {
    categoria: 'Óleos & Lubrificantes',
    marcas: [
      {
        nome: 'Motul',
        destaque: '7100 100% Sintético Ester / 5100',
        descricao: 'Padrão ouro em proteção térmica para embreagem úmida e câmbio.',
      },
      {
        nome: 'Yamalube',
        destaque: '4T Full Synthetic',
        descricao: 'Fórmula desenvolvida para alta rotação e preservação dos anéis.',
      },
      {
        nome: 'Mobil Super Moto',
        destaque: 'Authentic 10W40 / 20W50',
        descricao: 'Grande resistência à oxidação em viagens sob calor extremo.',
      },
    ],
  },
  {
    categoria: 'Transmissão & Correntes',
    marcas: [
      {
        nome: 'D.I.D (Daido)',
        destaque: '520 / 525 / 530 ZVM-X com retentor X-Ring',
        descricao: 'Corrente japonesa de altíssima tração para motos de mais de 100 cv.',
      },
      {
        nome: 'Regina Chains',
        destaque: 'HPE Maintenance Free',
        descricao: 'Tecnologia com revestimento tetraédrico que reduz necessidade de lubrificação.',
      },
      {
        nome: 'Vaz & KMC',
        destaque: 'Coroas e Pinhões Temperados',
        descricao: 'Aço carbono especial com tratamento térmico anti-desgaste.',
      },
    ],
  },
  {
    categoria: 'Bagageiros, Baús & Protetores',
    marcas: [
      {
        nome: 'GIVI',
        destaque: 'Linha Trekker Outback Alumínio / Monokey',
        descricao: 'Sistemas estanques para chuva e suportes reforçados com trava rápida.',
      },
      {
        nome: 'Touratech',
        destaque: 'Zega Pro / Suspensão Especial',
        descricao: 'Equipamentos germânicos para expedições extremas de volta ao mundo.',
      },
      {
        nome: 'Chapam & Scam',
        destaque: 'Protetores de Motor e Carenagem',
        descricao: 'Tubos de aço carbono que protegem a moto em eventuais quedas.',
      },
    ],
  },
];

// Curated Useful Motorcycle Portals
const SITES_UTEIS = [
  {
    nome: 'Motoo (motoo.com.br)',
    descricao:
      'Portal brasileiro líder em notícias diárias, testes completos de motos, lançamentos, comparativos e mercado de duas rodas.',
    url: 'https://www.motoo.com.br',
    badge: 'Destaque Nacional',
  },
  {
    nome: 'Revista Duas Rodas',
    descricao:
      'A mais tradicional publicação de motociclismo do país, com avaliações técnicas e cobertura de eventos internacionais.',
    url: 'https://www.revistaduasrodas.com.br',
    badge: 'Tradicional',
  },
  {
    nome: 'Motonline',
    descricao:
      'Comunidade, fichas técnicas completas de todos os modelos e anos, opiniões de proprietários e fórum de pilotos.',
    url: 'https://www.motonline.com.br',
    badge: 'Comunidade & Fichas',
  },
  {
    nome: 'SENATRAN - CRLV Digital',
    descricao:
      'Portal oficial do Governo Federal para consulta de documentação, licenciamento e regularidade de veículos.',
    url: 'https://portalservicos.senatran.serpro.gov.br',
    badge: 'Governo Oficial',
  },
];

export const NoticiasMotosView: React.FC<Props> = ({ noticias, onSaveNew }) => {
  const { activeRole } = useAuth();
  const isDiretoriaOrAdmin = activeRole === 'administrador' || activeRole === 'diretoria';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const [selectedNoticia, setSelectedNoticia] = useState<NoticiaMoto | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    resumo: '',
    conteudoCompleto: '',
    categoria: 'noticia' as NoticiaMoto['categoria'],
    fonteNome: 'Motoo.com.br',
    fonteUrl: 'https://www.motoo.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    tags: 'Motos, Lançamento, Brasil',
    destaque: false,
  });

  const categories = [
    { id: 'todas', label: 'Tudo', icon: Newspaper },
    { id: 'noticia', label: 'Notícias & Lançamentos', icon: Newspaper },
    { id: 'dica_pilotagem', label: 'Dicas de Pilotagem & Estrada', icon: Compass },
    { id: 'tendencia_tecnologia', label: 'Tendências & Tecnologia', icon: Cpu },
    { id: 'pecas_marcas', label: 'Marcas de Peças & Guia', icon: Wrench },
    { id: 'site_util', label: 'Sites Úteis (ex: motoo.com)', icon: Globe },
  ];

  const [selectedPortal, setSelectedPortal] = useState<
    'todos' | 'motoo' | 'motonline' | 'revistaduasrodas'
  >('todos');

  const filtered = noticias.filter((n) => {
    const matchesSearch =
      n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.resumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.fonteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory = activeCategory === 'todas' ? true : n.categoria === activeCategory;

    const matchesPortal =
      selectedPortal === 'todos'
        ? true
        : selectedPortal === 'motoo'
        ? n.fonteNome.toLowerCase().includes('motoo') || (n.fonteUrl && n.fonteUrl.includes('motoo'))
        : selectedPortal === 'motonline'
        ? n.fonteNome.toLowerCase().includes('motonline') || (n.fonteUrl && n.fonteUrl.includes('motonline'))
        : n.fonteNome.toLowerCase().includes('duas rodas') || (n.fonteUrl && n.fonteUrl.includes('revistaduasrodas'));

    return matchesSearch && matchesCategory && matchesPortal;
  });

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.resumo) return;

    if (onSaveNew) {
      await onSaveNew({
        titulo: form.titulo,
        resumo: form.resumo,
        conteudoCompleto: form.conteudoCompleto || form.resumo,
        categoria: form.categoria,
        fonteNome: form.fonteNome,
        fonteUrl: form.fonteUrl,
        imagemUrl: form.imagemUrl,
        data: new Date().toLocaleDateString('pt-BR'),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        destaque: form.destaque,
      });
    }

    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>Universo Duas Rodas Brasil & Mundo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 font-heading">
              Notícias, Dicas & Tendências de Motociclismo
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Fique por dentro das novidades do setor, lançamentos das maiores montadoras,
              pilotagem defensiva em comboio, guia das melhores marcas de peças e portais úteis como
              o <strong>Motoo (motoo.com.br)</strong>.
            </p>
          </div>

          {isDiretoriaOrAdmin && onSaveNew && (
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 whitespace-nowrap self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Publicar Notícia / Dica
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar notícias, modelos, peças ou dicas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* SECTION 1: OS 3 MAIORES PORTAIS DE MOTOCICLISMO DO BRASIL (MOTOO, MOTONLINE, REVISTA DUAS RODAS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-heading">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Alimentação Oficial: Os 3 Grandes Portais de Notícias Duas Rodas</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acesse as manchetes em tempo real e consulte as matérias completas diretamente nos sites oficiais.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold self-start sm:self-auto">
            Fontes Verificadas
          </span>
        </div>

        {/* Cards dos 3 Portais Oficiais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. MOTOO */}
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-red-500/30 hover:border-red-500/60 transition shadow-xl flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/40">
                  motoo.com.br
                </span>
                <a
                  href="https://www.motoo.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  title="Abrir motoo.com.br em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h3 className="font-bold text-zinc-100 text-base group-hover:text-amber-400 transition">
                  Motoo Brasil
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Líder nacional em cobertura de lançamentos, dados de vendas da Fenabrave, testes e comparativos de motos.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                <span className="text-amber-400 font-bold block text-[10px] uppercase">Manchetes no Radar:</span>
                <p className="truncate">• Nova BMW R 1300 GS Adventure</p>
                <p className="truncate">• Recorde de vendas no mercado nacional</p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedPortal(selectedPortal === 'motoo' ? 'todos' : 'motoo')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                  selectedPortal === 'motoo'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {selectedPortal === 'motoo' ? 'Filtrando Motoo ✓' : 'Ver Matérias Motoo'}
              </button>
              <a
                href="https://www.motoo.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Acessar Site</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2. MOTONLINE */}
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-orange-500/30 hover:border-orange-500/60 transition shadow-xl flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/40">
                  motonline.com.br
                </span>
                <a
                  href="https://motonline.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  title="Abrir motonline.com.br em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h3 className="font-bold text-zinc-100 text-base group-hover:text-amber-400 transition">
                  Motonline
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Comunidade de pilotos, fichas técnicas completas de motos antigas e novas, comparativos off-road e segurança.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                <span className="text-amber-400 font-bold block text-[10px] uppercase">Manchetes no Radar:</span>
                <p className="truncate">• Tiger 900 vs BMW F 900 GS</p>
                <p className="truncate">• Guia de pilotagem segura em comboio</p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedPortal(selectedPortal === 'motonline' ? 'todos' : 'motonline')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                  selectedPortal === 'motonline'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {selectedPortal === 'motonline' ? 'Filtrando Motonline ✓' : 'Ver Matérias Motonline'}
              </button>
              <a
                href="https://motonline.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/40 text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Acessar Site</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 3. REVISTA DUAS RODAS */}
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-sky-500/30 hover:border-sky-500/60 transition shadow-xl flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-wider border border-sky-500/40">
                  revistaduasrodas.com.br
                </span>
                <a
                  href="https://www.revistaduasrodas.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  title="Abrir revistaduasrodas.com.br em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h3 className="font-bold text-zinc-100 text-base group-hover:text-amber-400 transition">
                  Revista Duas Rodas
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  A mais tradicional publicação de motociclismo do país, organizadora do prêmio Moto do Ano e testes em autódromo.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                <span className="text-amber-400 font-bold block text-[10px] uppercase">Manchetes no Radar:</span>
                <p className="truncate">• Bastidores da Moto do Ano 2026</p>
                <p className="truncate">• Ducati DesertX Discovery para expedição</p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedPortal(selectedPortal === 'revistaduasrodas' ? 'todos' : 'revistaduasrodas')
                }
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                  selectedPortal === 'revistaduasrodas'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {selectedPortal === 'revistaduasrodas' ? 'Filtrando Duas Rodas ✓' : 'Ver Matérias Duas Rodas'}
              </button>
              <a
                href="https://www.revistaduasrodas.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Acessar Site</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: GUIA DE MARCAS DE PEÇAS & MANUTENÇÃO */}
      {(activeCategory === 'todas' || activeCategory === 'pecas_marcas') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-heading">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Guia Oficial de Peças & Marcas Recomendadas</span>
            </h2>
            <span className="text-[11px] text-zinc-500">Qualidade certificada para viagens</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MARCAS_PECAS_GUIA.map((secao, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{secao.categoria}</span>
                </div>

                <div className="space-y-2.5">
                  {secao.marcas.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100 text-[13px]">{m.nome}</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                          {m.destaque}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">{m.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: ARTIGOS & NOTÍCIAS FEED */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-heading">
            <Newspaper className="w-4 h-4 text-amber-400" />
            <span>Feed de Notícias & Dicas</span>
          </h2>
          <span className="text-[11px] text-zinc-500">{filtered.length} artigos encontrados</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800">
            <Newspaper className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-300 text-sm font-semibold">Nenhum artigo encontrado.</p>
            <p className="text-zinc-500 text-xs mt-1">
              Tente buscar por outro termo ou selecione a categoria &quot;Tudo&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((noticia) => (
              <div
                key={noticia.id}
                className="rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition overflow-hidden shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-48 w-full bg-zinc-950 overflow-hidden">
                    <img
                      src={noticia.imagemUrl}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow">
                        {noticia.categoria === 'noticia'
                          ? 'Notícia'
                          : noticia.categoria === 'dica_pilotagem'
                          ? 'Dica de Estrada'
                          : noticia.categoria === 'tendencia_tecnologia'
                          ? 'Tecnologia'
                          : noticia.categoria === 'pecas_marcas'
                          ? 'Peças & Marcas'
                          : 'Site Útil'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-700 text-[10px] font-bold text-zinc-300">
                      {noticia.data}
                    </div>

                    <div className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-emerald-400 drop-shadow">
                      Fonte: {noticia.fonteNome}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-zinc-100 text-base group-hover:text-amber-400 transition leading-snug font-heading">
                      {noticia.titulo}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {noticia.resumo}
                    </p>

                    {/* Tags */}
                    {noticia.tags && noticia.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {noticia.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-zinc-800/80 mt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedNoticia(noticia)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ler Artigo Completo</span>
                  </button>

                  {noticia.fonteUrl && (
                    <a
                      href={noticia.fonteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[11px] font-bold transition shadow-sm"
                      title={`Abrir página oficial da notícia no site ${noticia.fonteNome}`}
                    >
                      <span>Ver na Página Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: LEITURA COMPLETA DO ARTIGO */}
      {selectedNoticia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider">
                {selectedNoticia.fonteNome}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNoticia(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="h-60 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                <img
                  src={selectedNoticia.imagemUrl}
                  alt={selectedNoticia.titulo}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Publicado em: {selectedNoticia.data}</span>
                  <span>Fonte Oficial: {selectedNoticia.fonteNome}</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-100 font-heading">
                  {selectedNoticia.titulo}
                </h2>
              </div>

              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <p className="font-semibold text-amber-300">{selectedNoticia.resumo}</p>
                <p>{selectedNoticia.conteudoCompleto || selectedNoticia.resumo}</p>
              </div>

              {selectedNoticia.tags && (
                <div className="flex flex-wrap gap-2">
                  {selectedNoticia.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              {selectedNoticia.fonteUrl ? (
                <a
                  href={selectedNoticia.fonteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acessar {selectedNoticia.fonteNome}</span>
                </a>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedNoticia(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition"
              >
                Fechar Artigo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOTÍCIA (DIRETORIA) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-100 font-heading">
                Publicar Notícia ou Dica de Moto
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lançamento Nova Moto 2026..."
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={(e) =>
                      setForm({ ...form, categoria: e.target.value as NoticiaMoto['categoria'] })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  >
                    <option value="noticia">Notícia Geral</option>
                    <option value="dica_pilotagem">Dica de Pilotagem</option>
                    <option value="tendencia_tecnologia">Tecnologia & Tendência</option>
                    <option value="pecas_marcas">Peças & Marcas</option>
                    <option value="site_util">Site Útil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Fonte / Portal</label>
                  <input
                    type="text"
                    placeholder="Ex: Motoo.com.br"
                    value={form.fonteNome}
                    onChange={(e) => setForm({ ...form, fonteNome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Resumo *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Breve resumo da matéria..."
                  value={form.resumo}
                  onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Conteúdo Completo</label>
                <textarea
                  rows={4}
                  placeholder="Texto completo do artigo ou tutorial..."
                  value={form.conteudoCompleto}
                  onChange={(e) => setForm({ ...form, conteudoCompleto: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={form.imagemUrl}
                    onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Link Externo da Matéria</label>
                  <input
                    type="url"
                    value={form.fonteUrl}
                    onChange={(e) => setForm({ ...form, fonteUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
                >
                  Salvar Notícia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no final do Módulo 10 de Notícias */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
