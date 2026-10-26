import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Bike,
  Calendar,
  HeartHandshake,
  LifeBuoy,
  Users,
  Newspaper,
  Bell,
  Settings,
  Server,
  Wrench,
  Coins,
  ShieldCheck,
  Search,
  LogOut,
  ChevronRight,
  Sparkles,
  Lock,
  Layers,
  ArrowUpRight,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ArrowRight,
  Activity,
  Flame,
  HelpCircle,
  FileCode2,
  RotateCcw,
  FileText,
  Trophy,
} from 'lucide-react';
import { ConfiguracaoClube, UserRole, Associado, Evento, Mensalidade } from '../types';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { isModuleVisible } from '../utils/moduleVisibility';

export interface ModuleDefinition {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  badgeColor: string;
  tags: string[];
  roleRequired?: UserRole[];
  featured?: boolean;
}

interface Props {
  config: ConfiguracaoClube;
  activeRole: UserRole;
  currentAssociado: Associado | null;
  eventos?: Evento[];
  mensalidades?: Mensalidade[];
  onOpenModule: (moduleId: string) => void;
  onLockOrLogout: () => void;
  onOpenDeploymentModal: () => void;
  onOpenManualAjuda?: () => void;
  onOpenManualProgramacao?: () => void;
  onOpenResetModal?: () => void;
}

