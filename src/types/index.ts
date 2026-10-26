export type UserRole = 'administrador' | 'diretoria' | 'associado';

export type UserStatus = 'ativo' | 'pendente' | 'suspenso' | 'inativo';

export type AssociadoStatus =
  | 'pendente'
  | 'em_analise'
  | 'aprovado'
  | 'ativo'
  | 'inativo'
  | 'suspenso'
  | 'rejeitado'
  | 'desligado';

export interface ContatoEmergencia {
  nome: string;
  parentesco: string;
  telefone: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  role: UserRole;
  status: UserStatus;
  associadoId?: string;
  cpf?: string;
  createdAt: string;
}

export interface CredencialDiretoria {
  id?: string;
  login: string;
  senha: string;
  updatedAt: string;
  alteradoPor?: string;
}

export interface CredencialAdmin {
  id?: string;
  senha: string;
  updatedAt: string;
}

export interface Associado {
  id: string;
  uid: string;
  numeroAssociado: string; // Ex: MC-000001
  nome: string;
  nomeGuerra: string;
  senha?: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  tipoSanguineo: string; // A+, O-, etc.
  email: string;
  telefone: string;
  whatsapp: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhValidade: string;
  regional: string;
  cargo: string;
  status: AssociadoStatus;
  fotoUrl?: string;
  dataAssociacao: string;
  // Estado Civil & Informações de Saúde / Emergência (LGPD e LAI)
  estadoCivil?: string;
  alergiaMedicamento?: { possui: boolean; descricao: string };
  alergiaAlimentacao?: { possui: boolean; descricao: string };
  problemaSaude?: { possui: boolean; descricao: string };
  pcd?: { possui: boolean; descricao: string };
  consentimentoLgpd?: boolean;
  dataConsentimentoLgpd?: string;
  // Filiação Oficial
  dataFiliacao?: string;
  aprovadoPorDiretoria?: string;
  numeroAtaFiliacao?: string;
  // Desligamento & Bloqueio por CPF (com até 3000 caracteres de justificativa)
  dataDesligamento?: string;
  motivoDesligamento?: string;
  desligadoPor?: string;
  cpfBloqueado?: string;
  observacoes?: string;
  aprovadoPor?: string;
  aprovadoEm?: string;
  // Termo de Filiação, Responsabilidade & Assinatura Digital Touch/Mouse
  assinaturaDigitalUrl?: string;
  dataAssinaturaTermo?: string;
  termoResponsabilidadeAceito?: boolean;
  contatosEmergencia?: ContatoEmergencia[];
  createdAt: string;
}

export interface Veiculo {
  id: string;
  associadoId: string;
  associadoNome?: string;
  tipo: 'moto' | 'carro' | 'outro';
  marca: string;
  modelo: string;
  versao?: string;
  ano: string; // Ano do modelo
  anoFabricacao?: string; // Ex: 2024
  cor: string;
  placa: string;
  kmAtual: number;
  fotoUrl?: string;
  observacoes?: string;
  seguradora?: string;
  apolice?: string;
  // DADOS COMPLETOS DO DOCUMENTO CRLV DA MOTO
  renavam?: string;
  chassi?: string; // VIN 17 dígitos
  cilindradaCc?: number; // Ex: 1254 cc
  potenciaCv?: number; // Ex: 136 cv
  combustivel?: string; // Gasolina, Flex, etc.
  numeroCrlv?: string; // Código de segurança ou número do CRLV
  exercicioLicenciamento?: string; // Ex: 2026
  categoriaVeiculo?: string; // Particular / Motocicleta
  capacidadePassageiros?: string; // 2P
  nomeProprietarioCrlv?: string;
  cpfCnpjProprietario?: string;
  municipioEmplacamento?: string;
  ufEmplacamento?: string;
  restricoesFinanceiras?: string; // Nenhuma, Alienação Fiduciária, etc.
  // DIGITALIZAÇÃO DO DOCUMENTO CRLV (PDF ou Imagem)
  crlvDigitalUrl?: string;
  crlvDigitalNomeArquivo?: string;
  crlvDigitalizadoEm?: string;
  createdAt: string;
}

export interface Manutencao {
  id: string;
  associadoId: string;
  veiculoId: string;
  veiculoDescricao?: string;
  data: string;
  km: number;
  tipoServico: string; // Troca de Óleo, Pneus, Revisão Geral, Relação/Corrente, etc.
  descricao: string;
  oficina: string;
  valor: number;
  proximaManutencaoKm?: number;
  proximaManutencaoData?: string;
  createdAt: string;
}

export interface Abastecimento {
  id: string;
  associadoId: string;
  veiculoId: string;
  veiculoDescricao?: string;
  dataHora: string;
  km: number;
  combustivel: 'gasolina_comum' | 'gasolina_aditivada' | 'gasolina_premium' | 'etanol' | 'diesel';
  litros: number;
  precoLitro: number;
  valorTotal: number;
  tanqueCheio: boolean;
  posto: string;
  cidade: string;
  consumoKmL?: number;
  createdAt: string;
}

