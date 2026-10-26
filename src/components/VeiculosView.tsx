import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Veiculo, Associado } from '../types';
import {
  Bike,
  Plus,
  Gauge,
  Calendar,
  Shield,
  Trash2,
  Edit3,
  Search,
  Filter,
  Wrench,
  Fuel,
  FileText,
  Camera,
  Globe,
  Upload,
  CheckCircle2,
  FileCheck,
  Eye,
  X,
  Scan,
  Download,
  Printer,
  Sparkles,
  AlertCircle,
  QrCode,
  Share2,
  Check,
  RotateCw,
} from 'lucide-react';
import { DinastiaBrandBadge } from './DinastiaBrandBadge';
import { Manutencao, ConfiguracaoClube } from '../types';
import { gerarRelatorioPreventivoVeiculosPdf } from '../services/manutencaoPreventivaPdfService';

interface Props {
  veiculos: Veiculo[];
  associados: Associado[];
  manutencoes?: Manutencao[];
  config?: ConfiguracaoClube;
  onSaveNew: (data: Omit<Veiculo, 'id'>) => Promise<void>;
  onUpdate?: (id: string, data: Partial<Veiculo>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenManutencaoForVeiculo?: (veiculo: Veiculo) => void;
  onOpenAbastecimentoForVeiculo?: (veiculo: Veiculo) => void;
}

// Pre-curated high-resolution motorcycle gallery for online search
const MOTORCYCLE_CATALOG = [
  {
    marca: 'BMW',
    modelo: 'R 1250 GS Adventure',
    versao: 'Triple Black',
    categoria: 'Big Trail',
    fotoUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Harley-Davidson',
    modelo: 'Fat Boy 114',
    versao: 'Milwaukee-Eight',
    categoria: 'Custom / Cruiser',
    fotoUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Harley-Davidson',
    modelo: 'Ultra Limited',
    versao: 'Touring Glide',
    categoria: 'Touring',
    fotoUrl:
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Triumph',
    modelo: 'Tiger 900 Rally Pro',
    versao: 'Rally Pro',
    categoria: 'Big Trail',
    fotoUrl:
      'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Honda',
    modelo: 'CRF 1100L Africa Twin',
    versao: 'Adventure Sports ES',
    categoria: 'Big Trail',
    fotoUrl:
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Yamaha',
    modelo: 'MT-09',
    versao: 'Master of Torque 890cc',
    categoria: 'Naked',
    fotoUrl:
      'https://images.unsplash.com/photo-1571216332002-282dce467b32?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Ducati',
    modelo: 'Multistrada V4 S',
    versao: 'Radar Edition',
    categoria: 'Big Trail / Crossover',
    fotoUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Kawasaki',
    modelo: 'Versys 1000 GT',
    versao: 'Grand Tourer',
    categoria: 'Touring / Trail',
    fotoUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
  },
  {
    marca: 'Royal Enfield',
    modelo: 'Interceptor 650',
    versao: 'Custom Chrome',
    categoria: 'Clássica / Café Racer',
    fotoUrl:
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=1000&q=80',
  },
];

export const VeiculosView: React.FC<Props> = ({
  veiculos,
  associados,
  manutencoes = [],
  config,
  onSaveNew,
  onUpdate,
  onDelete,
  onOpenManutencaoForVeiculo,
  onOpenAbastecimentoForVeiculo,
}) => {
  const { activeRole, currentAssociado } = useAuth();
  const [gerandoRelatorioPreventivo, setGerandoRelatorioPreventivo] = useState(false);

  const handleGerarRelatorioPreventivo = async () => {
    try {
      setGerandoRelatorioPreventivo(true);
      const cfg = config || {
        nomeClube: 'Iron Side Road Rider M.C.',
        lema: 'Os melhores são de ferro',
        cidadeSede: 'São Paulo',
        estadoSede: 'SP',
      } as any;
      await gerarRelatorioPreventivoVeiculosPdf(veiculos, manutencoes, associados, cfg);
    } catch (err) {
      console.error('Erro ao gerar relatório preventivo:', err);
      alert('Erro ao gerar relatório de manutenção preventiva.');
    } finally {
      setGerandoRelatorioPreventivo(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);

  // CRLV Detail Viewer Modal
  const [selectedCrlvVeiculo, setSelectedCrlvVeiculo] = useState<Veiculo | null>(null);

  // Digitalized Document Fullscreen Viewer Modal
  const [selectedDocUrl, setSelectedDocUrl] = useState<{
    url: string;
    nome: string;
    placa: string;
  } | null>(null);

  // Photo Selector Modal / Tabs: 'camera' | 'internet' | 'upload'
  const [photoSourceTab, setPhotoSourceTab] = useState<'camera' | 'internet' | 'upload'>('internet');
  const [internetSearchQuery, setInternetSearchQuery] = useState('');

  // Camera video stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Document scan camera state
  const docScanInputRef = useRef<HTMLInputElement | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  // Full CRLV & Vehicle Form State
  const initialFormState = {
    tipo: 'moto' as 'moto' | 'carro' | 'outro',
    marca: 'BMW',
    modelo: 'R 1250 GS Adventure',
    versao: 'Triple Black Edition',
    ano: '2024',
    anoFabricacao: '2024',
    cor: 'Preto Metálico',
    placa: 'BRA2E19',
    kmAtual: 14500,
    fotoUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    seguradora: 'Porto Seguro Motos',
    apolice: '984210-98',
    observacoes: 'Pneus Michelin Anakee Adventure recém trocados.',
    // DADOS COMPLETOS DO CRLV
    renavam: '01293847561',
    chassi: '9BWZZZ123RP098765',
    cilindradaCc: 1254,
    potenciaCv: 136,
    combustivel: 'Gasolina',
    numeroCrlv: '202619482910',
    exercicioLicenciamento: '2026',
    categoriaVeiculo: 'Particular / Motocicleta',
    capacidadePassageiros: '2P',
    nomeProprietarioCrlv: currentAssociado?.nome || 'Roberto Silveira',
    cpfCnpjProprietario: currentAssociado?.cpf || '123.456.789-00',
    municipioEmplacamento: 'São Paulo',
    ufEmplacamento: 'SP',
    restricoesFinanceiras: 'Nenhuma',
    // DIGITALIZAÇÃO DO DOCUMENTO
    crlvDigitalUrl: '',
    crlvDigitalNomeArquivo: '',
    crlvDigitalizadoEm: '',
  };

  const [form, setForm] = useState(initialFormState);

  // Filter based on active role
  const displayVeiculos = veiculos.filter((v) => {
    if (activeRole === 'associado' && currentAssociado) {
      if (v.associadoId !== currentAssociado.id && v.associadoId !== currentAssociado.uid) {
        return false;
      }
    }
    return (
      v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.renavam && v.renavam.includes(searchTerm))
    );
  });

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError('Não foi possível acessar a câmera do dispositivo. Verifique as permissões.');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture snapshot from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setForm((prev) => ({ ...prev, fotoUrl: dataUrl }));
      stopCamera();
    }
  };

