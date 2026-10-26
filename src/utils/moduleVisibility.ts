import { ConfiguracaoClube, UserRole, ModuloVisibilidadePermissao } from '../types';

export interface ModuloInfo {
  id: string;
  aliases: string[];
  number: string;
  title: string;
  subtitle: string;
  category: string;
  defaultAssociado: boolean;
  defaultDiretoria: boolean;
  adminOnly?: boolean;
}

export const LISTA_MODULOS_SISTEMA: ModuloInfo[] = [
  {
    id: 'cadastro_institucional',
    aliases: ['cadastro_institucional', 'institucional'],
    number: '00',
    title: 'Cadastro Institucional — Moto Clube',
    subtitle: 'Dados oficiais do moto clube, CNPJ, sede física, diretoria legal e checklist de estatuto.',
    category: 'Institucional & Fundação',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'carteirinha',
    aliases: ['carteirinha'],
    number: '01',
    title: 'Carteirinha Digital',
    subtitle: 'Identificação oficial do integrante, QR Code dinâmico, tipo sanguíneo e validação.',
    category: 'Identidade & Acesso',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'veiculos',
    aliases: ['veiculos'],
    number: '02',
    title: 'Minhas Motos & Frota',
    subtitle: 'Cadastro de motocicletas, leitura de CRLV, galeria de fotos e odômetro.',
    category: 'Frota & Documentos',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'manutencao_abastecimento',
    aliases: ['manutencao_abastecimento', 'manutencao'],
    number: '03',
    title: 'Manutenção & Abastecimento',
    subtitle: 'Histórico de despesas na estrada, revisões preventivas, óleo e consumo km/l.',
    category: 'Garagem & Estrada',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'associados',
    aliases: ['associados'],
    number: '04',
    title: 'Quadro de Integrantes',
    subtitle: 'Fichas cadastrais completas, dados LGPD, cargos e controle de filiações.',
    category: 'Gestão de Membros',
    defaultAssociado: false, // Por padrão, apenas seu próprio cadastro para associados
    defaultDiretoria: true,
  },
  {
    id: 'mensalidades',
    aliases: ['mensalidades'],
    number: '05',
    title: 'Mensalidades & Finanças',
    subtitle: 'Contribuições com PIX Copia e Cola, QR Code, comprovantes e tesouraria.',
    category: 'Tesouraria',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'eventos',
    aliases: ['eventos'],
    number: '06',
    title: 'Eventos, Passeios & Galeria',
    subtitle: 'Calendário de viagens, comboios, presença e galeria de fotos com upload de câmera.',
    category: 'Estrada & Fraternidade',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'campanhas',
    aliases: ['campanhas'],
    number: '07',
    title: 'Campanhas & Doações',
    subtitle: 'Ações sociais solidárias, metas financeiras em R$ e itens beneficentes.',
    category: 'Ação Social',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'sos',
    aliases: ['sos'],
    number: '08',
    title: 'SOS Estrada & Apoio 24h',
    subtitle: 'Central de emergência: guinchos especializados, mecânicos parceiros e 190 / SAMU / PRF.',
    category: 'Segurança na Rodovia',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'amigos_mc',
    aliases: ['amigos_mc', 'amigos'],
    number: '09',
    title: 'Amigos & Outros MCs',
    subtitle: 'Rede de motoclubes irmãos, alianças interestaduais e pontos de apoio.',
    category: 'Irmandade Motociclística',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'noticias_motos',
    aliases: ['noticias_motos', 'noticias'],
    number: '10',
    title: 'Notícias & Novidades',
    subtitle: 'Portal de tendências do mundo das duas rodas, lançamentos e dicas.',
    category: 'Mundo Duas Rodas',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'comunicados',
    aliases: ['comunicados'],
    number: '11',
    title: 'Mural de Comunicados',
    subtitle: 'Quadro oficial de avisos da diretoria, convocações e comunicados urgentes.',
    category: 'Mural Oficial',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'configuracoes',
    aliases: ['configuracoes'],
    number: '12',
    title: 'Configurações & Auditoria',
    subtitle: 'Painel geral de controle de módulos, gestão de senhas e auditoria (Exclusivo Administrador).',
    category: 'Administração & Segurança',
    defaultAssociado: false,
    defaultDiretoria: false,
    adminOnly: true,
  },
  {
    id: 'hostinger',
    aliases: ['hostinger', 'hostinger-apk'],
    number: '13',
    title: 'Publicação Google Play, App Store & Hostinger',
    subtitle: 'Instruções para publicação TWA no Google Play, Apple App Store e hPanel Hostinger.',
    category: 'Lojas & Publicação Nativa',
    defaultAssociado: false,
    defaultDiretoria: false,
    adminOnly: true,
  },
  {
    id: 'relatorios_central',
    aliases: ['relatorios_central', 'relatorios', 'central_relatorios'],
    number: '14',
    title: 'Central de Relatórios Oficiais em PDF',
    subtitle: 'Central unificada de emissão de todos os relatórios, laudos e carteirinhas do clube em PDF.',
    category: 'Documentos & Auditoria',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
  {
    id: 'rank_estradas',
    aliases: ['rank_estradas', 'ranking', 'motoqueiros_elite'],
    number: '15',
    title: 'Rank de Estradas — Motoqueiros de Elite',
    subtitle: 'Classificação oficial por quilometragem somada de abastecimentos e manutenções registradas.',
    category: 'Garagem & Estrada',
    defaultAssociado: true,
    defaultDiretoria: true,
  },
];

export const DEFAULT_MODULOS_VISIBILIDADE: Record<string, ModuloVisibilidadePermissao> =
  LISTA_MODULOS_SISTEMA.reduce((acc, m) => {
    acc[m.id] = {
      associado: m.defaultAssociado,
      diretoria: m.defaultDiretoria,
    };
    return acc;
  }, {} as Record<string, ModuloVisibilidadePermissao>);

/**
 * Normaliza o ID do módulo considerando possíveis variações e aliases
 */
export function normalizeModuleId(moduleId: string): string {
  const clean = moduleId.trim().toLowerCase();
  for (const mod of LISTA_MODULOS_SISTEMA) {
    if (mod.id === clean || mod.aliases.includes(clean)) {
      return mod.id;
    }
  }
  return clean;
}

/**
 * Determina se um módulo deve estar visível para o perfil ativo
 */
export function isModuleVisible(
  moduleId: string,
  role: UserRole,
  config?: ConfiguracaoClube
): boolean {
  const normId = normalizeModuleId(moduleId);

  // Administrador tem acesso irrestrito a todos os módulos do sistema
  if (role === 'administrador') {
    return true;
  }

  // Módulo 12 (Configurações) é estritamente exclusivo do perfil Administrador
  if (normId === 'configuracoes') {
    return false;
  }

  // Módulo 13 (Hostinger/Lojas) é exclusivo do Administrador por padrão
  if (normId === 'hostinger' && role === 'associado') {
    return false;
  }

  const storedVisibility = config?.modulosVisibilidade?.[normId];

  if (role === 'associado') {
    if (storedVisibility !== undefined && typeof storedVisibility.associado === 'boolean') {
      return storedVisibility.associado;
    }
    const info = LISTA_MODULOS_SISTEMA.find((m) => m.id === normId);
    return info ? info.defaultAssociado : true;
  }

  if (role === 'diretoria') {
    if (storedVisibility !== undefined && typeof storedVisibility.diretoria === 'boolean') {
      return storedVisibility.diretoria;
    }
    const info = LISTA_MODULOS_SISTEMA.find((m) => m.id === normId);
    return info ? info.defaultDiretoria : true;
  }

  return true;
}