export interface EventoFoto {
  id: string;
  url: string;
  legenda?: string;
  autorId?: string;
  autorNome: string;
  autorFoto?: string;
  dataUpload: string;
  origem: 'camera' | 'upload' | 'storage';
  storagePath?: string;
  curtidas?: string[];
  destaqueAlbum?: boolean; // Selecionada como melhor foto para o álbum histórico do clube
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  local: string;
  cidade?: string;
  preco: number;
  vagasLimite: number;
  participantesCount: number;
  imagemUrl?: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  organizador: string;
  latitude?: number;
  longitude?: number;
  pontoEncontroCoordenadas?: string;
  inscritos?: string[]; // IDs dos associados inscritos
  presencas?: Record<string, boolean>; // Mapa associadoId -> status de presença (true: Presente, false: Ausente/Pendente)
  galeria?: EventoFoto[]; // Fotos registradas do evento (upload de câmera / Firebase Storage)
  createdAt: string;
}

export interface Mensalidade {
  id: string;
  associadoId: string;
  nomeAssociado: string;
  numeroAssociado: string;
  competencia: string; // Ex: "Outubro/2026"
  ano: number;
  mes: number;
  valor: number;
  vencimento: string; // DD/MM/AAAA
  status: 'pendente' | 'pago' | 'atrasado';
  dataPagamento?: string;
  formaPagamento?: string; // PIX, Dinheiro, Boleto, Cartão
  // Comprovante em PDF & Aprovação pela Diretoria
  comprovanteUrl?: string;
  comprovanteNomeArquivo?: string;
  comprovanteTipo?: string;
  comprovanteEnviadoEm?: string;
  statusComprovante?: 'pendente_analise' | 'aprovado' | 'rejeitado';
  aprovadoPorDiretor?: string;
  dataAprovacaoDiretor?: string;
  motivoRejeicaoComprovante?: string;
  createdAt: string;
}

export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  data: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  autor: string;
  fixado: boolean;
  createdAt: string;
}

export interface ParceiroServico {
  id: string;
  nome: string;
  categoria:
    | 'guincho'
    | 'oficina'
    | 'borracharia'
    | 'hospital'
    | 'seguro'
    | 'posto'
    | 'chaveiro'
    | 'autopecas'
    | 'clube'
    | 'outro';
  telefone: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  endereco: string;
  descontoAssociado?: string;
  horario24h: boolean;
  observacoes?: string;
}

export interface AmigoMotoClube {
  id: string;
  nome: string; // Nome do MC ou Amigo
  tipo: 'moto_clube' | 'moto_grupo' | 'irmao_amigo' | 'faccao_regional';
  presidenteOuContato?: string;
  telefone: string;
  whatsapp: string;
  cidade: string;
  estado: string; // UF
  enderecoSede?: string;
  fotoOuBrasaoUrl?: string;
  anoFundacao?: string;
  aniversarioMc?: string;
  email?: string;
  instagram?: string;
  observacoes?: string;
  createdAt: string;
}

export interface NoticiaMoto {
  id: string;
  titulo: string;
  resumo: string;
  conteudoCompleto?: string;
  categoria: 'noticia' | 'dica_pilotagem' | 'tendencia_tecnologia' | 'pecas_marcas' | 'site_util';
  fonteNome: string; // Ex: Motoo, Motonline, Duas Rodas
  fonteUrl?: string; // Ex: https://www.motoo.com.br
  imagemUrl: string;
  data: string;
  tags?: string[];
  destaque?: boolean;
}

export interface ModuloVisibilidadePermissao {
  associado: boolean;
  diretoria: boolean;
}

export interface ConfiguracaoClube {
  id: string;
  nomeClube: string;
  lema: string;
  anoFundacao: string;
  logotipoUrl: string;
  telefoneContato: string;
  whatsappContato: string;
  emailContato: string;
  cidadeSede: string;
  estadoSede: string;
  chavePix: string;
  tipoChavePix: string;
  valorMensalidadePadrao: number;
  diaVencimentoPadrao: number;
  corPrimaria: string;
  corSecundaria: string;
  modulosVisibilidade?: Record<string, ModuloVisibilidadePermissao>;
  fonteFamilia?: string;
  fonteTamanhoEscala?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  updatedAt: string;
}

export interface AuditoriaLog {
  id: string;
  autorUid: string;
  autorEmail: string;
  acao: string;
  alvo: string;
  detalhes: string;
  timestamp: string;
}

export interface DoacaoRegistro {
  id: string;
  autorNome: string;
  autorIdentificador?: string; // CPF ou Matrícula
  tipo: 'financeiro' | 'alimentos' | 'agasalhos' | 'brinquedos' | 'outros';
  valor?: number;
  descricaoItens?: string;
  data: string;
  comprovanteUrl?: string;
  observacoes?: string;
}

