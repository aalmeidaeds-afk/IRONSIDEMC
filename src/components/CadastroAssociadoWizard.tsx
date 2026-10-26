import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  KeyRound,
  Shield,
  Camera,
  Bike,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Heart,
  Calendar,
  Lock,
  Upload,
  RefreshCw,
  Search,
} from 'lucide-react';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { Associado, ConfiguracaoClube, Veiculo, Mensalidade } from '../types';
import { createAssociado, updateAssociado, createVeiculo, createMensalidade, addAuditoriaLog } from '../services/db';
import { processUniversalImageFile } from '../utils/imageUploadHelper';

interface Props {
  config: ConfiguracaoClube;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (associado: Associado) => void;
  initialAssociado?: Associado | null;
  mode?: 'create' | 'edit';
}

export const CadastroAssociadoWizard: React.FC<Props> = ({
  config,
  isOpen,
  onClose,
  onSuccess,
  initialAssociado,
  mode = 'create',
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const [createdAssociadoData, setCreatedAssociadoData] = useState<Associado | null>(null);

  // Form states
  // Step 1: Credenciais
  const [cpf, setCpf] = useState(initialAssociado?.cpf || '');
  const [senha, setSenha] = useState(initialAssociado?.senha || '');
  const [confirmSenha, setConfirmSenha] = useState(initialAssociado?.senha || '');

  // Step 2: Dados Pessoais & Foto
  const [nome, setNome] = useState(initialAssociado?.nome || '');
  const [nomeGuerra, setNomeGuerra] = useState(initialAssociado?.nomeGuerra || '');
  const [rg, setRg] = useState(initialAssociado?.rg || '');
  const [dataNascimento, setDataNascimento] = useState(initialAssociado?.dataNascimento || '');
  const [tipoSanguineo, setTipoSanguineo] = useState(initialAssociado?.tipoSanguineo || 'O+');
  const [cnhNumero, setCnhNumero] = useState(initialAssociado?.cnhNumero || '');
  const [cnhCategoria, setCnhCategoria] = useState(initialAssociado?.cnhCategoria || 'A');
  const [cnhValidade, setCnhValidade] = useState(initialAssociado?.cnhValidade || '');
  const [fotoUrl, setFotoUrl] = useState(
    initialAssociado?.fotoUrl ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  );
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when initialAssociado changes
  React.useEffect(() => {
    if (initialAssociado) {
      setCpf(initialAssociado.cpf || '');
      setSenha(initialAssociado.senha || '123456');
      setConfirmSenha(initialAssociado.senha || '123456');
      setNome(initialAssociado.nome || '');
      setNomeGuerra(initialAssociado.nomeGuerra || '');
      setRg(initialAssociado.rg || '');
      setDataNascimento(initialAssociado.dataNascimento || '');
      setTipoSanguineo(initialAssociado.tipoSanguineo || 'O+');
      setCnhNumero(initialAssociado.cnhNumero || '');
      setCnhCategoria(initialAssociado.cnhCategoria || 'A');
      setCnhValidade(initialAssociado.cnhValidade || '');
      if (initialAssociado.fotoUrl) setFotoUrl(initialAssociado.fotoUrl);
      setEmail(initialAssociado.email || '');
      setTelefone(initialAssociado.telefone || '');
      setWhatsapp(initialAssociado.whatsapp || '');
      setCep(initialAssociado.cep || '');
      setLogradouro(initialAssociado.logradouro || '');
      setNumero(initialAssociado.numero || '');
      setComplemento(initialAssociado.complemento || '');
      setBairro(initialAssociado.bairro || '');
      setCidade(initialAssociado.cidade || '');
      setEstado(initialAssociado.estado || '');
      if (initialAssociado.assinaturaDigitalUrl) {
        setAssinaturaDataUrl(initialAssociado.assinaturaDigitalUrl);
      }
      setAceitouTermos(true);
    }
  }, [initialAssociado]);

  // Step 3: Endereço & Contatos
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState(config.cidadeSede || 'São Paulo');
  const [estado, setEstado] = useState(config.estadoSede || 'SP');
  const [estadoCivil, setEstadoCivil] = useState('Casado(a)');
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState('');
  const [contatoEmergenciaParentesco, setContatoEmergenciaParentesco] = useState('Esposa');
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState('');
  const [alergiaMedicamento, setAlergiaMedicamento] = useState('Nenhuma');

  // Step 4: Minha Moto (Veículo inicial)
  const [motoMarca, setMotoMarca] = useState('BMW');
  const [motoModelo, setMotoModelo] = useState('R 1250 GS');
  const [motoAno, setMotoAno] = useState('2024');
  const [motoCor, setMotoCor] = useState('Preta Triple Black');
  const [motoPlaca, setMotoPlaca] = useState('');
  const [motoKm, setMotoKm] = useState('12500');
  const [motoCilindrada, setMotoCilindrada] = useState('1254');

  // Step 5: Termo & Assinatura Digital
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouLgpd, setAceitouLgpd] = useState(true);

  if (!isOpen) return null;

  // Mascaras
  const formatCpf = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  };

  const formatCep = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  };

  const formatPhone = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  // Buscar CEP
  const handleBuscarCep = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setErrorMsg('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setErrorMsg(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrorMsg('CEP não localizado.');
        return;
      }
      setLogradouro(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');
    } catch {
      setErrorMsg('Não foi possível consultar o CEP automaticamente.');
    }
  };

  // Câmera ao vivo
  const handleStartCamera = async () => {
    try {
      setIsCapturingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorMsg('Não foi possível acessar a câmera do dispositivo.');
      setIsCapturingCamera(false);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFotoUrl(dataUrl);
    }
    // Stop stream
    if (videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCapturingCamera(false);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg(null);
      const res = await processUniversalImageFile(file);
      setFotoUrl(res.dataUrl);
    } catch {
      setErrorMsg('Não foi possível processar a foto selecionada. Tente outro formato.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Validações por passo
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        setErrorMsg('Informe um CPF completo com 11 dígitos.');
        return false;
      }
      if (!senha || senha.length < 6) {
        setErrorMsg('A senha deve possuir no mínimo 6 caracteres.');
        return false;
      }
      if (senha !== confirmSenha) {
        setErrorMsg('A confirmação de senha não confere.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!nome.trim() || !nomeGuerra.trim()) {
        setErrorMsg('Informe o Nome Completo e o Nome de Guerra (Vulgo na estrada).');
        return false;
      }
      if (!dataNascimento.trim()) {
        setErrorMsg('Informe a data de nascimento.');
        return false;
      }
      if (!cnhNumero.trim()) {
        setErrorMsg('Informe o número da CNH de motociclista.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!telefone.trim() || !email.trim()) {
        setErrorMsg('Informe o telefone celular e o e-mail de contato.');
        return false;
      }
      if (!logradouro.trim() || !numero.trim() || !cidade.trim()) {
        setErrorMsg('Preencha o endereço completo (Logradouro, Número e Cidade).');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!motoModelo.trim() || !motoPlaca.trim()) {
        setErrorMsg('Informe o Modelo e a Placa da motocicleta.');
        return false;
      }
      return true;
    }

    if (step === 5) {
      if (!aceitouTermos) {
        setErrorMsg('Você precisa aceitar os termos do Estatuto e Código de Conduta para continuar.');
        return false;
      }
      if (!assinaturaDataUrl) {
        setErrorMsg('Por favor, faça sua assinatura digital no quadro utilizando o touch ou mouse.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Finalizar e Alimentar Bancos
  const handleFinalSubmit = async () => {
    if (!validateStep(5)) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const nowIso = new Date().toISOString();
      const cleanCpf = cpf.replace(/\D/g, '');

      // Se for edição de associado existente (ex: em análise ou pendente)
      if (initialAssociado) {
        const updatedFields: Partial<Associado> = {
          nome,
          nomeGuerra,
          senha,
          cpf,
          rg,
          dataNascimento,
          tipoSanguineo,
          email,
          telefone: telefone || whatsapp,
          whatsapp: whatsapp || telefone,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cnhNumero,
          cnhCategoria,
          cnhValidade,
          fotoUrl,
          assinaturaDigitalUrl: assinaturaDataUrl || initialAssociado.assinaturaDigitalUrl,
          contatosEmergencia: contatoEmergenciaNome
            ? [
                {
                  nome: contatoEmergenciaNome,
                  parentesco: contatoEmergenciaParentesco,
                  telefone: contatoEmergenciaTelefone || telefone,
                },
              ]
            : initialAssociado.contatosEmergencia,
        };
        await updateAssociado(initialAssociado.id, updatedFields);
        await addAuditoriaLog({
          autorUid: initialAssociado.id,
          autorEmail: email,
          acao: 'ATUALIZACAO_CADASTRO_PROPRIO',
          alvo: `${nome} (${cleanCpf})`,
          detalhes: `Associado atualizou suas informações cadastrais e fotos no sistema.`,
          timestamp: new Date().toISOString(),
        });
        const completeUpdated: Associado = {
          ...initialAssociado,
          ...updatedFields,
        };
        setCreatedAssociadoData(completeUpdated);
        setCompletedSuccess(true);
        onSuccess(completeUpdated);
        setSubmitting(false);
        return;
      }

      // 1. Criar Associado (Status PENDENTE aguardando aprovação da Diretoria)
      const novoAssociadoData: Omit<Associado, 'id'> = {
        uid: `assoc-auto-${Date.now()}`,
        numeroAssociado: 'PENDENTE',
        nome,
        nomeGuerra,
        senha, // Gravada para conferência de login do associado
        cpf,
        rg,
        dataNascimento,
        tipoSanguineo,
        email,
        telefone: telefone || whatsapp,
        whatsapp: whatsapp || telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cnhNumero,
        cnhCategoria,
        cnhValidade,
        regional: `${cidade} - ${estado}`,
        cargo: 'Aspirante / Próspero',
        status: 'pendente', // IMPORTANTE: Só liberado após homologação da Diretoria
        fotoUrl,
        dataAssociacao: new Date().toLocaleDateString('pt-BR'),
        estadoCivil,
        alergiaMedicamento: {
          possui: alergiaMedicamento !== 'Nenhuma' && alergiaMedicamento.trim() !== '',
          descricao: alergiaMedicamento,
        },
        alergiaAlimentacao: { possui: false, descricao: '' },
        problemaSaude: { possui: false, descricao: '' },
        pcd: { possui: false, descricao: '' },
        consentimentoLgpd: aceitouLgpd,
        dataConsentimentoLgpd: new Date().toLocaleDateString('pt-BR'),
        termoResponsabilidadeAceito: true,
        dataAssinaturaTermo: new Date().toLocaleString('pt-BR'),
        assinaturaDigitalUrl: assinaturaDataUrl,
        observacoes: `Auto-cadastro realizado pelo portal online. Termo de filiação e responsabilidade assinado digitalmente em ${new Date().toLocaleString('pt-BR')}.`,
        contatosEmergencia: contatoEmergenciaNome
          ? [
              {
                nome: contatoEmergenciaNome,
                parentesco: contatoEmergenciaParentesco,
                telefone: contatoEmergenciaTelefone || telefone,
              },
            ]
          : [],
        createdAt: nowIso,
      };

      const associadoId = await createAssociado(novoAssociadoData);
      const completeAssociado: Associado = {
        id: associadoId,
        ...novoAssociadoData,
      };

      // 2. Alimentar Banco de Veículos (Minhas Motos)
      const novoVeiculoData: Omit<Veiculo, 'id'> = {
        associadoId,
        associadoNome: `${nome} (${nomeGuerra})`,
        tipo: 'moto',
        marca: motoMarca,
        modelo: motoModelo,
        ano: motoAno,
        cor: motoCor,
        placa: motoPlaca.toUpperCase(),
        kmAtual: Number(motoKm) || 0,
        cilindradaCc: Number(motoCilindrada) || 0,
        fotoUrl:
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        observacoes: 'Motocicleta cadastrada no pedido de filiação oficial.',
        createdAt: nowIso,
      };
      await createVeiculo(novoVeiculoData);

      // 3. Alimentar Banco Financeiro (Primeira Mensalidade Pendente)
      const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const novaMensalidade: Omit<Mensalidade, 'id'> = {
        associadoId,
        nomeAssociado: nome,
        numeroAssociado: 'PENDENTE',
        competencia: currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1),
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        valor: config.valorMensalidadePadrao || 85.0,
        vencimento: `10/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
        status: 'pendente',
        createdAt: nowIso,
      };
      await createMensalidade(novaMensalidade);

      // 4. Registrar em Auditoria
      await addAuditoriaLog({
        autorUid: associadoId,
        autorEmail: email,
        acao: 'AUTO_CADASTRO_FILIACAO',
        alvo: `${nome} (${cleanCpf})`,
        detalhes: `Novo cadastro de filiação enviado com termo assinado digitalmente. Aguardando deliberação da Diretoria.`,
        timestamp: nowIso,
      });

      setCreatedAssociadoData(completeAssociado);
      setCompletedSuccess(true);
      onSuccess(completeAssociado);
    } catch (err) {
      console.error('Erro ao finalizar cadastro:', err);
      setErrorMsg('Ocorreu um erro ao gravar as informações no banco. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header do Wizard */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-zinc-100 font-heading">
                  Filiação & Cadastro de Integrante
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {config.nomeClube}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Crie seu login, informe seus dados completos e assine o termo digitalmente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso Sequencial (Passos 1 a 5) */}
        {!completedSuccess && (
          <div className="px-6 py-3 bg-zinc-950/70 border-b border-zinc-800/70 shrink-0">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {[
                { step: 1, label: 'Acesso & Senha' },
                { step: 2, label: 'Identificação' },
                { step: 3, label: 'Endereço' },
                { step: 4, label: 'Minha Moto' },
                { step: 5, label: 'Assinatura' },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      currentStep === item.step
                        ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20 shadow-md'
                        : currentStep > item.step
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {currentStep > item.step ? '✓' : item.step}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 hidden sm:block ${
                      currentStep === item.step ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tela de Sucesso */}
          {completedSuccess && (
            <div className="py-8 text-center space-y-5 animate-fade-in max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-black text-zinc-100 font-heading">
                  Cadastro Realizado com Sucesso!
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Bem-vindo à irmandade, <strong className="text-amber-400">{nomeGuerra}</strong>! Suas
                  informações, motocicleta e termo assinado digitalmente foram recebidos e salvos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                  <span>Status do Cadastro:</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PENDENTE (Aguardando Homologação da Diretoria)
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Login Registrado:</span>
                  <span className="font-mono text-zinc-200 font-bold">{cpf}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Moto Vinculada na Garagem:</span>
                  <span className="text-zinc-200 font-bold">
                    {motoMarca} {motoModelo} ({motoPlaca.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
                <p className="font-bold mb-1">Importante sobre a Liberação do Acesso:</p>
                Por determinação do estatuto, assim que a Diretoria homologar sua filiação em ata oficial, seu acesso a todos os módulos do perfil Associado será liberado automaticamente com seu CPF e senha!
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition shadow-lg cursor-pointer"
              >
                Voltar à Tela de Login
              </button>
            </div>
          )}

          {/* PASSO 1: Acesso & Credenciais */}
          {!completedSuccess && currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Passo 1 de 5: Definição de Login e Senha
                </p>
                <p className="text-zinc-300">
                  Seu CPF será utilizado como login oficial no aplicativo. Crie uma senha segura para acessar sua carteirinha, motos e mensalidades.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    CPF (Será o seu Login de Acesso) *
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Crie sua Senha de Acesso *
                    </label>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Confirme a Senha *
                    </label>
                    <input
                      type="password"
                      value={confirmSenha}
                      onChange={(e) => setConfirmSenha(e.target.value)}
                      placeholder="Repita a mesma senha"
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: Identificação & Foto */}
          {!completedSuccess && currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              {/* 1. Nome Completo e Nome de Guerra SEMPRE PRIMEIRO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silveira"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Nome de Guerra / Apelido no Clube *
                  </label>
                  <input
                    type="text"
                    value={nomeGuerra}
                    onChange={(e) => setNomeGuerra(e.target.value)}
                    placeholder="Ex: Fênix, Trovão, Corisco"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Seção de Foto Oficial liberada APENAS após preencher ambos os nomes */}
              {nome.trim() && nomeGuerra.trim() ? (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 text-xs text-zinc-300 space-y-3 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-zinc-900 shrink-0 shadow-md">
                        <img src={fotoUrl} alt="Foto Perfil" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Foto Oficial do Integrante: {nomeGuerra}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Sua foto será exibida na Carteirinha Digital oficial, na ficha cadastral e nos relatórios por CPF.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Câmera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-zinc-700 shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Galeria / Computador</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelected}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-dashed border-zinc-800 text-xs text-zinc-400 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <p>
                    <strong className="text-zinc-200">Atenção:</strong> Preencha primeiro seu{' '}
                    <span className="text-amber-400 font-semibold">Nome Completo</span> e o{' '}
                    <span className="text-amber-400 font-semibold">Nome de Guerra</span> acima para desbloquear a captura da sua foto oficial.
                  </p>
                </div>
              )}

              {/* Video Camera Capture View */}
              {isCapturingCamera && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-3">
                  <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg"
                    >
                      Tirar Foto Agora
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCapturingCamera(false)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">RG *</label>
                  <input
                    type="text"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                    placeholder="00.000.000-0"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Data de Nascimento *
                  </label>
                  <input
                    type="text"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Tipo Sanguíneo (Fator RH) *
                  </label>
                  <select
                    value={tipoSanguineo}
                    onChange={(e) => setTipoSanguineo(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-red-400 font-bold focus:border-amber-400 focus:outline-none"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Número de Registro CNH *
                  </label>
                  <input
                    type="text"
                    value={cnhNumero}
                    onChange={(e) => setCnhNumero(e.target.value)}
                    placeholder="00000000000"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Categoria da CNH *
                  </label>
                  <select
                    value={cnhCategoria}
                    onChange={(e) => setCnhCategoria(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="A">A (Moto)</option>
                    <option value="AB">AB (Moto e Carro)</option>
                    <option value="AC">AC (Moto e Caminhão)</option>
                    <option value="AD">AD (Moto e Ônibus)</option>
                    <option value="AE">AE (Moto e Articulado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Validade da CNH *
                  </label>
                  <input
                    type="text"
                    value={cnhValidade}
                    onChange={(e) => setCnhValidade(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3: Endereço & Contatos */}
          {!completedSuccess && currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    E-mail de Contato *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(11) 90000-0000"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Telefone Secundário
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="(11) 90000-0000"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-zinc-200">Endereço Residencial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">CEP *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(formatCep(e.target.value))}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleBuscarCep}
                        className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Logradouro (Rua / Av.) *
                    </label>
                    <input
                      type="text"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="Ex: Av. Paulista"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Número *</label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Bairro</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Cidade *</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Estado (UF) *</label>
                    <input
                      type="text"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      placeholder="SP"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Contato de Emergência na Estrada */}
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <Heart className="w-4 h-4" />
                  <span>Contato de Emergência para Viagens em Comboio</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Nome do Contato</label>
                    <input
                      type="text"
                      value={contatoEmergenciaNome}
                      onChange={(e) => setContatoEmergenciaNome(e.target.value)}
                      placeholder="Ex: Maria Silveira"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Parentesco</label>
                    <input
                      type="text"
                      value={contatoEmergenciaParentesco}
                      onChange={(e) => setContatoEmergenciaParentesco(e.target.value)}
                      placeholder="Esposa, Irmão, Mãe"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={contatoEmergenciaTelefone}
                      onChange={(e) => setContatoEmergenciaTelefone(formatPhone(e.target.value))}
                      placeholder="(11) 98888-8888"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4: Minha Moto (Alimentação da Frota) */}
          {!completedSuccess && currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-amber-400" />
                  Alimentação do Módulo Minhas Motos & Frota
                </p>
                <p className="text-zinc-300">
                  Cadastre sua motocicleta principal. Ela será automaticamente vinculada à sua garagem e constará no comboio oficial do clube.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Marca da Moto *</label>
                  <select
                    value={motoMarca}
                    onChange={(e) => setMotoMarca(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  >
                    {[
                      'BMW',
                      'Harley-Davidson',
                      'Triumph',
                      'Honda',
                      'Yamaha',
                      'Kawasaki',
                      'Suzuki',
                      'Ducati',
                      'Royal Enfield',
                      'KTM',
                      'Outra',
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Modelo da Motocicleta *
                  </label>
                  <input
                    type="text"
                    value={motoModelo}
                    onChange={(e) => setMotoModelo(e.target.value)}
                    placeholder="Ex: R 1250 GS Adventure / Fat Boy 114"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Ano de Fabricação / Modelo *
                  </label>
                  <input
                    type="text"
                    value={motoAno}
                    onChange={(e) => setMotoAno(e.target.value)}
                    placeholder="2024"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Cor *</label>
                  <input
                    type="text"
                    value={motoCor}
                    onChange={(e) => setMotoCor(e.target.value)}
                    placeholder="Ex: Preta / Azul"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Placa *</label>
                  <input
                    type="text"
                    value={motoPlaca}
                    onChange={(e) => setMotoPlaca(e.target.value.toUpperCase())}
                    placeholder="ABC1D23"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-amber-400 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Cilindrada (cc)
                  </label>
                  <input
                    type="number"
                    value={motoCilindrada}
                    onChange={(e) => setMotoCilindrada(e.target.value)}
                    placeholder="1254"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASSO 5: Termo de Responsabilidade & Assinatura Digital Touch/Mouse */}
          {!completedSuccess && currentStep === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-2 max-h-48 overflow-y-auto">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Estatuto, Termo de Filiação & Código de Trânsito Brasileiro
                </p>
                <p className="leading-relaxed">
                  1. Declaro que as informações cadastrais prestadas são exatas e verdadeiras sob as penas da Lei.
                </p>
                <p className="leading-relaxed">
                  2. Comprometo-me a zelar pela irmandade, respeito mútuo, imagem do moto clube {config.nomeClube} e cumprimento rigoroso das leis de trânsito em rodovias estaduais e federais.
                </p>
                <p className="leading-relaxed">
                  3. Em viagens e passeios em comboio, assumo a responsabilidade pela manutenção e segurança da minha motocicleta e equipamentos de proteção obrigatórios (capacete certificado, jaqueta, luvas e botas).
                </p>
                <p className="leading-relaxed">
                  4. Autorizo a guarda de meus dados nos termos da LGPD (Lei nº 13.709/2018) estritamente para gestão interna do clube, carteirinha digital e socorro em caso de emergência.
                </p>
              </div>

              {/* Checkbox de Aceite */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-amber-500/50 transition">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700"
                />
                <div className="text-xs text-zinc-300">
                  <span className="font-bold text-zinc-100">
                    Li e concordo plenamente com o Termo de Filiação e Responsabilidade.
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Estou ciente de que meu acesso será liberado após a análise e aprovação em ata pela Diretoria.
                  </p>
                </div>
              </label>

              {/* CAMPO DE ASSINATURA DIGITAL TOUCH OU MOUSE */}
              <DigitalSignaturePad
                value={assinaturaDataUrl}
                onChange={(dataUrl) => setAssinaturaDataUrl(dataUrl)}
                required
                title="Assinatura Digital Manuscrita (Touch ou Mouse)"
                subtitle="Assine no campo com a ponta do dedo ou caneta stylus no celular, ou arraste com o mouse."
              />
            </div>
          )}
        </div>

        {/* Rodapé com Navegação e Marca Dinastia System */}
        <div className="p-5 bg-zinc-950 border-t border-zinc-800 shrink-0 space-y-4">
          {!completedSuccess && (
            <div className="flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Próximo Passo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-7 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition flex items-center gap-2 shadow-xl disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando Informações...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalizar & Enviar Filiação</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Marca Dinastia System no rodapé de todas as partes */}
          <DinastiaBrandBadge variant="footer" />
        </div>
      </div>
    </div>
  );
};
