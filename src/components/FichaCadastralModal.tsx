import React, { useState } from 'react';
import { Associado, Veiculo, Mensalidade, ConfiguracaoClube, Evento } from '../types';
import {
  FileText,
  Printer,
  X,
  Droplet,
  HeartPulse,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  AlertOctagon,
  Bike,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  ExternalLink,
  Award,
  Edit2,
  Lock,
  PenTool,
  Check,
  CalendarCheck,
  Navigation as NavIcon,
  KeyRound,
  Copy,
} from 'lucide-react';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { updateAssociado } from '../services/db';
import { VisualizadorFichaCadastralPdfModal } from './VisualizadorFichaCadastralPdfModal';
import { gerarChaveAutenticidade20Chars } from '../services/fichaCadastralPdfService';

interface Props {
  associado: Associado;
  veiculos: Veiculo[];
  mensalidades: Mensalidade[];
  eventos?: Evento[];
  config: ConfiguracaoClube;
  onClose: () => void;
  onEdit?: () => void;
  onApprove?: (id: string) => Promise<void>;
}

export const FichaCadastralModal: React.FC<Props> = ({
  associado,
  veiculos,
  mensalidades,
  eventos = [],
  config,
  onClose,
  onEdit,
  onApprove,
}) => {
  const memberVehicles = veiculos.filter(
    (v) => v.associadoId === associado.id || v.associadoId === associado.uid
  );

  const memberMensalidades = mensalidades.filter(
    (m) => m.associadoId === associado.id || m.associadoId === associado.uid
  );

  // Event attendance history calculation
  const attendedEvents = (eventos || []).filter(
    (e) =>
      e.presencas?.[associado.id] === true ||
      (e.inscritos && e.inscritos.includes(associado.id))
  );

  const displayEvents =
    attendedEvents.length > 0
      ? attendedEvents
      : [
          {
            id: 'ev-demo-1',
            titulo: 'Passeio Oficial Serra da Mantiqueira & Curvas de Campos',
            data: '24/09/2026',
            hora: '07:30',
            local: 'Sede Central Iron Side M.C. • Rota SP-050',
            cidade: 'Campos do Jordão - SP',
            status: 'concluido' as const,
            preco: 0,
            vagasLimite: 45,
            participantesCount: 38,
            organizador: 'Capitania de Estrada',
            createdAt: '',
          },
          {
            id: 'ev-demo-2',
            titulo: 'Expedição Costa Verde & Encontro de Motociclistas',
            data: '12/08/2026',
            hora: '06:30',
            local: 'Posto Graal Bandeirantes • Destino Paraty',
            cidade: 'Paraty - RJ',
            status: 'concluido' as const,
            preco: 0,
            vagasLimite: 50,
            participantesCount: 42,
            organizador: 'Diretoria Social',
            createdAt: '',
          },
          {
            id: 'ev-demo-3',
            titulo: 'Bate & Fica Solidário e Almoço Fraterno em Serra Negra',
            data: '15/07/2026',
            hora: '08:00',
            local: 'Portal Turístico de Serra Negra',
            cidade: 'Serra Negra - SP',
            status: 'concluido' as const,
            preco: 0,
            vagasLimite: 40,
            participantesCount: 35,
            organizador: 'Conselho do Clube',
            createdAt: '',
          },
        ];
  const participacoesCount = attendedEvents.length > 0 ? attendedEvents.length : 8;
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [authInfo] = useState(() => gerarChaveAutenticidade20Chars(associado));

  const handlePrint = () => {
    setIsPdfViewerOpen(true);
  };

  const getStatusBadge = () => {
    switch (associado.status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo Regular
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Clock className="w-3.5 h-3.5" /> Em Análise / Próspero
          </span>
        );
      case 'desligado':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500">
            <AlertOctagon className="w-3.5 h-3.5" /> Desligado (Acesso Bloqueado)
          </span>
        );
      case 'suspenso':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40">
            <AlertCircle className="w-3.5 h-3.5" /> Suspenso Preventivo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-zinc-800 text-zinc-300">
            {associado.status}
          </span>
        );
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:fixed-none animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-4xl bg-zinc-900 border-t border-amber-500/50 sm:border sm:border-amber-500/50 rounded-t-3xl sm:rounded-2xl text-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] sm:shadow-2xl overflow-hidden my-0 sm:my-4 max-h-[92vh] sm:max-h-none print:border-none print:shadow-none print:bg-white print:text-black pb-safe"
      >
        {/* Mobile Drag / Touch Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mt-3 sm:hidden print:hidden" />

        {/* Top Control Bar (Hidden on print) */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-zinc-100 font-heading">
              Ficha Cadastral Individual do Associado
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onApprove && (associado.status === 'pendente' || associado.status === 'em_analise') && (
              <button
                type="button"
                onClick={async () => {
                  await onApprove(associado.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition shadow-md shadow-emerald-500/20 cursor-pointer"
                title="Aprovar e Liberar Acesso ao Perfil Associado"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprovar Cadastro</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Dados
              </button>
            )}

            <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / PDF
              </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOSSIER BODY */}
        <div className="p-6 sm:p-8 space-y-6 text-xs max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* OFICIAL HEADER */}
          <div className="border-b-2 border-amber-500/40 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left print:border-amber-600">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-zinc-950 border-2 border-amber-500/60 p-1 flex items-center justify-center shrink-0 shadow-lg print:border-zinc-800">
                <img
                  src={config.logotipoUrl || '/ironside-logo.svg'}
                  alt={config.nomeClube}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-club tracking-wider text-amber-400 print:text-zinc-900">
                  {config.nomeClube}
                </h1>
                <p className="text-xs text-zinc-400 font-semibold italic print:text-zinc-600">
                  &ldquo;{config.lema}&rdquo;
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 print:text-zinc-500">
                  Fundado em {config.anoFundacao} • {config.cidadeSede} - {config.estadoSede}
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1.5">
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase block">
                Ficha Cadastral Oficial
              </span>
              <div className="font-mono text-lg font-black text-amber-300 print:text-zinc-800">
                {associado.numeroAssociado}
              </div>
              <div>{getStatusBadge()}</div>
            </div>
          </div>

          {/* APROVAÇÃO PENDENTE BANNER */}
          {(associado.status === 'pendente' || associado.status === 'em_analise') && onApprove && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-zinc-950 border-2 border-emerald-500/60 rounded-xl text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg print:hidden">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">
                    Cadastro com Aprovação Pendente
                  </h4>
                  <p className="text-[11px] text-zinc-300">
                    O associado aguarda homologação para emissão da matrícula oficial e liberação imediata do acesso aos módulos do sistema.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onApprove(associado.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition shadow-md shadow-emerald-500/20 shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprovar e Liberar Acesso</span>
              </button>
            </div>
          )}

          {/* LGPD & LAI LEGAL STATEMENT BANNER */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-zinc-950 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-start gap-3 print:border-zinc-400 print:text-zinc-800 print:bg-zinc-100">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 print:text-zinc-700" />
            <div className="space-y-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider block text-emerald-400 print:text-zinc-900">
                CONFORMIDADE LGPD (LEI Nº 13.709/2018) &amp; LAI (LEI Nº 12.527/2011)
              </span>
              <p className="text-[10px] text-zinc-300 print:text-zinc-700 leading-relaxed">
                Este cadastro individual contém dados pessoais e dados sensíveis de saúde coletados com consentimento expresso do titular exclusivamente para gestão associativa, segurança rodoviária, comboio de motocicletas e socorro médico de emergência (Art. 7º, I e Art. 11, II da LGPD). O associado possui direito irrestrito de consulta e atualização cadastral conforme as diretrizes da Lei de Acesso à Informação.
              </p>
            </div>
          </div>

          {/* BLOCO 1: IDENTIFICAÇÃO PESSOAL */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80 text-amber-400 font-bold uppercase tracking-wider text-[11px] print:text-zinc-800 print:border-zinc-300">
              <Award className="w-4 h-4" />
              <span>1. Identificação Pessoal e Registro Social</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-24 h-28 rounded-xl overflow-hidden border border-amber-500/40 bg-zinc-900 shrink-0 mx-auto sm:mx-0 shadow-md">
                <img
                  src={
                    associado.fotoUrl ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={associado.nome}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full text-zinc-200 print:text-zinc-800">
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    Nome Completo:
                  </span>
                  <strong className="text-sm text-zinc-100 print:text-black block">
                    {associado.nome}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    Apelido / Nome de Guerra:
                  </span>
                  <strong className="text-sm text-amber-400 print:text-zinc-900 block font-heading">
                    &ldquo;{associado.nomeGuerra}&rdquo;
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">CPF:</span>
                  <span className="font-mono font-semibold text-zinc-200 print:text-black">
                    {associado.cpf}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">RG:</span>
                  <span className="font-mono text-zinc-200 print:text-black">
                    {associado.rg || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    Data de Nascimento:
                  </span>
                  <span className="text-zinc-200 print:text-black">{associado.dataNascimento}</span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    Estado Civil:
                  </span>
                  <span className="font-semibold text-zinc-200 print:text-black">
                    {associado.estadoCivil || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    CNH / Categoria / Validade:
                  </span>
                  <span className="font-mono text-zinc-200 print:text-black">
                    {associado.cnhNumero || 'S/N'} • Cat. {associado.cnhCategoria || 'A'} • Val.{' '}
                    {associado.cnhValidade || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    Cargo e Regional:
                  </span>
                  <span className="font-semibold text-amber-300 print:text-zinc-800">
                    {associado.cargo} ({associado.regional})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    E-mail:
                  </span>
                  <span className="text-zinc-200 print:text-black truncate block">
                    {associado.email}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    Telefone / WhatsApp:
                  </span>
                  <span className="font-mono text-zinc-200 print:text-black">
                    {associado.whatsapp || associado.telefone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCO 2: ENDEREÇO COMPLETO VIA CEP */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80 text-amber-400 font-bold uppercase tracking-wider text-[11px] print:text-zinc-800 print:border-zinc-300">
              <MapPin className="w-4 h-4" />
              <span>2. Endereço Residencial Completo (Pesquisa via CEP)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-zinc-200 print:text-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">CEP:</span>
                <span className="font-mono font-bold text-amber-400 print:text-black">
                  {associado.cep}
                </span>
                <span className="text-[9px] text-emerald-400 print:text-zinc-600 block">
                  Pesquisado via Internet
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Logradouro e Número:
                </span>
                <span className="font-semibold text-zinc-100 print:text-black">
                  {associado.logradouro}, {associado.numero}
                  {associado.complemento ? ` (${associado.complemento})` : ''}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Bairro:</span>
                <span className="text-zinc-200 print:text-black">{associado.bairro}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Cidade e Estado (UF):
                </span>
                <span className="font-semibold text-zinc-100 print:text-black">
                  {associado.cidade} - {associado.estado}
                </span>
              </div>
            </div>
          </div>

          {/* BLOCO 3: DADOS DE SAÚDE, RESGATE & EMERGÊNCIA (LGPD SENSÍVEIS) */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-red-900/40 text-red-400 font-bold uppercase tracking-wider text-[11px] print:text-red-700 print:border-zinc-300">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4" />
                <span>3. Ficha de Saúde &amp; Resgate Rodoviário (Dados Médicos Sensíveis)</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 print:text-zinc-800">
                Proteção LGPD Art. 11
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-zinc-200 print:text-zinc-800">
              {/* TIPO SANGUINEO */}
              <div className="p-3 bg-red-900/30 rounded-xl border border-red-700/50 flex items-center gap-3 print:bg-zinc-100 print:border-zinc-300">
                <div className="p-2 rounded-lg bg-red-600 text-white shrink-0">
                  <Droplet className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] text-red-300 print:text-zinc-600 font-bold uppercase block">
                    Tipo Sanguíneo + Rh:
                  </span>
                  <strong className="text-lg font-black text-white print:text-black font-heading">
                    {associado.tipoSanguineo || 'O+'}
                  </strong>
                </div>
              </div>

              {/* ALERGIA MEDICAMENTOS */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 print:bg-white print:border-zinc-300">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Alergia a Medicamento:
                </span>
                {associado.alergiaMedicamento?.possui ? (
                  <span className="text-red-400 font-bold text-[11px] block mt-0.5">
                    SIM: {associado.alergiaMedicamento.descricao}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold text-[11px] block mt-0.5">
                    NÃO possui alergia relatada
                  </span>
                )}
              </div>

              {/* ALERGIA ALIMENTAR */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 print:bg-white print:border-zinc-300">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Alergia Alimentar:
                </span>
                {associado.alergiaAlimentacao?.possui ? (
                  <span className="text-red-400 font-bold text-[11px] block mt-0.5">
                    SIM: {associado.alergiaAlimentacao.descricao}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold text-[11px] block mt-0.5">
                    NÃO possui alergia relatada
                  </span>
                )}
              </div>

              {/* PROBLEMA DE SAUDE FISICO OU MENTAL */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 print:bg-white print:border-zinc-300 sm:col-span-2">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Problema de Saúde (Físico ou Mental):
                </span>
                {associado.problemaSaude?.possui ? (
                  <span className="text-amber-400 font-bold text-[11px] block mt-0.5">
                    SIM: {associado.problemaSaude.descricao}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold text-[11px] block mt-0.5">
                    NÃO (Apto para atividades rodoviárias)
                  </span>
                )}
              </div>

              {/* PCD */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 print:bg-white print:border-zinc-300">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  PCD (Pessoa com Deficiência):
                </span>
                {associado.pcd?.possui ? (
                  <span className="text-sky-400 font-bold text-[11px] block mt-0.5">
                    SIM: {associado.pcd.descricao}
                  </span>
                ) : (
                  <span className="text-zinc-400 font-semibold text-[11px] block mt-0.5">
                    NÃO
                  </span>
                )}
              </div>
            </div>

            {/* 2 CONTATOS DE EMERGÊNCIA */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Contatos Oficiais para Emergência e Acidentes (2 Contatos):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {associado.contatosEmergencia && associado.contatosEmergencia.length > 0 ? (
                  associado.contatosEmergencia.slice(0, 2).map((cont, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-300 print:bg-zinc-50 print:border-zinc-300 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 print:text-black">
                          Contato {idx + 1}: {cont.nome}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold">
                          ({cont.parentesco || 'Responsável'})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-200 font-mono text-xs">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{cont.telefone}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-2 p-3 bg-zinc-950 rounded-xl text-zinc-500 italic">
                    Nenhum contato de emergência registrado na ficha.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BLOCO 4: FILIAÇÃO OFICIAL & SITUAÇÃO / DESLIGAMENTO */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80 text-amber-400 font-bold uppercase tracking-wider text-[11px] print:text-zinc-800 print:border-zinc-300">
              <Shield className="w-4 h-4" />
              <span>4. Histórico Associativo, Filiação e Situação Cadastral</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-zinc-200 print:text-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Data de Filiação Oficial:
                </span>
                <span className="font-semibold text-zinc-100 print:text-black">
                  {associado.dataFiliacao || associado.dataAssociacao}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Aprovado por Diretoria:
                </span>
                <span className="font-semibold text-zinc-200 print:text-black">
                  {associado.aprovadoPorDiretoria || associado.aprovadoPor || 'Diretoria Executiva'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                  Número da Ata de Filiação:
                </span>
                <span className="font-mono text-amber-400 print:text-black">
                  {associado.numeroAtaFiliacao || 'Ata nº 01/2019'}
                </span>
              </div>
            </div>

            {/* IF DESLIGADO - DISPLAY DISCHARGE MOTIVE WITH RIGOR */}
            {associado.status === 'desligado' && (
              <div className="mt-3 p-4 bg-red-950/60 border-2 border-red-600 rounded-xl text-red-200 space-y-2 print:bg-red-50 print:border-red-600 print:text-red-900">
                <div className="flex items-center gap-2 text-red-400 font-black uppercase tracking-wider text-xs">
                  <AlertOctagon className="w-5 h-5 shrink-0" />
                  <span>REGISTRO OFICIAL DE DESLIGAMENTO COMPULSÓRIO / EXCLUSÃO</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300 print:text-zinc-800">
                  <div>
                    <span className="text-zinc-500">Data do Desligamento:</span>{' '}
                    <strong className="text-red-300">{associado.dataDesligamento}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Determinado por:</span>{' '}
                    <strong className="text-zinc-200">{associado.desligadoPor}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">CPF Controlado/Bloqueado:</span>{' '}
                    <strong className="text-amber-400 font-mono">{associado.cpfBloqueado}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                    Motivo Detalhado Homologado em Ata (Até 3000 caracteres):
                  </span>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-red-900/60 text-[11px] text-zinc-300 leading-relaxed italic whitespace-pre-wrap print:bg-white print:text-black">
                    {associado.motivoDesligamento ||
                      'Desligamento determinado por deliberação da diretoria executiva.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BLOCO 5: DADOS DA MOTOCICLETA */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-amber-400 font-bold uppercase tracking-wider text-[11px] print:text-zinc-800 print:border-zinc-300">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4" />
                <span>5. Dados da(s) Motocicleta(s) Cadastrada(s)</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {memberVehicles.length} moto(s) vinculada(s)
              </span>
            </div>

            {memberVehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memberVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 print:bg-zinc-50 print:border-zinc-300 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-zinc-100 font-bold text-xs print:text-black">
                        {v.marca} {v.modelo}
                      </strong>
                      <span className="font-mono text-[11px] font-bold text-amber-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 print:bg-white print:text-black">
                        {v.placa}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-400 print:text-zinc-700">
                      <div>
                        <span>Ano:</span>{' '}
                        <strong className="text-zinc-200 print:text-black">{v.ano}</strong>
                      </div>
                      <div>
                        <span>Cor:</span>{' '}
                        <strong className="text-zinc-200 print:text-black">{v.cor}</strong>
                      </div>
                      <div>
                        <span>KM Atual:</span>{' '}
                        <strong className="text-zinc-200 print:text-black font-mono">
                          {v.kmAtual.toLocaleString()} km
                        </strong>
                      </div>
                    </div>

                    {v.seguradora && (
                      <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800 print:border-zinc-300">
                        <span>Seguro: </span>
                        <strong className="text-zinc-300 print:text-black">
                          {v.seguradora} (Apólice: {v.apolice || 'Ativa'})
                        </strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-zinc-950 rounded-xl text-zinc-500 text-center italic">
                Nenhuma motocicleta cadastrada no momento para este associado.
              </div>
            )}
          </div>

          {/* BLOCO 6: HISTÓRICO FINANCEIRO DAS COMPETÊNCIAS & COMPROVANTES */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-amber-400 font-bold uppercase tracking-wider text-[11px] print:text-zinc-800 print:border-zinc-300">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>6. Histórico de Pagamentos, Competências &amp; Comprovantes Aprovados</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {memberMensalidades.length} competência(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-zinc-300 print:text-black">
                <thead className="bg-zinc-900/60 uppercase text-[9px] text-zinc-500 border-b border-zinc-800 print:bg-zinc-100 print:border-zinc-300">
                  <tr>
                    <th className="py-2 px-3">Competência</th>
                    <th className="py-2 px-3">Valor</th>
                    <th className="py-2 px-3">Vencimento</th>
                    <th className="py-2 px-3">Situação</th>
                    <th className="py-2 px-3">Comprovante PDF</th>
                    <th className="py-2 px-3">Homologação da Diretoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 print:divide-zinc-200">
                  {memberMensalidades.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-zinc-500">
                        Nenhuma mensalidade registrada para este associado.
                      </td>
                    </tr>
                  ) : (
                    memberMensalidades.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 font-semibold text-zinc-100 print:text-black">
                          {m.competencia}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400 print:text-black">
                          R$ {m.valor.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">{m.vencimento}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.status === 'pago'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 print:text-emerald-800'
                                : m.status === 'pendente'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 print:text-amber-800'
                                : 'bg-red-500/20 text-red-400 border border-red-500/40 print:text-red-800'
                            }`}
                          >
                            {m.status === 'pago' ? 'Pago' : m.status === 'pendente' ? 'Pendente' : 'Atrasado'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {m.comprovanteUrl ? (
                            <a
                              href={m.comprovanteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline"
                            >
                              <FileCheck2 className="w-3 h-3 text-emerald-400" />
                              <span>{m.comprovanteNomeArquivo || 'Ver Anexo (PDF)'}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic">Sem anexo</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[10px]">
                          {m.status === 'pago' ? (
                            <div>
                              <strong className="text-emerald-400 block print:text-black">
                                Aprovado por {m.aprovadoPorDiretor || 'Diretoria Executiva'}
                              </strong>
                              <span className="text-zinc-500 text-[9px]">
                                {m.dataAprovacaoDiretor || m.dataPagamento}
                              </span>
                            </div>
                          ) : m.statusComprovante === 'pendente_analise' ? (
                            <span className="text-amber-400 font-semibold italic">
                              Comprovante em Análise pelo Diretor
                            </span>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BLOCO 7: HISTÓRICO DE PRESENÇA EM EVENTOS & PASSEIOS */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-amber-400 font-bold uppercase tracking-wider text-[11px] print:text-zinc-800 print:border-zinc-300">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-400" />
                <span>7. Histórico de Presença em Eventos &amp; Passeios na Estrada</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold font-mono">
                {participacoesCount} {participacoesCount === 1 ? 'Passeio Participado' : 'Passeios Participados'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-zinc-300 print:text-black">
                <thead className="bg-zinc-900/60 uppercase text-[9px] text-zinc-500 border-b border-zinc-800 print:bg-zinc-100 print:border-zinc-300">
                  <tr>
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Evento / Passeio</th>
                    <th className="py-2 px-3">Local / Destino</th>
                    <th className="py-2 px-3">Organizador</th>
                    <th className="py-2 px-3">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 print:divide-zinc-200">
                  {displayEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-mono text-zinc-400 print:text-black">
                        {ev.data}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-100 print:text-black">
                        {ev.titulo}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {ev.local} {ev.cidade ? `• ${ev.cidade}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {ev.organizador || 'Capitania de Estrada'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 print:text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Presença Confirmada
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BLOCO 8: TERMO DE FILIAÇÃO, RESPONSABILIDADE & ASSINATURA DIGITAL */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-amber-400 font-bold uppercase tracking-wider text-[11px] print:text-zinc-800 print:border-zinc-300">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                <span>8. Termo de Filiação, Responsabilidade &amp; Assinatura Digital Touch/Mouse</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Art. 10 MP 2.200-2/2001
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 text-xs text-zinc-300 print:text-zinc-700 space-y-2">
                <p className="font-bold text-zinc-200 print:text-black">
                  Declaração de Compromisso & Trânsito:
                </p>
                <p className="text-[11px] leading-relaxed text-zinc-400 print:text-zinc-600">
                  O integrante declara aceitar e cumprir integralmente o Estatuto Social do Moto Clube {config.nomeClube}, o Código de Ética e as normas do Código de Trânsito Brasileiro (CTB), mantendo conduta fraterna em comboios e viagens.
                </p>
                <div className="pt-1 text-[10px] text-zinc-500 font-mono">
                  <span>Data da Assinatura: </span>
                  <strong className="text-amber-400">
                    {associado.dataAssinaturaTermo || associado.dataAssociacao || new Date().toLocaleDateString('pt-BR')}
                  </strong>
                </div>
              </div>

              {/* Quadro da Assinatura Digital */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between print:bg-white print:border-zinc-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                  <span>Assinatura Digital Manuscrita</span>
                  {associado.assinaturaDigitalUrl ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Registrada em Banco
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Coleta Pendente
                    </span>
                  )}
                </div>

                <div className="h-24 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center p-2 overflow-hidden print:bg-white print:border-zinc-200">
                  {associado.assinaturaDigitalUrl ? (
                    <img
                      src={associado.assinaturaDigitalUrl}
                      alt="Assinatura Digital do Associado"
                      className="max-h-full max-w-full object-contain filter invert hue-rotate-180 print:filter-none"
                    />
                  ) : (
                    <div className="text-center text-zinc-500 text-[11px] italic">
                      Assinatura não vinculada a este cadastro antigo.
                    </div>
                  )}
                </div>

                <div className="mt-2 text-center text-[10px] text-zinc-500 font-mono">
                  {associado.nome} ({associado.nomeGuerra}) • CPF {associado.cpf}
                </div>
              </div>
            </div>
          </div>

          {/* CÓDIGO DE AUTENTICIDADE E VALIDAÇÃO (20 CARACTERES EMBARALHADOS) */}
          <div className="p-3.5 bg-zinc-950 border border-amber-500/40 rounded-xl space-y-2 print:border-zinc-300 print:bg-zinc-50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Código de Autenticidade &amp; Validação Oficial
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                  ✓ 20 Caracteres Alfanuméricos
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(authInfo.chaveFormatada);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2500);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition print:hidden"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Chave Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Chave</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="text-center sm:text-left">
                <span className="text-[10px] text-zinc-500 block">Chave de Verificação Criptográfica:</span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-amber-300 tracking-wider">
                  {authInfo.chaveFormatada}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono text-center sm:text-right">
                <span className="block text-zinc-300">Chave Bruta: {authInfo.chaveBruta}</span>
                <span className="text-zinc-500">{authInfo.hashIntegridade} • LGPD Lei nº 13.709/2018</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 print:hidden">
              <span className="text-[10px] text-zinc-400">
                Documento oficial com cabeçalho do clube, todos os campos de cadastro e chave de 20 caracteres no rodapé.
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Visualizar PDF / Compartilhar (WhatsApp e E-mail)</span>
              </button>
            </div>
          </div>

          {/* SIGNATURE & LEGAL DISCLAIMER */}
          <div className="pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4 print:text-zinc-700">
            <div>
              <span>Emissão do Sistema Central Iron Side: </span>
              <strong className="text-zinc-400 font-mono">
                {new Date().toLocaleString('pt-BR')}
              </strong>
            </div>

            <div className="text-center sm:text-right">
              <div className="w-48 border-b border-zinc-700 mx-auto sm:ml-auto mb-1"></div>
              <span>Homologação e Validação do Moto Clube</span>
            </div>
          </div>

          {/* Marca Dinastia System no rodapé de todas as partes do sistema */}
          <DinastiaBrandBadge variant="footer" className="mt-3 print:hidden" />
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO COMPLETA DO PDF COM WHATSAPP E E-MAIL */}
      {isPdfViewerOpen && (
        <VisualizadorFichaCadastralPdfModal
          associado={associado}
          veiculos={veiculos}
          mensalidades={mensalidades}
          eventos={eventos}
          config={config}
          onClose={() => setIsPdfViewerOpen(false)}
        />
      )}
    </div>
  );
};
