import React, { useState } from 'react';
import {
  Code,
  ShieldAlert,
  Server,
  Database,
  Lock,
  Cpu,
  Layers,
  FileCode2,
  HardDrive,
  Workflow,
  X,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  KeyRound,
  FileText,
  RotateCcw,
  Zap,
  ShieldCheck,
  Smartphone,
  Eye,
  BellRing,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfiguracaoClube } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config?: ConfiguracaoClube;
  onOpenResetModal?: () => void;
}

export const ManualProgramacaoAdminModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onOpenResetModal,
}) => {
  const { activeRole, currentUser } = useAuth();
  const [secaoAtiva, setSecaoAtiva] = useState<string>('arquitetura');
  const [copiado, setCopiado] = useState<string | null>(null);

  if (!isOpen) return null;

  // Trava de segurança: acesso estritamente restrito ao perfil Administrador
  if (activeRole !== 'administrador') {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="w-full max-w-md bg-zinc-900 border-2 border-red-500 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-black text-red-400 font-heading">
            Acesso Restrito: Exclusivo Perfil Administrador
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Este manual detalha a programação interna, arquitetura NoSQL, credenciais mestras e chaves criptográficas do sistema. Somente o perfil <strong>Administrador</strong> possui autorização para consulta.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    );
  }

  const copiarTrecho = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2500);
  };

  const secoes = [
    { id: 'arquitetura', label: '1. Arquitetura & Stack', icon: Cpu },
    { id: 'firestore', label: '2. Banco NoSQL Firestore', icon: Database },
    { id: 'seguranca', label: '3. Regras de Segurança & RBAC', icon: Lock },
    { id: 'storage_logo', label: '4. Storage & Redimensionamento', icon: HardDrive },
    { id: 'pdf_hash', label: '5. Motor de PDF & Hash 20 Dígitos', icon: FileText },
    { id: 'fontes', label: '6. Injeção de Fontes Online', icon: Code },
    { id: 'offline_pwa', label: '7. Modo Offline & PWA', icon: Smartphone },
    { id: 'reset_operacoes', label: '8. Reset Master de Operações', icon: RotateCcw },
    { id: 'lembretes_notificacoes', label: '9. Motor de Lembretes & Browser Push', icon: BellRing },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl h-[95vh] bg-zinc-900 border-2 border-amber-500/60 rounded-3xl flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl text-amber-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-100 font-heading">
                  Manual de Configuração &amp; Programação Detalhada
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/40">
                  Acesso Exclusivo Administrador
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Engenharia de software, modelos NoSQL, criptografia de 20 dígitos, injeção de fontes e reset
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout: Sidebar + Detail Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation */}
          <div className="w-full md:w-72 bg-zinc-950/70 border-b md:border-b-0 md:border-r border-zinc-800 p-2.5 space-y-1.5 shrink-0 max-h-48 md:max-h-none overflow-y-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 block mb-1">
              Módulos Técnicos do Sistema:
            </span>
            {secoes.map((s) => {
              const Icon = s.icon;
              const isSelected = s.id === secaoAtiva;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSecaoAtiva(s.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 cursor-pointer text-xs font-bold ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                      : 'hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-zinc-900/60">
            {/* 1. ARQUITETURA GERAL */}
            {secaoAtiva === 'arquitetura' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <Cpu className="w-5 h-5" />
                      1. Arquitetura de Software &amp; Stack Tecnológica
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Padrão de desenvolvimento SPA reativo em Vite com React 19 e TypeScript Strict
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    Vite 6 • React 19 • TS 5
                  </span>
                </div>

                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Diagrama em Camadas da Aplicação:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-zinc-900 rounded-xl border border-sky-500/30">
                      <span className="text-[10px] text-sky-400 font-bold block uppercase">Camada 1: Apresentação</span>
                      <strong className="text-zinc-100 block mt-1">React 19 + Tailwind v4</strong>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Componentes modulares, Lucide Icons, Recharts e modais responsivos com toque móvel.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900 rounded-xl border border-amber-500/30">
                      <span className="text-[10px] text-amber-400 font-bold block uppercase">Camada 2: Serviços &amp; Estado</span>
                      <strong className="text-zinc-100 block mt-1">Hooks &amp; Context API</strong>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        <code>AuthContext</code>, <code>useLogoUpload</code>, <code>useVersionCheck</code> e <code>fontLoader</code>.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900 rounded-xl border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase">Camada 3: Persistência</span>
                      <strong className="text-zinc-100 block mt-1">Cloud Firestore + Dexie.js</strong>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Sincronização híbrida online/offline com fila de mutações e cache local IndexedDB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Estrutura de Pastas do Código Fonte:
                  </h4>
                  <pre className="p-3 bg-zinc-900 rounded-xl text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed">
{`/src
├── components/          # 48 componentes React da interface
│   ├── Header.tsx       # Topbar com hook de logo e alternador de papéis
│   ├── AssociadosView   # Gestão de membros e disparo do PDF
│   ├── VisualizadorPdf  # Preview do PDF, WhatsApp e E-mail nativos
│   └── Configuracoes    # Painel mestre de configurações e reset
├── services/            # Serviços de integração externa e regras
│   ├── db.ts            # Camada Firestore CRUD e rotinas de reset
│   ├── fichaCadastralPdfService.ts # Motor jsPDF com chave 20 chars
│   └── offlineDb.ts     # IndexedDB local via Dexie
├── hooks/               # Custom hooks reutilizáveis (useLogoUpload...)
├── utils/               # fontLoader.ts, moduleVisibility.ts...
└── types/               # Tipagem estrita TypeScript`}
                  </pre>
                </div>
              </div>
            )}

            {/* 2. FIRESTORE NOSQL */}
            {secaoAtiva === 'firestore' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      2. Modelagem de Dados no Cloud Firestore
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Coleções NoSQL otimizadas com referências indexadas e chaves compostas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                    <strong className="text-amber-400 block font-mono">/associados</strong>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Armazena fichas cadastrais completas, dados civis (CPF, RG, CNH), dados médicos protegidos por LGPD e URL da assinatura digital.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                    <strong className="text-amber-400 block font-mono">/veiculos</strong>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Frota de motos vinculadas ao <code>associadoId</code>, ano de fabricação, modelo, placa, cilindrada cc, renavam e CRLV digitalizado.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                    <strong className="text-amber-400 block font-mono">/mensalidades</strong>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Lançamentos com competência, vencimento, valor, status (pago/pendente), chave PIX e anexo do comprovante de pagamento.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                    <strong className="text-amber-400 block font-mono">/configuracoes (doc: "geral")</strong>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Dados do moto clube (nome, lema, logo, chave PIX, <code>fonteFamilia</code>, <code>fonteTamanhoEscala</code> e permissões de módulos).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SEGURANÇA & RBAC */}
            {secaoAtiva === 'seguranca' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      3. Controle de Acesso Baseado em Papéis (RBAC) &amp; LGPD
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Três perfis com níveis estritos de autorização no sistema
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-amber-500/40">
                    <strong className="text-amber-400 text-sm">Perfil Administrador:</strong>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Acesso mestre e irrestrito. Pode habilitar/desabilitar módulos via toggle, trocar a logo e a tipografia online, restaurar backups e executar o Reset Master do banco de dados com autorização por senha.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-sky-500/40">
                    <strong className="text-sky-400 text-sm">Perfil Diretoria:</strong>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Gestão de filiações, aprovação de cadastros, homologação de comprovantes de mensalidade, criação de eventos e comunicados. Sem permissão de reset destrutivo ou alteração de regras do sistema.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-emerald-500/40">
                    <strong className="text-emerald-400 text-sm">Perfil Associado:</strong>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Acesso exclusivo aos próprios dados (carteirinha, ficha cadastral, suas motos, suas mensalidades com pagamento PIX e confirmação de presença em eventos). Protegido pela Lei nº 13.709/2018 (LGPD).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. STORAGE & HOOK LOGO */}
            {secaoAtiva === 'storage_logo' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      4. Processamento de Imagens &amp; Hook useLogoUpload
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Redimensionamento no cliente com HTML5 Canvas e persistência em tempo real
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <p className="text-zinc-300 leading-relaxed">
                    O hook <code>useLogoUpload</code> implementado no <code>Header.tsx</code> permite carregar arquivos de imagem via File API. Antes de enviar para a nuvem, a imagem é renderizada em um elemento <code>HTMLCanvasElement</code> com dimensionamento máximo de 512x512 pixels e algoritmo de suavização em alta definição.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    ✓ Suporte a Firebase Storage com fallback automático para Base64 Data URL, garantindo 0 falhas mesmo se as regras de storage estiverem bloqueadas.
                  </p>
                </div>
              </div>
            )}

            {/* 5. MOTOR DE PDF & CHAVE DE 20 DÍGITOS */}
            {secaoAtiva === 'pdf_hash' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      5. Motor de PDF &amp; Chave Aleatória de 20 Dígitos
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Geração de A4 vetorial com jsPDF, AutoTable, código de 20 caracteres e compartilhamento
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 text-xs">
                  <div className="p-3 bg-zinc-900 rounded-lg font-mono text-amber-300 text-xs">
                    Exemplo de Chave no Rodapé: 9K4F-7R2M-8W1Q-5X3B-6D0P (20 Caracteres)
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    A função <code>gerarChaveAutenticidade20Chars()</code> utiliza <code>crypto.getRandomValues</code> para gerar 20 caracteres alfanuméricos embaralhados sem ambiguidade visual. Um hash determinístico SHA-256 é computado vinculando a matrícula e o CPF do associado, sendo inserido em todas as páginas do documento e no rodapé oficial.
                  </p>
                  <p className="text-zinc-300 leading-relaxed">
                    No visualizador móvel, o botão <strong>"Abrir no Navegador"</strong> cria uma instância de Blob nativa que abre em tela cheia no Safari e Chrome, enquanto a Web Share API aciona o envio do PDF diretamente como anexo no WhatsApp e E-mail.
                  </p>
                </div>
              </div>
            )}

            {/* 6. TIPOGRAFIA ONLINE */}
            {secaoAtiva === 'fontes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      6. Injeção Dinâmica de Fontes do Google Fonts
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Alteração em tempo de execução via CSS Variables e link tag sem deploy
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <p className="text-zinc-300 leading-relaxed">
                    A função <code>applyGlobalFont(fontFamilyId, fontScaleId)</code> injeta dinamicamente o link da fonte selecionada no <code>document.head</code> (com preconnect ao <code>fonts.gstatic.com</code>) e atualiza as variáveis CSS <code>--app-font-family</code> e <code>--app-font-size-scale</code> no <code>document.documentElement</code>.
                  </p>
                  <p className="text-amber-400 font-bold">
                    Desta forma, todo o sistema (cabeçalhos, textos, cartões e botões) herda a fonte e tamanho imediatamente, persistindo as preferências no Firestore e no localStorage.
                  </p>
                </div>
              </div>
            )}

            {/* 7. OFFLINE & PWA */}
            {secaoAtiva === 'offline_pwa' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <Smartphone className="w-5 h-5" />
                      7. Arquitetura Offline-First &amp; PWA Standalone
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Funcionamento contínuo em estradas sem sinal celular
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <p className="text-zinc-300 leading-relaxed">
                    O aplicativo implementa o padrão PWA com <code>manifest.json</code> e armazenamento IndexedDB via Dexie.js. Quando o associado viaja por regiões sem sinal de operadora, os dados da carteirinha, CRLV e SOS continuam acessíveis. Mutações criadas offline são enfileiradas e sincronizadas automaticamente assim que o sinal for restabelecido.
                  </p>
                </div>
              </div>
            )}

            {/* 8. RESET MASTER DE OPERAÇÕES */}
            {secaoAtiva === 'reset_operacoes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-red-400 flex items-center gap-2">
                      <RotateCcw className="w-5 h-5" />
                      8. Procedimento de Reset Master para Início de Operações
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Limpeza de dados simulados com autorização por senha mascarada
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-2xl space-y-3 text-xs">
                  <strong className="text-red-300 block text-sm">
                    Especificações do Botão Reset Master:
                  </strong>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    <li>
                      <strong>Localização:</strong> Disponível no painel do Administrador (Centro de Comando e Módulo 14).
                    </li>
                    <li>
                      <strong>Senha de Segurança Padrão:</strong> <code>Disnatia2026</code> (campo estritamente mascarado com caracteres de ponto; a senha nunca é exposta na tela).
                    </li>
                    <li>
                      <strong>Troca de Senha Sem Senha Anterior:</strong> Conforme solicitado, o administrador pode alterar a senha de reset a qualquer momento diretamente sem precisar informar a senha anterior.
                    </li>
                    <li>
                      <strong>O que é limpo:</strong> Associados de teste, veículos, manutenções, abastecimentos, eventos, mensalidades, comunicados, campanhas e auditoria.
                    </li>
                    <li>
                      <strong>O que é preservado:</strong> Identidade do clube (nome, brasão, logo, sede, lema, chave PIX, tipografia) e documentação institucional registrada.
                    </li>
                  </ul>

                  {onOpenResetModal && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenResetModal();
                          onClose();
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-red-600/30"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Abrir Janela de Reset de Operações</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 9. MOTOR DE LEMBRETES AUTOMÁTICOS & WEB NOTIFICATIONS */}
            {secaoAtiva === 'lembretes_notificacoes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      <BellRing className="w-5 h-5" />
                      9. Motor de Lembretes Automáticos &amp; Notificações do Navegador
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Disparo programado no Service Worker e Web Notifications API
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 text-xs">
                  <p className="text-zinc-300 leading-relaxed">
                    O módulo <code>src/services/notificationService.ts</code> implementa um agendador inteligente de cobrança preventiva e de inadimplência:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    <li>
                      <strong>Agendamento em Lote:</strong> <code>agendarLembretesAutomaticosParaMensalidades()</code> calcula automaticamente os dias de disparo: 5 dias antes, 2 dias antes, dia do vencimento e 2 dias após vencimento.
                    </li>
                    <li>
                      <strong>Notificação Nativa do Navegador:</strong> <code>dispararNotificacaoNavegador()</code> utiliza a Web Notification API (ou Service Worker em modo PWA) com vibração e ícones oficiais.
                    </li>
                    <li>
                      <strong>Loop de Background:</strong> <code>iniciarLoopVerificacaoLembretes()</code> roda periodicamente no ciclo de vida do React, disparando os alertas assim que o horário limite é atingido.
                    </li>
                    <li>
                      <strong>Cancelamento Automático por Pagamento:</strong> Se a mensalidade for quitada via PIX ou aprovada pela diretoria, os lembretes pendentes associados são automaticamente cancelados com <code>cancelarLembretesDeMensalidade()</code>.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
