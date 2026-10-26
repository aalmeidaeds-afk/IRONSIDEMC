import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Associado, Manutencao, Abastecimento, ConfiguracaoClube } from '../types';

export interface RankMemberData {
  associado: Associado;
  kmTotal: number;
  kmAbastecimentos: number;
  kmManutencoes: number;
  totalLitros: number;
  totalGastoCombustivel: number;
  totalGastoManutencao: number;
  nivelElite: 'Diamante' | 'Ouro' | 'Prata' | 'Bronze' | 'Estradeiro';
  posicao: number;
}

/**
 * Calcula os dados de quilometragem acumulada para cada associado
 */
export function calcularRankEstradas(
  associados: Associado[],
  abastecimentos: Abastecimento[],
  manutencoes: Manutencao[]
): RankMemberData[] {
  return associados
    .filter((a) => a.status === 'ativo' || a.status === 'aprovado')
    .map((assoc) => {
      const userAbast = abastecimentos.filter((ab) => ab.associadoId === assoc.id);
      const userManut = manutencoes.filter((m) => m.associadoId === assoc.id);

      // Maior km registrado ou soma diferencial
      const maxKmAbast = userAbast.reduce((max, cur) => Math.max(max, cur.km || 0), 0);
      const maxKmManut = userManut.reduce((max, cur) => Math.max(max, cur.km || 0), 0);
      
      const kmAbastecimentos = userAbast.reduce((acc, cur) => acc + (cur.km || 0), 0);
      const kmManutencoes = userManut.reduce((acc, cur) => acc + (cur.km || 0), 0);
      
      // Quilometragem de estrada calculada: maior odômetro absoluto ou soma acumulada ponderada
      const kmPico = Math.max(maxKmAbast, maxKmManut);
      const kmTotal = kmPico > 0 ? kmPico : (kmAbastecimentos + kmManutencoes);

      const totalLitros = userAbast.reduce((acc, cur) => acc + (cur.litros || 0), 0);
      const totalGastoCombustivel = userAbast.reduce((acc, cur) => acc + (cur.valorTotal || 0), 0);
      const totalGastoManutencao = userManut.reduce((acc, cur) => acc + (cur.valor || 0), 0);

      let nivelElite: 'Diamante' | 'Ouro' | 'Prata' | 'Bronze' | 'Estradeiro' = 'Estradeiro';
      if (kmTotal >= 50000) nivelElite = 'Diamante';
      else if (kmTotal >= 25000) nivelElite = 'Ouro';
      else if (kmTotal >= 10000) nivelElite = 'Prata';
      else if (kmTotal >= 5000) nivelElite = 'Bronze';

      return {
        associado: assoc,
        kmTotal,
        kmAbastecimentos,
        kmManutencoes,
        totalLitros,
        totalGastoCombustivel,
        totalGastoManutencao,
        nivelElite,
        posicao: 0,
      };
    })
    .sort((a, b) => b.kmTotal - a.kmTotal)
    .map((item, index) => ({
      ...item,
      posicao: index + 1,
    }));
}

/**
 * Exporta o Relatório Oficial em PDF do Rank de Estradas & Motoqueiros de Elite
 */