export const ModulesHubView: React.FC<Props> = ({
  config,
  activeRole,
  currentAssociado,
  eventos = [],
  mensalidades = [],
  onOpenModule,
  onLockOrLogout,
  onOpenDeploymentModal,
  onOpenManualAjuda,
  onOpenManualProgramacao,
  onOpenResetModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isDiretoriaOrAdmin = activeRole === 'administrador' || activeRole === 'diretoria';

  const modulesList: ModuleDefinition[] = [
    {
      id: 'cadastro_institucional',
      number: '00',
      title: 'Cadastro Institucional — Moto Clube',
      subtitle: 'Dados oficiais do moto clube, CNPJ, sede física, representação da diretoria legal, dados bancários e checklist de estatuto.',
      category: 'Institucional & Fundação',
      icon: Landmark,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      glowColor: 'group-hover:border-amber-500/60 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      tags: ['CNPJ Oficial', 'Diretoria Legal', 'Estatuto', 'Sede'],
      featured: true,
    },
    {
      id: 'carteirinha',
      number: '01',
      title: 'Carteirinha Digital',
      subtitle: 'Identificação oficial do integrante, QR Code dinâmico, tipo sanguíneo e validação em tempo real.',
      category: 'Identidade & Acesso',
      icon: CreditCard,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      glowColor: 'group-hover:border-amber-500/60 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      tags: ['QR Code Dinâmico', 'Filiado Ativo', 'Exportar PDF'],
      featured: true,
    },
    {
      id: 'veiculos',
      number: '02',
      title: 'Minhas Motos & Frota',
      subtitle: 'Cadastro de motocicletas com leitura óptica de CRLV, galeria de fotos (câmera ao vivo, internet ou upload) e odômetro.',
      category: 'Frota & Documentos',
      icon: Bike,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      glowColor: 'group-hover:border-amber-500/60 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      tags: ['CRLV Digital', 'Câmera ao Vivo', 'Galeria de Fotos', 'Odômetro'],
      featured: true,
    },
    {
      id: 'manutencao',
      number: '03',
      title: 'Manutenção & Abastecimento',
      subtitle: 'Histórico de despesas na estrada, revisões preventivas, troca de óleo, pneus e cálculo de consumo km/l.',
      category: 'Garagem & Estrada',
      icon: Wrench,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      glowColor: 'group-hover:border-orange-500/60 group-hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      tags: ['Consumo km/l', 'Revisões Preventivas', 'Despesas de Viagem'],
    },
    {
      id: 'associados',
      number: '04',
      title: 'Quadro de Integrantes',
      subtitle: 'Fichas cadastrais completas, dados LGPD, cargos, filiação oficial e bloqueio rigoroso por CPF.',
      category: 'Gestão de Membros',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      glowColor: 'group-hover:border-sky-500/60 group-hover:shadow-[0_0_25px_rgba(14,165,233,0.2)]',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      tags: ['Ficha Cadastral', 'LGPD', 'Diretoria & Admin'],
      roleRequired: ['diretoria', 'administrador'],
    },
    {
      id: 'mensalidades',
      number: '05',
      title: 'Mensalidades & Finanças',
      subtitle: 'Contribuições com PIX Copia e Cola, QR Code automático, envio de comprovantes e fluxo da tesouraria.',
      category: 'Tesouraria',
      icon: Coins,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      glowColor: 'group-hover:border-emerald-500/60 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      tags: ['PIX Instantâneo', 'Comprovantes', 'Histórico Financeiro'],
    },
    {
      id: 'eventos',
      number: '06',
      title: 'Eventos & Rolês',
      subtitle: 'Calendário oficial de viagens, passeios em comboio, pontos de encontro e confirmação de presença (bate-e-fica).',
      category: 'Estrada & Fraternidade',
      icon: Calendar,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      glowColor: 'group-hover:border-purple-500/60 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      tags: ['Bate-e-Volta', 'Comboio Oficial', 'Lista de Confirmados'],
    },
    {
      id: 'campanhas',
      number: '07',
      title: 'Campanhas & Doações',
      subtitle: 'Ações sociais solidárias, metas financeiras em R$ e itens, dados da instituição parceira e WhatsApp.',
      category: 'Ação Social',
      icon: HeartHandshake,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      glowColor: 'group-hover:border-rose-500/60 group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      tags: ['Metas R$ & Itens', 'Prestação de Contas', 'Divulgar WhatsApp'],
    },
    {
      id: 'sos',
      number: '08',
      title: 'SOS Estrada & Apoio 24h',
      subtitle: 'Central de emergência: guinchos especializados para motos, mecânicos parceiros, postos e 190 / SAMU / PRF.',
      category: 'Segurança na Rodovia',
      icon: LifeBuoy,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      glowColor: 'group-hover:border-red-500/60 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      tags: ['Guincho 24h', 'Mecânicos Parceiros', 'Emergência 190'],
    },
    {
      id: 'amigos',
      number: '09',
      title: 'Amigos & Outros MCs',
      subtitle: 'Rede de motoclubes irmãos, alianças interestaduais, contatos dos presidentes e pontos de apoio.',
      category: 'Irmandade Motociclística',
      icon: Users,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      glowColor: 'group-hover:border-cyan-500/60 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      tags: ['Moto Clubes Parceiros', 'Alianças', 'Contatos de Estrada'],
    },
    {
      id: 'noticias',
      number: '10',
      title: 'Notícias & Novidades',
      subtitle: 'Portal de tendências do mundo das duas rodas, lançamentos de motos, big trails, equipamentos e dicas.',
      category: 'Mundo Duas Rodas',
      icon: Newspaper,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      glowColor: 'group-hover:border-yellow-500/60 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      tags: ['Lançamentos', 'Big Trails', 'Dicas Técnicas'],
    },
    {
      id: 'comunicados',
      number: '11',
      title: 'Mural de Comunicados',
      subtitle: 'Quadro oficial de avisos da diretoria, convocações de assembleia e comunicados urgentes para o clube.',
      category: 'Mural Oficial',
      icon: Bell,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      glowColor: 'group-hover:border-violet-500/60 group-hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      tags: ['Avisos da Diretoria', 'Comunicados Urgentes', 'Mural'],
    },
    {
      id: 'configuracoes',
      number: '12',
      title: 'Configurações & Auditoria',
      subtitle: 'Parâmetros institucionais do clube, valor da mensalidade, gráficos Recharts e logs de segurança.',
      category: 'Administração & Segurança',
      icon: Settings,
      color: 'text-zinc-300 bg-zinc-800 border-zinc-700',
      glowColor: 'group-hover:border-zinc-500/60 group-hover:shadow-[0_0_25px_rgba(113,113,122,0.2)]',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      tags: ['Exclusivo Administrador', 'Parâmetros', 'Gráficos 30d', 'Auditoria'],
      roleRequired: ['administrador'],
    },
    {
      id: 'hostinger',
      number: '13',
      title: 'Publicação Google Play, App Store & Hostinger',
      subtitle: 'Instruções para publicação TWA nativa no Google Play, Apple App Store, hPanel Hostinger e Windows.',
      category: 'Lojas & Publicação Nativa',
      icon: Server,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      glowColor: 'group-hover:border-emerald-500/60 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      tags: ['Exclusivo Administrador', 'Google Play (TWA)', 'App Store (iOS)', 'Hostinger'],
      roleRequired: ['administrador'],
    },
    {
      id: 'relatorios_central',
      number: '14',
      title: 'Central de Relatórios Oficiais (PDF)',
      subtitle: 'Central unificada contendo todos os relatórios em PDF de todos os módulos: Fichas, Carteirinhas, Frota, Manutenção Preventiva, Tesouraria e Auditoria.',
      category: 'Documentos & Auditoria',
      icon: FileText,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      glowColor: 'group-hover:border-amber-500/60 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      tags: ['Todos os PDFs', 'Ficha Cadastral', 'Carteirinha', 'Preventivo Óleo/Pneus', 'Tesouraria'],
      featured: true,
    },
    {
      id: 'rank_estradas',
      number: '15',
      title: 'Rank de Estradas — Motoqueiros de Elite',
      subtitle: 'Classificação oficial por quilometragem somada de todos os abastecimentos e manutenções registradas.',
      category: 'Garagem & Estrada',
      icon: Trophy,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      glowColor: 'group-hover:border-yellow-500/60 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.25)]',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      tags: ['Pódio da Estrada', 'Elite Diamante', 'Odômetro Acumulado', 'Combustível'],
      featured: true,
    },
  ];

  // Filtering modules based on role and dynamic administrator rules:
  const filteredModules = modulesList.filter((m) => {
    // Aplica regra de visibilidade configurada pelo Administrador no Módulo 12
    if (!isModuleVisible(m.id, activeRole, config)) {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.subtitle.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    roleNeeded: string;
  } | null>(null);

  const handleCardClick = (mod: ModuleDefinition) => {
    // Check permission - strictly enforce administrator access for Module 12 and Module 13
    if (mod.roleRequired && !mod.roleRequired.includes(activeRole)) {
      if (mod.id === 'hostinger') {
        setAccessDeniedModal({
          isOpen: true,
          title: 'Acesso Restrito ao Módulo 13',
          message: 'O Módulo 13 (Hospedagem Hostinger & APK Celular) é estritamente exclusivo para o perfil ADMINISTRADOR do sistema.',
          roleNeeded: 'Administrador (somente a senha mestra)',
        });
      } else if (mod.id === 'configuracoes') {
        setAccessDeniedModal({
          isOpen: true,
          title: 'Acesso Restrito ao Módulo 12',
          message: 'O Módulo 12 (Configurações & Auditoria) é estritamente exclusivo para o perfil ADMINISTRADOR do sistema.',
          roleNeeded: 'Administrador (somente a senha mestra)',
        });
      } else {
        setAccessDeniedModal({
          isOpen: true,
          title: `Acesso Restrito ao Módulo ${mod.number}`,
          message: `O módulo "${mod.title}" exige permissão de Diretoria ou Administrador do clube.`,
          roleNeeded: 'Diretoria ou Administrador',
        });
      }
      return;
    }

    if (mod.id === 'hostinger') {
      onOpenDeploymentModal();
      return;
    }

    onOpenModule(mod.id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Welcome / Profile Strip */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-amber-500/40 flex items-center justify-center p-1 shadow-md shrink-0">
            <img
              src="/ironside-logo.svg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-zinc-100">
                {currentAssociado?.nome || 'Comandante da Estrada'}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  activeRole === 'administrador'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : activeRole === 'diretoria'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {activeRole.toUpperCase()}
              </span>
              {currentAssociado?.numeroAssociado && (
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">
                  {currentAssociado.numeroAssociado}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {config.nomeClube} · &ldquo;{config.lema}&rdquo;
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto w-full sm:w-auto justify-end">
          {onOpenManualAjuda && (
            <button
              type="button"
              onClick={onOpenManualAjuda}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Central de Ajuda & Guia Ilustrado de Telas"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Guia de Telas</span>
            </button>
          )}

          {activeRole === 'administrador' && onOpenManualProgramacao && (
            <button
              type="button"
              onClick={onOpenManualProgramacao}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Manual Técnico de Programação (Exclusivo Administrador)"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Manual Programação</span>
            </button>
          )}

          {activeRole === 'administrador' && onOpenResetModal && (
            <button
              type="button"
              onClick={onOpenResetModal}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border border-red-400 shadow-md shadow-red-600/30"
              title="Reset: Limpar banco de dados para iniciar operações (Requer senha)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>Reset Operações</span>
            </button>
          )}

          {activeRole === 'administrador' && (
            <button
              type="button"
              onClick={onOpenDeploymentModal}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-amber-500/40"
            >
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Módulo 13 (Admin)</span>
            </button>
          )}
          {activeRole === 'associado' ? (
            <button
              type="button"
              onClick={onLockOrLogout}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sair</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLockOrLogout}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Bloquear / Trocar Perfil</span>
            </button>
          )}
        </div>
      </div>

      {/* DASHBOARD OVERVIEW: RADAR DO ASSOCIADO (STATUS DA MENSALIDADE + 3 PRÓXIMOS EVENTOS / 48H) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cartão de Toque: Status da Mensalidade Atual */}
        {(() => {
          const mesAtual = new Date().getMonth() + 1;
          const anoAtual = new Date().getFullYear();
          const nomeMesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

          const mensalidadeAssociado = currentAssociado
            ? mensalidades.find(
                (m) =>
                  (m.associadoId === currentAssociado.id ||
                    (currentAssociado.numeroAssociado && m.numeroAssociado === currentAssociado.numeroAssociado)) &&
                  m.mes === mesAtual &&
                  m.ano === anoAtual
              ) ||
              mensalidades.find(
                (m) =>
                  m.associadoId === currentAssociado.id ||
                  (currentAssociado.numeroAssociado && m.numeroAssociado === currentAssociado.numeroAssociado)
              ) ||
              (mensalidades.length > 0 ? mensalidades[0] : null)
            : (mensalidades.length > 0 ? mensalidades[0] : null);

          const isPago = mensalidadeAssociado?.status === 'pago';
          const valorMensalidade = mensalidadeAssociado?.valor ?? config.valorMensalidadePadrao ?? 50;

          return (
            <div
              onClick={() => onOpenModule('mensalidades')}
              className={`lg:col-span-4 p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group shadow-xl active:scale-[0.99] flex flex-col justify-between ${
                isPago
                  ? 'bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-500/10'
                  : 'bg-gradient-to-br from-amber-950/50 via-zinc-900 to-zinc-950 border-amber-500/50 hover:border-amber-400 hover:shadow-amber-500/10'
              }`}
              title="Toque para abrir o Módulo Financeiro & Mensalidades"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Mensalidade Atual</span>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                      isPago
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {isPago ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>EM DIA</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span>PENDENTE</span>
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono ${isPago ? 'text-emerald-400' : 'text-amber-400'}`}>
                      R$ {valorMensalidade.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize">
                      / {nomeMesAtual} {anoAtual}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                    {isPago
                      ? 'Sua contribuição com o clube está quitada e sua carteirinha segue 100% ativa.'
                      : 'Mensalidade aguardando pagamento. Toque para acessar a chave Pix oficial.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold">
                <span className={isPago ? 'text-emerald-400' : 'text-amber-400'}>
                  {isPago ? 'Ver Comprovante Oficial' : 'Pagar Agora via Pix'}
                </span>
                <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isPago ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
            </div>
          );
        })()}

        {/* Cartão de Toque: 3 Próximos Eventos (Destaque Próximas 48h) */}
        {(() => {
          const agora = new Date().getTime();
          const sorted = [...eventos].sort((a, b) => {
            const dataA = new Date(a.data).getTime() || 0;
            const dataB = new Date(b.data).getTime() || 0;
            return dataA - dataB;
          });

          const proximos = sorted.slice(0, 3).map((ev) => {
            const dataEv = new Date(ev.data).getTime();
            const diffHoras = (dataEv - agora) / (1000 * 60 * 60);
            const isProximas48h = diffHoras >= -12 && diffHoras <= 48;
            return { ...ev, isProximas48h };
          });

          return (
            <div className="lg:col-span-8 p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs sm:text-sm font-black text-zinc-100 uppercase tracking-wider">
                    Radar de Eventos &amp; Próximos Encontros
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenModule('eventos')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Todos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {proximos.length === 0 ? (
                <div
                  onClick={() => onOpenModule('eventos')}
                  className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center cursor-pointer hover:border-amber-500/40 transition"
                >
                  <p className="text-xs text-zinc-400">Nenhum evento agendado no momento.</p>
                  <span className="text-[11px] text-amber-400 font-bold mt-1 inline-block">
                    Toque para abrir a agenda do clube ➔
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {proximos.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onOpenModule('eventos')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 active:scale-95 group ${
                        ev.isProximas48h
                          ? 'bg-gradient-to-br from-amber-500/15 via-zinc-950 to-zinc-950 border-amber-500/60 hover:border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          {ev.isProximas48h ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950 flex items-center gap-1 animate-pulse">
                              <Flame className="w-2.5 h-2.5 fill-zinc-950" />
                              <span>Próx. 48h</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-500">
                              Agendado
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {ev.hora || '08:00'}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                          {ev.titulo}
                        </h5>

                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{ev.cidade || ev.local || 'Sede do Clube'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>{ev.data}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>


      {/* Hub Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-black text-zinc-100 font-heading">
              Central de Telas & Módulos
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {filteredModules.length} módulos
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Clique em qualquer tela montada abaixo para abrir seu módulo específico.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar módulo ou função..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid de Ícones das Telas Montadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredModules.map((mod, index) => {
          const Icon = mod.icon;
          const isRestricted = mod.roleRequired && !mod.roleRequired.includes(activeRole);

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(mod)}
              className={`group relative p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl cursor-pointer transition-all flex flex-col justify-between overflow-hidden ${
                mod.glowColor
              } ${isRestricted ? 'opacity-65' : ''}`}
            >
              {/* Card Top: Number + Category */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black text-zinc-500 group-hover:text-amber-400 transition-colors">
                    MÓDULO {mod.number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${mod.badgeColor}`}
                  >
                    {mod.category}
                  </span>
                </div>

                {/* Icon + Title */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform ${mod.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                      {mod.title}
                      {mod.featured && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      )}
                    </h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {mod.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-zinc-950/80 border border-zinc-800 text-zinc-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Bottom / Action Button */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold">
                <span
                  className={`flex items-center gap-1 ${
                    isRestricted ? 'text-zinc-500' : 'text-amber-400 group-hover:text-amber-300'
                  }`}
                >
                  {isRestricted ? 'Acesso Restrito' : 'Abrir Módulo'}
                </span>
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isRestricted
                      ? 'bg-zinc-800 text-zinc-500'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:border-amber-500 group-hover:text-amber-400 group-hover:bg-amber-500/10'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de Acesso Restrito ao Módulo (ex: Módulo 13 exclusivo Administrador) */}
      {accessDeniedModal && accessDeniedModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-zinc-100 mb-2">
              {accessDeniedModal.title}
            </h3>

            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              {accessDeniedModal.message}
            </p>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 mb-5">
              <span className="font-bold text-amber-400">Perfil Necessário: </span>
              {accessDeniedModal.roleNeeded}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAccessDeniedModal(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Entendido / Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessDeniedModal(null);
                  onLockOrLogout();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Trocar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Marca Dinastia System no rodapé de todas as partes do sistema */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
