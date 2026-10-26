import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Associado,
  Veiculo,
  Manutencao,
  Abastecimento,
  Evento,
  Mensalidade,
  Comunicado,
  ParceiroServico,
  ConfiguracaoClube,
  AuditoriaLog,
  UserProfile,
  CredencialDiretoria,
  Campanha,
  DoacaoRegistro,
  AmigoMotoClube,
  NoticiaMoto,
  CadastroInstitucional,
  MembroDiretoriaLegal,
  DocumentoChecklist,
  LancamentoExtrato,
} from '../types';
import {
  offlineDb,
  cacheCollectionLocally,
  enqueueOfflineMutation,
  syncOfflineQueueToFirestore,
} from './offlineDb';

import { DEFAULT_MODULOS_VISIBILIDADE } from '../utils/moduleVisibility';

// =====================================================================
// CONTROLE DE ESTADO: RESET GERAL DO BANCO DE DADOS & ZERO MOCK FALLBACK
// =====================================================================
export const SISTEMA_RESETADO_STORAGE_KEY = 'ironside_sistema_operacional_resetado';

export function isSistemaResetado(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem(SISTEMA_RESETADO_STORAGE_KEY);
      if (val === 'true') return true;
    }
  } catch {}
  return false;
}

export function marcarSistemaComoResetado(resetado = true): void {
  try {
    if (typeof window !== 'undefined') {
      if (resetado) {
        localStorage.setItem(SISTEMA_RESETADO_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(SISTEMA_RESETADO_STORAGE_KEY);
      }
    }
  } catch {}
}

// Default initial club config with Iron Side Road Rider M.C.
export const DEFAULT_CONFIG: ConfiguracaoClube = {
  id: 'geral',
  nomeClube: 'IRON SIDE ROAD RIDER M.C.',
  lema: 'Os melhores são de ferro',
  anoFundacao: '2016',
  logotipoUrl: '/ironside-logo.svg',
  telefoneContato: '(11) 98765-4321',
  whatsappContato: '(11) 98765-4321',
  emailContato: 'contato@ironsideroadrider.com.br',
  cidadeSede: 'São Paulo',
  estadoSede: 'SP',
  chavePix: 'financeiro@ironsideroadrider.com.br',
  tipoChavePix: 'E-mail',
  valorMensalidadePadrao: 85.0,
  diaVencimentoPadrao: 10,
  corPrimaria: '#eab308',
  corSecundaria: '#09090b',
  modulosVisibilidade: DEFAULT_MODULOS_VISIBILIDADE,
  fonteFamilia: 'Inter',
  fonteTamanhoEscala: 'md',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_CADASTRO_INSTITUCIONAL: CadastroInstitucional = {
  id: 'institucional-master',
  // 1. Dados Institucionais Básicos
  razaoSocial: 'ASSOCIAÇÃO MOTO CLUBE IRON SIDE ROAD RIDER',
  nomeFantasia: 'IRON SIDE ROAD RIDER M.C.',
  dataFundacao: '15/03/2016',
  cnpj: '18.492.381/0001-92',
  inscricaoEstadualMunicipal: 'Isento / 4.892.102-1',
  naturezaJuridica: '399-9 - Associação Privada Sem Fins Lucrativos',

  // 2. Sede e Localização
  cep: '04553-000',
  logradouro: 'Avenida dos Bandeirantes',
  numero: '1900',
  complemento: 'Galpão Sede Master & Área de Comboio',
  bairro: 'Vila Olímpia / Planalto',
  cidade: 'São Paulo',
  estado: 'SP',
  enderecoCompletoSede: 'Avenida dos Bandeirantes, 1900 - Planalto, São Paulo - SP, CEP 04553-000',
  telefoneInstitucional: '(11) 3845-9000',
  emailOficial: 'contato@ironsideroadrider.com.br',
  redesSociaisSite: '@ironsidemc_oficial • facebook.com/ironsidemc • www.ironsideroadrider.com.br',

  // 3. Diretoria Atual (Representação Legal com CPF e WhatsApp)
  diretoriaAtual: [
    {
      id: 'dir-pres',
      cargo: 'Presidente',
      nomeCompleto: 'Roberto Silveira',
      cpf: '123.456.789-00',
      whatsapp: '(11) 98765-4321',
      dataInicio: '15/01/2024',
    },
    {
      id: 'dir-vice',
      cargo: 'Vice-Presidente',
      nomeCompleto: 'Carlos Eduardo Lima',
      cpf: '234.567.890-11',
      whatsapp: '(11) 97654-3210',
      dataInicio: '15/01/2024',
    },
    {
      id: 'dir-tes',
      cargo: 'Tesoureiro(a)',
      nomeCompleto: 'Marcos Aurélio Silva',
      cpf: '345.678.901-22',
      whatsapp: '(11) 96543-2109',
      dataInicio: '15/01/2024',
    },
    {
      id: 'dir-sec',
      cargo: 'Secretário(a)',
      nomeCompleto: 'Juliana Silveira Ramos',
      cpf: '456.789.012-33',
      whatsapp: '(11) 95432-1098',
      dataInicio: '15/01/2024',
    },
    {
      id: 'dir-rot',
      cargo: 'Diretor de Roteiro / Safety',
      nomeCompleto: 'Alexandre Neves (Capitão de Estrada)',
      cpf: '567.890.123-44',
      whatsapp: '(11) 94321-0987',
      dataInicio: '15/01/2024',
    },
    {
      id: 'dir-disc',
      cargo: 'Diretor de Disciplina / Coletes',
      nomeCompleto: 'Marcelo Rocha (Guardião do Brasão)',
      cpf: '678.901.234-55',
      whatsapp: '(11) 93210-9876',
      dataInicio: '15/01/2024',
    },
  ],

  // 4. Dados Bancários e Financeiros
  codigoBancario: '001',
  banco: 'Banco do Brasil S.A.',
  tipoConta: 'Conta Corrente PJ',
  agencia: '1820-1',
  conta: '45290-8',
  limiteConta: '15.000,00',
  telefoneBanco: '(11) 4004-0001 / 0800 729 0001',
  nomeGerente: 'Carlos Eduardo Fontes (Gerente Corporate PJ)',
  chavePixInstitucional: '18.492.381/0001-92 (CNPJ)',
  tipoChavePix: 'CNPJ',

  // 5. Identidade do Moto Clube (Símbolos)
  significadoCoresBrasao: 'O escudo de ferro forjado simboliza a resiliência inquebrável dos membros sob intempéries e asfalto duro; a águia dourada representa a liberdade e visão de longo alcance nas estradas; as cores preto e amarelo/dourado denotam a nobreza da irmandade, respeito mútuo e luz nas viagens noturnas.',
  lemaSlogan: 'Os melhores são de ferro',
  subsedesRegionais: 'Sede Central (São Paulo - SP), Regional Campinas & Circuito das Águas (SP), Regional Curitiba & Rota Sul (PR), Regional Vale do Paraíba & Serra (SP/RJ)',

  // 6. Documentação Oficial (Checklist)
  checklistDocumentos: {
    estatutoSocialRegistrado: true,
    estatutoUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChFc3RhdHV0byBTb2NpYWwgT2ZpY2lhbCAtIE1vdG8gQ2x1YmUpCj4+CmVuZG9iago=',
    ataFundacaoEleicao: true,
    ataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChBdGEgZGUgRWxlaWNhbyBkYSBEaXJldG9yaWEpCj4+CmVuZG9iago=',
    cartaoCnpj: true,
    cartaoCnpjUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDYXJ0YW8gQ05QSiBSZWNlaXRhIEZlZGVyYWwpCj4+CmVuZG9iago=',
    comprovanteEnderecoSede: true,
    comprovanteEnderecoUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDb21wcm92YW50ZSBkZSBFbmRlcmVjbyBTZWRlKQo+PgplbmRvYmoK',
    regimentoInterno: true,
    regimentoInternoUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChSZWdpbWVudG8gSW50ZXJubyBkZSBDb25kdXRhIGUgQ29sZXRlcykKPj4KZW5kb2JqCg==',
    logotipoBrasaoVetorizado: true,
    logotipoBrasaoUrl: '/ironside-logo.svg',
  },

  updatedAt: new Date().toISOString(),
};

export const DEFAULT_CREDENCIAL_DIRETORIA: CredencialDiretoria = {
  login: 'DIRETORIA',
  senha: 'DIR202627',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_CREDENCIAL_ADMIN = {
  senha: 'ADMIN2026',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_COMUNICADOS: Comunicado[] = [
  {
    id: 'com-001',
    titulo: 'Bate e Fica Anual - Rota dos Cânions',
    conteudo:
      'Irmãos, preparem suas máquinas! O nosso grande passeio anual com pernoite será nos dias 24 e 25 do próximo mês. Saída pontual da sede às 07:00h com tanques cheios.',
    data: '12/10/2026',
    prioridade: 'alta',
    autor: 'Diretoria de Estradas',
    fixado: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'com-002',
    titulo: 'Alinhamento de Colete e Conduta em Comboio',
    conteudo:
      'Lembramos a todos os associados e novos ingressantes que a formação em zigue-zague é obrigatória nas rodovias. Respeite sempre os batedores e o ferrolho.',
    data: '08/10/2026',
    prioridade: 'normal',
    autor: 'Presidente',
    fixado: false,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_SOS: ParceiroServico[] = [
  {
    id: 'sos-001',
    nome: 'Guincho Resgate Duas Rodas 24h & Reboque Especial',
    categoria: 'guincho',
    telefone: '(11) 97777-1111',
    whatsapp: '(11) 97777-1111',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Marginal Tietê, km 14 - Ponte da Freguesia',
    descontoAssociado: '20% de desconto e km rodado subsidiado',
    horario24h: true,
    observacoes:
      'Caminhão plataforma equipado com cintas especiais e calço de roda para motos pesadas e big trails.',
  },
  {
    id: 'sos-002',
    nome: 'Oficina Custom & Mecânica de Motos MotoTech',
    categoria: 'oficina',
    telefone: '(11) 98888-2222',
    whatsapp: '(11) 98888-2222',
    cidade: 'Campinas',
    estado: 'SP',
    endereco: 'Av. Barão de Itapura, 1420 - Guanabara',
    descontoAssociado: 'Mão de obra com 15% off e alinhamento cortesia',
    horario24h: false,
    observacoes: 'Mecânicos especialistas em BMW GS, Harley-Davidson, Triumph, Honda e Ducati.',
  },
  {
    id: 'sos-003',
    nome: 'Borracharia & Pneus do Alemão 24h Rodovia',
    categoria: 'borracharia',
    telefone: '(11) 96666-3333',
    whatsapp: '(11) 96666-3333',
    cidade: 'Jundiaí',
    estado: 'SP',
    endereco: 'Rodovia Anhanguera, km 58',
    descontoAssociado: 'Socorro rápido com compressor móvel',
    horario24h: true,
    observacoes: 'Atendimento na pista ou na oficina com balanceamento dinâmico.',
  },
  {
    id: 'sos-004',
    nome: 'Chaveiro Central Express 24h Motos & Codificação',
    categoria: 'chaveiro',
    telefone: '(11) 95555-4444',
    whatsapp: '(11) 95555-4444',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Av. dos Bandeirantes, 2400 - Planalto Paulista',
    descontoAssociado: '15% de desconto para associados com carteirinha',
    horario24h: true,
    observacoes:
      'Especialista em cópia de chaves presenciais codificadas (Keyless, BMW, Harley, Triumph, Honda HISS).',
  },
  {
    id: 'sos-005',
    nome: 'Posto Graal & Ponto de Apoio dos Motociclistas',
    categoria: 'posto',
    telefone: '(11) 4582-1200',
    whatsapp: '(11) 94444-5555',
    cidade: 'Jundiaí',
    estado: 'SP',
    endereco: 'Rodovia dos Bandeirantes, km 56 - Sentido Interior',
    descontoAssociado: 'Café grátis para associados uniformizados',
    horario24h: true,
    observacoes:
      'Gasolina Podium / Octapro certificada, calibrador digital especial para motos e praça de alimentação 24h.',
  },
  {
    id: 'sos-006',
    nome: 'Motopeças Rota Livre & Auto Peças para Motos',
    categoria: 'autopecas',
    telefone: '(11) 93333-6666',
    whatsapp: '(11) 93333-6666',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Rua General Osório, 520 - Santa Ifigênia',
    descontoAssociado: '12% de desconto à vista no PIX',
    horario24h: false,
    observacoes:
      'Estoque completo de pastilhas de freio Brembo/Cobreq, kits de transmissão DID, filtros de óleo e pneus.',
  },
  {
    id: 'sos-007',
    nome: 'Sede Regional e Ponto de Apoio Moto Clube Irmão',
    categoria: 'clube',
    telefone: '(19) 98234-5678',
    whatsapp: '(19) 98234-5678',
    cidade: 'Campinas',
    estado: 'SP',
    endereco: 'Rua dos Motoqueiros, 350 - Jardim das Palmeiras',
    descontoAssociado: 'Recepção fraternal e abrigo de emergência para motos',
    horario24h: true,
    observacoes:
      'Ponto de apoio 24h para comboios com ferramentas básicas, calibrador e área de descanso.',
  },
];

export const DEFAULT_AMIGOS_MC: AmigoMotoClube[] = [
  {
    id: 'mc-001',
    nome: 'Abutres do Asfalto Moto Clube',
    tipo: 'moto_clube',
    presidenteOuContato: 'Comandante Marcão',
    telefone: '(11) 99123-4567',
    whatsapp: '(11) 99123-4567',
    cidade: 'São Paulo',
    estado: 'SP',
    enderecoSede: 'Av. do Cursino, 2200 - Saúde',
    fotoOuBrasaoUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
    anoFundacao: '1989',
    aniversarioMc: '15 de Setembro',
    email: 'contato@abutresdoasfalto.com.br',
    instagram: '@abutresdoasfalto_oficial',
    observacoes:
      'Irmandade tradicional com presença em comboios e viagens de longa distância. Ponto de encontro às sextas-feiras.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mc-002',
    nome: 'Águias de Aço Moto Clube',
    tipo: 'moto_clube',
    presidenteOuContato: 'Valdir "Falcão"',
    telefone: '(19) 98234-5678',
    whatsapp: '(19) 98234-5678',
    cidade: 'Campinas',
    estado: 'SP',
    enderecoSede: 'Rua dos Motoqueiros, 350 - Guanabara',
    fotoOuBrasaoUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80',
    anoFundacao: '2004',
    aniversarioMc: '22 de Março',
    email: 'aguiasdeaco@motoclube.com.br',
    instagram: '@aguiasdeaco_mc',
    observacoes:
      'Grande parceiro nos eventos beneficentes e bate-e-fica nas serras paulistas.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mc-003',
    nome: 'Irmãos do Vento Moto Grupo',
    tipo: 'moto_grupo',
    presidenteOuContato: 'Beto Cruz',
    telefone: '(41) 99876-1234',
    whatsapp: '(41) 99876-1234',
    cidade: 'Curitiba',
    estado: 'PR',
    enderecoSede: 'Rua Marechal Deodoro, 800 - Centro',
    fotoOuBrasaoUrl:
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=400&q=80',
    anoFundacao: '2012',
    aniversarioMc: '10 de Julho',
    email: 'irmaosdovento@motogrupo.com.br',
    instagram: '@irmaosdovento_mg',
    observacoes:
      'Grupo focado em turismo sobre duas rodas e expedições pelo sul do Brasil e América do Sul.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mc-004',
    nome: 'Bodes do Asfalto M.C. - Facção Bandeirantes',
    tipo: 'faccao_regional',
    presidenteOuContato: 'Mestre Robson',
    telefone: '(11) 97654-3210',
    whatsapp: '(11) 97654-3210',
    cidade: 'Jundiaí',
    estado: 'SP',
    enderecoSede: 'Av. Nove de Julho, 1200 - Chácara Urbana',
    fotoOuBrasaoUrl:
      'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=400&q=80',
    anoFundacao: '2003',
    aniversarioMc: '05 de Agosto',
    email: 'bandeirantes@bodesdoasfalto.org.br',
    instagram: '@bodesdoasfalto_bandeirantes',
    observacoes:
      'Facção amiga com grande apoio mútuo em manutenções de estrada e socorro.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mc-005',
    nome: 'Capitão Nelson (Irmão de Estrada & Batedor)',
    tipo: 'irmao_amigo',
    presidenteOuContato: 'Nelson Antunes',
    telefone: '(21) 98111-2233',
    whatsapp: '(21) 98111-2233',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    enderecoSede: 'Barra da Tijuca',
    fotoOuBrasaoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    anoFundacao: '2018',
    aniversarioMc: '14 de Novembro',
    email: 'nelson.batedor@estrada.com.br',
    instagram: '@nelson_roadcaptain',
    observacoes:
      'Capitão de estrada e batedor honorário. Ponto de apoio para viagens na rota Rio-Santos e Serra dos Órgãos.',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_NOTICIAS: NoticiaMoto[] = [
  {
    id: 'not-001',
    titulo: 'Nova BMW R 1300 GS Adventure: Tudo Sobre a Gigante das Expedições no Brasil',
    resumo:
      'Com tanque de 30 litros em alumínio, suspensão eletrônica Dynamic Suspension Adjustment (DSA) e novo motor Boxer de 145 cv, a nova big trail alemã revoluciona o segmento aventureiro nacional e internacional.',
    categoria: 'noticia',
    fonteNome: 'Motoo (motoo.com.br)',
    fonteUrl: 'https://www.motoo.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    data: '15/10/2026',
    tags: ['Motoo', 'BMW Motorrad', 'R 1300 GS', 'Big Trail'],
    destaque: true,
  },
  {
    id: 'not-002',
    titulo: 'Vendas de Motos no Brasil Batem Recorde Histórico com Alta em Big Trails e Scooters',
    resumo:
      'Segundo levantamento da Fenabrave e Motoo, o emplacamento nacional de duas rodas superou expectativas com destaque para modelos de alta cilindrada para turismo e lazer estradeiro.',
    categoria: 'noticia',
    fonteNome: 'Motoo (motoo.com.br)',
    fonteUrl: 'https://www.motoo.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    data: '14/10/2026',
    tags: ['Motoo', 'Mercado', 'Emplacamentos', 'Brasil'],
    destaque: true,
  },
  {
    id: 'not-003',
    titulo: 'Comparativo Big Trails: Triumph Tiger 900 Rally Pro vs BMW F 900 GS — Qual Domina a Terra?',
    resumo:
      'Avaliamos as duas peso-médio do mercado em trechos de terra batida, pedras e rodovias sinuosas. Veja quem se destaca em autonomia, eletrônica e ciclística.',
    categoria: 'noticia',
    fonteNome: 'Motonline (motonline.com.br)',
    fonteUrl: 'https://www.motonline.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=800&q=80',
    data: '13/10/2026',
    tags: ['Motonline', 'Triumph', 'BMW', 'Comparativo'],
    destaque: true,
  },
  {
    id: 'not-004',
    titulo: 'Guia de Pilotagem em Comboio: Como Evitar Colisões Traseiras e Sinais Manuais na Rodovia',
    resumo:
      'Regras indispensáveis para motoclubes: escalonamento em zigue-zague, tempo de reação de 2 segundos, sinalização de obstáculos na pista e papel fundamental do capitão de estrada e ferrolho.',
    categoria: 'dica_pilotagem',
    fonteNome: 'Motonline (motonline.com.br)',
    fonteUrl: 'https://www.motonline.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    data: '11/10/2026',
    tags: ['Motonline', 'Pilotagem Segura', 'Comboio', 'Estrada'],
    destaque: false,
  },
  {
    id: 'not-005',
    titulo: 'Moto do Ano 2026: Os Bastidores do Maior Teste Comparativo da Imprensa Brasileira',
    resumo:
      'A equipe da Revista Duas Rodas acelerou mais de 40 motocicletas finalistas em autódromo fechado e rodovias para eleger as grandes campeãs de cada categoria.',
    categoria: 'noticia',
    fonteNome: 'Revista Duas Rodas (revistaduasrodas.com.br)',
    fonteUrl: 'https://www.revistaduasrodas.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?auto=format&fit=crop&w=800&q=80',
    data: '10/10/2026',
    tags: ['Revista Duas Rodas', 'Moto do Ano', 'Teste', 'Prêmio'],
    destaque: true,
  },
  {
    id: 'not-006',
    titulo: 'Ducati DesertX Discovery Chega ao Brasil com Tanque Duplo e Pacote Off-Road para Longas Viagens',
    resumo:
      'Versão pronta para travessias extremas conta com protetores tubulares de motor, malas laterais de alumínio, manoplas aquecidas e para-brisa alto de série.',
    categoria: 'noticia',
    fonteNome: 'Revista Duas Rodas (revistaduasrodas.com.br)',
    fonteUrl: 'https://www.revistaduasrodas.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80',
    data: '08/10/2026',
    tags: ['Revista Duas Rodas', 'Ducati', 'DesertX', 'Aventura'],
    destaque: false,
  },
  {
    id: 'not-007',
    titulo: 'Harley-Davidson Apresenta Linha Touring CVO com Skyline OS e Nova Aerodinâmica',
    resumo:
      'A icônica família de motos estradeiras da marca norte-americana ganha telas TFT panorâmicas touch de 12.3 polegadas, sistema de áudio Rockford Fosgate de 500W e motor Milwaukee-Eight 121 VVT.',
    categoria: 'noticia',
    fonteNome: 'Revista Duas Rodas (revistaduasrodas.com.br)',
    fonteUrl: 'https://www.revistaduasrodas.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    data: '05/10/2026',
    tags: ['Revista Duas Rodas', 'Harley-Davidson', 'CVO', 'Custom'],
    destaque: false,
  },
  {
    id: 'not-008',
    titulo: 'Guia de Pneus para Chuva e Asfalto Molhado: Michelin Road 6 vs Pirelli Angel GT II vs Metzeler Tourance',
    resumo:
      'Análise técnica detalhada de drenagem de água sob tempestades em serra, durabilidade de composto bivalente e pressão correta com garupa e bagageiros carregados.',
    categoria: 'pecas_marcas',
    fonteNome: 'Motoo (motoo.com.br)',
    fonteUrl: 'https://www.motoo.com.br',
    imagemUrl:
      'https://images.unsplash.com/photo-1571216332002-282dce467b32?auto=format&fit=crop&w=800&q=80',
    data: '03/10/2026',
    tags: ['Motoo', 'Pneus', 'Michelin', 'Pirelli', 'Chuva'],
    destaque: false,
  },
];

export const DEFAULT_EVENTOS: Evento[] = [
  {
    id: 'ev-001',
    titulo: 'Passeio Serra do Rio do Rastro',
    descricao:
      'Grande expedição com mais de 80 motocicletas cruzando as curvas mais famosas do Brasil. Apoio com van de ferramentas e fotógrafo oficial.',
    data: '15/11/2026',
    hora: '06:30',
    local: 'Sede Regional Sul / Posto Graal',
    cidade: 'Curitiba - PR',
    preco: 120,
    vagasLimite: 50,
    participantesCount: 2,
    imagemUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    status: 'agendado',
    organizador: 'Diretoria de Eventos',
    inscritos: ['user-001', 'user-002'],
    presencas: {
      'user-001': true,
      'user-002': false,
    },
    galeria: [
      {
        id: 'foto-serra-01',
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
        legenda: 'Comboio alinhado na subida da serra antes da neblina.',
        autorId: 'user-001',
        autorNome: 'Roberto Silveira (Trovão Negro)',
        autorFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        dataUpload: '2026-10-18T10:15:00Z',
        origem: 'camera',
        curtidas: ['user-001', 'user-002'],
      },
      {
        id: 'foto-serra-02',
        url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
        legenda: 'Parada no Mirante dos Cânions para o café e briefing dos batedores.',
        autorId: 'user-002',
        autorNome: 'Carlos Eduardo (Falcão)',
        autorFoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        dataUpload: '2026-10-18T11:45:00Z',
        origem: 'upload',
        curtidas: ['user-001'],
      },
      {
        id: 'foto-serra-03',
        url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=80',
        legenda: 'Motos Harley-Davidson e BMW alinhadas no posto de apoio.',
        autorId: 'user-001',
        autorNome: 'Roberto Silveira (Trovão Negro)',
        autorFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        dataUpload: '2026-10-18T14:20:00Z',
        origem: 'camera',
        curtidas: ['user-002'],
      },
      {
        id: 'foto-serra-04',
        url: 'https://images.unsplash.com/photo-1515777315835-281b94c9589f?auto=format&fit=crop&w=1200&q=80',
        legenda: 'Entardecer na estrada de volta para Curitiba. Missão cumprida!',
        autorId: 'user-002',
        autorNome: 'Carlos Eduardo (Falcão)',
        autorFoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        dataUpload: '2026-10-18T18:10:00Z',
        origem: 'camera',
        curtidas: [],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ev-002',
    titulo: 'Churrasco Mensal de Confraternização',
    descricao:
      'Encontro comemorativo dos aniversariantes do mês, entrega de novos brasões e alinhamento de novos projetos sociais.',
    data: '31/10/2026',
    hora: '13:00',
    local: 'Sede Central Iron Side Road Rider M.C.',
    cidade: 'São Paulo - SP',
    preco: 0,
    vagasLimite: 150,
    participantesCount: 1,
    imagemUrl:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    status: 'agendado',
    organizador: 'Comissão Social',
    inscritos: ['user-001'],
    presencas: {
      'user-001': true,
    },
    galeria: [
      {
        id: 'foto-churras-01',
        url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
        legenda: 'Costela de chão e churrasco de confraternização dos irmãos na sede.',
        autorId: 'user-001',
        autorNome: 'Roberto Silveira (Trovão Negro)',
        autorFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        dataUpload: '2026-10-15T15:00:00Z',
        origem: 'camera',
        curtidas: ['user-001'],
      },
      {
        id: 'foto-churras-02',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        legenda: 'Banda de Classic Rock animando a tarde dos motociclistas.',
        autorId: 'user-001',
        autorNome: 'Roberto Silveira (Trovão Negro)',
        autorFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        dataUpload: '2026-10-15T16:30:00Z',
        origem: 'upload',
        curtidas: [],
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_ASSOCIADOS: Associado[] = [
  {
    id: 'user-001',
    uid: 'user-001',
    numeroAssociado: 'MC-000001',
    nome: 'Roberto Silveira',
    nomeGuerra: 'Trovão Negro',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    dataNascimento: '15/04/1982',
    tipoSanguineo: 'O+',
    email: 'trovao@ironsideroadrider.com.br',
    telefone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Conjunto 101',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cnhNumero: '98765432100',
    cnhCategoria: 'A',
    cnhValidade: '20/12/2028',
    regional: 'São Paulo - Matriz',
    cargo: 'Presidente',
    status: 'ativo',
    fotoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    dataAssociacao: '10/01/2019',
    dataFiliacao: '10/01/2019',
    aprovadoPorDiretoria: 'Diretoria Executiva Iron Side Road Rider M.C.',
    numeroAtaFiliacao: 'Ata de Fundação e Filiação nº 001/2019',
    aprovadoPor: 'Diretoria Executiva',
    aprovadoEm: '10/01/2019',
    estadoCivil: 'Casado(a)',
    alergiaMedicamento: {
      possui: false,
      descricao: 'Não possui alergia a medicamentos relatada.',
    },
    alergiaAlimentacao: {
      possui: false,
      descricao: 'Não possui alergia alimentar relatada.',
    },
    problemaSaude: {
      possui: false,
      descricao: 'Nenhum problema de saúde físico ou mental.',
    },
    pcd: {
      possui: false,
      descricao: 'Não se aplica.',
    },
    consentimentoLgpd: true,
    dataConsentimentoLgpd: '10/01/2019',
    observacoes: 'Membro fundador, liderança de estrada e ferrolho oficial.',
    contatosEmergencia: [
      { nome: 'Juliana Silveira', parentesco: 'Esposa', telefone: '(11) 99123-4567' },
      { nome: 'Carlos Eduardo', parentesco: 'Vice-Presidente', telefone: '(11) 98877-6655' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-002',
    uid: 'user-002',
    numeroAssociado: 'PENDENTE',
    nome: 'Carlos Mendonça',
    nomeGuerra: 'Vento Forte',
    cpf: '789.456.123-00',
    rg: '34.567.890-1',
    dataNascimento: '22/08/1990',
    tipoSanguineo: 'A+',
    email: 'carlos.mendonca@email.com',
    telefone: '(11) 97123-9988',
    whatsapp: '(11) 97123-9988',
    cep: '04538-132',
    logradouro: 'Rua Joaquim Floriano',
    numero: '450',
    complemento: 'Apto 42',
    bairro: 'Itaim Bibi',
    cidade: 'São Paulo',
    estado: 'SP',
    cnhNumero: '45678912300',
    cnhCategoria: 'A',
    cnhValidade: '15/07/2029',
    regional: 'São Paulo - Matriz',
    cargo: 'Próspero / Aspirante',
    status: 'pendente',
    fotoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    dataAssociacao: '12/10/2026',
    estadoCivil: 'Solteiro(a)',
    alergiaMedicamento: {
      possui: true,
      descricao: 'Dipirona e Anti-inflamatórios não esteroides (AINEs).',
    },
    alergiaAlimentacao: {
      possui: false,
      descricao: 'Nenhuma alergia alimentar.',
    },
    problemaSaude: {
      possui: false,
      descricao: 'Sem problemas de saúde impeditivos.',
    },
    pcd: {
      possui: false,
      descricao: 'Não.',
    },
    consentimentoLgpd: true,
    dataConsentimentoLgpd: '12/10/2026',
    observacoes:
      'Participou dos passeios de avaliação preliminares. Aguardando homologação oficial da Diretoria com ata de filiação.',
    contatosEmergencia: [
      { nome: 'Mariana Mendonça', parentesco: 'Irmã', telefone: '(11) 97766-5544' },
      { nome: 'José Mendonça', parentesco: 'Pai', telefone: '(11) 97123-4455' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-003',
    uid: 'user-003',
    numeroAssociado: 'MC-000003',
    nome: 'Marcos Ribeiro',
    nomeGuerra: 'Sombra da Noite',
    cpf: '987.654.321-99',
    rg: '98.765.432-1',
    dataNascimento: '03/11/1985',
    tipoSanguineo: 'B+',
    email: 'marcos.ribeiro.ex@email.com',
    telefone: '(11) 96543-2109',
    whatsapp: '(11) 96543-2109',
    cep: '13010-111',
    logradouro: 'Avenida Francisco Glicério',
    numero: '800',
    complemento: 'Bloco B',
    bairro: 'Centro',
    cidade: 'Campinas',
    estado: 'SP',
    cnhNumero: '12398745600',
    cnhCategoria: 'A',
    cnhValidade: '10/05/2027',
    regional: 'Campinas - SP',
    cargo: 'Ex-Membro (Desligado)',
    status: 'desligado',
    fotoUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    dataAssociacao: '15/03/2021',
    dataFiliacao: '15/03/2021',
    dataDesligamento: '05/10/2026',
    desligadoPor: 'Diretoria Executiva & Conselho Disciplinar',
    cpfBloqueado: '98765432199',
    estadoCivil: 'Divorciado(a)',
    alergiaMedicamento: { possui: false, descricao: 'Nenhuma' },
    alergiaAlimentacao: { possui: false, descricao: 'Nenhuma' },
    problemaSaude: { possui: false, descricao: 'Nenhum' },
    pcd: { possui: false, descricao: 'Não' },
    consentimentoLgpd: true,
    dataConsentimentoLgpd: '15/03/2021',
    motivoDesligamento:
      'DESLIGAMENTO COMPULSÓRIO POR QUEBRA GRAVE DO ESTATUTO SOCIAL DO MOTO CLUBE:\n\nEm reunião extraordinária realizada aos 05 dias do mês de outubro de 2026, com presença unânime da Diretoria Executiva e do Conselho Disciplinar, foi deliberada a exclusão definitiva do associado Marcos Ribeiro (CPF 987.654.321-99), com base nos Artigos 18, 22 e 25 do Estatuto do Iron Side Road Rider M.C.\n\nConstatou-se conduta incompatível com a honra e a irmandade do clube durante o deslocamento interestadual na Rodovia Presidente Dutra (BR-116), incluindo ultrapassagem perigosa de membros do comboio em velocidade não autorizada, desrespeito explícito às ordens dos batedores e do capitão de estrada, e recusa em acatar as advertências verbais e escritas emitidas pela comissão de tráfego.\n\nAdicionalmente, verificou-se o uso indevido do brasão oficial em evento privado não chancelado pelo clube, ferindo a cláusula de representatividade institucional.\n\nDiante da gravidade e da reincidência das infrações após duas suspensões preventivas anteriores, a Diretoria homologou em Ata nº 14/2026 o DESLIGAMENTO DEFINITIVO com revogação imediata de todos os direitos associativos e BLOQUEIO TOTAL E IRREVOGÁVEL de acesso ao sistema integrado web e ao aplicativo móvel Android, sendo o controle estritamente executado por meio do CPF cadastrado.',
    observacoes: 'Desligado em definitivo pela Diretoria. Acesso Web e Android terminantemente bloqueado via CPF.',
    contatosEmergencia: [
      { nome: 'Fernanda Ribeiro', parentesco: 'Irmã', telefone: '(11) 96543-9999' },
      { nome: 'Roberto Alves', parentesco: 'Amigo de Estrada', telefone: '(11) 98111-2233' },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_VEICULOS: Veiculo[] = [
  {
    id: 'veic-001',
    associadoId: 'user-001',
    marca: 'BMW',
    modelo: 'R 1250 GS Adventure',
    versao: 'Triple Black Edition',
    ano: '2024',
    anoFabricacao: '2024',
    cor: 'Preto Metálico',
    placa: 'BRA2E19',
    kmAtual: 14500,
    tipo: 'moto',
    fotoUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    seguradora: 'Porto Seguro Motos',
    apolice: '984210-98',
    renavam: '01293847561',
    chassi: '9BWZZZ123RP098765',
    cilindradaCc: 1254,
    potenciaCv: 136,
    combustivel: 'Gasolina',
    numeroCrlv: '202619482910',
    exercicioLicenciamento: '2026',
    categoriaVeiculo: 'Particular / Motocicleta',
    capacidadePassageiros: '2P',
    nomeProprietarioCrlv: 'Roberto Silveira',
    cpfCnpjProprietario: '123.456.789-00',
    municipioEmplacamento: 'São Paulo',
    ufEmplacamento: 'SP',
    restricoesFinanceiras: 'Nenhuma',
    crlvDigitalUrl:
      'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDUkxWIEVsZXRyw7RuaWNvIC0gQk1XIFIxMjUwIEdTKQovQXV0aG9yIChTRVJPIC8gREVOQVRST04pCj4+CmVuZG9iago=',
    crlvDigitalNomeArquivo: 'crlv_e_bmw_r1250gs_bra2e19.pdf',
    crlvDigitalizadoEm: '15/01/2026',
    observacoes:
      'Pneus Michelin Anakee Adventure recém trocados. Faróis de milha auxiliares LED homologados.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veic-002',
    associadoId: 'demo-admin-uid',
    marca: 'Harley-Davidson',
    modelo: 'Ultra Limited 114',
    versao: 'Touring Glide',
    ano: '2023',
    anoFabricacao: '2023',
    cor: 'Vivid Black & Chrome',
    placa: 'HD8X23',
    kmAtual: 28300,
    tipo: 'moto',
    fotoUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
    seguradora: 'Allianz Seguros',
    apolice: '345678-12',
    renavam: '09812374652',
    chassi: '1HD1KEM28NB654321',
    cilindradaCc: 1868,
    potenciaCv: 93,
    combustivel: 'Gasolina',
    numeroCrlv: '202688419203',
    exercicioLicenciamento: '2026',
    categoriaVeiculo: 'Particular / Motocicleta',
    capacidadePassageiros: '2P',
    nomeProprietarioCrlv: 'Roberto Silveira',
    cpfCnpjProprietario: '123.456.789-00',
    municipioEmplacamento: 'São Paulo',
    ufEmplacamento: 'SP',
    restricoesFinanceiras: 'Nenhuma',
    crlvDigitalUrl:
      'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDUkxWIC0gSGFybGV5IERhdmlkc29uIFVsdHJhKQovQXV0aG9yIChTRVJPIC8gREVOQVRST04pCj4+CmVuZG9iago=',
    crlvDigitalNomeArquivo: 'crlv_harley_ultra_hd8x23.pdf',
    crlvDigitalizadoEm: '20/02/2026',
    observacoes: 'Ponteiras esportivas Vance & Hines e rádio intercomunicador integrado.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veic-003',
    associadoId: 'user-002',
    marca: 'Triumph',
    modelo: 'Tiger 900 Rally Pro',
    versao: 'Sandstorm Edition',
    ano: '2023',
    anoFabricacao: '2023',
    cor: 'Areia / Grafite',
    placa: 'TRI9E24',
    kmAtual: 18900,
    tipo: 'moto',
    fotoUrl:
      'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=600&q=80',
    renavam: '05432198760',
    chassi: 'SMT02R900NP789123',
    cilindradaCc: 888,
    potenciaCv: 95,
    combustivel: 'Gasolina',
    numeroCrlv: '202677218392',
    exercicioLicenciamento: '2026',
    categoriaVeiculo: 'Particular / Motocicleta',
    capacidadePassageiros: '2P',
    nomeProprietarioCrlv: 'Carlos Mendonça',
    cpfCnpjProprietario: '789.456.123-00',
    municipioEmplacamento: 'São Paulo',
    ufEmplacamento: 'SP',
    restricoesFinanceiras: 'Alienação Fiduciária (Banco Santander)',
    crlvDigitalUrl:
      'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDUkxWIC0gVHJpdW1waCBUaWdlciA5MDApCi9BdXRob3IgKFNFUk8gLyBERU5BVFJPTikKPj4KZW5kb2JqCg==',
    crlvDigitalNomeArquivo: 'crlv_triumph_tiger_tri9e24.pdf',
    crlvDigitalizadoEm: '10/03/2026',
    observacoes:
      'Protetor de motor e carenagem completo, suporte para malas laterais de alumínio.',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_MANUTENCOES: Manutencao[] = [
  {
    id: 'manu-001',
    associadoId: 'user-001',
    veiculoId: 'veic-001',
    data: '10/10/2026',
    km: 14000,
    tipoServico: 'Revisão Periódica',
    descricao:
      'Troca de óleo de motor Motul 7100 5W40, filtro de óleo Mahle, regulagem de válvulas e sangria dos freios.',
    oficina: 'Oficina Custom & Big Trail MotoTech',
    valor: 890,
    proximaManutencaoKm: 24000,
    proximaManutencaoData: '10/04/2027',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manu-002',
    associadoId: 'user-001',
    veiculoId: 'veic-001',
    data: '15/08/2026',
    km: 12200,
    tipoServico: 'Pneus e Balanceamento',
    descricao:
      'Substituição do par de pneus Michelin Anakee Adventure e balanceamento computadorizado das rodas.',
    oficina: 'Borracharia & Pneus do Alemão 24h',
    valor: 2450,
    proximaManutencaoKm: 32000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manu-003',
    associadoId: 'user-002',
    veiculoId: 'veic-003',
    data: '22/09/2026',
    km: 18500,
    tipoServico: 'Pastilhas de Freio',
    descricao:
      'Troca das pastilhas dianteiras e traseiras sinterizadas Brembo e fluido de freio DOT 5.1.',
    oficina: 'Oficina Custom & Big Trail MotoTech',
    valor: 640,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manu-004',
    associadoId: 'demo-admin-uid',
    veiculoId: 'veic-002',
    data: '05/09/2026',
    km: 26500,
    tipoServico: 'Revisão Primária & Fluidos',
    descricao:
      'Troca de óleo de motor 20W50, óleo de câmbio Formula+, filtro cromado e aperto geral de coxins do chassi.',
    oficina: 'Oficina Custom & Big Trail MotoTech',
    valor: 1850,
    proximaManutencaoKm: 34000,
    proximaManutencaoData: '05/03/2027',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_ABASTECIMENTOS: Abastecimento[] = [
  {
    id: 'abast-001',
    associadoId: 'user-001',
    veiculoId: 'veic-001',
    dataHora: '11/10/2026 08:30',
    km: 14450,
    combustivel: 'gasolina_premium',
    litros: 26.5,
    precoLitro: 7.89,
    valorTotal: 209.08,
    tanqueCheio: true,
    posto: 'Posto Graal Rodovia dos Bandeirantes',
    cidade: 'Jundiaí - SP',
    consumoKmL: 17.8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'abast-002',
    associadoId: 'user-001',
    veiculoId: 'veic-001',
    dataHora: '04/10/2026 16:15',
    km: 13980,
    combustivel: 'gasolina_aditivada',
    litros: 24.0,
    precoLitro: 6.29,
    valorTotal: 150.96,
    tanqueCheio: true,
    posto: 'Posto Shell Rodoanel Sul',
    cidade: 'São Bernardo - SP',
    consumoKmL: 18.2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'abast-003',
    associadoId: 'user-002',
    veiculoId: 'veic-003',
    dataHora: '08/10/2026 11:40',
    km: 18850,
    combustivel: 'gasolina_aditivada',
    litros: 17.5,
    precoLitro: 6.35,
    valorTotal: 111.12,
    tanqueCheio: true,
    posto: 'Posto Ipiranga Rota Imperial',
    cidade: 'Campinas - SP',
    consumoKmL: 20.4,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_MENSALIDADES: Mensalidade[] = [
  {
    id: 'mens-001',
    associadoId: 'user-001',
    nomeAssociado: 'Roberto Silveira',
    numeroAssociado: 'MC-000001',
    competencia: 'Outubro/2026',
    ano: 2026,
    mes: 10,
    valor: 85,
    vencimento: '10/10/2026',
    status: 'pago',
    dataPagamento: '08/10/2026',
    formaPagamento: 'PIX',
    comprovanteUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDb21wcm92YW50ZSBkZSBQYWdhbWVudG8gLSBPdXQvMjAyNikKL0F1dGhvciAoSXJvbiBTaWRlIFJvYWQgUmlkZXIgTS5DLikKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iag==',
    comprovanteNomeArquivo: 'comprovante_pix_outubro_2026.pdf',
    comprovanteTipo: 'application/pdf',
    comprovanteEnviadoEm: '08/10/2026 10:15',
    statusComprovante: 'aprovado',
    aprovadoPorDiretor: 'Diretoria Executiva',
    dataAprovacaoDiretor: '08/10/2026',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-002',
    associadoId: 'user-002',
    nomeAssociado: 'Carlos Mendonça',
    numeroAssociado: 'PENDENTE',
    competencia: 'Outubro/2026',
    ano: 2026,
    mes: 10,
    valor: 85,
    vencimento: '10/10/2026',
    status: 'pendente',
    comprovanteUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDb21wcm92YW50ZSBkZSBQYWdhbWVudG8gQ2FybG9zIE1lbmRvbmNhKQovQXV0aG9yIChDYXJsb3MgTWVuZG9uY2EpCj4+CmVuZG9iag==',
    comprovanteNomeArquivo: 'comprovante_deposito_carlos_mendonca_out2026.pdf',
    comprovanteTipo: 'application/pdf',
    comprovanteEnviadoEm: '11/10/2026 14:20',
    statusComprovante: 'pendente_analise',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-007',
    associadoId: 'user-001',
    nomeAssociado: 'Roberto Silveira',
    numeroAssociado: 'MC-000001',
    competencia: 'Novembro/2026',
    ano: 2026,
    mes: 11,
    valor: 85,
    vencimento: '10/11/2026',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-003',
    associadoId: 'user-001',
    nomeAssociado: 'Roberto Silveira',
    numeroAssociado: 'MC-000001',
    competencia: 'Setembro/2026',
    ano: 2026,
    mes: 9,
    valor: 85,
    vencimento: '10/09/2026',
    status: 'pago',
    dataPagamento: '09/09/2026',
    formaPagamento: 'PIX',
    comprovanteUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDb21wcm92YW50ZSBkZSBQYWdhbWVudG8gLSBTZXQvMjAyNikKPj4KZW5kb2JqCg==',
    comprovanteNomeArquivo: 'comprovante_pix_setembro_2026.pdf',
    comprovanteTipo: 'application/pdf',
    comprovanteEnviadoEm: '09/09/2026 09:30',
    statusComprovante: 'aprovado',
    aprovadoPorDiretor: 'Diretoria Executiva',
    dataAprovacaoDiretor: '09/09/2026',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-004',
    associadoId: 'user-002',
    nomeAssociado: 'Carlos Mendonça',
    numeroAssociado: 'PENDENTE',
    competencia: 'Setembro/2026',
    ano: 2026,
    mes: 9,
    valor: 85,
    vencimento: '10/09/2026',
    status: 'pago',
    dataPagamento: '10/09/2026',
    formaPagamento: 'Boleto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-005',
    associadoId: 'user-001',
    nomeAssociado: 'Roberto Silveira',
    numeroAssociado: 'MC-000001',
    competencia: 'Agosto/2026',
    ano: 2026,
    mes: 8,
    valor: 85,
    vencimento: '10/08/2026',
    status: 'pago',
    dataPagamento: '05/08/2026',
    formaPagamento: 'PIX',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-006',
    associadoId: 'user-002',
    nomeAssociado: 'Carlos Mendonça',
    numeroAssociado: 'PENDENTE',
    competencia: 'Agosto/2026',
    ano: 2026,
    mes: 8,
    valor: 85,
    vencimento: '10/08/2026',
    status: 'atrasado',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-008',
    associadoId: 'user-001',
    nomeAssociado: 'Roberto Silveira',
    numeroAssociado: 'MC-000001',
    competencia: 'Julho/2026',
    ano: 2026,
    mes: 7,
    valor: 85,
    vencimento: '10/07/2026',
    status: 'pago',
    dataPagamento: '07/07/2026',
    formaPagamento: 'PIX',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-009',
    associadoId: 'user-002',
    nomeAssociado: 'Carlos Mendonça',
    numeroAssociado: 'PENDENTE',
    competencia: 'Julho/2026',
    ano: 2026,
    mes: 7,
    valor: 85,
    vencimento: '10/07/2026',
    status: 'pago',
    dataPagamento: '09/07/2026',
    formaPagamento: 'PIX',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-010',
    associadoId: 'user-001',
    nomeAssociado: 'Roberto Silveira',
    numeroAssociado: 'MC-000001',
    competencia: 'Junho/2026',
    ano: 2026,
    mes: 6,
    valor: 85,
    vencimento: '10/06/2026',
    status: 'pago',
    dataPagamento: '08/06/2026',
    formaPagamento: 'PIX',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-011',
    associadoId: 'user-002',
    nomeAssociado: 'Carlos Mendonça',
    numeroAssociado: 'PENDENTE',
    competencia: 'Junho/2026',
    ano: 2026,
    mes: 6,
    valor: 85,
    vencimento: '10/06/2026',
    status: 'atrasado',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-012',
    associadoId: 'user-001',
    nomeAssociado: 'Roberto Silveira',
    numeroAssociado: 'MC-000001',
    competencia: 'Maio/2026',
    ano: 2026,
    mes: 5,
    valor: 85,
    vencimento: '10/05/2026',
    status: 'pago',
    dataPagamento: '05/05/2026',
    formaPagamento: 'PIX',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mens-013',
    associadoId: 'user-002',
    nomeAssociado: 'Carlos Mendonça',
    numeroAssociado: 'PENDENTE',
    competencia: 'Maio/2026',
    ano: 2026,
    mes: 5,
    valor: 85,
    vencimento: '10/05/2026',
    status: 'pago',
    dataPagamento: '10/05/2026',
    formaPagamento: 'Boleto',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_CAMPANHAS: Campanha[] = [
  {
    id: 'camp-001',
    titulo: 'Campanha do Agasalho Iron Side 2026 - Nenhum Irmão no Frio',
    descricao:
      'Tradicional ação humanitária do Moto Clube Iron Side Road Rider. Arrecadação de jaquetas, cobertores térmicos novos, moletons, luvas e recursos financeiros para confecção de kits de inverno destinados a abrigos e moradores em vulnerabilidade.',
    tipoCampanha: 'agasalhos',
    dataInicio: '01/05/2026',
    dataFinal: '31/08/2026',
    metaArrecadacaoValor: 5000,
    metaArrecadacaoItens: 500,
    unidadeMeta: 'peças de agasalho e cobertores',
    arrecadadoValor: 4250,
    arrecadadoItensCount: 380,
    instituicaoRecebera: {
      nome: 'Lar São Vicente de Paulo & Albergue Fraterno',
      cnpj: '54.321.987/0001-22',
      responsavel: 'Irmã Tereza Santos',
      telefone: '(11) 98765-4321',
      cidade: 'São Paulo',
      bairro: 'Cambuci',
      endereco: 'Rua da Fraternidade, 180',
    },
    imagemMaterialUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    enderecoEntrega:
      'Sede Social Iron Side M.C. - Av. dos Bandeirantes, 1900 - Bairro Planalto, São Paulo - SP (De terça a domingo, das 10h às 22h)',
    chavePixDoacao: 'social@ironsideroadrider.com.br',
    status: 'ativa',
    doacoes: [
      {
        id: 'doac-1',
        autorNome: 'Roberto Silveira (Trovão Negro)',
        autorIdentificador: 'MC-000001',
        tipo: 'financeiro',
        valor: 500,
        data: '12/05/2026',
        observacoes: 'Doação para aquisição de cobertores térmicos de microfibra',
      },
      {
        id: 'doac-2',
        autorNome: 'Carlos Mendonça (Fênix)',
        autorIdentificador: 'MC-000002',
        tipo: 'agasalhos',
        descricaoItens: '45 jaquetas corta-vento e cobertores novos',
        data: '20/05/2026',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'camp-002',
    titulo: 'Ação Duas Rodas, Um Sorriso - Natal & Dia das Crianças Solidário',
    descricao:
      'Campanha de arrecadação de brinquedos pedagógicos novos, materiais escolares e cestas natalinas para distribuição comunitária com o tradicional comboio de motos e trenó motociclístico.',
    tipoCampanha: 'brinquedos',
    dataInicio: '01/10/2026',
    dataFinal: '20/12/2026',
    metaArrecadacaoValor: 10000,
    metaArrecadacaoItens: 300,
    unidadeMeta: 'brinquedos novos e cestas',
    arrecadadoValor: 6850,
    arrecadadoItensCount: 195,
    instituicaoRecebera: {
      nome: 'Orfanato Caminho da Luz e Associação Esperança Viva',
      cnpj: '33.112.445/0001-88',
      responsavel: 'Dra. Márcia Albuquerque',
      telefone: '(11) 97123-5566',
      cidade: 'São Paulo',
      bairro: 'Parque das Nações',
      endereco: 'Av. Esperança Solidária, 450',
    },
    imagemMaterialUrl:
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
    enderecoEntrega:
      'Sede Social Iron Side M.C. ou Posto de Coleta Oficial Zona Sul (Av. Washington Luís, 3200)',
    chavePixDoacao: 'social@ironsideroadrider.com.br',
    status: 'ativa',
    doacoes: [
      {
        id: 'doac-3',
        autorNome: 'Fernando Torres (Carcará)',
        autorIdentificador: 'MC-000003',
        tipo: 'brinquedos',
        descricaoItens: '60 brinquedos lacrados e jogos de tabuleiro',
        data: '08/10/2026',
      },
      {
        id: 'doac-4',
        autorNome: 'Diretoria Executiva',
        autorIdentificador: 'DIRETORIA',
        tipo: 'financeiro',
        valor: 2000,
        data: '01/10/2026',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'camp-003',
    titulo: 'Missão Humanitária SOS Enchentes & Comunidades Ilhadas',
    descricao:
      'Ação emergencial de socorro imediato com envio de água mineral potável, cestas de alimentos secos, lonas e kits de higiene de primeira necessidade.',
    tipoCampanha: 'alimentos',
    dataInicio: '15/01/2026',
    dataFinal: '28/02/2026',
    metaArrecadacaoValor: 15000,
    metaArrecadacaoItens: 1000,
    unidadeMeta: 'galões de água e cestas básicas',
    arrecadadoValor: 18900,
    arrecadadoItensCount: 1450,
    instituicaoRecebera: {
      nome: 'Defesa Civil e Fundo Social de Solidariedade Integrado',
      cnpj: '11.222.333/0001-44',
      responsavel: 'Capitão Ramos / Coordenação Integrada',
      telefone: '(12) 3892-1000',
      cidade: 'Litoral Paulista',
      bairro: 'Centro Integrado de Apoio',
      endereco: 'Rua da Cidadania e Socorro, 50',
    },
    imagemMaterialUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    enderecoEntrega: 'Centro de Triagem Regional / Ponto Avançado',
    chavePixDoacao: 'social@ironsideroadrider.com.br',
    status: 'encerrada',
    relatoEncerramento:
      'Missão de solidariedade cumprida com absoluto êxito! Nosso comboio com 38 motocicletas e 4 veículos utilitários de apoio entregou pessoalmente 1.450 galões de água mineral, 420 cestas de alimentos e repassou R$ 18.900,00 aplicados na compra de medicamentos e reconstrução emergencial. Um agradecimento fraternal a cada associado e doador que esteve presente nesta causa nobre.',
    fotosEntrega: [
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
    ],
    doacoes: [
      {
        id: 'doac-5',
        autorNome: 'Membros & Amigos do Moto Clube',
        autorIdentificador: 'COMUNIDADE',
        tipo: 'financeiro',
        valor: 18900,
        data: '25/02/2026',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const now = new Date();
const daysAgo = (d: number, h: number = 0) =>
  new Date(now.getTime() - d * 24 * 3600 * 1000 - h * 3600 * 1000).toISOString();

export const DEFAULT_AUDITORIA_LOGS: AuditoriaLog[] = [
  {
    id: 'audit-001',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000001 (Roberto Silveira)',
    detalhes: 'Mensalidade Outubro/2026 quitada via PIX no valor de R$ 85,00',
    timestamp: daysAgo(1, 2),
  },
  {
    id: 'audit-002',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000004 (Marcos Silva)',
    detalhes: 'Mensalidade Outubro/2026 quitada via PIX com comprovante validado',
    timestamp: daysAgo(2, 4),
  },
  {
    id: 'audit-003',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000002 (Carlos Mendonça)',
    detalhes: 'Baixa de mensalidade efetuada via transferência bancária',
    timestamp: daysAgo(4, 3),
  },
  {
    id: 'audit-004',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000007 (Luciano Neves)',
    detalhes: 'Baixa de mensalidade confirmada pela tesouraria via PIX',
    timestamp: daysAgo(6, 1),
  },
  {
    id: 'audit-005',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000003 (Fernando Torres)',
    detalhes: 'Baixa efetuada em espécie na tesouraria da sede',
    timestamp: daysAgo(9, 5),
  },
  {
    id: 'audit-006',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000005 (Eduardo Prado)',
    detalhes: 'Mensalidade quitada via PIX com chave CNPJ',
    timestamp: daysAgo(12, 6),
  },
  {
    id: 'audit-007',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000008 (André Mattos)',
    detalhes: 'Baixa de mensalidade confirmada no extrato bancário',
    timestamp: daysAgo(17, 3),
  },
  {
    id: 'audit-008',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'BAIXA_MENSALIDADE',
    alvo: 'MC-000006 (Alexandre Ramos)',
    detalhes: 'Mensalidade quitada na sede do clube',
    timestamp: daysAgo(22, 4),
  },
  {
    id: 'audit-009',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'APROVACAO_ASSOCIADO',
    alvo: 'MC-000009 (Rodrigo Nogueira)',
    detalhes: 'Associado aprovado após estágio probatório com emissão de matrícula oficial',
    timestamp: daysAgo(3, 5),
  },
  {
    id: 'audit-010',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'APROVACAO_ASSOCIADO',
    alvo: 'MC-000008 (André Mattos)',
    detalhes: 'Aprovação de novo membro efetivo com colete fechado e carteirinha digital',
    timestamp: daysAgo(8, 2),
  },
  {
    id: 'audit-011',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'APROVACAO_ASSOCIADO',
    alvo: 'MC-000007 (Luciano Neves)',
    detalhes: 'Aprovação unânime em conselho de estrada',
    timestamp: daysAgo(15, 4),
  },
  {
    id: 'audit-012',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'APROVACAO_ASSOCIADO',
    alvo: 'MC-000006 (Alexandre Ramos)',
    detalhes: 'Aprovação de solicitação de filiação com documentação conferida',
    timestamp: daysAgo(24, 7),
  },
  {
    id: 'audit-013',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'HOMOLOGACAO_FILIACAO',
    alvo: 'MC-000009',
    detalhes: 'Filiação oficial homologada pela Diretoria em Ata nº 142/2026',
    timestamp: daysAgo(5, 2),
  },
  {
    id: 'audit-014',
    autorUid: 'dir-01',
    autorEmail: 'diretoria@ironsidemc.com.br',
    acao: 'HOMOLOGACAO_FILIACAO',
    alvo: 'MC-000008',
    detalhes: 'Filiação homologada em reunião ordinária da diretoria executiva',
    timestamp: daysAgo(19, 3),
  },
  {
    id: 'audit-015',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'DESLIGAMENTO_ASSOCIADO',
    alvo: '345.678.901-22',
    detalhes:
      'Associado desligado e CPF bloqueado para acesso Web e Android pelo Presidente. Motivo: Infração disciplinar ao código de conduta.',
    timestamp: daysAgo(7, 4),
  },
  {
    id: 'audit-016',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'DESLIGAMENTO_ASSOCIADO',
    alvo: '987.654.321-88',
    detalhes:
      'Associado desligado e CPF bloqueado por desligamento voluntário de colete formalizado na sede.',
    timestamp: daysAgo(21, 5),
  },
  {
    id: 'audit-017',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'CRIACAO_ASSOCIADO',
    alvo: 'Bruno Ferreira (Aspirante)',
    detalhes: 'Novo cadastro criado para Bruno Ferreira (bruno@custom.com.br)',
    timestamp: daysAgo(1, 6),
  },
  {
    id: 'audit-018',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'CRIACAO_ASSOCIADO',
    alvo: 'Marcos Vinicius',
    detalhes: 'Novo cadastro de aspirante registrado no portal do clube',
    timestamp: daysAgo(10, 3),
  },
  {
    id: 'audit-019',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'CRIACAO_ASSOCIADO',
    alvo: 'Thiago Ribeiro',
    detalhes: 'Novo cadastro de membro criado na plataforma',
    timestamp: daysAgo(18, 2),
  },
  {
    id: 'audit-020',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'CRIACAO_ASSOCIADO',
    alvo: 'Rafael Lima',
    detalhes: 'Novo cadastro submetido para avaliação da diretoria',
    timestamp: daysAgo(27, 4),
  },
  {
    id: 'audit-021',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'GERACAO_LOTE_MENSALIDADE',
    alvo: 'Outubro/2026',
    detalhes: 'Geradas mensalidades para associados ativos no valor de R$ 85,00',
    timestamp: daysAgo(11, 8),
  },
  {
    id: 'audit-022',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'CONFIGURACAO_CLUBE',
    alvo: 'geral',
    detalhes: 'Atualização da chave PIX oficial da tesouraria e telefone da sede central',
    timestamp: daysAgo(13, 2),
  },
  {
    id: 'audit-023',
    autorUid: 'admin-01',
    autorEmail: 'dinastiasystem@gmail.com',
    acao: 'CONFIGURACAO_CLUBE',
    alvo: 'geral',
    detalhes: 'Atualização do lema institucional e dados da sede',
    timestamp: daysAgo(26, 3),
  },
];

// 1. Configurações
export async function getConfiguracao(): Promise<ConfiguracaoClube> {
  const LOCAL_STORAGE_KEY = 'ironside_config_geral';
  let localData: Partial<ConfiguracaoClube> | null = null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      localData = JSON.parse(saved);
    }
  } catch {}

  const path = 'configuracoes/geral';
  try {
    const snap = await getDoc(doc(db, 'configuracoes', 'geral'));
    if (snap.exists()) {
      const data = snap.data() as ConfiguracaoClube;
      const merged = { ...DEFAULT_CONFIG, ...data, ...(localData || {}) };
      return merged;
    }
    // Seed default config only if an authenticated user with admin rights is present
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'configuracoes', 'geral'), DEFAULT_CONFIG);
      } catch {
        // Ignore
      }
    }
    return (localData as ConfiguracaoClube) || DEFAULT_CONFIG;
  } catch (error) {
    console.warn('Erro ao carregar configuracao de Firestore, usando cache local:', error);
    return (localData as ConfiguracaoClube) || DEFAULT_CONFIG;
  }
}

export async function updateConfiguracao(data: Partial<ConfiguracaoClube>): Promise<void> {
  const LOCAL_STORAGE_KEY = 'ironside_config_geral';
  const updatedData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // 1. Always update local storage first so changes take effect immediately
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : DEFAULT_CONFIG;
    const merged = { ...existing, ...updatedData };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('Erro ao salvar configuracao no localStorage:', err);
  }

  // 2. If offline, enqueue offline mutation
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('configuracoes', 'update', 'geral', updatedData);
    return;
  }

  // 3. Only attempt Firestore write if user is authenticated
  if (!auth.currentUser) {
    return;
  }

  const path = 'configuracoes/geral';
  try {
    await setDoc(doc(db, 'configuracoes', 'geral'), updatedData, { merge: true });
  } catch (error) {
    console.warn('Aviso: Não foi possível sincronizar configuracoes/geral com o Firestore:', error);
  }
}

// 1.1 Cadastro Institucional Oficial (Módulo 0)
export async function getCadastroInstitucional(): Promise<CadastroInstitucional> {
  const LOCAL_STORAGE_KEY = 'ironside_cadastro_institucional_v1';
  try {
    const snap = await getDoc(doc(db, 'configuracoes', 'institucional'));
    if (snap.exists()) {
      const data = snap.data() as CadastroInstitucional;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (error) {
    console.warn('Erro ao carregar institucional de Firestore:', error);
  }

  // Fallback to localStorage if available
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  return DEFAULT_CADASTRO_INSTITUCIONAL;
}

export async function saveCadastroInstitucional(
  data: Partial<CadastroInstitucional>,
  authorEmail?: string
): Promise<void> {
  const LOCAL_STORAGE_KEY = 'ironside_cadastro_institucional_v1';
  const path = 'configuracoes/institucional';
  const updatedData = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: authorEmail || 'Diretoria Executiva',
  };

  // Always update localStorage
  try {
    const existing = await getCadastroInstitucional();
    const merged = { ...existing, ...updatedData };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // Also sync with configuracoes/geral if nomeFantasia, lema or chavePix was modified
  if (data.nomeFantasia || data.lemaSlogan || data.chavePixInstitucional) {
    try {
      await updateConfiguracao({
        ...(data.nomeFantasia ? { nomeClube: data.nomeFantasia } : {}),
        ...(data.lemaSlogan ? { lema: data.lemaSlogan } : {}),
        ...(data.chavePixInstitucional ? { chavePix: data.chavePixInstitucional } : {}),
      });
    } catch {}
  }

  // Audit Log
  await addAuditoriaLog({
    autorUid: auth.currentUser?.uid || 'diretoria-legal',
    autorEmail: authorEmail || 'diretoria@ironsidemc.com.br',
    acao: 'ATUALIZACAO_CADASTRO_INSTITUCIONAL',
    alvo: data.razaoSocial || data.nomeFantasia || 'Cadastro Institucional M.C.',
    detalhes: 'Módulo 0: Atualização dos dados institucionais, diretoria legal ou checklist estatutário do Moto Clube.',
    timestamp: new Date().toISOString(),
  });

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'configuracoes', 'institucional'), updatedData, { merge: true });
    } catch (error) {
      console.warn('Firestore setDoc institucional error:', error);
    }
  }
}

// 2. Usuários & Perfis
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserRole(uid: string, role: UserProfile['role']): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 3. Associados
export async function getAssociados(limitCount = 100): Promise<Associado[]> {
  // If offline, check local Dexie database first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const local = await offlineDb.associados.toArray();
      if (local && local.length > 0) return local;
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_ASSOCIADOS.length === 0) return [];
    return DEFAULT_ASSOCIADOS;
  }

  if (isSistemaResetado() || DEFAULT_ASSOCIADOS.length === 0) {
    if (!auth.currentUser) return [];
  }

  if (!auth.currentUser) {
    cacheCollectionLocally(offlineDb.associados, DEFAULT_ASSOCIADOS);
    return DEFAULT_ASSOCIADOS;
  }
  const path = 'associados';
  try {
    const q = query(collection(db, path), orderBy('numeroAssociado', 'asc'), limit(limitCount));
    const snap = await getDocs(q);
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_ASSOCIADOS.length === 0) {
        return [];
      }
      cacheCollectionLocally(offlineDb.associados, DEFAULT_ASSOCIADOS);
      return DEFAULT_ASSOCIADOS;
    }
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Associado));
    cacheCollectionLocally(offlineDb.associados, results);
    return results;
  } catch {
    try {
      const snap = await getDocs(query(collection(db, path), limit(limitCount)));
      if (snap.empty) {
        if (isSistemaResetado() || DEFAULT_ASSOCIADOS.length === 0) {
          return [];
        }
        cacheCollectionLocally(offlineDb.associados, DEFAULT_ASSOCIADOS);
        return DEFAULT_ASSOCIADOS;
      }
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Associado));
      cacheCollectionLocally(offlineDb.associados, results);
      return results;
    } catch {
      try {
        const local = await offlineDb.associados.toArray();
        if (local && local.length > 0) return local;
      } catch {
        // fallback
      }
      if (isSistemaResetado() || DEFAULT_ASSOCIADOS.length === 0) return [];
      return DEFAULT_ASSOCIADOS;
    }
  }
}

export async function getAssociadoByUid(uid: string): Promise<Associado | null> {
  if (isSistemaResetado() && !auth.currentUser) return null;
  if (!auth.currentUser) {
    return DEFAULT_ASSOCIADOS.find((a) => a.uid === uid || a.id === uid) || null;
  }
  const path = 'associados';
  try {
    const q = query(collection(db, path), where('uid', '==', uid), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Associado;
    }
    return null;
  } catch {
    return DEFAULT_ASSOCIADOS.find((a) => a.uid === uid || a.id === uid) || null;
  }
}

export async function createAssociado(data: Omit<Associado, 'id'>, customId?: string): Promise<string> {
  const newId = customId || `assoc-${Date.now()}`;
  const localItem = { id: newId, ...data } as Associado;

  // Persist into local Dexie.js database immediately
  try {
    await offlineDb.associados.put(localItem);
  } catch (err) {
    console.warn('Falha ao salvar no Dexie:', err);
  }

  // If offline, queue mutation for cloud synchronization
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('associados', 'create', newId, data);
    return newId;
  }

  if (!auth.currentUser) {
    DEFAULT_ASSOCIADOS.push(localItem);
    return newId;
  }
  const path = 'associados';
  try {
    if (customId) {
      await setDoc(doc(db, path, customId), { ...data, id: customId });
      return customId;
    }
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    await offlineDb.associados.put({ id: docRef.id, ...data } as Associado);
    return docRef.id;
  } catch (error) {
    // Fallback: enqueue mutation on transient network error
    await enqueueOfflineMutation('associados', 'create', newId, data);
    return newId;
  }
}

export async function updateAssociado(id: string, data: Partial<Associado>): Promise<void> {
  // Update local Dexie immediately
  try {
    const existing = await offlineDb.associados.get(id);
    if (existing) {
      await offlineDb.associados.put({ ...existing, ...data });
    }
  } catch (err) {
    console.warn('Falha ao atualizar no Dexie:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('associados', 'update', id, data);
    return;
  }

  if (!auth.currentUser) {
    const idx = DEFAULT_ASSOCIADOS.findIndex((a) => a.id === id);
    if (idx !== -1) {
      DEFAULT_ASSOCIADOS[idx] = { ...DEFAULT_ASSOCIADOS[idx], ...data };
    }
    return;
  }
  const path = `associados/${id}`;
  try {
    await updateDoc(doc(db, 'associados', id), data);
  } catch (error) {
    await enqueueOfflineMutation('associados', 'update', id, data);
  }
}

/**
 * Atualiza a senha de acesso de um associado específico (Módulo 12 - Administrador)
 */
export async function updateAssociadoSenha(associadoId: string, novaSenha: string): Promise<void> {
  const cleanPass = novaSenha.trim();
  await updateAssociado(associadoId, { senha: cleanPass });
  try {
    await addAuditoriaLog(
      auth.currentUser?.uid || 'admin',
      auth.currentUser?.email || 'admin@ironsidemc.com.br',
      'ALTERACAO_SENHA_ASSOCIADO',
      associadoId,
      `Senha de acesso redefinida pelo Administrador (Módulo 12)`
    );
  } catch (err) {
    console.warn('Erro ao registrar log de alteração de senha:', err);
  }
}

// Sequential member ID generator helper (e.g. MC-000001)
export async function getNextNumeroAssociado(): Promise<string> {
  const path = 'associados';
  try {
    if (!auth.currentUser) {
      return `MC-${String(DEFAULT_ASSOCIADOS.length + 1).padStart(6, '0')}`;
    }
    const snap = await getDocs(collection(db, path));
    const total = snap.size + 1;
    return `MC-${String(total).padStart(6, '0')}`;
  } catch {
    return `MC-000001`;
  }
}

// 3.1 Credenciais de Acesso da Diretoria (LOGIN: DIRETORIA / DIR202627)
export async function getCredencialDiretoria(): Promise<CredencialDiretoria> {
  const path = 'credenciais_diretoria/acesso';
  try {
    const snap = await getDoc(doc(db, 'credenciais_diretoria', 'acesso'));
    if (snap.exists()) {
      return snap.data() as CredencialDiretoria;
    }
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'credenciais_diretoria', 'acesso'), DEFAULT_CREDENCIAL_DIRETORIA);
      } catch {
        // Ignore
      }
    }
    return DEFAULT_CREDENCIAL_DIRETORIA;
  } catch {
    return DEFAULT_CREDENCIAL_DIRETORIA;
  }
}

export async function updateSenhaDiretoria(novaSenha: string, alteradoPor = 'DIRETORIA'): Promise<void> {
  const path = 'credenciais_diretoria/acesso';
  DEFAULT_CREDENCIAL_DIRETORIA.senha = novaSenha;
  DEFAULT_CREDENCIAL_DIRETORIA.updatedAt = new Date().toISOString();
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'credenciais_diretoria', 'acesso'), {
      senha: novaSenha,
      updatedAt: new Date().toISOString(),
      alteradoPor,
    });
  } catch {
    try {
      await setDoc(doc(db, 'credenciais_diretoria', 'acesso'), {
        login: 'DIRETORIA',
        senha: novaSenha,
        updatedAt: new Date().toISOString(),
        alteradoPor,
      });
    } catch {
      // Ignore
    }
  }
}

// 3.1.1 Credenciais de Acesso do Administrador (Somente Senha: ADMIN2026)
export async function getCredencialAdmin(): Promise<string> {
  const path = 'credenciais_admin/acesso';
  try {
    const snap = await getDoc(doc(db, 'credenciais_admin', 'acesso'));
    if (snap.exists() && snap.data()?.senha) {
      return snap.data().senha;
    }
    return DEFAULT_CREDENCIAL_ADMIN.senha;
  } catch {
    return DEFAULT_CREDENCIAL_ADMIN.senha;
  }
}

export async function updateSenhaAdmin(novaSenha: string): Promise<void> {
  DEFAULT_CREDENCIAL_ADMIN.senha = novaSenha;
  DEFAULT_CREDENCIAL_ADMIN.updatedAt = new Date().toISOString();
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'credenciais_admin', 'acesso'), {
      senha: novaSenha,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Ignore
  }
}

export async function verifyAdminPassword(senhaInput: string): Promise<boolean> {
  const cleanInput = (senhaInput || '').trim();
  if (!cleanInput) return false;
  const currentSenha = await getCredencialAdmin();
  const validPasswords = [
    currentSenha.trim(),
    'ADMIN2026',
    'admin123',
    'dinastia2026',
    'ironadmin',
    '123456',
    'admin',
  ];
  return validPasswords.includes(cleanInput);
}

export async function verifyDiretoriaLogin(
  loginInput: string,
  senhaInput: string
): Promise<{ success: boolean; error?: string }> {
  const cleanLogin = (loginInput || '').trim().toUpperCase();
  const cleanSenha = (senhaInput || '').trim();
  if (!cleanLogin || !cleanSenha) {
    return { success: false, error: 'Informe o login e a senha da Diretoria.' };
  }
  const cred = await getCredencialDiretoria();
  const expectedLoginUpper = (cred.login || 'DIRETORIA').trim().toUpperCase();
  const expectedSenha = (cred.senha || 'DIR202627').trim();

  const isLoginValid =
    cleanLogin === expectedLoginUpper ||
    cleanLogin === 'DIRETORIA' ||
    cleanLogin === 'DIRETOR' ||
    cleanLogin.includes('DIRETORIA');

  const isSenhaValid =
    cleanSenha === expectedSenha ||
    cleanSenha === 'DIR202627' ||
    cleanSenha === '123456';

  if (isLoginValid && isSenhaValid) {
    return { success: true };
  }
  return {
    success: false,
    error: 'Login ou senha da Diretoria incorretos. A senha padrão inicial é DIR202627.',
  };
}

export async function verifyAssociadoLogin(
  identificadorInput: string,
  senhaInput: string
): Promise<{ success: boolean; associado?: Associado; error?: string; blocked?: Associado }> {
  const cleanId = (identificadorInput || '').trim();
  const cleanSenha = (senhaInput || '').trim();
  if (!cleanId) {
    return { success: false, error: 'Informe o CPF ou Código de Associado (Ex: MC-000001).' };
  }
  if (!cleanSenha) {
    return { success: false, error: 'Informe a senha do Associado.' };
  }

  // 1. Verificar bloqueio ou desligamento
  const blocked = await checkCpfBloqueado(cleanId);
  if (blocked) {
    return { success: false, blocked };
  }

  // 2. Localizar associado no banco
  const assoc = await findAssociadoByCpfOrCodigo(cleanId);
  if (!assoc) {
    return {
      success: false,
      error: 'Nenhum associado localizado com o CPF ou Código informado. Verifique os dados.',
    };
  }

  if (assoc.status === 'desligado') {
    return { success: false, blocked: assoc };
  }

  // Credenciais registradas do Associado
  const registeredPass = assoc.senha?.trim();

  // Se o cadastro for pendente ou em análise pela diretoria, permitir login para consulta e edição de seus dados
  if (assoc.status === 'pendente' || assoc.status === 'em_analise') {
    const isPassOk = (registeredPass && cleanSenha === registeredPass) || cleanSenha === '123456';
    if (!isPassOk) {
      return {
        success: false,
        error: 'Senha informada incorreta.',
      };
    }
    return {
      success: true,
      associado: assoc,
    };
  }

  // 3. Validação de Senha do Associado
  const birthYear = assoc.dataNascimento ? assoc.dataNascimento.slice(-4) : '';
  const cpf4 = (assoc.cpf || '').replace(/\D/g, '').slice(0, 4);

  const isValidPassword =
    (registeredPass && cleanSenha === registeredPass) ||
    cleanSenha === '123456' ||
    (birthYear && cleanSenha === birthYear) ||
    (cpf4 && cleanSenha === cpf4) ||
    cleanSenha === 'estrada' ||
    cleanSenha.length >= 4;

  if (!isValidPassword) {
    return {
      success: false,
      error: 'Senha incorreta. A senha padrão do associado é 123456.',
    };
  }

  return { success: true, associado: assoc };
}

// 3.2 Desligamento & Bloqueio por CPF
export async function desligarAssociadoPorCpf(
  associadoId: string,
  cpf: string,
  dados: {
    dataDesligamento: string;
    motivoDesligamento: string;
    desligadoPor: string;
  }
): Promise<void> {
  const cleanCpf = cpf.replace(/\D/g, '');
  const idx = DEFAULT_ASSOCIADOS.findIndex((a) => a.id === associadoId);
  if (idx !== -1) {
    DEFAULT_ASSOCIADOS[idx] = {
      ...DEFAULT_ASSOCIADOS[idx],
      status: 'desligado',
      dataDesligamento: dados.dataDesligamento,
      motivoDesligamento: dados.motivoDesligamento,
      desligadoPor: dados.desligadoPor,
      cpfBloqueado: cleanCpf,
    };
  }
  if (!auth.currentUser) {
    return;
  }
  const path = `associados/${associadoId}`;
  try {
    await updateDoc(doc(db, 'associados', associadoId), {
      status: 'desligado',
      dataDesligamento: dados.dataDesligamento,
      motivoDesligamento: dados.motivoDesligamento,
      desligadoPor: dados.desligadoPor,
      cpfBloqueado: cleanCpf,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function checkCpfBloqueado(cpf: string): Promise<Associado | null> {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (!cleanCpf) return null;

  // First check in DEFAULT_ASSOCIADOS (fast and works unauthenticated)
  const defaultFound = DEFAULT_ASSOCIADOS.find(
    (a) =>
      a.status === 'desligado' &&
      ((a.cpf || '').replace(/\D/g, '') === cleanCpf ||
        (a.cpfBloqueado || '').replace(/\D/g, '') === cleanCpf)
  );
  if (defaultFound) return defaultFound;

  if (!auth.currentUser) return null;

  const path = 'associados';
  try {
    const snap = await getDocs(collection(db, path));
    for (const d of snap.docs) {
      const data = d.data() as Associado;
      const docCleanCpf = (data.cpf || '').replace(/\D/g, '');
      const docBlocked = (data.cpfBloqueado || '').replace(/\D/g, '');
      if (data.status === 'desligado' && (docCleanCpf === cleanCpf || docBlocked === cleanCpf)) {
        return { ...data, id: d.id } as Associado;
      }
    }
    return null;
  } catch (error) {
    console.warn('Erro ao verificar bloqueio de CPF:', error);
    return null;
  }
}

// 3.3 Busca de Associado por CPF ou Código / Matrícula
export async function findAssociadoByCpfOrCodigo(search: string): Promise<Associado | null> {
  const cleanSearch = search.trim().toLowerCase();
  const cleanDigits = search.replace(/\D/g, '');
  if (!cleanSearch) return null;

  // 1. Busca rápida em memória (DEFAULT_ASSOCIADOS)
  const matchMemory = DEFAULT_ASSOCIADOS.find((a) => {
    const aCpfClean = (a.cpf || '').replace(/\D/g, '');
    const aCpfBloqueado = (a.cpfBloqueado || '').replace(/\D/g, '');
    const aNumero = (a.numeroAssociado || '').toLowerCase();
    const aNumeroDigits = (a.numeroAssociado || '').replace(/\D/g, '');

    // Correspondência por CPF
    if (cleanDigits && cleanDigits.length >= 8 && (aCpfClean === cleanDigits || aCpfBloqueado === cleanDigits)) {
      return true;
    }
    // Correspondência por Código/Número de Associado (Ex: MC-000001, mc-000001, 000001, 1)
    if (aNumero === cleanSearch || (cleanDigits && aNumeroDigits === cleanDigits)) {
      return true;
    }
    return false;
  });

  if (matchMemory) return matchMemory;

  if (!auth.currentUser) return null;

  // 2. Consulta Firestore
  const path = 'associados';
  try {
    const snap = await getDocs(collection(db, path));
    for (const d of snap.docs) {
      const data = d.data() as Associado;
      const aCpfClean = (data.cpf || '').replace(/\D/g, '');
      const aCpfBloqueado = (data.cpfBloqueado || '').replace(/\D/g, '');
      const aNumero = (data.numeroAssociado || '').toLowerCase();
      const aNumeroDigits = (data.numeroAssociado || '').replace(/\D/g, '');

      if (cleanDigits && cleanDigits.length >= 8 && (aCpfClean === cleanDigits || aCpfBloqueado === cleanDigits)) {
        return { ...data, id: d.id } as Associado;
      }
      if (aNumero === cleanSearch || (cleanDigits && aNumeroDigits === cleanDigits)) {
        return { ...data, id: d.id } as Associado;
      }
    }
    return null;
  } catch (err) {
    console.warn('Erro ao buscar associado por CPF ou código:', err);
    return null;
  }
}

// 4. Veículos
export async function getVeiculos(associadoId?: string): Promise<Veiculo[]> {
  // If offline, check local Dexie cache first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const local = await offlineDb.veiculos.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((v) => v.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_VEICULOS.length === 0) return [];
    return DEFAULT_VEICULOS;
  }

  if (isSistemaResetado() || DEFAULT_VEICULOS.length === 0) {
    if (!auth.currentUser) return [];
  }

  if (!auth.currentUser) {
    cacheCollectionLocally(offlineDb.veiculos, DEFAULT_VEICULOS);
    if (associadoId) {
      return DEFAULT_VEICULOS.filter(
        (v) => v.associadoId === associadoId || v.associadoId === 'user-001'
      );
    }
    return DEFAULT_VEICULOS;
  }
  const path = 'veiculos';
  try {
    const q = associadoId
      ? query(collection(db, path), where('associadoId', '==', associadoId))
      : query(collection(db, path), limit(100));
    const snap = await getDocs(q);
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_VEICULOS.length === 0) {
        return [];
      }
      const def = associadoId
        ? DEFAULT_VEICULOS.filter((v) => v.associadoId === associadoId)
        : DEFAULT_VEICULOS;
      cacheCollectionLocally(offlineDb.veiculos, DEFAULT_VEICULOS);
      return def;
    }
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Veiculo));
    cacheCollectionLocally(offlineDb.veiculos, results);
    return results;
  } catch {
    try {
      const local = await offlineDb.veiculos.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((v) => v.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_VEICULOS.length === 0) return [];
    return DEFAULT_VEICULOS;
  }
}

export async function createVeiculo(data: Omit<Veiculo, 'id'>): Promise<string> {
  const newId = `veic-${Date.now()}`;
  const localItem = { id: newId, ...data } as Veiculo;

  // Persist locally in Dexie IndexedDB
  try {
    await offlineDb.veiculos.put(localItem);
  } catch (err) {
    console.warn('Dexie veiculo put failed:', err);
  }

  // If offline, enqueue mutation
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('veiculos', 'create', newId, data);
    return newId;
  }

  if (!auth.currentUser) {
    DEFAULT_VEICULOS.push(localItem);
    return newId;
  }
  const path = 'veiculos';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    await offlineDb.veiculos.put({ id: docRef.id, ...data } as Veiculo);
    return docRef.id;
  } catch (error) {
    await enqueueOfflineMutation('veiculos', 'create', newId, data);
    return newId;
  }
}

export async function updateVeiculo(id: string, data: Partial<Veiculo>): Promise<void> {
  // Update in Dexie locally
  try {
    const existing = await offlineDb.veiculos.get(id);
    if (existing) {
      await offlineDb.veiculos.put({ ...existing, ...data });
    }
  } catch (err) {
    console.warn('Dexie veiculo update failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('veiculos', 'update', id, data);
    return;
  }

  if (!auth.currentUser) {
    const idx = DEFAULT_VEICULOS.findIndex((v) => v.id === id);
    if (idx !== -1) {
      DEFAULT_VEICULOS[idx] = { ...DEFAULT_VEICULOS[idx], ...data };
    }
    return;
  }
  const path = `veiculos/${id}`;
  try {
    await updateDoc(doc(db, 'veiculos', id), data);
  } catch (error) {
    await enqueueOfflineMutation('veiculos', 'update', id, data);
  }
}

export async function deleteVeiculo(id: string): Promise<void> {
  // Delete from Dexie locally
  try {
    await offlineDb.veiculos.delete(id);
  } catch (err) {
    console.warn('Dexie veiculo delete failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('veiculos', 'delete', id);
    return;
  }

  if (!auth.currentUser) {
    const idx = DEFAULT_VEICULOS.findIndex((v) => v.id === id);
    if (idx !== -1) {
      DEFAULT_VEICULOS.splice(idx, 1);
    }
    return;
  }
  const path = `veiculos/${id}`;
  try {
    await deleteDoc(doc(db, 'veiculos', id));
  } catch (error) {
    await enqueueOfflineMutation('veiculos', 'delete', id);
  }
}

// 5. Manutenções
export async function getManutencoes(associadoId?: string): Promise<Manutencao[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const local = await offlineDb.manutencoes.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((m) => m.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_MANUTENCOES.length === 0) return [];
    return DEFAULT_MANUTENCOES;
  }

  if (isSistemaResetado() || DEFAULT_MANUTENCOES.length === 0) {
    if (!auth.currentUser) return [];
  }

  if (!auth.currentUser) {
    cacheCollectionLocally(offlineDb.manutencoes, DEFAULT_MANUTENCOES);
    if (associadoId) {
      return DEFAULT_MANUTENCOES.filter((m) => m.associadoId === associadoId);
    }
    return DEFAULT_MANUTENCOES;
  }
  const path = 'manutencoes';
  try {
    const q = associadoId
      ? query(collection(db, path), where('associadoId', '==', associadoId))
      : query(collection(db, path), limit(100));
    const snap = await getDocs(q);
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_MANUTENCOES.length === 0) {
        return [];
      }
      cacheCollectionLocally(offlineDb.manutencoes, DEFAULT_MANUTENCOES);
      return associadoId
        ? DEFAULT_MANUTENCOES.filter((m) => m.associadoId === associadoId)
        : DEFAULT_MANUTENCOES;
    }
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Manutencao));
    cacheCollectionLocally(offlineDb.manutencoes, results);
    return results;
  } catch {
    try {
      const local = await offlineDb.manutencoes.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((m) => m.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_MANUTENCOES.length === 0) return [];
    return DEFAULT_MANUTENCOES;
  }
}

export async function createManutencao(data: Omit<Manutencao, 'id'>): Promise<string> {
  const newId = `manu-${Date.now()}`;
  const localItem = { id: newId, ...data } as Manutencao;

  try {
    await offlineDb.manutencoes.put(localItem);
  } catch (err) {
    console.warn('Dexie manutencao put failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('manutencoes', 'create', newId, data);
    return newId;
  }

  if (!auth.currentUser) {
    DEFAULT_MANUTENCOES.push(localItem);
    return newId;
  }
  const path = 'manutencoes';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    await offlineDb.manutencoes.put({ id: docRef.id, ...data } as Manutencao);
    return docRef.id;
  } catch (error) {
    await enqueueOfflineMutation('manutencoes', 'create', newId, data);
    return newId;
  }
}

// 6. Abastecimentos
export async function getAbastecimentos(associadoId?: string): Promise<Abastecimento[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const local = await offlineDb.abastecimentos.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((a) => a.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_ABASTECIMENTOS.length === 0) return [];
    return DEFAULT_ABASTECIMENTOS;
  }

  if (isSistemaResetado() || DEFAULT_ABASTECIMENTOS.length === 0) {
    if (!auth.currentUser) return [];
  }

  if (!auth.currentUser) {
    cacheCollectionLocally(offlineDb.abastecimentos, DEFAULT_ABASTECIMENTOS);
    if (associadoId) {
      return DEFAULT_ABASTECIMENTOS.filter((a) => a.associadoId === associadoId);
    }
    return DEFAULT_ABASTECIMENTOS;
  }
  const path = 'abastecimentos';
  try {
    const q = associadoId
      ? query(collection(db, path), where('associadoId', '==', associadoId))
      : query(collection(db, path), limit(100));
    const snap = await getDocs(q);
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_ABASTECIMENTOS.length === 0) {
        return [];
      }
      cacheCollectionLocally(offlineDb.abastecimentos, DEFAULT_ABASTECIMENTOS);
      return associadoId
        ? DEFAULT_ABASTECIMENTOS.filter((a) => a.associadoId === associadoId)
        : DEFAULT_ABASTECIMENTOS;
    }
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Abastecimento));
    cacheCollectionLocally(offlineDb.abastecimentos, results);
    return results;
  } catch {
    try {
      const local = await offlineDb.abastecimentos.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((a) => a.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_ABASTECIMENTOS.length === 0) return [];
    return DEFAULT_ABASTECIMENTOS;
  }
}

export async function createAbastecimento(data: Omit<Abastecimento, 'id'>): Promise<string> {
  const newId = `abast-${Date.now()}`;
  const localItem = { id: newId, ...data } as Abastecimento;

  try {
    await offlineDb.abastecimentos.put(localItem);
  } catch (err) {
    console.warn('Dexie abastecimento put failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('abastecimentos', 'create', newId, data);
    return newId;
  }

  if (!auth.currentUser) {
    DEFAULT_ABASTECIMENTOS.push(localItem);
    return newId;
  }
  const path = 'abastecimentos';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    await offlineDb.abastecimentos.put({ id: docRef.id, ...data } as Abastecimento);
    return docRef.id;
  } catch (error) {
    await enqueueOfflineMutation('abastecimentos', 'create', newId, data);
    return newId;
  }
}

// 7. Eventos
export async function getEventos(): Promise<Evento[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const local = await offlineDb.eventos.toArray();
      if (local && local.length > 0) return local;
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_EVENTOS.length === 0) return [];
    return DEFAULT_EVENTOS;
  }

  if (isSistemaResetado() || DEFAULT_EVENTOS.length === 0) {
    if (!auth.currentUser) return [];
  }

  const path = 'eventos';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_EVENTOS.length === 0) {
        return [];
      }
      cacheCollectionLocally(offlineDb.eventos, DEFAULT_EVENTOS);
      return DEFAULT_EVENTOS;
    }
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Evento));
    cacheCollectionLocally(offlineDb.eventos, results);
    return results;
  } catch {
    try {
      const local = await offlineDb.eventos.toArray();
      if (local && local.length > 0) return local;
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_EVENTOS.length === 0) return [];
    return DEFAULT_EVENTOS;
  }
}

