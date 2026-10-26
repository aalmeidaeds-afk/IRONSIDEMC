import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
  Link as LinkIcon,
  Shield,
  Palette,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string;
  onSelectLogo: (url: string) => Promise<void> | void;
}

// Preset gallery of club emblems and logos
export const LOGO_GALLERY_PRESETS = [
  {
    id: 'ironside_official',
    title: 'Iron Side Road Rider M.C. (Oficial)',
    category: 'Oficial',
    url: '/ironside-logo.svg',
    description: 'Emblema clássico com caveira de capacete, pistões cruzados e asas douradas.',
  },
  {
    id: 'eagle_gold',
    title: 'Águia Imperial & Pistões Gold',
    category: 'Custom MC',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="%2309090b" stroke="%23f59e0b" stroke-width="6"/><circle cx="100" cy="100" r="80" fill="none" stroke="%2371717a" stroke-dasharray="4 4" stroke-width="2"/><path d="M40 90 Q100 40 160 90 Q100 130 40 90 Z" fill="%23f59e0b" opacity="0.9"/><path d="M100 45 L115 80 L150 85 L125 110 L130 145 L100 128 L70 145 L75 110 L50 85 L85 80 Z" fill="%23d97706"/><circle cx="100" cy="100" r="28" fill="%2318181b" stroke="%23f59e0b" stroke-width="4"/><text x="100" y="105" fill="%23fef08a" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">M.C.</text><text x="100" y="165" fill="%23e4e4e7" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="2">ESTRADA &amp; HONRA</text></svg>',
    description: 'Águia dourada estilizada para motoclubes estradeiros.',
  },
  {
    id: 'skull_cross_pistons',
    title: 'Caveira Custom & Pistões Cromados',
    category: 'Old School',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="30" fill="%2309090b"/><circle cx="100" cy="100" r="85" fill="none" stroke="%23eab308" stroke-width="5"/><path d="M50 50 L150 150 M150 50 L50 150" stroke="%23a1a1aa" stroke-width="12" stroke-linecap="round"/><circle cx="100" cy="95" r="42" fill="%2318181b" stroke="%23eab308" stroke-width="4"/><circle cx="85" cy="90" r="10" fill="%2309090b"/><circle cx="115" cy="90" r="10" fill="%2309090b"/><path d="M85 120 L115 120 L110 135 L90 135 Z" fill="%23eab308"/><text x="100" y="180" fill="%23fbbf24" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle">1% BROTHERHOOD</text></svg>',
    description: 'Estilo clássico chopper old school com pistões cruzados.',
  },
  {
    id: 'route_shield',
    title: 'Escudo Rota BR & Asas Negras',
    category: 'Estradeiro',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 20 L165 45 C165 110 140 160 100 185 C60 160 35 110 35 45 Z" fill="%2318181b" stroke="%23f59e0b" stroke-width="6"/><path d="M100 35 L150 55 C150 105 130 145 100 168 C70 145 50 105 50 55 Z" fill="%2309090b" stroke="%2371717a" stroke-width="2"/><text x="100" y="80" fill="%23f59e0b" font-size="20" font-weight="900" font-family="sans-serif" text-anchor="middle">ROTA</text><text x="100" y="115" fill="%23ffffff" font-size="34" font-weight="900" font-family="sans-serif" text-anchor="middle">MC</text><text x="100" y="145" fill="%23a1a1aa" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">BRASIL</text></svg>',
    description: 'Emblema estilo escudo rodoviário de alta resistência.',
  },
  {
    id: 'diamond_veteran',
    title: 'Diamante Moto Clube Veteranos',
    category: 'Tradição',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><polygon points="100,20 180,100 100,180 20,100" fill="%2309090b" stroke="%23f59e0b" stroke-width="6"/><polygon points="100,35 165,100 100,165 35,100" fill="%2318181b" stroke="%2352525b" stroke-width="2"/><circle cx="100" cy="100" r="32" fill="%2309090b" stroke="%23f59e0b" stroke-width="3"/><text x="100" y="105" fill="%23fef08a" font-size="15" font-weight="bold" font-family="sans-serif" text-anchor="middle">VETERAN</text></svg>',
    description: 'Geometria de diamante tradicional para brasões de colete.',
  },
  {
    id: 'flame_motor',
    title: 'Motor V-Twin em Chamas',
    category: 'Custom & Chopper',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="%2309090b" stroke="%23ef4444" stroke-width="6"/><path d="M100 30 Q120 70 140 70 Q130 90 150 100 Q120 120 100 170 Q80 120 50 100 Q70 90 60 70 Q80 70 100 30 Z" fill="%23f97316" opacity="0.85"/><circle cx="100" cy="110" r="30" fill="%2318181b" stroke="%23f59e0b" stroke-width="4"/><text x="100" y="115" fill="%23ffffff" font-size="12" font-weight="900" font-family="sans-serif" text-anchor="middle">V-TWIN</text><text x="100" y="160" fill="%23fca5a5" font-size="9" font-weight="bold" font-family="sans-serif" text-anchor="middle">MOTO CLUBE</text></svg>',
    description: 'Inspiração custom em chamas ardentes e motor dois cilindros.',
  },
];

