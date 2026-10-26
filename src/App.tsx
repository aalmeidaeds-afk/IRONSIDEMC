import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoadThemeProvider } from './context/RoadThemeContext';
import {
  notifyNovoEvento,
  notifyNovoComunicado,
  iniciarLoopVerificacaoLembretes,
  cancelarLembretesDeMensalidade,
  agendarLembretesAutomaticosParaMensalidades,
} from './services/notificationService';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { AssociadosView } from './components/AssociadosView';
import { CarteirinhaDigital } from './components/CarteirinhaDigital';
import { VeiculosView } from './components/VeiculosView';
import { ManutencaoAbastecimentoView } from './components/ManutencaoAbastecimentoView';
import { FinanceiroView } from './components/FinanceiroView';
import { EventosView } from './components/EventosView';
import { ComunicadosView } from './components/ComunicadosView';
import { SosServicosView } from './components/SosServicosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { ValidarCarteirinhaModal } from './components/ValidarCarteirinhaModal';
import { PixModal } from './components/PixModal';
import { LoginModal } from './components/LoginModal';
import { TrocaSenhaDiretoriaModal } from './components/TrocaSenhaDiretoriaModal';
import { CampanhasView } from './components/CampanhasView';
import { AmigosMcView } from './components/AmigosMcView';
import { NoticiasMotosView } from './components/NoticiasMotosView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { VersionUpdatePrompt } from './components/VersionUpdatePrompt';
import { HostingerDeploymentModal } from './components/HostingerDeploymentModal';
import { InitialAuthGate } from './components/InitialAuthGate';
import { ModulesHubView } from './components/ModulesHubView';
import { CadastroInstitucionalView } from './components/CadastroInstitucionalView';
import { RelatoriosCentralView } from './components/RelatoriosCentralView';
import { RankEstradasView } from './components/RankEstradasView';
import { DinastiaBrandBadge } from './components/DinastiaBrandBadge';
import { ModalResetBancoDados } from './components/ModalResetBancoDados';
import { ManualAjudaUsuarioModal } from './components/ManualAjudaUsuarioModal';
import { ManualProgramacaoAdminModal } from './components/ManualProgramacaoAdminModal';
import { isModuleVisible } from './utils/moduleVisibility';
import { applyGlobalFont } from './utils/fontLoader';
import {
  DEFAULT_CONFIG,
  getConfiguracao,
  updateConfiguracao,
  getAssociados,
  createAssociado,
  updateAssociado,
  updateAssociadoSenha,
  getNextNumeroAssociado,
  desligarAssociadoPorCpf,
  getVeiculos,
  createVeiculo,
  updateVeiculo,
  deleteVeiculo,
  getManutencoes,
  createManutencao,
  getAbastecimentos,
  createAbastecimento,
  getEventos,
  createEvento,
  toggleInscricaoEvento,
  updatePresencaEvento,
  getMensalidades,
  createMensalidade,
  updateMensalidadeStatus,
  enviarComprovanteMensalidade,
  aprovarComprovanteMensalidade,
  rejeitarComprovanteMensalidade,
  getComunicados,
  createComunicado,
  getPrestadoresServicos,
  createPrestadorServico,
  getAuditoriaLogs,
  addAuditoriaLog,
  getCampanhas,
  createCampanha,
  updateCampanha,
  deleteCampanha,
  registrarDoacaoCampanha,
  encerrarCampanha,
  getAmigosMc,
  createAmigoMc,
  updateAmigoMc,
  deleteAmigoMc,
  getNoticiasMotos,
  createNoticiaMoto,
  DEFAULT_CADASTRO_INSTITUCIONAL,
  getCadastroInstitucional,
  saveCadastroInstitucional,
} from './services/db';
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
  Campanha,
  DoacaoRegistro,
  AmigoMotoClube,
  NoticiaMoto,
  CadastroInstitucional,
} from './types';
import { ShieldCheck, RefreshCw, AlertCircle, ArrowLeft, Layers, Lock } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    currentUser,
    userProfile,
    activeRole,
    currentAssociado,
    switchRolePersona,
    setCurrentAssociadoExplicitly,
  } = useAuth();

  // Initial Authentication Gate: starts locked to ask for Associado, Diretoria, or Administrador
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('hub_modulos');
  const [config, setConfig] = useState<ConfiguracaoClube>(DEFAULT_CONFIG);
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [prestadores, setPrestadores] = useState<ParceiroServico[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [amigosMc, setAmigosMc] = useState<AmigoMotoClube[]>([]);
  const [noticiasMotos, setNoticiasMotos] = useState<NoticiaMoto[]>([]);
  const [cadastroInstitucional, setCadastroInstitucional] = useState<CadastroInstitucional>(
    DEFAULT_CADASTRO_INSTITUCIONAL
  );

  const [loadingData, setLoadingData] = useState(true);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [selectedPixMensalidade, setSelectedPixMensalidade] = useState<Mensalidade | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [trocaSenhaModalOpen, setTrocaSenhaModalOpen] = useState(false);
  const [deploymentModalOpen, setDeploymentModalOpen] = useState(false);
  const [manualAjudaOpen, setManualAjudaOpen] = useState(false);
  const [manualProgramacaoOpen, setManualProgramacaoOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Load all data from Firestore
  const loadData = async () => {
    try {
      setLoadingData(true);
      const [
        cfg,
        assocList,
        veicList,
        manuList,
        fuelList,
        evList,
        mensList,
        comList,
        sosList,
        auditList,
        campList,
        amigosList,
        noticiasList,
        instData,
      ] = await Promise.all([
        getConfiguracao(),
        getAssociados(),
        getVeiculos(),
        getManutencoes(),
        getAbastecimentos(),
        getEventos(),
        getMensalidades(),
        getComunicados(),
        getPrestadoresServicos(),
        getAuditoriaLogs(),
        getCampanhas(),
        getAmigosMc(),
        getNoticiasMotos(),
        getCadastroInstitucional(),
      ]);

      setConfig(cfg || DEFAULT_CONFIG);
      setAssociados(assocList || []);
      setVeiculos(veicList || []);
      setManutencoes(manuList || []);
      setAbastecimentos(fuelList || []);
      setEventos(evList || []);
      setMensalidades(mensList || []);
      setComunicados(comList || []);
      setPrestadores(sosList || []);
      setAuditoriaLogs(auditList || []);
      setCampanhas(campList || []);
      setAmigosMc(amigosList || []);
      setNoticiasMotos(noticiasList || []);
      if (instData) {
        setCadastroInstitucional(instData);
      }


    } catch (err) {
      console.warn('Data load notice:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Aplicação da biblioteca global de fontes e escala de tamanho da fonte
  useEffect(() => {
    applyGlobalFont(config.fonteFamilia, config.fonteTamanhoEscala);
  }, [config.fonteFamilia, config.fonteTamanhoEscala]);

  // Listener para atualização instantânea do logo via File API e Storage
  useEffect(() => {
    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ logotipoUrl: string }>;
      if (customEvent.detail?.logotipoUrl) {
        setConfig((prev) => ({ ...prev, logotipoUrl: customEvent.detail.logotipoUrl }));
      }
    };
    window.addEventListener('ironside-logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('ironside-logo-updated', handleLogoUpdate);
  }, []);

  // Loop contínuo de verificação e disparo de lembretes automáticos de mensalidades no navegador
  useEffect(() => {
    if (mensalidades.length > 0) {
      agendarLembretesAutomaticosParaMensalidades(mensalidades);
    }
    const stopLoop = iniciarLoopVerificacaoLembretes(() => mensalidades, 45000);
    return () => stopLoop();
  }, [mensalidades]);

  // Operations
  const handleSaveCadastroInstitucional = async (data: Partial<CadastroInstitucional>) => {
    await saveCadastroInstitucional(data, currentUser?.email || undefined);
    const updated = await getCadastroInstitucional();
    setCadastroInstitucional(updated);
    const updatedConfig = await getConfiguracao();
    setConfig(updatedConfig);
  };

  const handleApproveAssociado = async (id: string) => {
    const nextNum = await getNextNumeroAssociado();
    const updatedFields: Partial<Associado> = {
      status: 'ativo',
      numeroAssociado: nextNum,
      aprovadoPor: currentUser?.displayName || 'Administrador',
      aprovadoEm: new Date().toLocaleDateString('pt-BR'),
    };
    await updateAssociado(id, updatedFields);
    await addAuditoriaLog(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@motoclube.com',
      'APROVACAO_ASSOCIADO',
      nextNum,
      `Associado ${id} aprovado com nova matrícula oficial ${nextNum}`
    );
    await loadData();
  };

  const handleApproveFiliacao = async (
    id: string,
    dados: {
      dataFiliacao: string;
      aprovadoPorDiretoria: string;
      numeroAtaFiliacao: string;
      cargo: string;
    }
  ) => {
    const target = associados.find((a) => a.id === id);
    let numAssoc = target?.numeroAssociado;
    if (!numAssoc || numAssoc === 'PENDENTE') {
      numAssoc = await getNextNumeroAssociado();
    }
    await updateAssociado(id, {
      status: 'ativo',
      numeroAssociado: numAssoc,
      dataFiliacao: dados.dataFiliacao,
      aprovadoPorDiretoria: dados.aprovadoPorDiretoria,
      numeroAtaFiliacao: dados.numeroAtaFiliacao,
      cargo: dados.cargo,
      aprovadoPor: dados.aprovadoPorDiretoria,
      aprovadoEm: dados.dataFiliacao,
    });
    await addAuditoriaLog(
      currentUser?.uid || 'diretoria',
      currentUser?.email || 'diretoria@motoclube.com',
      'HOMOLOGACAO_FILIACAO',
      numAssoc,
      `Filiação oficial homologada pela Diretoria: ${dados.aprovadoPorDiretoria} (Ata: ${dados.numeroAtaFiliacao})`
    );
    await loadData();
  };

  const handleDesligarAssociado = async (
    id: string,
    cpf: string,
    dados: {
      dataDesligamento: string;
      motivoDesligamento: string;
      desligadoPor: string;
    }
  ) => {
    await desligarAssociadoPorCpf(id, cpf, dados);
    await addAuditoriaLog(
      currentUser?.uid || 'diretoria',
      currentUser?.email || 'diretoria@motoclube.com',
      'DESLIGAMENTO_ASSOCIADO',
      cpf,
      `Associado desligado e CPF bloqueado para acesso Web e Android por ${dados.desligadoPor}. Motivo: ${dados.motivoDesligamento.slice(0, 150)}...`
    );
    await loadData();
  };

  const handleRejectAssociado = async (id: string, motivo: string) => {
    await updateAssociado(id, {
      status: 'rejeitado',
      observacoes: `Rejeitado: ${motivo}`,
    });
    await addAuditoriaLog(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@motoclube.com',
      'REJEICAO_ASSOCIADO',
      id,
      `Solicitação rejeitada com motivo: ${motivo}`
    );
    await loadData();
  };

  const handleSaveNewAssociado = async (data: Omit<Associado, 'id'>) => {
    const id = await createAssociado(data);
    await addAuditoriaLog(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@motoclube.com',
      'CRIACAO_ASSOCIADO',
      data.nome,
      `Novo cadastro criado para ${data.nome} (${data.email})`
    );
    await loadData();
  };

  const handleUpdateAssociado = async (id: string, data: Partial<Associado>) => {
    await updateAssociado(id, data);
    await loadData();
  };

  const handleSaveVeiculo = async (data: Omit<Veiculo, 'id'>) => {
    await createVeiculo(data);
    await loadData();
  };

  const handleUpdateVeiculo = async (id: string, data: Partial<Veiculo>) => {
    await updateVeiculo(id, data);
    await loadData();
  };

  const handleDeleteVeiculo = async (id: string) => {
    await deleteVeiculo(id);
    await loadData();
  };

  const handleSaveCampanha = async (data: Omit<Campanha, 'id'>) => {
    await createCampanha(data);
    await loadData();
  };

  const handleUpdateCampanha = async (id: string, data: Partial<Campanha>) => {
    await updateCampanha(id, data);
    await loadData();
  };

  const handleDeleteCampanha = async (id: string) => {
    await deleteCampanha(id);
    await loadData();
  };

  const handleRegistrarDoacao = async (
    campanhaId: string,
    doacao: Omit<DoacaoRegistro, 'id'>
  ) => {
    await registrarDoacaoCampanha(campanhaId, doacao);
    await loadData();
  };

  const handleEncerrarCampanha = async (
    campanhaId: string,
    relato: string,
    fotos?: string[]
  ) => {
    await encerrarCampanha(campanhaId, relato, fotos);
    await loadData();
  };

  const handleSaveAmigoMc = async (data: Omit<AmigoMotoClube, 'id'>) => {
    await createAmigoMc(data);
    await loadData();
  };

  const handleUpdateAmigoMc = async (id: string, data: Partial<AmigoMotoClube>) => {
    await updateAmigoMc(id, data);
    await loadData();
  };

  const handleDeleteAmigoMc = async (id: string) => {
    await deleteAmigoMc(id);
    await loadData();
  };

  const handleSaveNoticiaMoto = async (data: Omit<NoticiaMoto, 'id'>) => {
    await createNoticiaMoto(data);
    await loadData();
  };

  const handleSaveManutencao = async (data: Omit<Manutencao, 'id'>) => {
    await createManutencao(data);
    await loadData();
  };

  const handleSaveAbastecimento = async (data: Omit<Abastecimento, 'id'>) => {
    await createAbastecimento(data);
    await loadData();
  };

  const handleToggleInscricao = async (eventoId: string, associadoId: string) => {
    await toggleInscricaoEvento(eventoId, associadoId);
    await loadData();
  };

  const handleTogglePresenca = async (
    eventoId: string,
    associadoId: string,
    presente: boolean
  ) => {
    await updatePresencaEvento(eventoId, associadoId, presente);
    await loadData();
  };

  const handleSaveEvento = async (data: Omit<Evento, 'id'>) => {
    await createEvento(data);
    await loadData();
    notifyNovoEvento(data.titulo, `${data.data}${data.hora ? ` às ${data.hora}` : ''}`);
  };

  const handleSaveComunicado = async (data: Omit<Comunicado, 'id'>) => {
    await createComunicado(data);
    await loadData();
    notifyNovoComunicado(data.titulo, data.autor || 'Diretoria Iron Side');
  };

  const handleSavePrestador = async (data: Omit<ParceiroServico, 'id'>) => {
    await createPrestadorServico(data);
    await loadData();
  };

  const handleUpdateMensalidadeStatus = async (
    id: string,
    status: Mensalidade['status'],
    forma = 'PIX'
  ) => {
    await updateMensalidadeStatus(id, status, forma);
    if (status === 'pago') {
      cancelarLembretesDeMensalidade(id);
    }
    await addAuditoriaLog(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@motoclube.com',
      'BAIXA_MENSALIDADE',
      id,
      `Mensalidade marcada como ${status} via ${forma}`
    );
    await loadData();
  };

  const handleSubmitComprovante = async (
    mensalidadeId: string,
    fileDataUrl: string,
    fileName: string,
    fileType: string
  ) => {
    await enviarComprovanteMensalidade(mensalidadeId, fileDataUrl, fileName, fileType);
    await addAuditoriaLog(
      currentUser?.uid || 'associado',
      currentUser?.email || 'associado@ironsidemc.com.br',
      'ENVIO_COMPROVANTE',
      mensalidadeId,
      `Comprovante anexado (${fileName}) enviado para homologação da Diretoria Financeira.`
    );
    await loadData();
  };

  const handleAprovarComprovante = async (
    mensalidadeId: string,
    diretorNome = 'Diretoria Financeira'
  ) => {
    await aprovarComprovanteMensalidade(mensalidadeId, diretorNome);
    await loadData();
  };

  const handleRejeitarComprovante = async (
    mensalidadeId: string,
    motivo: string,
    diretorNome = 'Diretoria Financeira'
  ) => {
    await rejeitarComprovanteMensalidade(mensalidadeId, motivo, diretorNome);
    await loadData();
  };

  const handleCreateBatchMonth = async (
    competencia: string,
    ano: number,
    mes: number,
    valor: number,
    vencimento: string
  ) => {
    const ativos = associados.filter((a) => a.status === 'ativo');
    for (const assoc of ativos) {
      await createMensalidade({
        associadoId: assoc.id,
        nomeAssociado: assoc.nome,
        numeroAssociado: assoc.numeroAssociado,
        competencia,
        ano,
        mes,
        valor,
        vencimento,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      });
    }
    await addAuditoriaLog(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@motoclube.com',
      'GERACAO_LOTE_MENSALIDADE',
      competencia,
      `Geradas mensalidades para ${ativos.length} associados no valor de R$ ${valor.toFixed(2)}`
    );
    await loadData();
    // Agenda lembretes automáticos com integração ao navegador para os novos títulos
    const mensAtualizadas = await getMensalidades();
    agendarLembretesAutomaticosParaMensalidades(mensAtualizadas);
  };

  const handleSaveConfig = async (data: Partial<ConfiguracaoClube>) => {
    setConfig((prev) => ({ ...prev, ...data }));
    try {
      await updateConfiguracao(data);
      await addAuditoriaLog(
        currentUser?.uid || 'admin',
        currentUser?.email || 'admin@motoclube.com',
        'CONFIGURACAO_CLUBE',
        'geral',
        'Atualização de parâmetros e dados institucionais do Moto Clube'
      );
    } catch (err) {
      console.warn('Aviso ao sincronizar configurações:', err);
    }
  };

  const handleUpdateAssociadoSenha = async (associadoId: string, novaSenha: string) => {
    await updateAssociadoSenha(associadoId, novaSenha);
    await loadData();
  };

  const pendingCount = associados.filter(
    (a) => a.status === 'pendente' || a.status === 'em_analise'
  ).length;

  const currentOrFirstAssoc =
    currentAssociado ||
    (associados.length > 0
      ? associados[0]
      : {
          id: 'temp-1',
          uid: 'temp-1',
          numeroAssociado: 'MC-000001',
          nome: 'Roberto Silveira',
          nomeGuerra: 'Trovão Negro',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          dataNascimento: '15/04/1982',
          tipoSanguineo: 'O+',
          email: 'contato@aguiasdoasfalto.com.br',
          telefone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cnhNumero: '98765432100',
          cnhCategoria: 'A',
          cnhValidade: '20/12/2028',
          regional: 'São Paulo - Matriz',
          cargo: 'Presidente',
          status: 'ativo' as const,
          dataAssociacao: '10/01/2019',
          createdAt: new Date().toISOString(),
        });

  // PRIMEIRA TELA: Bloqueio inicial com Quadro de Escolha (ASSOCIADO | DIRETORIA | ADMINISTRADOR)
  if (!isUnlocked) {
    return (
      <InitialAuthGate
        config={config}
        onUpdateConfig={handleSaveConfig}
        onSuccess={(role, assoc, targetTab) => {
          switchRolePersona(role);
          if (assoc) {
            setCurrentAssociadoExplicitly(assoc);
          }
          setIsUnlocked(true);
          setActiveTab(targetTab || 'hub_modulos');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
      {/* Real-time Connectivity Status for Road Trips */}
      <OfflineBanner />

      {/* Automatic PWA / System Version Update Notification */}
      <VersionUpdatePrompt />

      {/* Top Header */}
      <Header
        config={config}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        onOpenTrocaSenhaModal={() => setTrocaSenhaModalOpen(true)}
        onOpenDeploymentModal={() => setDeploymentModalOpen(true)}
        onOpenHubModulos={() => setActiveTab('hub_modulos')}
        onLockOrLogout={() => setIsUnlocked(false)}
        onSaveConfig={handleSaveConfig}
        onOpenManualAjuda={() => setManualAjudaOpen(true)}
      />

      {/* Navigation Bar (Desktop view - on mobile the fixed bottom bar takes over) */}
      <div className="hidden md:block">
        <Navigation
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          pendingCount={pendingCount}
          config={config}
          onOpenManualAjuda={() => setManualAjudaOpen(true)}
        />
      </div>

      {/* Main Content Area (pb-28 on mobile ensures content scrolls above bottom bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 md:py-6">
        {loadingData ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-zinc-400 text-xs font-semibold">
              Carregando dados da nuvem Firestore...
            </p>
          </div>
        ) : (
          <>
            {/* Retorno à Central de Módulos (Menu Principal de Telas) */}
            {activeTab !== 'hub_modulos' && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md backdrop-blur-md mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub_modulos')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Voltar à Central de Módulos (Menu Principal)</span>
                </button>
                <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                  <span>Módulo Aberto:</span>
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-zinc-950 text-amber-400 border border-zinc-800 uppercase tracking-wider">
                    {activeTab === 'manutencao_abastecimento'
                      ? 'Manutenção & Combustível'
                      : activeTab === 'cadastro_institucional'
                      ? 'Módulo 00: Cadastro Institucional'
                      : activeTab.replace('_', ' ')}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-zinc-300 font-semibold uppercase text-[11px] px-2 py-0.5 rounded bg-zinc-800">
                    Perfil: {activeRole}
                  </span>
                </div>
              </div>
            )}

            {/* SEGUNDA TELA: CENTRAL DE MÓDULOS COM ÍCONES DAS TELAS MONTADAS */}
            {activeTab === 'hub_modulos' && (
              <ModulesHubView
                config={config}
                activeRole={activeRole}
                currentAssociado={currentAssociado}
                eventos={eventos}
                mensalidades={mensalidades}
                onOpenModule={(modId) => {
                  if (modId === 'manutencao') {
                    setActiveTab('manutencao_abastecimento');
                  } else {
                    setActiveTab(modId);
                  }
                }}
                onLockOrLogout={() => setIsUnlocked(false)}
                onOpenDeploymentModal={() => setDeploymentModalOpen(true)}
                onOpenManualAjuda={() => setManualAjudaOpen(true)}
                onOpenManualProgramacao={() => setManualProgramacaoOpen(true)}
                onOpenResetModal={() => setResetModalOpen(true)}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                associados={associados}
                veiculos={veiculos}
                mensalidades={mensalidades}
                manutencoes={manutencoes}
                eventos={eventos}
                comunicados={comunicados}
                config={config}
                onTabChange={(t) => setActiveTab(t)}
                onOpenNovoAssociado={() => setActiveTab('associados')}
                onOpenNovoEvento={() => setActiveTab('eventos')}
                onOpenNovoComunicado={() => setActiveTab('comunicados')}
                onOpenPixModal={(m) => setSelectedPixMensalidade(m)}
                onSaveConfig={handleSaveConfig}
              />
            )}

            {activeTab === 'associados' && (
              <AssociadosView
                associados={associados}
                veiculos={veiculos}
                mensalidades={mensalidades}
                eventos={eventos}
                config={config}
                onApprove={handleApproveAssociado}
                onApproveFiliacao={handleApproveFiliacao}
                onReject={handleRejectAssociado}
                onDesligar={handleDesligarAssociado}
                onSaveNew={handleSaveNewAssociado}
                onUpdate={handleUpdateAssociado}
              />
            )}

            {activeTab === 'carteirinha' && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-2xl font-black text-zinc-100 font-heading">
                    Carteira Oficial de Identificação do Associado
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Documento digital com validação por QR Code e dados médicos de emergência.
                  </p>
                </div>

                <CarteirinhaDigital
                  associado={currentOrFirstAssoc}
                  config={config}
                  associados={associados}
                  veiculos={veiculos}
                  onValidateClick={() => setValidationModalOpen(true)}
                />
              </div>
            )}

            {activeTab === 'veiculos' && (
              <VeiculosView
                veiculos={veiculos}
                associados={associados}
                onSaveNew={handleSaveVeiculo}
                onUpdate={handleUpdateVeiculo}
                onDelete={handleDeleteVeiculo}
                onOpenManutencaoForVeiculo={() => setActiveTab('manutencao_abastecimento')}
                onOpenAbastecimentoForVeiculo={() => setActiveTab('manutencao_abastecimento')}
              />
            )}

            {activeTab === 'manutencao_abastecimento' && (
              <ManutencaoAbastecimentoView
                veiculos={veiculos}
                manutencoes={manutencoes}
                abastecimentos={abastecimentos}
                onSaveManutencao={handleSaveManutencao}
                onSaveAbastecimento={handleSaveAbastecimento}
              />
            )}

            {activeTab === 'mensalidades' && (
              <FinanceiroView
                mensalidades={mensalidades}
                associados={associados}
                manutencoes={manutencoes}
                abastecimentos={abastecimentos}
                config={config}
                dadosInstitucionais={cadastroInstitucional}
                onUpdateStatus={handleUpdateMensalidadeStatus}
                onCreateBatchMonth={handleCreateBatchMonth}
                onOpenPixModal={(m) => setSelectedPixMensalidade(m)}
                onSubmitComprovante={handleSubmitComprovante}
                onAprovarComprovante={handleAprovarComprovante}
                onRejeitarComprovante={handleRejeitarComprovante}
              />
            )}

            {activeTab === 'eventos' && (
              <EventosView
                eventos={eventos}
                associados={associados}
                config={config}
                onSaveNew={handleSaveEvento}
                onToggleInscricao={handleToggleInscricao}
                onTogglePresenca={handleTogglePresenca}
              />
            )}

            {activeTab === 'comunicados' && (
              <ComunicadosView
                comunicados={comunicados}
                onSaveNew={handleSaveComunicado}
              />
            )}

            {activeTab === 'campanhas' && (
              <CampanhasView
                campanhas={campanhas}
                config={config}
                onSaveCampanha={handleSaveCampanha}
                onUpdateCampanha={handleUpdateCampanha}
                onDeleteCampanha={handleDeleteCampanha}
                onRegistrarDoacao={handleRegistrarDoacao}
                onEncerrarCampanha={handleEncerrarCampanha}
              />
            )}

            {activeTab === 'amigos_mc' && (
              <AmigosMcView
                amigos={amigosMc}
                onSaveNew={handleSaveAmigoMc}
                onUpdate={handleUpdateAmigoMc}
                onDelete={handleDeleteAmigoMc}
              />
            )}

            {activeTab === 'sos' && (
              <SosServicosView
                prestadores={prestadores}
                onSaveNew={handleSavePrestador}
              />
            )}

            {activeTab === 'noticias_motos' && (
              <NoticiasMotosView
                noticias={noticiasMotos}
                onSaveNew={handleSaveNoticiaMoto}
              />
            )}

            {activeTab === 'cadastro_institucional' && (
              <CadastroInstitucionalView
                dadosInstitucionais={cadastroInstitucional}
                config={config}
                onSave={handleSaveCadastroInstitucional}
                onSaveConfig={handleSaveConfig}
              />
            )}

            {(activeTab === 'relatorios_central' || activeTab === 'relatorios') && (
              <RelatoriosCentralView
                associados={associados}
                veiculos={veiculos}
                mensalidades={mensalidades}
                manutencoes={manutencoes}
                abastecimentos={abastecimentos}
                eventos={eventos}
                auditoriaLogs={auditoriaLogs}
                config={config}
                cadastroInstitucional={cadastroInstitucional}
                onNavigateToTab={(t) => setActiveTab(t)}
              />
            )}

            {(activeTab === 'rank_estradas' || activeTab === 'ranking') && (
              <RankEstradasView
                associados={associados}
                abastecimentos={abastecimentos}
                manutencoes={manutencoes}
                config={config}
                onOpenManutencao={() => setActiveTab('manutencao_abastecimento')}
              />
            )}

            {activeTab === 'configuracoes' && (
              activeRole === 'administrador' ? (
                <ConfiguracoesView
                  config={config}
                  auditoriaLogs={auditoriaLogs}
                  associados={associados}
                  veiculos={veiculos}
                  manutencoes={manutencoes}
                  abastecimentos={abastecimentos}
                  eventos={eventos}
                  mensalidades={mensalidades}
                  comunicados={comunicados}
                  prestadores={prestadores}
                  onSaveConfig={handleSaveConfig}
                  onUpdateAssociadoSenha={handleUpdateAssociadoSenha}
                  onApproveAssociado={handleApproveAssociado}
                  onReloadAssociados={loadData}
                  onOpenDeploymentModal={() => setDeploymentModalOpen(true)}
                  onTestRole={(r) => {
                    switchRolePersona(r);
                    setActiveTab('hub_modulos');
                  }}
                />
              ) : (
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-zinc-100">
                    Acesso Restrito ao Módulo 12
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O Módulo 12 (Configurações & Auditoria) é de acesso estritamente exclusivo do perfil Administrador.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('hub_modulos')}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer shadow-md"
                  >
                    Voltar à Central de Módulos
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Validation Modal */}
      {validationModalOpen && (
        <ValidarCarteirinhaModal
          associado={currentOrFirstAssoc}
          config={config}
          onClose={() => setValidationModalOpen(false)}
        />
      )}

      {/* PIX Modal */}
      {selectedPixMensalidade && (
        <PixModal
          mensalidade={selectedPixMensalidade}
          config={config}
          onClose={() => setSelectedPixMensalidade(null)}
          onSimulatePayment={async () => {
            await handleUpdateMensalidadeStatus(selectedPixMensalidade.id, 'pago', 'PIX');
            setSelectedPixMensalidade(null);
          }}
        />
      )}

      {/* Login & Acesso Modal */}
      {loginModalOpen && (
        <LoginModal
          config={config}
          onClose={() => setLoginModalOpen(false)}
          onOpenTrocaSenha={() => {
            setLoginModalOpen(false);
            setTrocaSenhaModalOpen(true);
          }}
          onSuccessLogin={(tab) => {
            setActiveTab(tab);
          }}
        />
      )}

      {/* Troca de Senha Diretoria Modal */}
      {trocaSenhaModalOpen && (
        <TrocaSenhaDiretoriaModal
          onClose={() => setTrocaSenhaModalOpen(false)}
          onSuccess={() => {
            setTrocaSenhaModalOpen(false);
          }}
        />
      )}

      {/* Central de Hospedagem Hostinger, Windows Setup (.exe) & APK Celulares (Módulo 13: Exclusivo Administrador) */}
      {activeRole === 'administrador' && (
        <HostingerDeploymentModal
          isOpen={deploymentModalOpen}
          onClose={() => setDeploymentModalOpen(false)}
        />
      )}

      {/* Central de Ajuda & Guia Ilustrado de Todas as Telas */}
      <ManualAjudaUsuarioModal
        isOpen={manualAjudaOpen}
        onClose={() => setManualAjudaOpen(false)}
        config={config}
      />

      {/* Manual de Programação e Arquitetura Técnica (Exclusivo Administrador) */}
      <ManualProgramacaoAdminModal
        isOpen={manualProgramacaoOpen}
        onClose={() => setManualProgramacaoOpen(false)}
        config={config}
      />

      {/* Modal: Reset Geral do Banco de Dados (Início das Operações Oficiais) */}
      <ModalResetBancoDados
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onResetComplete={async () => {
          setAssociados([]);
          setVeiculos([]);
          setManutencoes([]);
          setAbastecimentos([]);
          setEventos([]);
          setMensalidades([]);
          setComunicados([]);
          setPrestadores([]);
          setCampanhas([]);
          setAmigosMc([]);
          setNoticiasMotos([]);
          setAuditoriaLogs([]);
          await loadData();
        }}
        onSuccess={async () => {
          setAssociados([]);
          setVeiculos([]);
          setManutencoes([]);
          setAbastecimentos([]);
          setEventos([]);
          setMensalidades([]);
          setComunicados([]);
          setPrestadores([]);
          setCampanhas([]);
          setAmigosMc([]);
          setNoticiasMotos([]);
          setAuditoriaLogs([]);
          await loadData();
        }}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 pb-24 md:pb-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/ironside-logo.svg" alt="Iron Side Logo" className="w-7 h-7 object-contain" />
            <p className="font-club tracking-wider text-amber-400 font-bold">
              {config.nomeClube} • &ldquo;{config.lema}&rdquo;
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-zinc-400">
            <span>{config.cidadeSede} - {config.estadoSede}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Firebase Cloud Firestore Ativo
            </span>
            <span>•</span>
            {activeRole === 'administrador' ? (
              <button
                type="button"
                onClick={() => setDeploymentModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 hover:border-amber-500/40 font-semibold transition cursor-pointer"
                title="Módulo 13: Central de Hospedagem Hostinger, Setup Windows e APK (Exclusivo Administrador)"
              >
                <span>v1.2.1</span>
                <span>•</span>
                <span>Módulo 13: Hostinger & APKs</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-[11px]">
                v1.2.1
              </span>
            )}
          </div>
        </div>

        {/* Marca Dinastia System no rodapé de todas as partes do sistema */}
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <DinastiaBrandBadge variant="footer" />
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar (Android & iPhone native app feel) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        config={config}
        onOpenDeploymentModal={() => setDeploymentModalOpen(true)}
        onLockOrLogout={() => setIsUnlocked(false)}
        onOpenManualAjuda={() => setManualAjudaOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RoadThemeProvider>
        <MainApp />
      </RoadThemeProvider>
    </AuthProvider>
  );
}