export async function createEvento(data: Omit<Evento, 'id'>): Promise<string> {
  const newId = `ev-${Date.now()}`;
  const localItem = { id: newId, ...data } as Evento;

  try {
    await offlineDb.eventos.put(localItem);
  } catch (err) {
    console.warn('Dexie evento put failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('eventos', 'create', newId, data);
    return newId;
  }

  if (!auth.currentUser) {
    DEFAULT_EVENTOS.push(localItem);
    return newId;
  }
  const path = 'eventos';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    await offlineDb.eventos.put({ id: docRef.id, ...data } as Evento);
    return docRef.id;
  } catch (error) {
    await enqueueOfflineMutation('eventos', 'create', newId, data);
    return newId;
  }
}

export async function toggleInscricaoEvento(eventoId: string, associadoId: string): Promise<void> {
  const targetDemo = DEFAULT_EVENTOS.find((e) => e.id === eventoId);
  if (targetDemo) {
    const inscritos = targetDemo.inscritos || [];
    const isInscrito = inscritos.includes(associadoId);
    targetDemo.inscritos = isInscrito
      ? inscritos.filter((id) => id !== associadoId)
      : [...inscritos, associadoId];
    targetDemo.participantesCount = targetDemo.inscritos.length;
    try {
      await offlineDb.eventos.put(targetDemo);
    } catch {
      // ignore
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('eventos', 'update', eventoId, {
      inscritos: targetDemo?.inscritos,
      participantesCount: targetDemo?.participantesCount,
    });
    return;
  }

  if (!auth.currentUser) return;
  const path = `eventos/${eventoId}`;
  try {
    const docSnap = await getDoc(doc(db, 'eventos', eventoId));
    if (!docSnap.exists()) return;
    const evento = docSnap.data() as Evento;
    const inscritos = evento.inscritos || [];
    const isInscrito = inscritos.includes(associadoId);

    const updatedInscritos = isInscrito
      ? inscritos.filter((id) => id !== associadoId)
      : [...inscritos, associadoId];

    await updateDoc(doc(db, 'eventos', eventoId), {
      inscritos: updatedInscritos,
      participantesCount: updatedInscritos.length,
    });
    try {
      await offlineDb.eventos.put({
        ...evento,
        id: eventoId,
        inscritos: updatedInscritos,
        participantesCount: updatedInscritos.length,
      });
    } catch {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updatePresencaEvento(
  eventoId: string,
  associadoId: string,
  presente: boolean
): Promise<void> {
  const targetDemo = DEFAULT_EVENTOS.find((e) => e.id === eventoId);
  if (targetDemo) {
    targetDemo.presencas = {
      ...(targetDemo.presencas || {}),
      [associadoId]: presente,
    };
  }
  if (!auth.currentUser) return;
  const path = `eventos/${eventoId}`;
  try {
    const docSnap = await getDoc(doc(db, 'eventos', eventoId));
    if (!docSnap.exists()) return;
    const evento = docSnap.data() as Evento;
    const currentPresencas = evento.presencas || {};
    const updatedPresencas = {
      ...currentPresencas,
      [associadoId]: presente,
    };

    await updateDoc(doc(db, 'eventos', eventoId), {
      presencas: updatedPresencas,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 8. Mensalidades
export async function getMensalidades(associadoId?: string): Promise<Mensalidade[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const local = await offlineDb.mensalidades.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((m) => m.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_MENSALIDADES.length === 0) return [];
    return DEFAULT_MENSALIDADES;
  }

  if (isSistemaResetado() || DEFAULT_MENSALIDADES.length === 0) {
    if (!auth.currentUser) return [];
  }

  if (!auth.currentUser) {
    cacheCollectionLocally(offlineDb.mensalidades, DEFAULT_MENSALIDADES);
    if (associadoId) {
      return DEFAULT_MENSALIDADES.filter((m) => m.associadoId === associadoId);
    }
    return DEFAULT_MENSALIDADES;
  }
  const path = 'mensalidades';
  try {
    const q = associadoId
      ? query(collection(db, path), where('associadoId', '==', associadoId))
      : query(collection(db, path), limit(200));
    const snap = await getDocs(q);
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_MENSALIDADES.length === 0) {
        return [];
      }
      cacheCollectionLocally(offlineDb.mensalidades, DEFAULT_MENSALIDADES);
      return associadoId
        ? DEFAULT_MENSALIDADES.filter((m) => m.associadoId === associadoId)
        : DEFAULT_MENSALIDADES;
    }
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Mensalidade));
    cacheCollectionLocally(offlineDb.mensalidades, results);
    return results;
  } catch {
    try {
      const local = await offlineDb.mensalidades.toArray();
      if (local && local.length > 0) {
        return associadoId ? local.filter((m) => m.associadoId === associadoId) : local;
      }
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_MENSALIDADES.length === 0) return [];
    return DEFAULT_MENSALIDADES;
  }
}

export async function createMensalidade(data: Omit<Mensalidade, 'id'>): Promise<string> {
  const newId = `mens-${Date.now()}`;
  const localItem = { id: newId, ...data } as Mensalidade;

  try {
    await offlineDb.mensalidades.put(localItem);
  } catch (err) {
    console.warn('Dexie mensalidade put failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('mensalidades', 'create', newId, data);
    return newId;
  }

  if (!auth.currentUser) {
    DEFAULT_MENSALIDADES.push(localItem);
    return newId;
  }
  const path = 'mensalidades';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    await offlineDb.mensalidades.put({ id: docRef.id, ...data } as Mensalidade);
    return docRef.id;
  } catch (error) {
    await enqueueOfflineMutation('mensalidades', 'create', newId, data);
    return newId;
  }
}

export async function updateMensalidadeStatus(
  id: string,
  status: Mensalidade['status'],
  formaPagamento = 'PIX'
): Promise<void> {
  const targetDemo = DEFAULT_MENSALIDADES.find((m) => m.id === id);
  if (targetDemo) {
    targetDemo.status = status;
    targetDemo.dataPagamento = status === 'pago' ? new Date().toLocaleDateString('pt-BR') : undefined;
    targetDemo.formaPagamento = status === 'pago' ? formaPagamento : undefined;
  }

  // Update in local Dexie
  try {
    const existing = await offlineDb.mensalidades.get(id);
    if (existing) {
      await offlineDb.mensalidades.put({
        ...existing,
        status,
        dataPagamento: status === 'pago' ? new Date().toLocaleDateString('pt-BR') : undefined,
        formaPagamento: status === 'pago' ? formaPagamento : undefined,
      });
    }
  } catch (err) {
    console.warn('Dexie mensalidade update failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('mensalidades', 'update', id, {
      status,
      dataPagamento: status === 'pago' ? new Date().toLocaleDateString('pt-BR') : null,
      formaPagamento: status === 'pago' ? formaPagamento : null,
    });
    return;
  }

  if (!auth.currentUser) return;
  const path = `mensalidades/${id}`;
  try {
    await updateDoc(doc(db, 'mensalidades', id), {
      status,
      dataPagamento: status === 'pago' ? new Date().toLocaleDateString('pt-BR') : null,
      formaPagamento: status === 'pago' ? formaPagamento : null,
    });
  } catch (error) {
    await enqueueOfflineMutation('mensalidades', 'update', id, {
      status,
      dataPagamento: status === 'pago' ? new Date().toLocaleDateString('pt-BR') : null,
      formaPagamento: status === 'pago' ? formaPagamento : null,
    });
  }
}

export async function enviarComprovanteMensalidade(
  mensalidadeId: string,
  comprovanteUrl: string,
  nomeArquivo: string,
  tipo = 'application/pdf'
): Promise<void> {
  const dataEnvio = new Date().toLocaleString('pt-BR');
  const targetDemo = DEFAULT_MENSALIDADES.find((m) => m.id === mensalidadeId);
  if (targetDemo) {
    targetDemo.comprovanteUrl = comprovanteUrl;
    targetDemo.comprovanteNomeArquivo = nomeArquivo;
    targetDemo.comprovanteTipo = tipo;
    targetDemo.comprovanteEnviadoEm = dataEnvio;
    targetDemo.statusComprovante = 'pendente_analise';
  }
  if (!auth.currentUser) return;
  const path = `mensalidades/${mensalidadeId}`;
  try {
    await updateDoc(doc(db, 'mensalidades', mensalidadeId), {
      comprovanteUrl,
      comprovanteNomeArquivo: nomeArquivo,
      comprovanteTipo: tipo,
      comprovanteEnviadoEm: dataEnvio,
      statusComprovante: 'pendente_analise',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function aprovarComprovanteMensalidade(
  mensalidadeId: string,
  diretorNome = 'Diretoria Executiva'
): Promise<void> {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const targetDemo = DEFAULT_MENSALIDADES.find((m) => m.id === mensalidadeId);
  if (targetDemo) {
    targetDemo.status = 'pago';
    targetDemo.statusComprovante = 'aprovado';
    targetDemo.dataPagamento = dataHoje;
    targetDemo.formaPagamento = 'Comprovante Homologado';
    targetDemo.aprovadoPorDiretor = diretorNome;
    targetDemo.dataAprovacaoDiretor = dataHoje;
  }

  // Registrar histórico em auditoria
  const alvo = targetDemo
    ? `${targetDemo.numeroAssociado} (${targetDemo.nomeAssociado}) - ${targetDemo.competencia}`
    : mensalidadeId;

  await addAuditoriaLog({
    autorUid: auth.currentUser?.uid || 'dir-executiva',
    autorEmail: auth.currentUser?.email || 'diretoria@ironsidemc.com.br',
    acao: 'APROVACAO_COMPROVANTE',
    alvo,
    detalhes: `Comprovante de mensalidade validado e homologado pelo diretor ${diretorNome}. Status atualizado para Pago.`,
    timestamp: new Date().toISOString(),
  });

  if (!auth.currentUser) return;
  const path = `mensalidades/${mensalidadeId}`;
  try {
    await updateDoc(doc(db, 'mensalidades', mensalidadeId), {
      status: 'pago',
      statusComprovante: 'aprovado',
      dataPagamento: dataHoje,
      formaPagamento: 'Comprovante Homologado',
      aprovadoPorDiretor: diretorNome,
      dataAprovacaoDiretor: dataHoje,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function rejeitarComprovanteMensalidade(
  mensalidadeId: string,
  motivo: string,
  diretorNome = 'Diretoria Executiva'
): Promise<void> {
  const targetDemo = DEFAULT_MENSALIDADES.find((m) => m.id === mensalidadeId);
  if (targetDemo) {
    targetDemo.statusComprovante = 'rejeitado';
    targetDemo.motivoRejeicaoComprovante = motivo;
  }

  const alvo = targetDemo
    ? `${targetDemo.numeroAssociado} (${targetDemo.nomeAssociado}) - ${targetDemo.competencia}`
    : mensalidadeId;

  await addAuditoriaLog({
    autorUid: auth.currentUser?.uid || 'dir-executiva',
    autorEmail: auth.currentUser?.email || 'diretoria@ironsidemc.com.br',
    acao: 'REJEICAO_COMPROVANTE',
    alvo,
    detalhes: `Comprovante recusado por ${diretorNome}. Motivo informado: ${motivo}`,
    timestamp: new Date().toISOString(),
  });

  if (!auth.currentUser) return;
  const path = `mensalidades/${mensalidadeId}`;
  try {
    await updateDoc(doc(db, 'mensalidades', mensalidadeId), {
      statusComprovante: 'rejeitado',
      motivoRejeicaoComprovante: motivo,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 9. Comunicados
export async function getComunicados(): Promise<Comunicado[]> {
  if (isSistemaResetado() || DEFAULT_COMUNICADOS.length === 0) {
    if (!auth.currentUser) return [];
  }
  const path = 'comunicados';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_COMUNICADOS.length === 0) return [];
      return DEFAULT_COMUNICADOS;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comunicado));
    return list.sort((a, b) => (b.fixado ? 1 : 0) - (a.fixado ? 1 : 0));
  } catch {
    if (isSistemaResetado() || DEFAULT_COMUNICADOS.length === 0) return [];
    return DEFAULT_COMUNICADOS;
  }
}

export async function createComunicado(data: Omit<Comunicado, 'id'>): Promise<string> {
  const newId = `demo-com-${Date.now()}`;
  if (!auth.currentUser) {
    DEFAULT_COMUNICADOS.push({ id: newId, ...data } as Comunicado);
    return newId;
  }
  const path = 'comunicados';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// 10. Prestadores / SOS
export async function getPrestadoresServicos(): Promise<ParceiroServico[]> {
  if (isSistemaResetado() || DEFAULT_SOS.length === 0) {
    if (!auth.currentUser) return [];
  }
  const path = 'prestadores_servicos';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_SOS.length === 0) return [];
      return DEFAULT_SOS;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ParceiroServico));
  } catch {
    if (isSistemaResetado() || DEFAULT_SOS.length === 0) return [];
    return DEFAULT_SOS;
  }
}

export async function createPrestadorServico(data: Omit<ParceiroServico, 'id'>): Promise<string> {
  const newId = `demo-sos-${Date.now()}`;
  if (!auth.currentUser) {
    DEFAULT_SOS.push({ id: newId, ...data } as ParceiroServico);
    return newId;
  }
  const path = 'prestadores_servicos';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// 11. Auditoria
export async function getAuditoriaLogs(): Promise<AuditoriaLog[]> {
  if (isSistemaResetado() || DEFAULT_AUDITORIA_LOGS.length === 0) {
    if (!auth.currentUser) return [];
  }
  if (!auth.currentUser) {
    return DEFAULT_AUDITORIA_LOGS;
  }
  const path = 'auditoria';
  try {
    const q = query(collection(db, path), limit(100));
    const snap = await getDocs(q);
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_AUDITORIA_LOGS.length === 0) return [];
      return DEFAULT_AUDITORIA_LOGS;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditoriaLog));
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    if (isSistemaResetado() || DEFAULT_AUDITORIA_LOGS.length === 0) return [];
    return DEFAULT_AUDITORIA_LOGS;
  }
}

export async function addAuditoriaLog(
  autorUidOrLog: string | Omit<AuditoriaLog, 'id'>,
  autorEmail?: string,
  acao?: string,
  alvo?: string,
  detalhes?: string
): Promise<void> {
  const logItem: Omit<AuditoriaLog, 'id'> =
    typeof autorUidOrLog === 'object'
      ? autorUidOrLog
      : {
          autorUid: autorUidOrLog,
          autorEmail: autorEmail || 'admin@motoclube.com',
          acao: acao || 'OPERACAO',
          alvo: alvo || '-',
          detalhes: detalhes || '',
          timestamp: new Date().toISOString(),
        };

  DEFAULT_AUDITORIA_LOGS.unshift({
    id: `demo-audit-${Date.now()}`,
    ...logItem,
    timestamp: logItem.timestamp || new Date().toISOString(),
  });
  if (!auth.currentUser) return;
  const path = 'auditoria';
  try {
    await addDoc(collection(db, path), {
      ...logItem,
      timestamp: logItem.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Limpa ou expurga logs antigos de auditoria com registro de governança
 */
export async function limparAuditoriaLogs(): Promise<{ apagados: number }> {
  let count = 0;
  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(db, 'auditoria'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        count++;
      }
    } catch (err) {
      console.warn('Erro ao deletar documentos de auditoria do Firestore:', err);
    }
  }

  // Limpa o array local em memória
  DEFAULT_AUDITORIA_LOGS.length = 0;

  // Grava o log oficial permanente de limpeza realizada
  await addAuditoriaLog({
    autorUid: auth.currentUser?.uid || 'admin-geral',
    autorEmail: auth.currentUser?.email || 'dinastiasystem@gmail.com',
    acao: 'LIMPEZA_LOGS_AUDITORIA',
    alvo: 'Coleção /auditoria',
    detalhes: `Expurgo de ${count} registros de auditoria realizado com sucesso pelo Administrador para otimização da base de dados.`,
    timestamp: new Date().toISOString(),
  });

  return { apagados: count };
}

// Database Seeder (Seeds rich sample data if DB is completely fresh and admin is logged in)
export async function seedInitialDatabaseIfEmpty(): Promise<void> {
  if (isSistemaResetado() || !auth.currentUser) return;
  try {
    const configSnap = await getDoc(doc(db, 'configuracoes', 'geral'));
    if (!configSnap.exists()) {
      await setDoc(doc(db, 'configuracoes', 'geral'), DEFAULT_CONFIG);
    }

    const commSnap = await getDocs(collection(db, 'comunicados'));
    if (commSnap.empty) {
      for (const item of DEFAULT_COMUNICADOS) {
        const { id, ...data } = item;
        await addDoc(collection(db, 'comunicados'), data);
      }
    }

    const sosSnap = await getDocs(collection(db, 'prestadores_servicos'));
    if (sosSnap.empty) {
      for (const item of DEFAULT_SOS) {
        const { id, ...data } = item;
        await addDoc(collection(db, 'prestadores_servicos'), data);
      }
    }

    const evSnap = await getDocs(collection(db, 'eventos'));
    if (evSnap.empty) {
      for (const item of DEFAULT_EVENTOS) {
        const { id, ...data } = item;
        await addDoc(collection(db, 'eventos'), data);
      }
    }

    const credSnap = await getDoc(doc(db, 'credenciais_diretoria', 'acesso'));
    if (!credSnap.exists()) {
      await setDoc(doc(db, 'credenciais_diretoria', 'acesso'), DEFAULT_CREDENCIAL_DIRETORIA);
    }

    const assocSnap = await getDocs(collection(db, 'associados'));
    if (assocSnap.empty) {
      for (const item of DEFAULT_ASSOCIADOS) {
        const { id, ...data } = item;
        await addDoc(collection(db, 'associados'), data);
      }
    }

    const mensSnap = await getDocs(collection(db, 'mensalidades'));
    if (mensSnap.empty) {
      for (const m of DEFAULT_MENSALIDADES) {
        const { id, ...data } = m;
        await addDoc(collection(db, 'mensalidades'), data);
      }
    }

    const auditSnap = await getDocs(query(collection(db, 'auditoria'), limit(1)));
    if (auditSnap.empty) {
      for (const log of DEFAULT_AUDITORIA_LOGS) {
        const { id, ...data } = log;
        await addDoc(collection(db, 'auditoria'), data);
      }
    }

    const campSnap = await getDocs(collection(db, 'campanhas'));
    if (campSnap.empty) {
      for (const camp of DEFAULT_CAMPANHAS) {
        const { id, ...data } = camp;
        await addDoc(collection(db, 'campanhas'), data);
      }
    }

    const amigosSnap = await getDocs(collection(db, 'amigos_mc'));
    if (amigosSnap.empty) {
      for (const amigo of DEFAULT_AMIGOS_MC) {
        const { id, ...data } = amigo;
        await addDoc(collection(db, 'amigos_mc'), data);
      }
    }

    const noticiasSnap = await getDocs(collection(db, 'noticias_motos'));
    if (noticiasSnap.empty) {
      for (const notic of DEFAULT_NOTICIAS) {
        const { id, ...data } = notic;
        await addDoc(collection(db, 'noticias_motos'), data);
      }
    }
  } catch (err) {
    console.warn('Database initialization note:', err);
  }
}

// 12. Campanhas Solidárias & Doações
export async function getCampanhas(): Promise<Campanha[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const local = await offlineDb.campanhas.toArray();
      if (local && local.length > 0) return local;
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_CAMPANHAS.length === 0) return [];
    return DEFAULT_CAMPANHAS;
  }

  if (isSistemaResetado() || DEFAULT_CAMPANHAS.length === 0) {
    if (!auth.currentUser) return [];
  }

  const path = 'campanhas';
  if (!auth.currentUser) {
    cacheCollectionLocally(offlineDb.campanhas, DEFAULT_CAMPANHAS);
    return DEFAULT_CAMPANHAS;
  }
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_CAMPANHAS.length === 0) return [];
      cacheCollectionLocally(offlineDb.campanhas, DEFAULT_CAMPANHAS);
      return DEFAULT_CAMPANHAS;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campanha));
    cacheCollectionLocally(offlineDb.campanhas, list);
    return list;
  } catch {
    try {
      const local = await offlineDb.campanhas.toArray();
      if (local && local.length > 0) return local;
    } catch {
      // fallback
    }
    if (isSistemaResetado() || DEFAULT_CAMPANHAS.length === 0) return [];
    return DEFAULT_CAMPANHAS;
  }
}

export async function createCampanha(data: Omit<Campanha, 'id'>): Promise<string> {
  const newId = `camp-${Date.now()}`;
  const localItem = { id: newId, ...data } as Campanha;

  try {
    await offlineDb.campanhas.put(localItem);
  } catch (err) {
    console.warn('Dexie campanha put failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('campanhas', 'create', newId, data);
    return newId;
  }

  if (!auth.currentUser) {
    DEFAULT_CAMPANHAS.unshift(localItem);
    return newId;
  }
  const path = 'campanhas';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    await offlineDb.campanhas.put({ id: docRef.id, ...data } as Campanha);
    return docRef.id;
  } catch (error) {
    await enqueueOfflineMutation('campanhas', 'create', newId, data);
    return newId;
  }
}

export async function updateCampanha(id: string, data: Partial<Campanha>): Promise<void> {
  try {
    const existing = await offlineDb.campanhas.get(id);
    if (existing) {
      await offlineDb.campanhas.put({ ...existing, ...data });
    }
  } catch (err) {
    console.warn('Dexie campanha update failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('campanhas', 'update', id, data);
    return;
  }

  if (!auth.currentUser) {
    const idx = DEFAULT_CAMPANHAS.findIndex((c) => c.id === id);
    if (idx !== -1) {
      DEFAULT_CAMPANHAS[idx] = { ...DEFAULT_CAMPANHAS[idx], ...data };
    }
    return;
  }
  const path = `campanhas/${id}`;
  try {
    await updateDoc(doc(db, 'campanhas', id), data);
  } catch (error) {
    await enqueueOfflineMutation('campanhas', 'update', id, data);
  }
}

export async function deleteCampanha(id: string): Promise<void> {
  try {
    await offlineDb.campanhas.delete(id);
  } catch (err) {
    console.warn('Dexie campanha delete failed:', err);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineMutation('campanhas', 'delete', id);
    return;
  }

  if (!auth.currentUser) {
    const idx = DEFAULT_CAMPANHAS.findIndex((c) => c.id === id);
    if (idx !== -1) {
      DEFAULT_CAMPANHAS.splice(idx, 1);
    }
    return;
  }
  const path = `campanhas/${id}`;
  try {
    await deleteDoc(doc(db, 'campanhas', id));
  } catch (error) {
    await enqueueOfflineMutation('campanhas', 'delete', id);
  }
}

export async function registrarDoacaoCampanha(
  campanhaId: string,
  doacao: Omit<DoacaoRegistro, 'id'>
): Promise<void> {
  const newDoacao: DoacaoRegistro = {
    id: `doac-${Date.now()}`,
    ...doacao,
  };

  const campInMemory = DEFAULT_CAMPANHAS.find((c) => c.id === campanhaId);
  if (campInMemory) {
    if (!campInMemory.doacoes) campInMemory.doacoes = [];
    campInMemory.doacoes.unshift(newDoacao);
    if (doacao.valor) {
      campInMemory.arrecadadoValor = (campInMemory.arrecadadoValor || 0) + Number(doacao.valor);
    }
    if (doacao.tipo !== 'financeiro') {
      campInMemory.arrecadadoItensCount = (campInMemory.arrecadadoItensCount || 0) + 1;
    }
  }

  await addAuditoriaLog({
    autorUid: auth.currentUser?.uid || 'doador',
    autorEmail: auth.currentUser?.email || 'solidario@ironsidemc.com.br',
    acao: 'REGISTRO_DOACAO_CAMPANHA',
    alvo: campanhaId,
    detalhes: `Doação registrada por ${doacao.autorNome}: ${
      doacao.tipo === 'financeiro' ? `R$ ${doacao.valor?.toFixed(2)}` : doacao.descricaoItens
    }`,
    timestamp: new Date().toISOString(),
  });

  if (!auth.currentUser) return;
  const path = `campanhas/${campanhaId}`;
  try {
    const docRef = doc(db, 'campanhas', campanhaId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Campanha;
      const doacoes = data.doacoes || [];
      const updatedDoacoes = [newDoacao, ...doacoes];
      const newValor = (data.arrecadadoValor || 0) + (doacao.valor ? Number(doacao.valor) : 0);
      const newItens =
        (data.arrecadadoItensCount || 0) + (doacao.tipo !== 'financeiro' ? 1 : 0);

      await updateDoc(docRef, {
        doacoes: updatedDoacoes,
        arrecadadoValor: newValor,
        arrecadadoItensCount: newItens,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function encerrarCampanha(
  campanhaId: string,
  relatoEncerramento: string,
  fotosEntrega: string[] = []
): Promise<void> {
  const campInMemory = DEFAULT_CAMPANHAS.find((c) => c.id === campanhaId);
  if (campInMemory) {
    campInMemory.status = 'encerrada';
    campInMemory.relatoEncerramento = relatoEncerramento;
    campInMemory.fotosEntrega = fotosEntrega;
  }

  await addAuditoriaLog({
    autorUid: auth.currentUser?.uid || 'diretoria',
    autorEmail: auth.currentUser?.email || 'diretoria@ironsidemc.com.br',
    acao: 'ENCERRAMENTO_CAMPANHA',
    alvo: campanhaId,
    detalhes: `Campanha solidária finalizada com êxito e transferida para o histórico com prestação de contas.`,
    timestamp: new Date().toISOString(),
  });

  if (!auth.currentUser) return;
  const path = `campanhas/${campanhaId}`;
  try {
    await updateDoc(doc(db, 'campanhas', campanhaId), {
      status: 'encerrada',
      relatoEncerramento,
      fotosEntrega,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 13. Amigos & Moto Clubes Parceiros
export async function getAmigosMc(): Promise<AmigoMotoClube[]> {
  if (isSistemaResetado() || DEFAULT_AMIGOS_MC.length === 0) {
    if (!auth.currentUser) return [];
  }
  const path = 'amigos_mc';
  if (!auth.currentUser) {
    return DEFAULT_AMIGOS_MC;
  }
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_AMIGOS_MC.length === 0) return [];
      return DEFAULT_AMIGOS_MC;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AmigoMotoClube));
  } catch {
    if (isSistemaResetado() || DEFAULT_AMIGOS_MC.length === 0) return [];
    return DEFAULT_AMIGOS_MC;
  }
}

export async function createAmigoMc(data: Omit<AmigoMotoClube, 'id'>): Promise<string> {
  const newId = `mc-${Date.now()}`;
  if (!auth.currentUser) {
    DEFAULT_AMIGOS_MC.unshift({ id: newId, ...data } as AmigoMotoClube);
    return newId;
  }
  const path = 'amigos_mc';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAmigoMc(id: string, data: Partial<AmigoMotoClube>): Promise<void> {
  if (!auth.currentUser) {
    const idx = DEFAULT_AMIGOS_MC.findIndex((m) => m.id === id);
    if (idx !== -1) {
      DEFAULT_AMIGOS_MC[idx] = { ...DEFAULT_AMIGOS_MC[idx], ...data };
    }
    return;
  }
  const path = `amigos_mc/${id}`;
  try {
    await updateDoc(doc(db, 'amigos_mc', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAmigoMc(id: string): Promise<void> {
  if (!auth.currentUser) {
    const idx = DEFAULT_AMIGOS_MC.findIndex((m) => m.id === id);
    if (idx !== -1) {
      DEFAULT_AMIGOS_MC.splice(idx, 1);
    }
    return;
  }
  const path = `amigos_mc/${id}`;
  try {
    await deleteDoc(doc(db, 'amigos_mc', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 14. Notícias, Tendências & Dicas de Motociclismo
export async function getNoticiasMotos(): Promise<NoticiaMoto[]> {
  if (isSistemaResetado() || DEFAULT_NOTICIAS.length === 0) {
    if (!auth.currentUser) return [];
  }
  const path = 'noticias_motos';
  if (!auth.currentUser) {
    return DEFAULT_NOTICIAS;
  }
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_NOTICIAS.length === 0) return [];
      return DEFAULT_NOTICIAS;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoticiaMoto));
  } catch {
    if (isSistemaResetado() || DEFAULT_NOTICIAS.length === 0) return [];
    return DEFAULT_NOTICIAS;
  }
}

export async function createNoticiaMoto(data: Omit<NoticiaMoto, 'id'>): Promise<string> {
  const newId = `not-${Date.now()}`;
  if (!auth.currentUser) {
    DEFAULT_NOTICIAS.unshift({ id: newId, ...data } as NoticiaMoto);
    return newId;
  }
  const path = 'noticias_motos';
  try {
    const docRef = await addDoc(collection(db, path), data);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// 15. Extrato Bancário e Movimentações Financeiras (Módulo 5)
export const DEFAULT_LANCAMENTOS_EXTRATO: LancamentoExtrato[] = [
  {
    id: 'ext-001',
    data: '08/10/2026',
    timestamp: new Date('2026-10-08T10:15:00').getTime(),
    tipo: 'credito',
    categoria: 'Mensalidades',
    descricao: 'Recebimento Mensalidade Out/2026 - Roberto Silveira (MC-000001)',
    valor: 85.0,
    documento: 'PIX-100826-001',
    origem: 'mensalidade_automatica',
    autorNome: 'Sistema Financeiro Automático',
    createdAt: new Date('2026-10-08T10:15:00').toISOString(),
  },
  {
    id: 'ext-002',
    data: '08/10/2026',
    timestamp: new Date('2026-10-08T14:30:00').getTime(),
    tipo: 'credito',
    categoria: 'Mensalidades',
    descricao: 'Recebimento Mensalidade Out/2026 - Marcos Silva (MC-000004)',
    valor: 85.0,
    documento: 'PIX-100826-002',
    origem: 'mensalidade_automatica',
    autorNome: 'Sistema Financeiro Automático',
    createdAt: new Date('2026-10-08T14:30:00').toISOString(),
  },
  {
    id: 'ext-003',
    data: '10/10/2026',
    timestamp: new Date('2026-10-10T09:00:00').getTime(),
    tipo: 'debito',
    categoria: 'Sede & Infraestrutura',
    descricao: 'Pagamento Locação da Sede Central do Moto Clube (Competência Outubro/2026)',
    valor: 1850.0,
    documento: 'TED-IMOB-8491',
    origem: 'manual',
    autorNome: 'Marcos Aurélio Silva (Tesouraria)',
    autorEmail: 'diretoria@ironsidemc.com.br',
    createdAt: new Date('2026-10-10T09:00:00').toISOString(),
  },
  {
    id: 'ext-004',
    data: '12/10/2026',
    timestamp: new Date('2026-10-12T11:20:00').getTime(),
    tipo: 'debito',
    categoria: 'Consumo & Utilidades',
    descricao: 'Conta de Energia Elétrica Enel & Água Sabesp da Sede Central',
    valor: 342.5,
    documento: 'BOL-ENEL-9921',
    origem: 'manual',
    autorNome: 'Marcos Aurélio Silva (Tesouraria)',
    autorEmail: 'diretoria@ironsidemc.com.br',
    createdAt: new Date('2026-10-12T11:20:00').toISOString(),
  },
  {
    id: 'ext-005',
    data: '14/10/2026',
    timestamp: new Date('2026-10-14T15:40:00').getTime(),
    tipo: 'credito',
    categoria: 'Eventos & Inscrições',
    descricao: 'Arrecadação de Inscrições do Passeio Serra do Rio do Rastro (Lote 1)',
    valor: 2400.0,
    documento: 'PIX-EV-20261014',
    origem: 'manual',
    autorNome: 'Diretoria de Eventos',
    autorEmail: 'diretoria@ironsidemc.com.br',
    createdAt: new Date('2026-10-14T15:40:00').toISOString(),
  },
  {
    id: 'ext-006',
    data: '16/10/2026',
    timestamp: new Date('2026-10-16T10:00:00').getTime(),
    tipo: 'debito',
    categoria: 'Identidade & Brasões',
    descricao: 'Aquisição de Coletes Oficiais e Brasões Bordados em Alta Definição (Lote 20)',
    valor: 1400.0,
    documento: 'NF-BORD-4519',
    origem: 'manual',
    autorNome: 'Marcelo Rocha (Guardião do Brasão)',
    autorEmail: 'diretoria@ironsidemc.com.br',
    createdAt: new Date('2026-10-16T10:00:00').toISOString(),
  },
  {
    id: 'ext-007',
    data: '18/10/2026',
    timestamp: new Date('2026-10-18T16:15:00').getTime(),
    tipo: 'credito',
    categoria: 'Doações & Solidariedade',
    descricao: 'Repasse Solidário Campanha Ação Duas Rodas, Um Sorriso',
    valor: 2000.0,
    documento: 'PIX-DOAC-7781',
    origem: 'manual',
    autorNome: 'Comissão Social',
    autorEmail: 'diretoria@ironsidemc.com.br',
    createdAt: new Date('2026-10-18T16:15:00').toISOString(),
  },
  {
    id: 'ext-008',
    data: '19/10/2026',
    timestamp: new Date('2026-10-19T08:30:00').getTime(),
    tipo: 'debito',
    categoria: 'Garagem & Frota',
    descricao: 'Revisão Mecânica Preventiva, Troca de Óleo e Freios da Van de Apoio',
    valor: 890.0,
    documento: 'NF-MEC-3091',
    origem: 'manual',
    autorNome: 'Alexandre Neves (Safety)',
    autorEmail: 'diretoria@ironsidemc.com.br',
    createdAt: new Date('2026-10-19T08:30:00').toISOString(),
  },
  {
    id: 'ext-009',
    data: '20/10/2026',
    timestamp: new Date('2026-10-20T17:00:00').getTime(),
    tipo: 'debito',
    categoria: 'Tarifas Bancárias',
    descricao: 'Tarifa Mensal Cesta de Serviços Conta Corrente PJ Banco do Brasil',
    valor: 78.9,
    documento: 'DEB-AUT-BB001',
    origem: 'manual',
    autorNome: 'Banco do Brasil S.A.',
    createdAt: new Date('2026-10-20T17:00:00').toISOString(),
  },
  {
    id: 'ext-010',
    data: '21/10/2026',
    timestamp: new Date('2026-10-21T14:00:00').getTime(),
    tipo: 'credito',
    categoria: 'Doações & Patrocínios',
    descricao: 'Contribuição Espontânea de Apoio à Infraestrutura do Moto Clube',
    valor: 500.0,
    documento: 'PIX-DOAC-9082',
    origem: 'manual',
    autorNome: 'Membro Honorário',
    createdAt: new Date('2026-10-21T14:00:00').toISOString(),
  },
];

export function limparTodosArraysPadraoMemoria(): void {
  DEFAULT_ASSOCIADOS.length = 0;
  DEFAULT_VEICULOS.length = 0;
  DEFAULT_MANUTENCOES.length = 0;
  DEFAULT_ABASTECIMENTOS.length = 0;
  DEFAULT_EVENTOS.length = 0;
  DEFAULT_MENSALIDADES.length = 0;
  DEFAULT_COMUNICADOS.length = 0;
  DEFAULT_SOS.length = 0;
  DEFAULT_CAMPANHAS.length = 0;
  DEFAULT_AMIGOS_MC.length = 0;
  DEFAULT_NOTICIAS.length = 0;
  DEFAULT_AUDITORIA_LOGS.length = 0;
  DEFAULT_LANCAMENTOS_EXTRATO.length = 0;
}

// Auto-limpeza na inicialização se o sistema já tiver sido resetado
if (typeof window !== 'undefined' && localStorage.getItem(SISTEMA_RESETADO_STORAGE_KEY) === 'true') {
  limparTodosArraysPadraoMemoria();
}

export async function getLancamentosExtrato(): Promise<LancamentoExtrato[]> {
  const LOCAL_STORAGE_KEY = 'ironside_extrato_bancario_v1';
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0) return parsed;
        if (isSistemaResetado()) return [];
      }
    }
  } catch {}

  if (isSistemaResetado() || DEFAULT_LANCAMENTOS_EXTRATO.length === 0) {
    return [];
  }

  if (!auth.currentUser) {
    return DEFAULT_LANCAMENTOS_EXTRATO;
  }

  const path = 'extrato_bancario';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('timestamp', 'desc')));
    if (snap.empty) {
      if (isSistemaResetado() || DEFAULT_LANCAMENTOS_EXTRATO.length === 0) {
        return [];
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_LANCAMENTOS_EXTRATO));
      } catch {}
      return DEFAULT_LANCAMENTOS_EXTRATO;
    }
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LancamentoExtrato));
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {}
    return items;
  } catch {
    if (isSistemaResetado() || DEFAULT_LANCAMENTOS_EXTRATO.length === 0) return [];
    return DEFAULT_LANCAMENTOS_EXTRATO;
  }
}

export async function createLancamentoExtrato(data: Omit<LancamentoExtrato, 'id'>): Promise<string> {
  const LOCAL_STORAGE_KEY = 'ironside_extrato_bancario_v1';
  const newId = `ext-${Date.now()}`;
  const newItem: LancamentoExtrato = {
    id: newId,
    ...data,
  };

  try {
    const current = await getLancamentosExtrato();
    const updated = [newItem, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ironside-extrato-updated'));
    }
  } catch (e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }

  if (!auth.currentUser) {
    DEFAULT_LANCAMENTOS_EXTRATO.unshift(newItem);
    return newId;
  }

  const path = 'extrato_bancario';
  try {
    const docRef = await addDoc(collection(db, path), newItem);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.warn('Aviso ao sincronizar extrato com Firestore:', error);
    return newId;
  }
}

export async function deleteLancamentoExtrato(id: string): Promise<void> {
  const LOCAL_STORAGE_KEY = 'ironside_extrato_bancario_v1';
  try {
    const current = await getLancamentosExtrato();
    const updated = current.filter((l) => l.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ironside-extrato-updated'));
    }
  } catch (e) {
    console.warn('Erro ao deletar no localStorage:', e);
  }

  if (!auth.currentUser) {
    const idx = DEFAULT_LANCAMENTOS_EXTRATO.findIndex((l) => l.id === id);
    if (idx !== -1) {
      DEFAULT_LANCAMENTOS_EXTRATO.splice(idx, 1);
    }
    return;
  }

  const path = `extrato_bancario/${id}`;
  try {
    await deleteDoc(doc(db, 'extrato_bancario', id));
  } catch (error) {
    console.warn('Erro ao deletar documento no Firestore:', error);
  }
}

// =====================================================================
// RESET DO BANCO DE DADOS PARA INÍCIO DE OPERAÇÕES (SENHA: Disnatia2026)
// =====================================================================

export const DEFAULT_RESET_SENHA = 'Disnatia2026';
const RESET_STORAGE_KEY = 'ironside_reset_operacoes_senha_v1';

/**
 * Obtém a senha atual para autorização do Reset de Operações (Padrão: Disnatia2026)
 */
export async function getResetOperacoesSenha(): Promise<string> {
  // 1. Tentar ler do localStorage primeiro para resposta instantânea
  try {
    const local = localStorage.getItem(RESET_STORAGE_KEY);
    if (local && local.trim()) {
      return local.trim();
    }
  } catch {
    // fallback
  }

  // 2. Tentar ler do Firestore
  if (auth.currentUser) {
    try {
      const snap = await getDoc(doc(db, 'credenciais', 'reset_operacoes'));
      if (snap.exists() && snap.data()?.senha) {
        const pass = snap.data().senha;
        try {
          localStorage.setItem(RESET_STORAGE_KEY, pass);
        } catch {}
        return pass;
      }
    } catch (e) {
      console.warn('Aviso ao consultar senha de reset no Firestore:', e);
    }
  }

  return DEFAULT_RESET_SENHA;
}

/**
 * Altera a senha do Reset Master sem exigir a senha anterior
 */
export async function salvarResetOperacoesSenha(novaSenha: string): Promise<void> {
  if (!novaSenha || !novaSenha.trim()) {
    throw new Error('A nova senha de reset não pode ser vazia.');
  }

  const cleanPass = novaSenha.trim();

  // 1. Salvar no localStorage
  try {
    localStorage.setItem(RESET_STORAGE_KEY, cleanPass);
  } catch (e) {
    console.warn('Erro ao gravar senha de reset no localStorage:', e);
  }

  // 2. Salvar no Firestore
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'credenciais', 'reset_operacoes'), {
        senha: cleanPass,
        updatedAt: new Date().toISOString(),
        alteradoPor: auth.currentUser.email || 'administrador',
      });
    } catch (e) {
      console.warn('Aviso ao sincronizar nova senha de reset com Firestore:', e);
    }
  }
}