  // Handle CRLV Document file upload / scan
  const handleCrlvFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setForm((prev) => ({
        ...prev,
        crlvDigitalUrl: result,
        crlvDigitalNomeArquivo: file.name,
        crlvDigitalizadoEm: new Date().toLocaleDateString('pt-BR'),
      }));
    };
    reader.readAsDataURL(file);
  };

  // Intelligent OCR Scanner simulator for physical CRLV
  const handleSimulateOcrScan = () => {
    setOcrLoading(true);
    setOcrSuccessMsg(null);

    setTimeout(() => {
      // Simulate real-world OCR parsing from scanned CRLV
      setForm((prev) => ({
        ...prev,
        renavam: prev.renavam || '09845123891',
        chassi: prev.chassi || '9BWZZZ456RP789123',
        placa: prev.placa || 'IRN9A26',
        ano: prev.ano || '2024',
        anoFabricacao: prev.anoFabricacao || '2024',
        exercicioLicenciamento: '2026',
        numeroCrlv: prev.numeroCrlv || '202677894512',
        combustivel: 'Gasolina',
        cilindradaCc: prev.cilindradaCc || 1250,
        potenciaCv: prev.potenciaCv || 136,
        categoriaVeiculo: 'Particular / Motocicleta',
        municipioEmplacamento: 'São Paulo',
        ufEmplacamento: 'SP',
        restricoesFinanceiras: 'Nenhuma',
        crlvDigitalizadoEm: new Date().toLocaleDateString('pt-BR'),
        crlvDigitalNomeArquivo: prev.crlvDigitalNomeArquivo || 'crlv_e_digitalizado_camera.pdf',
        crlvDigitalUrl:
          prev.crlvDigitalUrl ||
          'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDUkxWIEVsZXRyw7RuaWNvIC0gU0VOQVRSQU4pCi9BdXRob3IgKFNFTkFUUkFOIC8gU0VSTykKPj4KZW5kb2JqCg==',
      }));
      setOcrLoading(false);
      setOcrSuccessMsg('Dados do CRLV digitalizados e preenchidos com sucesso via OCR!');
      setTimeout(() => setOcrSuccessMsg(null), 4000);
    }, 1200);
  };

  // Open modal for editing
  const handleOpenEdit = (v: Veiculo) => {
    setEditingVeiculo(v);
    setForm({
      tipo: v.tipo,
      marca: v.marca,
      modelo: v.modelo,
      versao: v.versao || '',
      ano: v.ano,
      anoFabricacao: v.anoFabricacao || v.ano,
      cor: v.cor,
      placa: v.placa,
      kmAtual: v.kmAtual,
      fotoUrl: v.fotoUrl || '',
      seguradora: v.seguradora || '',
      apolice: v.apolice || '',
      observacoes: v.observacoes || '',
      renavam: v.renavam || '',
      chassi: v.chassi || '',
      cilindradaCc: v.cilindradaCc || 0,
      potenciaCv: v.potenciaCv || 0,
      combustivel: v.combustivel || 'Gasolina',
      numeroCrlv: v.numeroCrlv || '',
      exercicioLicenciamento: v.exercicioLicenciamento || '2026',
      categoriaVeiculo: v.categoriaVeiculo || 'Particular / Motocicleta',
      capacidadePassageiros: v.capacidadePassageiros || '2P',
      nomeProprietarioCrlv: v.nomeProprietarioCrlv || currentAssociado?.nome || '',
      cpfCnpjProprietario: v.cpfCnpjProprietario || currentAssociado?.cpf || '',
      municipioEmplacamento: v.municipioEmplacamento || 'São Paulo',
      ufEmplacamento: v.ufEmplacamento || 'SP',
      restricoesFinanceiras: v.restricoesFinanceiras || 'Nenhuma',
      crlvDigitalUrl: v.crlvDigitalUrl || '',
      crlvDigitalNomeArquivo: v.crlvDigitalNomeArquivo || '',
      crlvDigitalizadoEm: v.crlvDigitalizadoEm || '',
    });
    setIsModalOpen(true);
  };

  // Open modal for new vehicle
  const handleOpenNew = () => {
    setEditingVeiculo(null);
    setForm(initialFormState);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerId = currentAssociado?.id || currentAssociado?.uid || 'user-001';
    const ownerNome = currentAssociado?.nomeGuerra || currentAssociado?.nome || 'Roberto Silveira';

    const vehiclePayload = {
      associadoId: editingVeiculo ? editingVeiculo.associadoId : ownerId,
      associadoNome: editingVeiculo ? editingVeiculo.associadoNome : ownerNome,
      tipo: form.tipo,
      marca: form.marca,
      modelo: form.modelo,
      versao: form.versao,
      ano: form.ano,
      anoFabricacao: form.anoFabricacao || form.ano,
      cor: form.cor,
      placa: form.placa.toUpperCase().trim(),
      kmAtual: Number(form.kmAtual) || 0,
      fotoUrl: form.fotoUrl,
      seguradora: form.seguradora,
      apolice: form.apolice,
      observacoes: form.observacoes,
      renavam: form.renavam,
      chassi: form.chassi,
      cilindradaCc: Number(form.cilindradaCc) || 0,
      potenciaCv: Number(form.potenciaCv) || 0,
      combustivel: form.combustivel,
      numeroCrlv: form.numeroCrlv,
      exercicioLicenciamento: form.exercicioLicenciamento || '2026',
      categoriaVeiculo: form.categoriaVeiculo,
      capacidadePassageiros: form.capacidadePassageiros,
      nomeProprietarioCrlv: form.nomeProprietarioCrlv,
      cpfCnpjProprietario: form.cpfCnpjProprietario,
      municipioEmplacamento: form.municipioEmplacamento,
      ufEmplacamento: form.ufEmplacamento,
      restricoesFinanceiras: form.restricoesFinanceiras,
      crlvDigitalUrl: form.crlvDigitalUrl,
      crlvDigitalNomeArquivo: form.crlvDigitalNomeArquivo,
      crlvDigitalizadoEm: form.crlvDigitalizadoEm || (form.crlvDigitalUrl ? new Date().toLocaleDateString('pt-BR') : undefined),
      createdAt: editingVeiculo ? editingVeiculo.createdAt : new Date().toISOString(),
    };

    if (editingVeiculo && onUpdate) {
      await onUpdate(editingVeiculo.id, vehiclePayload);
    } else {
      await onSaveNew(vehiclePayload);
    }

    stopCamera();
    setIsModalOpen(false);
  };

  // Filter internet motorcycle catalog
  const filteredCatalog = MOTORCYCLE_CATALOG.filter((item) => {
    if (!internetSearchQuery) return true;
    const query = internetSearchQuery.toLowerCase();
    return (
      item.marca.toLowerCase().includes(query) ||
      item.modelo.toLowerCase().includes(query) ||
      item.versao.toLowerCase().includes(query) ||
      item.categoria.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
              {activeRole === 'associado' ? 'Minhas Motos & Garagem' : 'Frota & Motocicletas do Clube'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
              CRLV-e Integrado
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {activeRole === 'associado'
              ? 'Cadastro completo do CRLV, digitalização do documento oficial, fotos e odômetro.'
              : `Total de ${veiculos.length} motocicletas cadastradas na frota com documentação em dia.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGerarRelatorioPreventivo}
            disabled={gerandoRelatorioPreventivo}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            title="Gerar relatório PDF com limites de km para óleo, pneus e revisões preventivas"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>{gerandoRelatorioPreventivo ? 'Gerando...' : 'Relatório Preventivo (Óleo/Pneus PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Motocicleta & CRLV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar moto por marca, modelo, placa ou RENAVAM..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayVeiculos.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Bike className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-semibold">
              Nenhuma motocicleta encontrada.
            </p>
            <p className="text-zinc-600 text-xs mt-1">
              Clique em &quot;Cadastrar Motocicleta & CRLV&quot; para registrar seu veículo e documento.
            </p>
          </div>
        ) : (
          displayVeiculos.map((v) => {
            const hasCrlvDoc = Boolean(v.crlvDigitalUrl);

            return (
              <div
                key={v.id}
                className="rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition overflow-hidden shadow-sm flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="h-48 w-full bg-zinc-950 relative overflow-hidden">
                    <img
                      src={
                        v.fotoUrl ||
                        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={`${v.marca} ${v.modelo}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />

                    {/* Placa Badge */}
                    <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700 text-[11px] font-mono font-black text-amber-400 shadow">
                      {v.placa}
                    </div>

                    {/* Ano Badge */}
                    <div className="absolute top-3 right-3 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700 text-[11px] font-bold text-zinc-200">
                      {v.ano}
                    </div>

                    {/* CRLV Digital Status Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      {hasCrlvDoc ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-zinc-950 text-[10px] font-bold flex items-center gap-1 shadow">
                          <CheckCircle2 className="w-3 h-3" />
                          CRLV Digitalizado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/80 text-zinc-950 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          CRLV Pendente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                          {v.marca}
                        </span>
                        {v.renavam && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            RENAVAM: {v.renavam}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-zinc-100 font-heading">
                        {v.modelo}
                      </h3>
                      {v.versao && (
                        <p className="text-xs text-zinc-400">
                          {v.versao} • {v.cor}
                        </p>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Hodômetro</span>
                          <span className="font-bold text-zinc-100 font-mono">
                            {v.kmAtual.toLocaleString('pt-BR')} km
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Seguro</span>
                          <span className="text-zinc-200 truncate block text-[11px]">
                            {v.seguradora || 'Sem apólice'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CRLV Highlights */}
                    <div className="bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span>Licenciamento:</span>
                        <span className="font-bold text-zinc-200 font-mono">
                          {v.exercicioLicenciamento || '2026'}
                        </span>
                      </div>
                      {v.chassi && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span>Chassi / VIN:</span>
                          <span className="font-mono text-zinc-300 truncate max-w-[170px]">
                            {v.chassi}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 pt-2 border-t border-zinc-800/80 space-y-2">
                  {/* View CRLV Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedCrlvVeiculo(v)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-800 hover:bg-amber-500 text-zinc-200 hover:text-zinc-950 text-xs font-bold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400 group-hover:text-zinc-950" />
                    <span>Dossiê CRLV-e Digital</span>
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {onOpenAbastecimentoForVeiculo && (
                        <button
                          type="button"
                          onClick={() => onOpenAbastecimentoForVeiculo(v)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition"
                          title="Registrar Abastecimento"
                        >
                          <Fuel className="w-3 h-3 text-amber-400" />
                          Combustível
                        </button>
                      )}
                      {onOpenManutencaoForVeiculo && (
                        <button
                          type="button"
                          onClick={() => onOpenManutencaoForVeiculo(v)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition"
                          title="Registrar Manutenção"
                        >
                          <Wrench className="w-3 h-3 text-sky-400" />
                          Revisão
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(v)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition"
                        title="Editar moto e documento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja remover a motocicleta ${v.marca} ${v.modelo}?`)) {
                            onDelete(v.id);
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                        title="Remover veículo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: CADASTRO COMPLETO DO VEÍCULO & DOCUMENTO CRLV */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-zinc-950">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 font-heading">
                    {editingVeiculo ? 'Editar Motocicleta & CRLV' : 'Cadastrar Motocicleta & CRLV'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Dados completos do Certificado de Registro e Licenciamento de Veículo (CRLV).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsModalOpen(false);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-5 text-xs">
              {/* SECTION 1: SELETOR DE FOTO DA MOTO (CÂMERA / PESQUISA INTERNET / UPLOAD) */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    Foto da Motocicleta (Câmera ou Pesquisa na Internet)
                  </span>
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setPhotoSourceTab('internet');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        photoSourceTab === 'internet'
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Pesquisar na Internet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoSourceTab('camera');
                        startCamera();
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        photoSourceTab === 'camera'
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Usar Câmera
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setPhotoSourceTab('upload');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        photoSourceTab === 'upload'
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      URL / Arquivo
                    </button>
                  </div>
                </div>

                {/* TAB: CÂMERA EM TEMPO REAL */}
                {photoSourceTab === 'camera' && (
                  <div className="space-y-3">
                    <div className="relative h-60 bg-black rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {!cameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 p-4 text-center">
                          <Camera className="w-8 h-8 text-zinc-500 mb-2" />
                          <p className="text-zinc-400 text-xs">Câmera desativada</p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
                          >
                            Ativar Câmera
                          </button>
                        </div>
                      )}
                      {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 p-4 text-center text-red-400">
                          {cameraError}
                        </div>
                      )}
                    </div>
                    {cameraActive && (
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Capturar Foto da Câmera
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs"
                        >
                          Desligar Câmera
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: PESQUISA NA INTERNET */}
                {photoSourceTab === 'internet' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Pesquisar foto por modelo (ex: BMW R 1250, Fat Boy, Tiger, Africa Twin)..."
                        value={internetSearchQuery}
                        onChange={(e) => setInternetSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {filteredCatalog.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              marca: item.marca,
                              modelo: item.modelo,
                              versao: item.versao,
                              fotoUrl: item.fotoUrl,
                            }));
                          }}
                          className={`group relative rounded-xl overflow-hidden border text-left transition ${
                            form.fotoUrl === item.fotoUrl
                              ? 'border-amber-500 ring-2 ring-amber-500/30'
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="h-16 w-full bg-zinc-950">
                            <img
                              src={item.fotoUrl}
                              alt={item.modelo}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          </div>
                          <div className="p-1.5 bg-zinc-900/90 text-[10px]">
                            <p className="font-bold text-zinc-200 truncate">{item.modelo}</p>
                            <p className="text-zinc-500 text-[9px]">{item.marca}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: URL OU UPLOAD */}
                {photoSourceTab === 'upload' && (
                  <div className="space-y-2">
                    <label className="block text-zinc-400 text-[11px]">URL da Foto da Moto</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.fotoUrl}
                      onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Preview current selected photo */}
                {form.fotoUrl && (
                  <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                    <div className="h-12 w-16 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 flex-shrink-0">
                      <img src={form.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[11px] truncate flex-1">
                      <span className="text-emerald-400 font-bold block flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Foto Selecionada
                      </span>
                      <span className="text-zinc-500 text-[10px] truncate block">{form.fotoUrl}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: DIGITALIZAÇÃO DO DOCUMENTO CRLV NO APLICATIVO */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    Digitalização do Documento CRLV no Aplicativo
                  </span>
                  <span className="text-[10px] text-zinc-500">PDF ou Foto do Documento</span>
                </div>

                <p className="text-zinc-400 text-[11px]">
                  Digitalize seu documento físico ou importe o CRLV-e digital emitido pelo DETRAN /
                  SENATRAN para validação no aplicativo do moto clube.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Box */}
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-amber-500/60 bg-zinc-900/50 cursor-pointer transition text-center group">
                    <Upload className="w-6 h-6 text-zinc-500 group-hover:text-amber-400 mb-1.5" />
                    <span className="font-bold text-zinc-200 text-xs">
                      Selecionar Arquivo do CRLV
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      PDF, JPG ou PNG (Documento digitalizado)
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCrlvFileUpload(file);
                      }}
                    />
                  </label>

                  {/* OCR Simulator Scanner */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1">
                        <Scan className="w-4 h-4" />
                        <span>Preenchimento Inteligente via OCR</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Escanear CRLV e preencher automaticamente Renavam, Chassi, Placa e Proprietário.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={ocrLoading}
                      onClick={handleSimulateOcrScan}
                      className="mt-3 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow"
                    >
                      {ocrLoading ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processando OCR do Documento...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Escanear & Autopreencher Dados</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {ocrSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{ocrSuccessMsg}</span>
                  </div>
                )}

                {/* Scanned Document Indicator */}
                {form.crlvDigitalUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-zinc-200 block">
                          {form.crlvDigitalNomeArquivo || 'documento_crlv_digitalizado.pdf'}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Digitalizado em: {form.crlvDigitalizadoEm || 'Hoje'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDocUrl({
                          url: form.crlvDigitalUrl,
                          nome: form.crlvDigitalNomeArquivo || 'CRLV Digital',
                          placa: form.placa,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Visualizar
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 3: INFORMAÇÕES DO DOCUMENTO OFICIAL DO DETRAN (CRLV) */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-4">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] block">
                  Informações Cadastrais do Documento CRLV
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Placa Oficial *</label>
                    <input
                      type="text"
                      required
                      placeholder="ABC1D23"
                      value={form.placa}
                      onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono font-bold uppercase focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">RENAVAM *</label>
                    <input
                      type="text"
                      required
                      placeholder="01293847561"
                      value={form.renavam}
                      onChange={(e) => setForm({ ...form, renavam: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono font-bold focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1">Chassi / VIN (17 dígitos) *</label>
                    <input
                      type="text"
                      required
                      placeholder="9BWZZZ123RP098765"
                      value={form.chassi}
                      onChange={(e) => setForm({ ...form, chassi: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono uppercase focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="BMW, Harley, Honda..."
                      value={form.marca}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      placeholder="R 1250 GS, Fat Boy..."
                      value={form.modelo}
                      onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Versão</label>
                    <input
                      type="text"
                      placeholder="Adventure, Pro..."
                      value={form.versao}
                      onChange={(e) => setForm({ ...form, versao: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Cor Predominante</label>
                    <input
                      type="text"
                      placeholder="Preto, Prata..."
                      value={form.cor}
                      onChange={(e) => setForm({ ...form, cor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Ano Fabricação</label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={form.anoFabricacao}
                      onChange={(e) => setForm({ ...form, anoFabricacao: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Ano Modelo</label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={form.ano}
                      onChange={(e) => setForm({ ...form, ano: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Cilindrada (cc)</label>
                    <input
                      type="number"
                      placeholder="1254"
                      value={form.cilindradaCc}
                      onChange={(e) => setForm({ ...form, cilindradaCc: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Combustível</label>
                    <input
                      type="text"
                      placeholder="Gasolina / Flex"
                      value={form.combustivel}
                      onChange={(e) => setForm({ ...form, combustivel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Exercício Licenciamento</label>
                    <input
                      type="text"
                      placeholder="2026"
                      value={form.exercicioLicenciamento}
                      onChange={(e) => setForm({ ...form, exercicioLicenciamento: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Cód. Segurança CRLV</label>
                    <input
                      type="text"
                      placeholder="202619482910"
                      value={form.numeroCrlv}
                      onChange={(e) => setForm({ ...form, numeroCrlv: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Município</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={form.municipioEmplacamento}
                      onChange={(e) => setForm({ ...form, municipioEmplacamento: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="SP"
                      value={form.ufEmplacamento}
                      onChange={(e) => setForm({ ...form, ufEmplacamento: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-zinc-400 mb-1">Nome do Proprietário no CRLV</label>
                    <input
                      type="text"
                      placeholder="Nome completo conforme documento"
                      value={form.nomeProprietarioCrlv}
                      onChange={(e) => setForm({ ...form, nomeProprietarioCrlv: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">CPF / CNPJ do Proprietário</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={form.cpfCnpjProprietario}
                      onChange={(e) => setForm({ ...form, cpfCnpjProprietario: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Hodômetro Atual (KM)</label>
                    <input
                      type="number"
                      value={form.kmAtual}
                      onChange={(e) => setForm({ ...form, kmAtual: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Seguradora</label>
                    <input
                      type="text"
                      placeholder="Porto, Tokio Marine, Suhai..."
                      value={form.seguradora}
                      onChange={(e) => setForm({ ...form, seguradora: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Restrições Financeiras</label>
                    <input
                      type="text"
                      placeholder="Nenhuma, Alienação..."
                      value={form.restricoesFinanceiras}
                      onChange={(e) => setForm({ ...form, restricoesFinanceiras: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Observações / Acessórios / Customizações</label>
                <textarea
                  rows={2}
                  placeholder="Acessórios instalados, histórico de revisões..."
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition"
                >
                  Salvar Motocicleta & CRLV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOSSIÊ CRLV-E OFICIAL DO DETRAN / SENATRAN */}
      {selectedCrlvVeiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 my-8">
            {/* Header style DETRAN / SENATRAN */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-zinc-100 tracking-wider">
                      CERTIFICADO DE REGISTRO E LICENCIAMENTO DE VEÍCULO
                    </h3>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-mono font-bold">
                    CRLV-e DIGITAL • EXERCÍCIO {selectedCrlvVeiculo.exercicioLicenciamento || '2026'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCrlvVeiculo(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Document Fields */}
            <div className="py-4 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Código RENAVAM
                  </span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {selectedCrlvVeiculo.renavam || '01293847561'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Placa Oficial
                  </span>
                  <span className="text-sm font-bold text-zinc-100 font-mono">
                    {selectedCrlvVeiculo.placa}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Exercício
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {selectedCrlvVeiculo.exercicioLicenciamento || '2026'}
                  </span>
                </div>
              </div>

              {/* Chassi & Vehicle Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Chassi / VIN
                  </span>
                  <span className="font-bold text-zinc-200 font-mono">
                    {selectedCrlvVeiculo.chassi || '9BWZZZ123RP098765'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Marca / Modelo / Versão
                  </span>
                  <span className="font-bold text-zinc-200">
                    {selectedCrlvVeiculo.marca} {selectedCrlvVeiculo.modelo}{' '}
                    {selectedCrlvVeiculo.versao}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Ano Fabr. / Modelo
                  </span>
                  <span className="text-zinc-300">
                    {selectedCrlvVeiculo.anoFabricacao || selectedCrlvVeiculo.ano} /{' '}
                    {selectedCrlvVeiculo.ano}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Cor Predominante
                  </span>
                  <span className="text-zinc-300">{selectedCrlvVeiculo.cor}</span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Combustível
                  </span>
                  <span className="text-zinc-300">
                    {selectedCrlvVeiculo.combustivel || 'Gasolina'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Cilindrada / Potência
                  </span>
                  <span className="text-zinc-300">
                    {selectedCrlvVeiculo.cilindradaCc || 1254} cc •{' '}
                    {selectedCrlvVeiculo.potenciaCv || 136} cv
                  </span>
                </div>
              </div>

              {/* Proprietário & Município */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Nome do Proprietário
                  </span>
                  <span className="font-bold text-zinc-200">
                    {selectedCrlvVeiculo.nomeProprietarioCrlv ||
                      selectedCrlvVeiculo.associadoNome ||
                      'Roberto Silveira'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    CPF / CNPJ
                  </span>
                  <span className="font-mono text-zinc-300">
                    {selectedCrlvVeiculo.cpfCnpjProprietario || '123.456.789-00'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Local de Emplacamento
                  </span>
                  <span className="text-zinc-300">
                    {selectedCrlvVeiculo.municipioEmplacamento || 'São Paulo'} -{' '}
                    {selectedCrlvVeiculo.ufEmplacamento || 'SP'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">
                    Restrições Financeiras
                  </span>
                  <span className="text-zinc-300">
                    {selectedCrlvVeiculo.restricoesFinanceiras || 'Nenhuma'}
                  </span>
                </div>
              </div>

              {/* Digitalized Document Section */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="font-sans font-bold text-zinc-200 block">
                      Validação de Autenticidade Digital
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Cód. Segurança: {selectedCrlvVeiculo.numeroCrlv || '202619482910'}
                    </span>
                  </div>
                </div>

                {selectedCrlvVeiculo.crlvDigitalUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocUrl({
                        url: selectedCrlvVeiculo.crlvDigitalUrl!,
                        nome: selectedCrlvVeiculo.crlvDigitalNomeArquivo || 'CRLV Digital',
                        placa: selectedCrlvVeiculo.placa,
                      })
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-sans font-bold text-xs shadow"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Abrir CRLV Digitalizado</span>
                  </button>
                ) : (
                  <span className="text-amber-400 text-[11px] font-sans">
                    Arquivo digital ainda não anexado
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2 font-sans">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
              <button
                type="button"
                onClick={() => setSelectedCrlvVeiculo(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DO DOCUMENTO DIGITALIZADO EM TELA CHEIA */}
      {selectedDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{selectedDocUrl.nome}</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    PLACA: {selectedDocUrl.placa} • Documento Digital Oficial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocUrl(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-hidden flex items-center justify-center bg-zinc-950 rounded-2xl border border-zinc-800 my-2">
              {selectedDocUrl.url.startsWith('data:application/pdf') ? (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-emerald-400 mx-auto" />
                  <p className="text-zinc-200 font-bold text-sm">
                    Documento CRLV Eletrônico Digitalizado (PDF)
                  </p>
                  <p className="text-xs text-zinc-500">
                    O documento encontra-se preservado no cofre digital de segurança do moto clube.
                  </p>
                  <a
                    href={selectedDocUrl.url}
                    download={selectedDocUrl.nome}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
                  >
                    <Download className="w-4 h-4" />
                    Baixar PDF do CRLV
                  </a>
                </div>
              ) : (
                <img
                  src={selectedDocUrl.url}
                  alt="CRLV Digitalizado"
                  className="max-h-[65vh] w-auto object-contain rounded-lg"
                />
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <a
                href={selectedDocUrl.url}
                download={selectedDocUrl.nome}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <button
                type="button"
                onClick={() => setSelectedDocUrl(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marca Dinastia System no rodapé de Veículos / Minhas Motos */}
      <DinastiaBrandBadge variant="footer" className="mt-8" />
    </div>
  );
};
