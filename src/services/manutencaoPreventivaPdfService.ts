import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Veiculo, Manutencao, Associado, ConfiguracaoClube } from '../types';

export interface AlertaManutencaoMoto {
  veiculoId: string;
  marca: string;
  modelo: string;
  placa: string;
  proprietarioNome: string;
  kmAtual: number;
  tipoRevisao: 'Troca de Óleo & Filtro' | 'Pneus & Balanceamento' | 'Pastilhas de Freio' | 'Revisão Geral / Transmissão';
  intervaloPadraoKm: number;
  ultimoKmRegistrado: number;
  kmLimite: number;
  kmRestantes: number;
  statusAlerta: 'URGENTE' | 'ATENÇÃO' | 'REGULAR';
}

/**
 * Calcula os alertas preventivos de quilometragem para cada motocicleta
 */
export function calcularAlertasManutencaoPreventiva(
  veiculos: Veiculo[],
  manutencoes: Manutencao[] = [],
  associados: Associado[] = []
): AlertaManutencaoMoto[] {
  const alertas: AlertaManutencaoMoto[] = [];

  const assocMap = new Map<string, string>();
  associados.forEach((a) => assocMap.set(a.id, `${a.nome} (${a.nomeGuerra || 'Colete'})`));

  veiculos.forEach((moto) => {
    const kmAtual = moto.kmAtual || 0;
    const proprietario = assocMap.get(moto.associadoId) || moto.associadoNome || 'Associado';

    const manusMoto = manutencoes.filter((m) => m.veiculoId === moto.id);

    // 1. Verificação de Troca de Óleo (Intervalo padrão: 5.000 km)
    const ultimaTrocaOleo = manusMoto
      .filter((m) => {
        const serv = (m.tipoServico || '').toLowerCase();
        return serv.includes('oleo') || serv.includes('óleo') || serv.includes('revis');
      })
      .sort((a, b) => (b.km || 0) - (a.km || 0))[0];

    const ultimoKmOleo = ultimaTrocaOleo?.km || Math.max(0, kmAtual - 4200);
    const limiteOleo = ultimoKmOleo + 5000;
    const restantesOleo = limiteOleo - kmAtual;

    alertas.push({
      veiculoId: moto.id,
      marca: moto.marca,
      modelo: moto.modelo,
      placa: moto.placa,
      proprietarioNome: proprietario,
      kmAtual,
      tipoRevisao: 'Troca de Óleo & Filtro',
      intervaloPadraoKm: 5000,
      ultimoKmRegistrado: ultimoKmOleo,
      kmLimite: limiteOleo,
      kmRestantes: restantesOleo,
      statusAlerta: restantesOleo <= 0 ? 'URGENTE' : restantesOleo <= 1000 ? 'ATENÇÃO' : 'REGULAR',
    });

    // 2. Verificação de Pneus (Intervalo padrão: 15.000 km)
    const ultimaTrocaPneus = manusMoto
      .filter((m) => {
        const serv = (m.tipoServico || '').toLowerCase();
        return serv.includes('pneu') || serv.includes('pneus');
      })
      .sort((a, b) => (b.km || 0) - (a.km || 0))[0];

    const ultimoKmPneus = ultimaTrocaPneus?.km || Math.max(0, kmAtual - 13800);
    const limitePneus = ultimoKmPneus + 15000;
    const restantesPneus = limitePneus - kmAtual;

    alertas.push({
      veiculoId: moto.id,
      marca: moto.marca,
      modelo: moto.modelo,
      placa: moto.placa,
      proprietarioNome: proprietario,
      kmAtual,
      tipoRevisao: 'Pneus & Balanceamento',
      intervaloPadraoKm: 15000,
      ultimoKmRegistrado: ultimoKmPneus,
      kmLimite: limitePneus,
      kmRestantes: restantesPneus,
      statusAlerta: restantesPneus <= 0 ? 'URGENTE' : restantesPneus <= 1500 ? 'ATENÇÃO' : 'REGULAR',
    });

    // 3. Pastilhas de Freio (Intervalo padrão: 8.000 km)
    const ultimaRevisaoFreios = manusMoto
      .filter((m) => {
        const serv = (m.tipoServico || '').toLowerCase();
        return serv.includes('freio') || serv.includes('pastilha') || serv.includes('revis');
      })
      .sort((a, b) => (b.km || 0) - (a.km || 0))[0];

    const ultimoKmFreios = ultimaRevisaoFreios?.km || Math.max(0, kmAtual - 6800);
    const limiteFreios = ultimoKmFreios + 8000;
    const restantesFreios = limiteFreios - kmAtual;

    alertas.push({
      veiculoId: moto.id,
      marca: moto.marca,
      modelo: moto.modelo,
      placa: moto.placa,
      proprietarioNome: proprietario,
      kmAtual,
      tipoRevisao: 'Pastilhas de Freio',
      intervaloPadraoKm: 8000,
      ultimoKmRegistrado: ultimoKmFreios,
      kmLimite: limiteFreios,
      kmRestantes: restantesFreios,
      statusAlerta: restantesFreios <= 0 ? 'URGENTE' : restantesFreios <= 800 ? 'ATENÇÃO' : 'REGULAR',
    });
  });

  // Ordenar priorizando as mais urgentes (menor km restante primeiro)
  return alertas.sort((a, b) => a.kmRestantes - b.kmRestantes);
}

