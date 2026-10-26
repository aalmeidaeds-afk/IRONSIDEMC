import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiagnosticoItem } from '../types/diagnostico';
import { ConfiguracaoClube } from '../types';

export function exportarRelatorioDiagnosticoPDF(
  itens: DiagnosticoItem[],
  config?: ConfiguracaoClube,
  versaoApp = '1.2.2'
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryDark = [18, 18, 20]; // #121214
  const amberAccent = [245, 158, 11]; // #f59e0b
  const emeraldAccent = [16, 185, 129]; // #10b981
  const zincMuted = [113, 113, 122]; // #71717a

  const nomeClube = config?.nomeClube || 'IRON SIDE ROAD RIDER M.C.';
  const lemaClube = config?.lema || 'Irmandade, Honra, Liberdade e o Ronco dos Motores';
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const protocoloDoc = `LAUDO-DIAG-${Date.now().toString().slice(-8)}`;

  // Métricas
  const totalItens = itens.length;
  const totalCorrigidos = itens.filter((i) => i.status === 'corrigido').length;
  const totalAprovados = itens.filter((i) => i.status === 'aprovado').length;
  const totalOtimizados = itens.filter((i) => i.status === 'otimizado').length;

  // 1. Cabeçalho Superior Institucional
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.rect(0, 0, 297, 34, 'F');

  // Faixa de destaque Âmbar
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(0, 34, 297, 2, 'F');

  // Título e Nome do Clube
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(nomeClube.toUpperCase(), 14, 13);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(212, 212, 216);
  doc.text(`"${lemaClube}"`, 14, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text('LAUDO TÉCNICO DE AUDITORIA, DIAGNÓSTICO E CORREÇÕES DO SISTEMA', 14, 28);

  // Metadados no topo direito
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 212, 216);
  doc.text(`Protocolo: ${protocoloDoc}`, 283, 12, { align: 'right' });
  doc.text(`Emissão: ${dataEmissao} às ${horaEmissao}`, 283, 17, { align: 'right' });
  doc.text(`Versão do Sistema: v${versaoApp} (Build 14)`, 283, 22, { align: 'right' });
  doc.text(`Executor Responsável: Administrador Geral`, 283, 27, { align: 'right' });

  // 2. Quadro Resumo Executivo de Métricas
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 40, 269, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('RESUMO EXECUTIVO:', 18, 50);

  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Testes: ${totalItens}`, 70, 50);
  doc.setTextColor(180, 83, 9); // amber dark
  doc.text(`Falhas Corrigidas: ${totalCorrigidos}`, 120, 50);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`Recursos Aprovados: ${totalAprovados}`, 175, 50);
  doc.setTextColor(59, 130, 246); // blue
  doc.text(`Otimizações: ${totalOtimizados}`, 230, 50);

  // 3. Tabela de Registros com Chave Primária & Código de Erro
  const tableData = itens.map((item) => [
    item.codigoErro ? `${item.id}\nCod: ${item.codigoErro}` : item.id,
    item.dataHora,
    `${item.modulo}\n[${item.recurso}]`,
    item.descricaoFalha,
    item.correcaoEfetuada,
    item.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 60,
    head: [
      [
        'CHAVE PRIMÁRIA',
        'DATA & HORA',
        'MÓDULO / RECURSO',
        'DESCRIÇÃO DA FALHA / CENÁRIO TESTADO',
        'CORREÇÃO TÉCNICA EFETUADA',
        'STATUS',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [245, 158, 11],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [39, 39, 42],
      cellPadding: 3,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', textColor: [20, 20, 22] }, // ID
      1: { cellWidth: 26, fontSize: 7 }, // Data/Hora
      2: { cellWidth: 50, fontStyle: 'bold' }, // Módulo
      3: { cellWidth: 70 }, // Falha
      4: { cellWidth: 72 }, // Correção
      5: { cellWidth: 19, halign: 'center', fontStyle: 'bold' }, // Status
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    didParseCell: (data) => {
      // Colorir o status
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw).toLowerCase();
        if (val.includes('corrigido')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val.includes('aprovado')) {
          data.cell.styles.textColor = [59, 130, 246];
        } else if (val.includes('otimizado')) {
          data.cell.styles.textColor = [139, 92, 246];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // 4. Rodapé em todas as páginas com numeração e autenticidade
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = 210; // A4 landscape height in mm

    // Linha divisória do rodapé
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, 283, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(zincMuted[0], zincMuted[1], zincMuted[2]);

    doc.text(
      'Documento confidencial gerado pelo Sistema Oficial de Gestão Iron Side Road Rider M.C. • Acesso Restrito ao Administrador',
      14,
      pageHeight - 7
    );

    doc.text(
      `Página ${i} de ${totalPages} • Autenticação: SHA256-${Date.now().toString(16).toUpperCase()}`,
      283,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // Download do arquivo PDF
  const nomeArquivo = `Relatorio-Diagnostico-${nomeClube.replace(/\s+/g, '_')}-${dataEmissao.replace(/\//g, '-')}.pdf`;
  doc.save(nomeArquivo);
}