export interface Campanha {
  id: string;
  titulo: string;
  descricao: string;
  tipoCampanha: 'alimentos' | 'agasalhos' | 'brinquedos' | 'financeira' | 'medicamentos' | 'outro';
  dataInicio: string; // DD/MM/AAAA
  dataFinal: string; // DD/MM/AAAA
  metaArrecadacaoValor?: number;
  metaArrecadacaoItens?: number;
  unidadeMeta: string; // "R$", "kg de alimentos", "peças de agasalho", "brinquedos", "cestas básicas"
  arrecadadoValor: number;
  arrecadadoItensCount: number;
  instituicaoRecebera: {
    nome: string;
    cnpj?: string;
    responsavel?: string;
    telefone?: string;
    cidade: string;
    bairro?: string;
    endereco?: string;
  };
  imagemMaterialUrl: string; // Cartaz / Banner da campanha para download e WhatsApp
  enderecoEntrega: string; // Endereço de entrega das doações ou Sede Matriz
  chavePixDoacao?: string;
  status: 'ativa' | 'encerrada';
  relatoEncerramento?: string; // Histórico de impacto social e fotos da entrega
  fotosEntrega?: string[];
  doacoes?: DoacaoRegistro[];
  createdAt: string;
}

export interface MembroDiretoriaLegal {
  id: string;
  cargo: string;
  nomeCompleto: string;
  cpf: string;
  whatsapp: string;
  dataInicio: string; // DD/MM/AAAA
}

export interface DocumentoChecklist {
  estatutoSocialRegistrado: boolean;
  estatutoUrl?: string;
  ataFundacaoEleicao: boolean;
  ataUrl?: string;
  cartaoCnpj: boolean;
  cartaoCnpjUrl?: string;
  comprovanteEnderecoSede: boolean;
  comprovanteEnderecoUrl?: string;
  regimentoInterno: boolean;
  regimentoInternoUrl?: string;
  logotipoBrasaoVetorizado: boolean;
  logotipoBrasaoUrl?: string;
}

export interface CadastroInstitucional {
  id: string;
  // 1. Dados Institucionais Básicos
  razaoSocial: string;
  nomeFantasia: string;
  dataFundacao: string; // DD/MM/AAAA
  cnpj: string;
  inscricaoEstadualMunicipal: string;
  naturezaJuridica: string;

  // 2. Sede e Localização
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  enderecoCompletoSede: string;
  telefoneInstitucional: string;
  emailOficial: string;
  redesSociaisSite: string;

  // 3. Diretoria Atual (Representação Legal)
  diretoriaAtual: MembroDiretoriaLegal[];

  // 4. Dados Bancários e Financeiros
  codigoBancario?: string;
  banco: string;
  tipoConta: string;
  agencia: string;
  conta: string;
  limiteConta?: number | string;
  telefoneBanco?: string;
  nomeGerente?: string;
  chavePixInstitucional: string;
  tipoChavePix?: string;

  // 5. Identidade do Moto Clube (Símbolos)
  significadoCoresBrasao: string;
  lemaSlogan: string;
  subsedesRegionais: string;

  // 6. Documentação Oficial (Checklist)
  checklistDocumentos: DocumentoChecklist;

  updatedAt: string;
  updatedBy?: string;
}

export interface LancamentoExtrato {
  id: string;
  data: string; // DD/MM/AAAA
  timestamp: number;
  tipo: 'credito' | 'debito';
  categoria: string;
  descricao: string;
  valor: number;
  documento?: string;
  origem: 'manual' | 'mensalidade_automatica';
  autorNome: string;
  autorEmail?: string;
  saldoApos?: number;
  createdAt: string;
}

export type TipoLembreteMensalidade =
  | 'preventivo_5d'
  | 'preventivo_2d'
  | 'dia_vencimento'
  | 'cobranca_atraso'
  | 'personalizado';

export interface LembreteMensalidadeAgendado {
  id: string;
  mensalidadeId: string;
  associadoId: string;
  nomeAssociado: string;
  numeroAssociado?: string;
  competencia: string;
  valor: number;
  vencimento: string; // DD/MM/AAAA
  dataHoraAgendada: string; // ISO string
  tipoLembrete: TipoLembreteMensalidade;
  status: 'agendado' | 'disparado' | 'cancelado';
  canalNavegador: boolean;
  notificadoNavegador?: boolean;
  disparadoEm?: string;
  mensagemPersonalizada?: string;
  createdAt: string;
}

export interface ConfiguracaoLembretesAutomaticos {
  ativo: boolean;
  diasPreventivos: number[];
  notificarNoVencimento: boolean;
  notificarAtraso: boolean;
  diasAposVencimentoAtraso: number;
  integrarNotificacaoNavegador: boolean;
  horarioPreferencialEnvio: string;
}