export const GaleriaLogoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onSelectLogo,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentLogoUrl || '/ironside-logo.svg');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'galeria' | 'upload' | 'url'>('galeria');
  const [previewError, setPreviewError] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleApplyLogo = async () => {
    try {
      setSaving(true);
      await onSelectLogo(selectedUrl);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG ou WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSelectedUrl(result);
        setPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-3xl bg-zinc-950 border-t border-amber-500/40 sm:border sm:border-amber-500/40 rounded-t-3xl sm:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.85)] sm:shadow-2xl overflow-hidden flex flex-col max-h-[92vh] pb-safe"
      >
        {/* Mobile Drag / Touch Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 font-heading">
                Galeria de Artes &amp; Troca do Logotipo Oficial
              </h3>
              <p className="text-xs text-zinc-400">
                Selecione uma arte do catálogo, envie um arquivo da sua galeria ou informe uma URL.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <button
            type="button"
            onClick={() => setActiveTab('galeria')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'galeria'
                ? 'text-amber-400 border-amber-400 bg-zinc-900'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Galeria de Artes do Clube
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'upload'
                ? 'text-amber-400 border-amber-400 bg-zinc-900'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Carregar da Galeria do Dispositivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'url'
                ? 'text-amber-400 border-amber-400 bg-zinc-900'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            URL Personalizada
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Active Preview */}
          <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-zinc-950 border-2 border-amber-500/50 p-2 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                {previewError ? (
                  <ImageIcon className="w-8 h-8 text-zinc-600" />
                ) : (
                  <img
                    src={selectedUrl}
                    alt="Pré-visualização do logotipo"
                    onError={() => setPreviewError(true)}
                    onLoad={() => setPreviewError(false)}
                    className="max-w-full max-h-full object-contain filter drop-shadow"
                  />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  Arte Selecionada para Brasão
                </span>
                <p className="text-sm font-bold text-zinc-100 mt-0.5">
                  Visualização em tempo real no sistema
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 max-w-md line-clamp-1 font-mono">
                  {selectedUrl.startsWith('data:') ? 'Imagem carregada localmente (Base64)' : selectedUrl}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyLogo}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50 shrink-0"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Gravando...' : 'Confirmar & Aplicar Este Logo'}
            </button>
          </div>

          {/* TAB 1: GALERIA DE ARTES */}
          {activeTab === 'galeria' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Clique em qualquer arte para selecioná-la:</span>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  {LOGO_GALLERY_PRESETS.length} artes disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {LOGO_GALLERY_PRESETS.map((item) => {
                  const isSelected = selectedUrl === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedUrl(item.url);
                        setPreviewError(false);
                      }}
                      className={`p-3.5 rounded-2xl cursor-pointer transition border text-left flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={item.url}
                            alt={item.title}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-zinc-200 truncate mt-1">
                            {item.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500">Formato Vetorial SVG</span>
                        {isSelected ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Selecionado
                          </span>
                        ) : (
                          <span className="text-zinc-400 hover:text-amber-400">Escolher</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD DA GALERIA DO DISPOSITIVO */}
          {activeTab === 'upload' && (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border-2 border-dashed border-zinc-700 hover:border-amber-500 transition text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-100">
                  Selecione uma imagem da galeria do celular ou computador
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Suporta arquivos PNG com transparência, JPG, SVG ou WEBP. Resolução recomendada mínima de 512x512 pixels.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-600 transition shadow-sm"
              >
                Buscar Arquivo na Galeria
              </button>
            </div>
          )}

          {/* TAB 3: URL PERSONALIZADA */}
          {activeTab === 'url' && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <label className="block text-xs font-semibold text-zinc-300">
                Endereço URL da Imagem do Logotipo:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/brasao-motoclube.png"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setSelectedUrl(customUrlInput.trim());
                      setPreviewError(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition border border-zinc-700"
                >
                  Carregar URL
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Certifique-se de que o link é direto para a imagem e possui protocolo HTTPS para segurança.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Atualização instantânea no cabeçalho, carteirinha e módulos
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyLogo}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition disabled:opacity-50"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