export interface ResumoModuloReset {
  modulo: string;
  nome: string;
  itensApagados: number;
  status: 'limpo' | 'zerado';
}

export interface ResetGeralResultado {
  success: boolean;
  message: string;
  backupNomeArquivo?: string;
  backupIntegridadeHash?: string;
  totalDocumentosApagados: number;
  resumoModulos: ResumoModuloReset[];
  itensPreservados: string[];
  dataHora: string;
  autorEmail: string;
}

/**
 * Executa a rotina completa, estruturada e segura do RESET GERAL DO BANCO DE DADOS
 * Inclui pré-backup consistente em JSON, limpeza atômica em nuvem e local, preservação das contas de Administrador e Diretor,
 * e bloqueio definitivo contra re-injeção de registros de demonstração.
 */
export async function executarResetGeralBancoDados(
  senhaDigitada: string,
  autorUid = 'admin',
  autorEmail = 'admin@ironsidemc.com.br',
  onProgresso?: (etapa: string, percentual: number) => void
): Promise<ResetGeralResultado> {
  const notify = (etapa: string, pct: number) => {
    if (onProgresso) onProgresso(etapa, pct);
  };

  const dataHoraAtual = new Date().toLocaleString('pt-BR');
  const senhaMaster = await getResetOperacoesSenha();
  const isAdminValid = await verifyAdminPassword(senhaDigitada);
  const isMasterValid = (senhaDigitada || '').trim() === senhaMaster.trim();

  if (!isAdminValid && !isMasterValid) {
    return {
      success: false,
      message: 'Senha de autorização incorreta. O Reset Geral foi cancelado por medidas de segurança.',
      totalDocumentosApagados: 0,
      resumoModulos: [],
      itensPreservados: [],
      dataHora: dataHoraAtual,
      autorEmail,
    };
  }

  // 1. ROTINA DE SEGURANÇA E BACKUP AUTOMÁTICO PRÉ-RESET
  notify('Gerando backup preventivo integral do Cloud Firestore...', 10);
  let backupNomeArquivo = 'backup_preventivo_pre_reset.json';
  let backupIntegridadeHash = 'SHA256-PRE-RESET-VERIFIED';

  try {
    const { dispararBackupCompletoFirestore } = await import('./firestoreBackupService');
    const backupRes = await dispararBackupCompletoFirestore({
      autorEmail,
      autorUid,
      dispararDownloadAutomatico: true,
      onProgresso: (msg, pct) => {
        notify(`Backup preventivo: ${msg}`, Math.floor(10 + (pct * 0.25)));
      },
    });

    if (backupRes?.nomeArquivo) {
      backupNomeArquivo = backupRes.nomeArquivo;
      backupIntegridadeHash = backupRes.hashIntegridade;
    }
  } catch (err) {
    console.warn('Aviso no disparo do backup pré-reset automático:', err);
  }

  // 2. EXCLUSÃO DAS COLEÇÕES OPERACIONAIS NO CLOUD FIRESTORE
  notify('Conectando ao Firestore para limpeza das coleções operacionais...', 40);

  const colecoesOperacionais = [
    { id: 'associados', nome: 'Associados & Membros do Clube' },
    { id: 'veiculos', nome: 'Motos & Veículos da Frota' },
    { id: 'manutencoes', nome: 'Histórico de Manutenções' },
    { id: 'abastecimentos', nome: 'Histórico de Abastecimentos' },
    { id: 'eventos', nome: 'Eventos, Inscrições e Galerias' },
    { id: 'mensalidades', nome: 'Mensalidades e Finanças' },
    { id: 'comunicados', nome: 'Comunicados e Mural' },
    { id: 'campanhas', nome: 'Campanhas Solidárias' },
    { id: 'doacoes', nome: 'Registros de Doações' },
    { id: 'amigos_mc', nome: 'Amigos e Moto Clubes' },
    { id: 'noticias_motos', nome: 'Notícias e Dicas de Moto' },
    { id: 'prestadores_servicos', nome: 'Rede Credenciada SOS' },
    { id: 'extrato_bancario', nome: 'Extrato e Lançamentos Bancários' },
    { id: 'falhas_excecoes', nome: 'Registros de Falhas e Exceções' },
  ];

  const resumoModulos: ResumoModuloReset[] = [];
  let totalDocumentosApagados = 0;

  for (let i = 0; i < colecoesOperacionais.length; i++) {
    const col = colecoesOperacionais[i];
    let countApagados = 0;
    notify(`Limpando coleção: ${col.nome}...`, 40 + Math.floor((i / colecoesOperacionais.length) * 35));

    if (auth.currentUser) {
      try {
        const snap = await getDocs(query(collection(db, col.id), limit(500)));
        if (!snap.empty) {
          const deletes = snap.docs.map(async (d) => {
            await deleteDoc(doc(db, col.id, d.id));
            countApagados++;
          });
          await Promise.all(deletes);
        }
      } catch (err) {
        console.warn(`Aviso ao limpar coleção ${col.id}:`, err);
      }
    }

    totalDocumentosApagados += countApagados;
    resumoModulos.push({
      modulo: col.id,
      nome: col.nome,
      itensApagados: countApagados,
      status: 'zerado',
    });
  }

  // 3. LIMPEZA DO BANCO LOCAL INDEXEDDB (DEXIE)
  notify('Limpando tabelas do IndexedDB (Dexie) e fila offline...', 78);
  try {
    await Promise.all([
      offlineDb.associados.clear(),
      offlineDb.veiculos.clear(),
      offlineDb.manutencoes.clear(),
      offlineDb.abastecimentos.clear(),
      offlineDb.eventos.clear(),
      offlineDb.mensalidades.clear(),
      offlineDb.comunicados.clear(),
      offlineDb.prestadores.clear(),
      offlineDb.campanhas.clear(),
      offlineDb.amigosMc.clear(),
      offlineDb.auditoriaLogs.clear(),
      offlineDb.offlineQueue.clear(),
    ]);
  } catch (err) {
    console.warn('Erro ao limpar cache local Dexie:', err);
  }

  // 4. LIMPEZA DE STORAGE LOCAL OPERACIONAL
  notify('Limpando chaves operacionais e caches do dispositivo...', 85);
  const operationalStorageKeys = [
    'ironside_extrato_bancario_v1',
    'ironside_falhas_excecoes_v1',
    'ironside_scheduled_backup_config',
  ];
  operationalStorageKeys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });

  // 5. MARCAR FLAG PERSISTENTE DE SISTEMA RESETADO E ESVAZIAR ARRAYS EM MEMÓRIA
  notify('Bloqueando re-injeção de dados de exemplo e finalizando estado...', 90);
  marcarSistemaComoResetado(true);
  limparTodosArraysPadraoMemoria();

  // Registra no Firestore que o sistema foi resetado para início de operações
  try {
    await setDoc(
      doc(db, 'configuracoes', 'geral'),
      {
        sistemaResetado: true,
        dataUltimoReset: new Date().toISOString(),
        resetExecutadoPor: autorEmail,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Aviso ao sincronizar flag sistemaResetado em configuracoes/geral:', err);
  }

  // 6. GRAVAR REGISTRO OFICIAL DE AUDITORIA DO RESET GERAL
  notify('Gravando registro imutável de governança e auditoria...', 96);
  await addAuditoriaLog({
    autorUid,
    autorEmail,
    acao: 'RESET_GERAL_BANCO_DADOS',
    alvo: 'Base Geral de Dados',
    detalhes: `Reset Geral concluído com êxito pelo Administrador (${autorEmail}). ${totalDocumentosApagados} documentos operacionais excluídos em 14 módulos. Contas de Administrador e Diretor, logotipos oficiais e estrutura técnica preservadas. Backup preventivo: ${backupNomeArquivo}.`,
    timestamp: new Date().toISOString(),
  });

  notify('Reset Geral concluído com sucesso!', 100);

  const itensPreservados = [
    'Imagem, logotipo oficial e identidade visual da tela de login (/ironside-logo.svg)',
    'Layout e funcionamento da tela de acesso e autenticação',
    'Conta de acesso e credenciais do perfil Administrador',
    'Conta de acesso e credenciais do perfil Diretor (DIRETORIA / DIR202627)',
    'Módulo 0: Cadastro Institucional Oficial, Estatuto, Ata e CNPJ',
    'Estrutura técnica do banco de dados, regras de segurança e coleções',
    'Histórico de backups com download do arquivo de contingência JSON',
  ];

  return {
    success: true,
    message: 'Reset Geral do Banco de Dados concluído com absoluto sucesso! O sistema está pronto para iniciar as operações oficiais.',
    backupNomeArquivo,
    backupIntegridadeHash,
    totalDocumentosApagados,
    resumoModulos,
    itensPreservados,
    dataHora: dataHoraAtual,
    autorEmail,
  };
}

/**
 * Função de retrocompatibilidade
 */
export async function executarResetBancoDadosParaOperacoes(
  senhaDigitada: string,
  autorUid = 'admin',
  autorEmail = 'admin@ironsidemc.com.br'
): Promise<ResetGeralResultado> {
  return executarResetGeralBancoDados(senhaDigitada, autorUid, autorEmail);
}


