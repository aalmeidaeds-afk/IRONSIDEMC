// Utility to dynamically load Google Fonts and apply global font family and scaling

export interface FontOption {
  id: string;
  name: string;
  category: 'Moderno' | 'Geométrico' | 'Estrada & Moto Clube' | 'Futurista & Tático' | 'Clássico';
  googleFontFamily: string; // URL param name, e.g. "Inter:wght@400;600;700;800;900"
  cssFamily: string; // CSS font-family string
  previewText: string;
  description: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: 'Inter',
    name: 'Inter',
    category: 'Moderno',
    googleFontFamily: 'Inter:wght@400;500;600;700;800;900',
    cssFamily: "'Inter', sans-serif",
    previewText: 'IRON SIDE M.C. • 2016',
    description: 'Interface limpa, moderna e com altíssima legibilidade.',
  },
  {
    id: 'Roboto',
    name: 'Roboto',
    category: 'Geométrico',
    googleFontFamily: 'Roboto:wght@400;500;700;900',
    cssFamily: "'Roboto', sans-serif",
    previewText: 'OS MELHORES SÃO DE FERRO',
    description: 'Estrutura geométrica robusta com curvas abertas e neutras.',
  },
  {
    id: 'Montserrat',
    name: 'Montserrat',
    category: 'Moderno',
    googleFontFamily: 'Montserrat:wght@400;600;700;800;900',
    cssFamily: "'Montserrat', sans-serif",
    previewText: 'MOTOCICLISMO & FRATERNIDADE',
    description: 'Inspirada em letreiros urbanos históricos. Elegante e marcante.',
  },
  {
    id: 'Poppins',
    name: 'Poppins',
    category: 'Geométrico',
    googleFontFamily: 'Poppins:wght@400;500;600;700;800',
    cssFamily: "'Poppins', sans-serif",
    previewText: 'LEALDADE, HONRA E ESTRADA',
    description: 'Geometria arredondada com toque contemporâneo e sofisticado.',
  },
  {
    id: 'Bebas Neue',
    name: 'Bebas Neue',
    category: 'Estrada & Moto Clube',
    googleFontFamily: 'Bebas+Neue',
    cssFamily: "'Bebas Neue', sans-serif",
    previewText: 'IRMANDADE DO ASFALTO',
    description: 'Caixa alta imponente, tipografia clássica de eventos e clubes de moto.',
  },
  {
    id: 'Oswald',
    name: 'Oswald',
    category: 'Estrada & Moto Clube',
    googleFontFamily: 'Oswald:wght@400;500;600;700',
    cssFamily: "'Oswald', sans-serif",
    previewText: 'FORÇA & RESISTÊNCIA DE FERRO',
    description: 'Releitura condensada do estilo gótico clássico da cultura custom.',
  },
  {
    id: 'Rajdhani',
    name: 'Rajdhani',
    category: 'Futurista & Tático',
    googleFontFamily: 'Rajdhani:wght@500;600;700',
    cssFamily: "'Rajdhani', sans-serif",
    previewText: 'TELEMETRIA &segurança TÁTICA',
    description: 'Estilo cockpit e painel de moto com traços angulares refinados.',
  },
  {
    id: 'Orbitron',
    name: 'Orbitron',
    category: 'Futurista & Tático',
    googleFontFamily: 'Orbitron:wght@500;700;900',
    cssFamily: "'Orbitron', sans-serif",
    previewText: 'SISTEMA DINASTIA TÁTICO',
    description: 'Visual sci-fi / HUD militar para comandos e telemetria de alta precisão.',
  },
  {
    id: 'Exo 2',
    name: 'Exo 2',
    category: 'Futurista & Tático',
    googleFontFamily: 'Exo+2:wght@400;600;700;800',
    cssFamily: "'Exo 2', sans-serif",
    previewText: 'ALTA VELOCIDADE & ESTRADA',
    description: 'Projetada para sensação tecnológica com curvas dinâmicas e esportivas.',
  },
  {
    id: 'Cinzel',
    name: 'Cinzel',
    category: 'Clássico',
    googleFontFamily: 'Cinzel:wght@600;700;800;900',
    cssFamily: "'Cinzel', serif",
    previewText: 'BRASÃO & TRADIÇÃO DO CLUBE',
    description: 'Inspirada em inscrições romanas clássicas. Ideal para brasões e lemas solenes.',
  },
  {
    id: 'Open Sans',
    name: 'Open Sans',
    category: 'Moderno',
    googleFontFamily: 'Open+Sans:wght@400;600;700;800',
    cssFamily: "'Open Sans', sans-serif",
    previewText: 'GESTÃO ASSOCIATIVA TRANSPARENTE',
    description: 'Criada para máxima legibilidade em telas de todos os tamanhos.',
  },
  {
    id: 'Lato',
    name: 'Lato',
    category: 'Geométrico',
    googleFontFamily: 'Lato:wght@400;700;900',
    cssFamily: "'Lato', sans-serif",
    previewText: 'COMUNIDADE & IRMÃOS DE ESTRADA',
    description: 'Harmonia entre curvas amigáveis e solidez estrutural.',
  },
];

