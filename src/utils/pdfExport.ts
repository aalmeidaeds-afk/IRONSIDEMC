import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Evento, Associado, ConfiguracaoClube } from '../types';

export interface InscritoLinhaPDF {
  numero: number;
  nome: string;
  nomeGuerra?: string;
  numeroAssociado: string;
  statusPresenca: 'Presente' | 'Não Confirmada / Ausente';
  telefone?: string;
  cidade?: string;
}

/**
 * Gera e realiza o download do arquivo PDF com a lista oficial de inscritos no evento.
 * Inclui: Nome, Número do Associado e Status de Presença (+ metadados e cabeçalho oficial do clube).
 */
export function exportarListaInscritosPDF(
  evento: Evento,
  todosAssociados: Associado[],
  config?: ConfiguracaoClube
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [20, 20, 22]; // Dark zinc #141416
  const amberAccent = [245, 158, 11]; // Amber #f59e0b
  const nomeClube = config?.nomeClube || 'IRON SIDE ROAD RIDER M.C.';
  const lemaClube = config?.lema || 'Irmandade, Honra, Liberdade e o Ronco dos Motores';
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaHoje = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Mapear os associados inscritos
  const inscritosIds = evento.inscritos || [];
  const presencasMap = evento.presencas || {};

  // Se houver IDs de inscritos, encontrar os associados correspondentes
  // Também dar fallback caso o ID do inscrito seja o id ou o uid
  const linhas: InscritoLinhaPDF[] = inscritosIds.map((inscritoId, idx) => {
    const associado = todosAssociados.find(
      (a) => a.id === inscritoId || a.uid === inscritoId
    );

    const isPresente = presencasMap[inscritoId] === true;

    if (associado) {
      return {
        numero: idx + 1,
        nome: associado.nome + (associado.nomeGuerra ? ` ("${associado.nomeGuerra}")` : ''),
        nomeGuerra: associado.nomeGuerra,
        numeroAssociado: associado.numeroAssociado || 'PENDENTE',
        statusPresenca: isPresente ? 'Presente' : 'Não Confirmada / Ausente',
        telefone: associado.telefone || associado.whatsapp || '-',
        cidade: `${associado.cidade || ''}${associado.estado ? `/${associado.estado}` : ''}`,
      };
    }

    return {
      numero: idx + 1,
      nome: `Associado ID: ${inscritoId}`,
      numeroAssociado: 'N/D',
      statusPresenca: isPresente ? 'Presente' : 'Não Confirmada / Ausente',
      telefone: '-',
      cidade: '-',
    };
  });

  // Top header bar
  doc.setFillColor(24, 24, 27); // Zinc 900
  doc.rect(0, 0, 210, 32, 'F');

  // Amber accent line
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(0, 31, 210, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(nomeClube.toUpperCase(), 14, 13);

  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(lemaClube, 14, 18);

  doc.setTextColor(161, 161, 170); // Zinc 400
  doc.setFontSize(7.5);
  doc.text(`SISTEMA DE GESTÃO OFICIAL • LISTA DE CHAMADA E INSCRIÇÕES`, 14, 24);

  // Document Badge on right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DOCUMENTO OFICIAL', 196, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text(`Emissão: ${dataHoje} às ${horaHoje}`, 196, 18, { align: 'right' });
  doc.text(`ID Evento: #${evento.id.slice(0, 8)}`, 196, 24, { align: 'right' });

  // Event Details Box
  const startY = 40;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, startY, 182, 34, 2, 2, 'F');
  doc.setDrawColor(228, 228, 231);
  doc.roundedRect(14, startY, 182, 34, 2, 2, 'S');

  // Event Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 24, 27);
  doc.text(evento.titulo, 18, startY + 8);

  // Event Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);

  const col1X = 18;
  const col2X = 85;
  const col3X = 145;

  doc.text(`Data: ${evento.data || 'A definir'}`, col1X, startY + 16);
  doc.text(`Horário: ${evento.hora || 'A definir'}`, col1X, startY + 22);
  doc.text(`Organizador: ${evento.organizador || 'Diretoria'}`, col1X, startY + 28);

  doc.text(`Local: ${evento.local || 'A definir'}`, col2X, startY + 16);
  doc.text(`Cidade: ${evento.cidade || config?.cidadeSede || '-'}`, col2X, startY + 22);
  doc.text(`Valor: ${evento.preco > 0 ? `R$ ${evento.preco.toFixed(2)}` : 'Gratuito'}`, col2X, startY + 28);

  const totalInscritos = linhas.length;
  const totalPresentes = linhas.filter((l) => l.statusPresenca === 'Presente').length;
  const limiteVagas = evento.vagasLimite || 50;

  doc.text(`Total Inscritos: ${totalInscritos} / ${limiteVagas}`, col3X, startY + 16);
  doc.text(`Presentes Marcados: ${totalPresentes}`, col3X, startY + 22);
  doc.text(`Status do Evento: ${evento.status ? evento.status.toUpperCase() : 'AGENDADO'}`, col3X, startY + 28);

  // Section title for table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text('RELAÇÃO DE INSCRITOS & CONTROLE DE PRESENÇA', 14, startY + 42);

  // Table Data
  const tableRows = linhas.map((linha) => [
    linha.numero.toString(),
    linha.nome,
    linha.numeroAssociado,
    linha.statusPresenca,
  ]);

  if (linhas.length === 0) {
    tableRows.push(['-', 'Nenhum associado inscrito até o momento.', '-', '-']);
  }

  // Generate Table using autoTable
  autoTable(doc, {
    startY: startY + 45,
    margin: { left: 14, right: 14 },
    head: [['#', 'Nome Completo / Guerra', 'Nº do Associado', 'Status de Presença']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [39, 39, 42],
      cellPadding: 3.2,
      lineColor: [228, 228, 231],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 46, halign: 'center' },
    },
    didParseCell: (data) => {
      // Highlight "Presente" vs "Não Confirmada / Ausente"
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val === 'Presente') {
          data.cell.styles.textColor = [16, 120, 70]; // Dark green
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Não Confirmada / Ausente') {
          data.cell.styles.textColor = [120, 120, 120];
        }
      }
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.font = 'courier';
        data.cell.styles.fontStyle = 'bold';
      }
    },
    foot: [
      [
        '',
        `Total de inscritos listados: ${totalInscritos}`,
        '',
        `Presentes: ${totalPresentes} | Ausentes: ${totalInscritos - totalPresentes}`,
      ],
    ],
    footStyles: {
      fillColor: [244, 244, 245],
      textColor: [39, 39, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
  });

  // Footer / Signature Section at bottom of page
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 25;

  // Signatures
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(20, footerY, 90, footerY);
  doc.line(120, footerY, 190, footerY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Responsável pelo Evento / Batedor', 55, footerY + 4, { align: 'center' });
  doc.text('Diretoria Executiva / Presidência', 155, footerY + 4, { align: 'center' });

  // System stamp
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Relatório emitido pelo Sistema Oficial ${nomeClube} • Registro de presença e credenciamento oficial.`,
    105,
    pageHeight - 8,
    { align: 'center' }
  );

  // File download name
  const sanitizedTitle = evento.titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 30);
  const fileName = `inscritos_evento_${sanitizedTitle}_${dataHoje.replace(/\//g, '-')}.pdf`;

  doc.save(fileName);
}