export async function exportarRankEstradasPdf(
  rankData: RankMemberData[],
  config: ConfiguracaoClube
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const now = new Date();
  const dataGeracao = now.toLocaleDateString('pt-BR');
  const horaGeracao = now.toLocaleTimeString('pt-BR');

  // Cabeçalho escuro executivo
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Friso dourado
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 35, pageWidth, 1.4, 'F');

  // Brasão / Título
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(config.nomeClube || 'IRON SIDE ROAD RIDER M.C.', 14, 12);

  doc.setTextColor(228, 228, 231);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.text(`“${config.lema || 'Os melhores são de ferro'}”`, 14, 17);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(254, 240, 138);
  doc.text('RANK DE ESTRADAS & MOTOQUEIROS DE ELITE', 14, 26);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 212, 216);
  doc.text(
    `Classificação Oficial por Quilometragem Total (Abastecimentos & Manutenções) • Emitido em ${dataGeracao} às ${horaGeracao}`,
    14,
    31
  );

  // Sede e Contato à Direita
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('AUDITORIA DE TELEMETRIA', pageWidth - 14, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(228, 228, 231);
  doc.text(`Sede: ${config.cidadeSede || 'São Paulo'} / ${config.estadoSede || 'SP'}`, pageWidth - 14, 16, { align: 'right' });
  doc.text(`Chave PIX: ${config.chavePix || 'Não informada'}`, pageWidth - 14, 21, { align: 'right' });
  doc.text('Dinastia System • Telemetria Segura', pageWidth - 14, 26, { align: 'right' });

  // Bloco de KPIs do Ranking
  const totalKmGeral = rankData.reduce((acc, c) => acc + c.kmTotal, 0);
  const totalLitrosGeral = rankData.reduce((acc, c) => acc + c.totalLitros, 0);
  const totalPilotos = rankData.length;
  const mediaKmPiloto = totalPilotos > 0 ? Math.round(totalKmGeral / totalPilotos) : 0;

  doc.setFillColor(244, 244, 245);
  doc.roundedRect(12, 39, 273, 11, 1.5, 1.5, 'F');
  doc.setDrawColor(212, 212, 216);
  doc.roundedRect(12, 39, 273, 11, 1.5, 1.5, 'S');

  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `TELEMETRIA DE ESTRADA: ${totalPilotos} Pilotos Ranqueados  |  Quilometragem Combinada: ${totalKmGeral.toLocaleString('pt-BR')} km  |  Combustível Queimado: ${totalLitrosGeral.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L  |  Média/Piloto: ${mediaKmPiloto.toLocaleString('pt-BR')} km`,
    16,
    46
  );

  // Linhas da Tabela
  const tableRows = rankData.map((item) => {
    let insignia = 'ESTRADEIRO';
    if (item.posicao === 1) insignia = '1º LUGAR (DIAMANTE)';
    else if (item.posicao === 2) insignia = '2º LUGAR (OURO)';
    else if (item.posicao === 3) insignia = '3º LUGAR (PRATA)';
    else if (item.nivelElite === 'Diamante') insignia = 'ELITE DIAMANTE';
    else if (item.nivelElite === 'Ouro') insignia = 'ELITE OURO';
    else if (item.nivelElite === 'Prata') insignia = 'ELITE PRATA';
    else if (item.nivelElite === 'Bronze') insignia = 'ELITE BRONZE';

    return [
      `#${item.posicao}`,
      item.associado.numeroAssociado || '---',
      item.associado.nome,
      item.associado.nomeGuerra || '---',
      item.associado.cargo || 'Membro',
      `${item.kmTotal.toLocaleString('pt-BR')} km`,
      `${item.totalLitros.toFixed(1)} L`,
      `R$ ${item.totalGastoCombustivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${item.totalGastoManutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      insignia,
    ];
  });

  autoTable(doc, {
    startY: 53,
    head: [
      [
        'Posição',
        'Matrícula',
        'Nome Completo',
        'Nome de Guerra',
        'Cargo',
        'KM Total',
        'Total Litros',
        'Gasto Combustível',
        'Gasto Manutenção',
        'Nível / Insígnia',
      ],
    ],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [217, 119, 6], // Amber escuro
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [39, 39, 42],
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 48 },
      3: { cellWidth: 32 },
      4: { cellWidth: 30 },
      5: { cellWidth: 26, fontStyle: 'bold', halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 27, halign: 'right' },
      8: { cellWidth: 27, halign: 'right' },
      9: { cellWidth: 23, fontStyle: 'bold', halign: 'center' },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setDrawColor(212, 212, 216);
      doc.setLineWidth(0.3);
      doc.line(12, pageHeight - 16, pageWidth - 12, pageHeight - 16);

      doc.setFontSize(7);
      doc.setTextColor(63, 63, 70);
      doc.text(
        `Classificação com base nos registros do Dinastia System • ${config.nomeClube} • Emitido em conformidade com o Estatuto Social e Telemetria de Frota.`,
        12,
        pageHeight - 11.5
      );
      doc.text(
        `Emitido em ${dataGeracao} às ${horaGeracao} • Página ${data.pageNumber} de ${pageCount}`,
        12,
        pageHeight - 7.5
      );

      // Linha de Assinatura Diretoria de Estrada
      doc.setDrawColor(161, 161, 170);
      doc.line(pageWidth - 75, pageHeight - 11, pageWidth - 12, pageHeight - 11);
      doc.text('Diretoria de Estrada / Capitão de Estrada', pageWidth - 43.5, pageHeight - 7.5, {
        align: 'center',
      });
    },
  });

  const slug = (config.nomeClube || 'ironside').toLowerCase().replace(/\s+/g, '-');
  doc.save(`rank-de-estradas-${slug}-${dataGeracao.replace(/\//g, '-')}.pdf`);
}
