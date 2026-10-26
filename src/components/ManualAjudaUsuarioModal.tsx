import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Search,
  BookOpen,
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  Bike,
  Wrench,
  DollarSign,
  Calendar,
  Bell,
  LifeBuoy,
  HeartHandshake,
  Shield,
  Newspaper,
  Landmark,
  Settings,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Printer,
  Smartphone,
  Share2,
  FileText,
  KeyRound,
  Download,
} from 'lucide-react';
import { ConfiguracaoClube } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config?: ConfiguracaoClube;
  onNavigateTab?: (tabId: string) => void;
}

interface ModuloGuia {
  id: string;
  tabId: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  icone: React.ElementType;
  iconeCor: string;
  resumo: string;
  comoUsarPassos: string[];
  dicaOuro: string;
  destaques: string[];
  mockupTitulo: string;
  mockupDescricao: string;
}

export const ManualAjudaUsuarioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onNavigateTab,
}) => {
  const [busca, setBusca] = useState('');
  const [moduloSelecionado, setModuloSelecionado] = useState<string>('hub_modulos');

  if (!isOpen) return null;

  const modulosGuia: ModuloGuia[] = [
    {
      id: 'hub_modulos',
      tabId: 'hub_modulos',
      numero: 'Módulo Central',
      titulo: 'Central de Módulos (Mission Control)',
      subtitulo: 'Painel mestre de acesso rápido, telemetria e atalhos operacionais',
      icone: Layers,
      iconeCor: 'text-amber-400',
      resumo:
        'A Central de Módulos é a tela inicial do sistema. Nela você encontra os cards para acessar todas as funcionalidades com um único toque, status dos próximos eventos e atalhos inteligentes.',
      comoUsarPassos: [
        'Toque em qualquer card da grade para navegar diretamente para a tela desejada.',
        'Visualize o resumo dos 3 próximos passeios e eventos agendados para as próximas 48h.',
        'Verifique o indicador dinâmico de status da sua mensalidade (Verde = Quitado / Amarelo = Pendente).',
        'Utilize a barra de pesquisa rápida para filtrar funcionalidades pelo nome.',
      ],
      dicaOuro:
        'Você pode tocar no logotipo do clube no topo a qualquer momento para retornar à tela inicial ou tela de segurança.',
      destaques: [
        'Acesso a todos os 15 módulos do sistema',
        'Status em tempo real de eventos',
        'Indicador visual de mensalidade',
      ],
      mockupTitulo: 'Central de Módulos • 15 Módulos Integrados',
      mockupDescricao: 'Layout estilo Mission Control com cards de alta legibilidade para tela de celular e computador.',
    },
    {
      id: 'dashboard',
      tabId: 'dashboard',
      numero: 'Módulo 01',
      titulo: 'Dashboard Geral & Indicadores',
      subtitulo: 'Métricas executivas, estatísticas da frota e balanço financeiro',
      icone: LayoutDashboard,
      iconeCor: 'text-sky-400',
      resumo:
        'Visão analítica completa com gráficos e indicadores-chave de desempenho do Moto Clube: total de associados regulares, cilindrada média da frota, taxas de adimplência e próximos eventos.',
      comoUsarPassos: [
        'Acompanhe os cartões métricos no topo da tela com totais e percentuais.',
        'Role a tela para visualizar a distribuição de cargos e regionais.',
        'Confira o gráfico de histórico de arrecadação e comparativo de despesas.',
      ],
      dicaOuro:
        'No celular, os cartões métricos possuem rolagem horizontal suave para facilitar a leitura com uma mão só.',
      destaques: ['Indicadores financeiros', 'Contagem de membros ativos', 'Cilindrada acumulada'],
      mockupTitulo: 'Visão Geral Executiva',
      mockupDescricao: 'Gráficos interativos e estatísticas vitais do clube.',
    },
    {
      id: 'cadastro_institucional',
      tabId: 'cadastro_institucional',
      numero: 'Módulo 02',
      titulo: 'Cadastro Institucional & Diretoria Legal',
      subtitulo: 'Estatuto social, CNPJ, dados bancários e composição da diretoria',
      icone: Landmark,
      iconeCor: 'text-emerald-400',
      resumo:
        'Área oficial contendo toda a base jurídica do Moto Clube: Razão Social, CNPJ, conta bancária, ata de eleição, composição da Diretoria com CPFs e documentação estatutária registrada.',
      comoUsarPassos: [
        'Consulte a razão social e o CNPJ oficial do Moto Clube.',
        'Acesse a lista da Diretoria Executiva em exercício com seus cargos oficiais.',
        'Baixe cópias digitalizadas do Estatuto Social e Cartão CNPJ em PDF.',
      ],
      dicaOuro:
        'Use esta tela sempre que precisar comprovar a formalização jurídica do clube perante prefeituras, federações ou patrocinadores.',
      destaques: ['Documentos com download PDF', 'Composição da Diretoria', 'Dados bancários oficiais'],
      mockupTitulo: 'Dossiê Institucional Registrado',
      mockupDescricao: 'Dados jurídicos em conformidade com o Código Civil brasileiro.',
    },
    {
      id: 'associados',
      tabId: 'associados',
      numero: 'Módulo 03',
      titulo: 'Quadro de Associados & Ficha Cadastral',
      subtitulo: 'Gestão de membros, filtro por regional e ficha cadastral oficial em PDF',
      icone: Users,
      iconeCor: 'text-amber-400',
      resumo:
        'Gerenciamento completo dos associados. Permite cadastrar novos membros com preenchimento automático via busca de CEP na internet, aprovar filiações, aplicar termos LGPD e gerar a Ficha Cadastral em PDF com 20 dígitos de autenticidade.',
      comoUsarPassos: [
        'Utilize a barra de pesquisa para buscar membros por nome, apelido, CPF ou matrícula.',
        'Toque em "Ver Ficha" para inspecionar todo o dossiê individual do associado.',
        'Toque em "PDF" para abrir a Ficha Cadastral Oficial com cabeçalho, todos os dados e código de autenticidade no rodapé.',
        'Na visualização do PDF, toque em "WhatsApp" ou "E-mail" para compartilhar o documento diretamente como anexo.',
      ],
      dicaOuro:
        'No celular, toque em "Abrir no Navegador" na tela do PDF para navegar em tela cheia com zoom tátil suave.',
      destaques: [
        'Ficha Cadastral em PDF de alta resolução',
        'Chave de autenticidade aleatória de 20 caracteres',
        'Compartilhamento nativo WhatsApp e E-mail',
        'Busca de endereço via CEP na internet',
      ],
      mockupTitulo: 'Ficha Cadastral Oficial com Autenticidade',
      mockupDescricao: 'Documento completo com dados civis, médicos, veículos e hash de integridade.',
    },
    {
      id: 'carteirinha',
      tabId: 'carteirinha',
      numero: 'Módulo 04',
      titulo: 'Carteirinha Digital de Membro',
      subtitulo: 'Credencial eletrônica oficial com QR Code e validação em tempo real',
      icone: CreditCard,
      iconeCor: 'text-violet-400',
      resumo:
        'Carteirinha de membro oficial com efeito holográfico de estrada. Exibe foto, tipo sanguíneo com fator Rh, matrícula, cargo, lema do clube e QR Code criptográfico para checagem rápida em eventos.',
      comoUsarPassos: [
        'Toque na carteirinha para girar e visualizar o verso com contatos de emergência e termos.',
        'Apresente o QR Code na portaria de eventos ou pedágios parceiros.',
        'Utilize o botão "Validar Carteirinha" para escanear a credencial de outro irmão de estrada.',
      ],
      dicaOuro:
        'A carteirinha digital funciona mesmo sem conexão com a internet através do cache local seguro do aplicativo.',
      destaques: ['QR Code dinâmico', 'Tipo sanguíneo em destaque', 'Modo offline garantido'],
      mockupTitulo: 'Credencial Digital com Efeito Holográfico',
      mockupDescricao: 'Identidade oficial do associado para apresentar em qualquer lugar do país.',
    },
    {
      id: 'veiculos',
      tabId: 'veiculos',
      numero: 'Módulo 05',
      titulo: 'Frota de Motocicletas & CRLV Digital',
      subtitulo: 'Cadastro detalhado de motos, especificações técnicas e documento anexado',
      icone: Bike,
      iconeCor: 'text-orange-400',
      resumo:
        'Registro de todas as motos dos associados: marca, modelo, ano, placa, cilindrada, chassi (VIN), renavam e anexo em PDF ou foto do documento CRLV de licenciamento.',
      comoUsarPassos: [
        'Clique em "Cadastrar Nova Moto" e informe os dados da motocicleta.',
        'Anexe a imagem ou PDF do documento CRLV para tê-lo sempre à mão nas viagens.',
        'Consulte a soma total de cilindradas e média de anos da frota do clube.',
      ],
      dicaOuro:
        'Manter o CRLV anexado permite comprovar a procedência da moto em blitzes e comboios rodoviários.',
      destaques: ['Armazenamento de CRLV', 'Dados mecânicos e potência', 'Chassi e Renavam protegidos'],
      mockupTitulo: 'Garagem Oficial do Clube',
      mockupDescricao: 'Controle de toda a frota de duas rodas dos integrantes.',
    },
    {
      id: 'manutencao_abastecimento',
      tabId: 'manutencao_abastecimento',
      numero: 'Módulo 06',
      titulo: 'Manutenção & Calculadora de Combustível',
      subtitulo: 'Histórico de revisões, troca de óleo e calculadora de consumo médio',
      icone: Wrench,
      iconeCor: 'text-yellow-400',
      resumo:
        'Controle de saúde mecânica da sua máquina. Registre trocas de óleo, pneus e revisões preventivas com alerta de quilometragem. Inclui calculadora de consumo de combustível (km/l) e autonomia.',
      comoUsarPassos: [
        'Aba "Manutenções": registre serviços realizados, oficina e custo.',
        'Aba "Combustível": insira os litros abastecidos e o odômetro para cálculo automático de consumo.',
        'Aba "Calculadora": planeje paradas em postos com base no consumo médio da sua moto.',
      ],
      dicaOuro:
        'Cadastre a previsão da próxima troca de óleo para receber alertas antes dos passeios longos.',
      destaques: ['Calculadora km/l', 'Previsão de revisões', 'Controle de gastos com peças'],
      mockupTitulo: 'Telemetria & Histórico de Manutenção',
      mockupDescricao: 'Evite panes na estrada mantendo o histórico de revisões em dia.',
    },
    {
      id: 'mensalidades',
      tabId: 'mensalidades',
      numero: 'Módulo 07',
      titulo: 'Financeiro, Mensalidades & Gráficos',
      subtitulo: 'Quitação com chave PIX, envio de comprovante e gráfico Recharts de 6 meses',
      icone: DollarSign,
      iconeCor: 'text-emerald-400',
      resumo:
        'Módulo financeiro oficial. Permite ao associado pagar mensalidades via chave PIX e anexar comprovante. A diretoria conta com gráfico interativo de linha (Recharts) dos últimos 6 meses, homologação de baixas e extrato bancário.',
      comoUsarPassos: [
        'Associado: toque em "Pagar com PIX" para copiar a chave da Tesouraria e anexe a foto/PDF do comprovante.',
        'Diretoria: analise comprovantes enviados e dê baixa com um clique ("Aprovar Comprovante").',
        'Lembretes no Navegador: use o botão "Lembretes Automáticos" para agendar notificações preventivas e de cobrança diretamente no navegador.',
        'Analise o gráfico interativo de evolução financeira (pagas vs. pendentes) mês a mês.',
        'Gere mensalidades em lote para todos os associados ativos para o mês seguinte.',
      ],
      dicaOuro:
        'Ative as notificações do navegador para receber avisos automáticos 5 dias antes, 2 dias antes e no dia do vencimento da sua mensalidade.',
      destaques: [
        'Gráfico Recharts dos últimos 6 meses',
        'Lembretes automáticos no navegador (Web Notifications)',
        'Envio e homologação de comprovantes',
        'Geração de lote mensal automatizada',
      ],
      mockupTitulo: 'Gestão Financeira & Gráficos Interativos',
      mockupDescricao: 'Transparência total com gráfico de receitas e adimplência.',
    },
    {
      id: 'eventos',
      tabId: 'eventos',
      numero: 'Módulo 08',
      titulo: 'Passeios, Eventos & Galeria de Fotos',
      subtitulo: 'Calendário de viagens, lista de presença com um clique e fotos dos passeios',
      icone: Calendar,
      iconeCor: 'text-sky-400',
      resumo:
        'Planejamento de viagens e bate-e-voltas. Veja data, hora, ponto de encontro, rota, previsão de tempo e confirme presença. Conta com galeria de fotos capturadas na estrada pelos membros.',
      comoUsarPassos: [
        'Toque em "Confirmar Presença" no evento para garantir sua vaga no comboio.',
        'Na tela do passeio, toque no carrossel de fotos para ver ou enviar fotos da câmera do celular.',
        'A diretoria pode exportar a lista de presença em PDF para controle na estrada.',
      ],
      dicaOuro:
        'O organizador pode marcar a presença real dos associados no ponto de encontro para controle de frequência.',
      destaques: ['Carrossel de fotos dos passeios', 'Controle de vagas e inscritos', 'Rotas e pontos de parada'],
      mockupTitulo: 'Calendário de Viagens & Galeria de Fotos',
      mockupDescricao: 'Organize comboios seguros e registre os melhores momentos da irmandade.',
    },
    {
      id: 'comunicados',
      tabId: 'comunicados',
      numero: 'Módulo 09',
      titulo: 'Mural de Comunicados & Notificações',
      subtitulo: 'Avisos da diretoria, convocações de reuniões e avisos de urgência',
      icone: Bell,
      iconeCor: 'text-yellow-400',
      resumo:
        'Mural oficial de recados com classificação por prioridade (Normal, Alta, Urgente). Garante que todos os irmãos fiquem sabendo de decisões de assembleia, regras de conduta e chamadas da diretoria.',
      comoUsarPassos: [
        'Leia os comunicados fixados no topo com prioridade máxima.',
        'Diretoria: crie comunicados com título, conteúdo e nível de urgência.',
        'O sino de notificações no cabeçalho exibe quantos comunicados novos você ainda não leu.',
      ],
      dicaOuro:
        'Comunicados urgentes aparecem com borda vermelha pulsante para alertar sobre mudanças de última hora.',
      destaques: ['Alertas por prioridade', 'Contador de não lidos no cabeçalho', 'Mural fixo de diretoria'],
      mockupTitulo: 'Mural Oficial de Notificações',
      mockupDescricao: 'Comunicação direta da presidência e diretoria com todos os associados.',
    },
    {
      id: 'sos',
      tabId: 'sos',
      numero: 'Módulo 10',
      titulo: 'SOS Estrada & Rede de Prestadores 24h',
      subtitulo: 'Guinchos de moto, oficinas especializadas e resgate por geolocalização',
      icone: LifeBuoy,
      iconeCor: 'text-red-400',
      resumo:
        'Central de resgate rodoviário. Encontre guinchos com prancha para moto, borracharias 24h, oficinas especializadas e hospitais nas principais rodovias, com botão de discagem rápida e WhatsApp.',
      comoUsarPassos: [
        'Filtre prestadores por categoria (Guincho, Oficina, Borracharia, Hospital, Chaveiro).',
        'Toque em "Ligar Agora" ou "Abrir WhatsApp" para socorro imediato.',
        'Visualize o endereço e desconto especial para associados do moto clube.',
      ],
      dicaOuro:
        'Cadastre o telefone do guincho de confiança da sua região para que outros irmãos possam utilizá-lo em caso de pane.',
      destaques: ['Atendimento 24h', 'Discagem de emergência com 1 toque', 'Descontos para membros'],
      mockupTitulo: 'Rede SOS Estrada 24 Horas',
      mockupDescricao: 'Segurança e resgate para ninguém ficar parado na estrada.',
    },
    {
      id: 'campanhas',
      tabId: 'campanhas',
      numero: 'Módulo 11',
      titulo: 'Campanhas Sociais & Doações',
      subtitulo: 'Ações de solidariedade, arrecadação de agasalhos e brinquedos via PIX',
      icone: HeartHandshake,
      iconeCor: 'text-emerald-400',
      resumo:
        'O motociclismo com coração. Gerenciamento de campanhas beneficentes (Páscoa Solidária, Campanha do Agasalho, Natal dos Motociclistas). Permite acompanhar meta financeira e registrar doações.',
      comoUsarPassos: [
        'Acompanhe a barra de progresso da meta da campanha ativa.',
        'Contribua via chave PIX e anexe o comprovante de doação solidária.',
        'Veja a lista de doadores e o valor arrecadado em prol das instituições.',
      ],
      dicaOuro:
        'A prestação de contas é pública para todos os associados com extrato transparente das doações.',
      destaques: ['Barra de meta percentual', 'Registro de doações solidárias', 'Prestação de contas'],
      mockupTitulo: 'Ação Social & Solidariedade',
      mockupDescricao: 'Projetos comunitários que fortalecem a imagem do moto clube na sociedade.',
    },
    {
      id: 'amigos_mc',
      tabId: 'amigos_mc',
      numero: 'Módulo 12',
      titulo: 'Irmandade & Moto Clubes Amigos',
      subtitulo: 'Lista de MCs parceiros, sedes, aniversários e contatos de presidentes',
      icone: Shield,
      iconeCor: 'text-sky-400',
      resumo:
        'Rede de respeito e diplomacia entre clubes. Registre moto clubes parceiros, datas de aniversário de fundação, contato de presidentes, endereço das sedes e canais oficiais do Instagram.',
      comoUsarPassos: [
        'Consulte sedes de motoclubes irmãos para planejar paradas e visitas em viagens.',
        'Acompanhe as datas comemorativas de aniversário dos MCs parceiros.',
        'Toque no botão do WhatsApp para falar diretamente com os presidentes e diretores de eventos.',
      ],
      dicaOuro:
        'Excelente para parabenizar clubes parceiros em seus aniversários e reforçar laços de lealdade no asfalto.',
      destaques: ['Calendário de aniversários de MCs', 'Contatos diretos de presidentes', 'Endereços de sedes'],
      mockupTitulo: 'Irmandade & Alianças de Estrada',
      mockupDescricao: 'Diplomacia, lealdade e confraternização entre clubes amigos.',
    },
    {
      id: 'noticias_motos',
      tabId: 'noticias_motos',
      numero: 'Módulo 13',
      titulo: 'Portal de Notícias & Dicas de Pilotagem',
      subtitulo: 'Lançamentos de motos, novidades do motociclismo e segurança viária',
      icone: Newspaper,
      iconeCor: 'text-amber-400',
      resumo:
        'Feed informativo sobre o mundo das duas rodas: dicas de pilotagem defensiva na chuva e serra, avaliações mecânicas, novidades de lançamentos mundiais e legislações de trânsito.',
      comoUsarPassos: [
        'Role os cards de notícias com imagens e resumos das matérias.',
        'Toque em uma matéria para ler as orientações técnicas ou abrir o site oficial de referência.',
        'Filtre matérias por categoria (Dicas de Pilotagem, Tendências, Manutenção ou Notícias).',
      ],
      dicaOuro:
        'Compartilhe as dicas de segurança com novos membros para elevar o padrão de pilotagem do grupo.',
      destaques: ['Pilotagem em condições adversas', 'Lançamentos mecânicos', 'Legislação e segurança'],
      mockupTitulo: 'Portal de Notícias & Cultura Duas Rodas',
      mockupDescricao: 'Conteúdo informativo para manter os motociclistas sempre atualizados.',
    },
    {
      id: 'configuracoes',
      tabId: 'configuracoes',
      numero: 'Módulo 14',
      titulo: 'Painel do Administrador & Configurações',
      subtitulo: 'Controle de módulos, troca de logotipo, tipografia online e reset master',
      icone: Settings,
      iconeCor: 'text-violet-400',
      resumo:
        'Painel restrito de controle do Administrador. Permite ligar/desligar módulos do sistema, trocar o logotipo via File API & Firebase Storage, mudar fontes da internet (Google Fonts) e tamanho da letra, gerenciar senhas, gerar backups com integridade e executar o Reset Master do banco de dados.',
      comoUsarPassos: [
        'Aba "Centro de Comando": visão executiva e indicadores do sistema.',
        'Aba "Controle de Módulos": use as chaves liga/desliga para ocultar ou exibir telas para associados e diretoria.',
        'Aba "Tipografia & Fontes": escolha entre 12 famílias tipográficas do Google Fonts e ajuste o tamanho das letras.',
        'Botão "Reset do Banco de Dados": limpa os dados de teste para iniciar operações reais (exige senha mascarada com padrão "Disnatia2026").',
      ],
      dicaOuro:
        'Qualquer alteração feita neste módulo reflete instantaneamente em todos os celulares conectados sem necessidade de novo deploy.',
      destaques: [
        'Chaves liga/desliga de módulos',
        'Upload e redimensionamento de logo',
        'Biblioteca de fontes online Google Fonts',
        'Reset Master para início de operações',
      ],
      mockupTitulo: 'Centro de Comando & Configuração Master',
      mockupDescricao: 'Controle total da plataforma na ponta dos dedos do administrador.',
    },
  ];

  const modulosFiltrados = modulosGuia.filter((m) => {
    const termo = busca.toLowerCase();
    return (
      m.titulo.toLowerCase().includes(termo) ||
      m.subtitulo.toLowerCase().includes(termo) ||
      m.resumo.toLowerCase().includes(termo) ||
      m.destaques.some((d) => d.toLowerCase().includes(termo))
    );
  });

  const moduloAtivo =
    modulosGuia.find((m) => m.id === moduloSelecionado) || modulosGuia[0];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl h-[95vh] bg-zinc-900 border border-amber-500/50 rounded-3xl flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2 font-heading">
                Central de Ajuda &amp; Manual de Uso de Todas as Telas
              </h2>
              <p className="text-xs text-zinc-400">
                Guia ilustrado com índice completo de navegação e instruções de fácil compreensão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Stats */}
        <div className="p-3.5 bg-zinc-950/80 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Pesquisar módulo, funcionalidade ou dúvida..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 self-end sm:self-center">
            <span className="font-semibold text-zinc-300">Índice:</span>
            <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-amber-400 font-bold">
              {modulosGuia.length} Módulos Catalogados
            </span>
          </div>
        </div>

        {/* Content Layout: Sidebar Index (Left) + Detail & Visual Mockup (Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Index Sidebar */}
          <div className="w-full md:w-80 bg-zinc-950/60 border-b md:border-b-0 md:border-r border-zinc-800 overflow-y-auto p-2.5 space-y-1.5 shrink-0 max-h-48 md:max-h-none">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 block mb-1">
              Índice Geral de Telas:
            </span>
            {modulosFiltrados.map((m) => {
              const Icon = m.icone;
              const isSelected = m.id === moduloAtivo.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModuloSelecionado(m.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm'
                      : 'hover:bg-zinc-900 border border-transparent text-zinc-300'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-zinc-500 font-mono block leading-none">
                      {m.numero}
                    </span>
                    <span className="text-xs font-bold truncate block mt-0.5">
                      {m.titulo}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-zinc-900/60">
            {/* Header of Active Module */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-zinc-950 border border-amber-500/40 rounded-2xl text-amber-400 shrink-0">
                  <moduloAtivo.icone className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                      {moduloAtivo.numero}
                    </span>
                    <h3 className="text-lg font-black text-zinc-100 font-heading">
                      {moduloAtivo.titulo}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {moduloAtivo.subtitulo}
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab(moduloAtivo.tabId);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer shrink-0 self-start sm:self-center"
                >
                  <span>Abrir Tela Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Visual Simulation / Screen Mockup */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-[11px] font-mono text-zinc-400 ml-2">
                    Simulação Visual: {moduloAtivo.mockupTitulo}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  Interface Ativa
                </span>
              </div>

              {/* Graphical UI Card Representation */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <moduloAtivo.icone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">
                        {config?.nomeClube || 'IRON SIDE ROAD RIDER M.C.'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {moduloAtivo.mockupDescricao}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                    100% OPERACIONAL
                  </span>
                </div>

                {/* Highlights tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {moduloAtivo.destaques.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-300 border border-zinc-800 text-[10px] font-medium"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumo do Módulo */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                O que é esta tela e para que serve:
              </h4>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800/80">
                {moduloAtivo.resumo}
              </p>
            </div>

            {/* Como Usar Passo a Passo */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span>Instruções de Uso Passo a Passo:</span>
              </h4>
              <div className="space-y-2">
                {moduloAtivo.comoUsarPassos.map((passo, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-200"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{passo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dica de Ouro da Estrada */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <div className="p-1.5 rounded-lg bg-amber-500 text-zinc-950 shrink-0">
                <CheckCircle2 className="w-4 h-4 font-bold" />
              </div>
              <div>
                <strong className="text-amber-300 block font-bold mb-0.5">
                  Dica de Ouro de Estrada:
                </strong>
                <p className="text-[11px] leading-relaxed text-amber-100/90">
                  {moduloAtivo.dicaOuro}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