export const FONT_SCALE_OPTIONS: {
  id: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  label: string;
  scalePercent: string;
  description: string;
}[] = [
  { id: 'sm', label: 'Compacto', scalePercent: '92%', description: 'Mais conteúdo por tela, ideal para celulares compactos' },
  { id: 'md', label: 'Padrão', scalePercent: '100%', description: 'Equilíbrio recomendado para todos os dispositivos' },
  { id: 'lg', label: 'Médio Aumentado', scalePercent: '108%', description: 'Conforto visual aprimorado para leitura fácil' },
  { id: 'xl', label: 'Grande', scalePercent: '116%', description: 'Letras grandes para melhor visibilidade em suporte de guidão' },
  { id: '2xl', label: 'Extra Grande', scalePercent: '125%', description: 'Acessibilidade máxima para visão com luvas e à distância' },
];

/**
 * Dynamically updates the document font and scale
 */
export function applyGlobalFont(fontFamilyId?: string, fontScaleId?: string): void {
  if (typeof document === 'undefined') return;

  const selectedFont =
    AVAILABLE_FONTS.find((f) => f.id.toLowerCase() === (fontFamilyId || '').toLowerCase()) ||
    AVAILABLE_FONTS[0];

  // 1. Inject or update Google Fonts stylesheet link
  const linkId = 'applet-google-fonts-link';
  let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = linkId;
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }

  // Preconnect to Google Fonts for speed
  if (!document.getElementById('google-fonts-preconnect')) {
    const preconnect1 = document.createElement('link');
    preconnect1.id = 'google-fonts-preconnect';
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);
  }

  const googleUrl = `https://fonts.googleapis.com/css2?family=${selectedFont.googleFontFamily}&display=swap`;
  if (linkEl.href !== googleUrl) {
    linkEl.href = googleUrl;
  }

  // 2. Set root CSS variables & body style
  const root = document.documentElement;
  root.style.setProperty('--app-font-family', selectedFont.cssFamily);
  document.body.style.fontFamily = selectedFont.cssFamily;

  // 3. Apply font size scale
  const scaleObj = FONT_SCALE_OPTIONS.find((s) => s.id === fontScaleId) || FONT_SCALE_OPTIONS[1];
  root.style.setProperty('--app-font-size-scale', scaleObj.scalePercent);
  root.style.fontSize = scaleObj.scalePercent;

  // Also store in localStorage for instant cold start
  try {
    localStorage.setItem('ironside_app_font_family', selectedFont.id);
    localStorage.setItem('ironside_app_font_scale', scaleObj.id);
  } catch {
    // Ignore storage quota
  }
}