/**
 * Gera o relatório PDF oficial de Manutenções Preventivas da Frota
 */
export async function gerarRelatorioPreventivoVeiculosPdf(
  veiculos: Veiculo[],
  manutencoes: Manutencao[] = [],
  param3?: Associado[] | ConfiguracaoClube,
  param4?: ConfiguracaoClube
): Promise<void> {
  let associados: Associado[] = [];
  let config: ConfiguracaoClube = { nomeClube: 'IRON SIDE ROAD RIDER M.C.' } as any;

  if (Array.isArray(param3)) {
    associados = param3;
    if (param4) config = param4;
  } else if (param3) {
    config = param3;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const alertas = calcularAlertasManutencaoPreventiva(veiculos, manutencoes, associados);

  // Filtra apenas as que precisam de atenção preventiva (< 2000 km) ou todas
  const alertasCriticos = alertas.filter((a) => a.kmRestantes <= 2000);
  const listaParaExibir = alertasCriticos.length > 0 ? alertasCriticos : alertas;

  // Cabeçalho institucional
  doc.setFillColor(15, 15, 18);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.text(config.nomeClube.toUpperCase(), 15, 12);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('MÓDULO 02: GESTÃO DE MOTOS & FROTA • RELATÓRIO PREVENTIVO DE MANUTENÇÃO', 15, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text(
    `Emissão: ${new Date().toLocaleString('pt-BR')} • Critério de Segurança para Viagens em Comboio`,
    15,
    24
  );

  // Totalizadores em caixas
  const totalUrgentes = alertas.filter((a) => a.statusAlerta === 'URGENTE').length;
  const totalAtencao = alertas.filter((a) => a.statusAlerta === 'ATENÇÃO').length;
  const totalRegulares = alertas.filter((a) => a.statusAlerta === 'REGULAR').length;

  const kpiY = 33;
  // Caixa Urgentes
  doc.setFillColor(239, 68, 68);
  doc.roundedRect(15, kpiY, 55, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('LIMITE EXCEDIDO (URGENTE)', 18, kpiY + 5);
  doc.setFontSize(11);
  doc.text(`${totalUrgentes} manutenções vencidas`, 18, kpiY + 11);

  // Caixa Atenção
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(75, kpiY, 55, 14, 2, 2, 'F');
  doc.setTextColor(9, 9, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ATENÇÃO IMINENTE (< 1.000 KM)', 78, kpiY + 5);
  doc.setFontSize(11);
  doc.text(`${totalAtencao} motocicletas`, 78, kpiY + 11);

  // Caixa Regulares
  doc.setFillColor(39, 39, 42);
  doc.roundedRect(135, kpiY, 55, 14, 2, 2, 'F');
  doc.setTextColor(52, 211, 153);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EM DIA / REGULARES', 138, kpiY + 5);
  doc.setFontSize(11);
  doc.text(`${totalRegulares} itens conformes`, 138, kpiY + 11);

  // Tabela autoTable
  const headers = [
    'Placa',
    'Motocicleta',
    'Proprietário (Associado)',
    'Km Atual',
    'Revisão Preventiva',
    'Última Troca',
    'Km Limite',
    'Restante',
    'Status',
  ];

  const rows = listaParaExibir.map((item) => [
    item.placa,
    `${item.marca} ${item.modelo}`,
    item.proprietarioNome,
    `${item.kmAtual.toLocaleString('pt-BR')} km`,
    item.tipoRevisao,
    `${item.ultimoKmRegistrado.toLocaleString('pt-BR')} km`,
    `${item.kmLimite.toLocaleString('pt-BR')} km`,
    item.kmRestantes <= 0
      ? `VENCIDO (${Math.abs(item.kmRestantes)} km)`
      : `${item.kmRestantes.toLocaleString('pt-BR')} km`,
    item.statusAlerta,
  ]);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 52,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [24, 24, 27],
    },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [245, 158, 11],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw);
        if (val === 'URGENTE') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'ATENÇÃO') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
  });

  // Assinaturas e Rodapé
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  const signY = Math.min(finalY + 18, 185);

  doc.setDrawColor(180, 180, 180);
  doc.line(20, signY, 110, signY);
  doc.line(pageWidth - 110, signY, pageWidth - 20, signY);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('DIRETORIA DE ESTRADAS & COMBOIOS', 65, signY + 5, { align: 'center' });
  doc.text('DIRETORIA DE PATRIMÔNIO & SEGURANÇA', pageWidth - 65, signY + 5, { align: 'center' });

  doc.setFontSize(7);
  doc.text(
    `Relatório emitido pelo Dinastia System • Gestão Oficial Iron Side Road Rider M.C.`,
    pageWidth / 2,
    200,
    { align: 'center' }
  );

  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`Relatorio_Manutencao_Preventiva_Frota_${timestamp}.pdf`);
}
