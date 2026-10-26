import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Associado, ConfiguracaoClube, Veiculo } from '../types';

/**
 * Gera a Carteirinha Digital Oficial em PDF de Alta Resolução (300 DPI layout)
 * com Frente e Verso estruturados para impressão em crachá/cartão PVC ou porte em papel.
 */
export async function exportarCarteirinhaPdf(
  associado: Associado,
  config: ConfiguracaoClube,
  motoPrincipal?: Veiculo
): Promise<void> {
  // Cria documento PDF em formato A4 ou Cartão de Identificação (85mm x 54mm em landscape)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Fundo dark elegante no cabeçalho da página
  doc.setFillColor(15, 15, 18);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.text(config.nomeClube.toUpperCase(), pageWidth / 2, 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text('DOCUMENTO OFICIAL DE IDENTIFICAÇÃO MOTOCICLÍSTICA • CARTEIRA NACIONAL', pageWidth / 2, 20, { align: 'center' });
  doc.text(`Sede: ${config.cidadeSede || 'São Paulo'} - ${config.estadoSede || 'SP'} • Fundado em ${config.anoFundacao || '2018'}`, pageWidth / 2, 25, { align: 'center' });

  // Linha dourada divisória
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.line(15, 31, pageWidth - 15, 31);

  // ==========================================
  // 1. FRENTE DO CARTÃO (Medida Padrão: 90mm x 55mm)
  // ==========================================
  const cardWidth = 95;
  const cardHeight = 60;
  const cardX1 = (pageWidth - cardWidth) / 2;
  const cardY1 = 40;

  // Fundo do Cartão Frente (Dark Leather style)
  doc.setFillColor(20, 20, 24);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.roundedRect(cardX1, cardY1, cardWidth, cardHeight, 4, 4, 'FD');

  // Topo do Cartão Frente
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(cardX1, cardY1, cardWidth, 6, 4, 4, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'black');
  doc.setTextColor(9, 9, 11);
  doc.text('CARTEIRA OFICIAL DO INTEGRANTE • FILIADO REGULAR', cardX1 + cardWidth / 2, cardY1 + 4.2, { align: 'center' });

  // Brasão e Foto do Membro
  const photoX = cardX1 + 5;
  const photoY = cardY1 + 10;
  const photoSize = 25;

  // Foto placeholder ou real
  doc.setFillColor(30, 30, 35);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(photoX, photoY, photoSize, photoSize, 2, 2, 'FD');

  if (associado.fotoUrl && associado.fotoUrl.startsWith('data:image')) {
    try {
      doc.addImage(associado.fotoUrl, 'JPEG', photoX, photoY, photoSize, photoSize);
    } catch {
      // fallback
    }
  }

  // Nome e Dados Principais na Frente
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(associado.nome.toUpperCase(), cardX1 + 34, cardY1 + 14);

  doc.setFontSize(12);
  doc.setTextColor(245, 158, 11);
  doc.text(`"${associado.nomeGuerra || 'IRMÃO'}"`, cardX1 + 34, cardY1 + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text('MATRÍCULA:', cardX1 + 34, cardY1 + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(associado.numeroAssociado, cardX1 + 55, cardY1 + 26);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('CARGO:', cardX1 + 34, cardY1 + 31);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(associado.cargo || 'Membro Efetivo', cardX1 + 55, cardY1 + 31);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('REGIONAL:', cardX1 + 34, cardY1 + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text((associado.regional || config.cidadeSede || 'Matriz').slice(0, 24), cardX1 + 55, cardY1 + 36);

  // Tarja inferior de Tipo Sanguíneo e CPF
  doc.setFillColor(39, 39, 42);
  doc.rect(cardX1 + 0.8, cardY1 + cardHeight - 12, cardWidth - 1.6, 11, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(239, 68, 68);
  doc.text(`TIPO SANGUÍNEO: ${associado.tipoSanguineo || 'O+'}`, cardX1 + 5, cardY1 + cardHeight - 5);

  doc.setTextColor(212, 212, 216);
  doc.text(`CPF: ${associado.cpf}`, cardX1 + 52, cardY1 + cardHeight - 5);

  // ==========================================
  // 2. VERSO DO CARTÃO (Com QR Code e Dados Médicos)
  // ==========================================
  const cardY2 = cardY1 + cardHeight + 12;

  // Fundo Verso
  doc.setFillColor(20, 20, 24);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.roundedRect(cardX1, cardY2, cardWidth, cardHeight, 4, 4, 'FD');

  // Topo do Verso
  doc.setFillColor(39, 39, 42);
  doc.rect(cardX1 + 0.8, cardY2 + 0.8, cardWidth - 1.6, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('DADOS MÉDICOS, VEÍCULO & CONTATOS DE EMERGÊNCIA', cardX1 + cardWidth / 2, cardY2 + 5, { align: 'center' });

  // Gerar QR Code de validação
  const verificationUrl = `${window.location.origin}/validar/${associado.numeroAssociado}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#09090b', light: '#fef08a' },
    });
    doc.addImage(qrDataUrl, 'PNG', cardX1 + cardWidth - 28, cardY2 + 10, 22, 22);
  } catch {
    // fallback
  }

  // Dados Médicos e Contato de Emergência
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(161, 161, 170);

  doc.text('CNH / Categoria:', cardX1 + 5, cardY2 + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${associado.cnhNumero || 'Informado'} (Cat. ${associado.cnhCategoria || 'A'})`, cardX1 + 32, cardY2 + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('Data de Filiação:', cardX1 + 5, cardY2 + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(associado.dataFiliacao || associado.dataAssociacao || 'Ativa', cardX1 + 32, cardY2 + 18);

  const contato = associado.contatosEmergencia?.[0];
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('Emergência:', cardX1 + 5, cardY2 + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68);
  doc.text(`${contato?.nome || 'Central MC'} (${contato?.parentesco || 'Sede'})`, cardX1 + 32, cardY2 + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('Tel. Emergência:', cardX1 + 5, cardY2 + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(contato?.telefone || config.telefoneContato || '(11) 98765-4321', cardX1 + 32, cardY2 + 28);

  // Motocicleta vinculada
  if (motoPrincipal) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(161, 161, 170);
    doc.text('Moto Principal:', cardX1 + 5, cardY2 + 33);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 158, 11);
    doc.text(`${motoPrincipal.marca} ${motoPrincipal.modelo} (${motoPrincipal.placa})`, cardX1 + 32, cardY2 + 33);
  }

  // Lema e Validação
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(161, 161, 170);
  doc.text(`"${config.lema || 'Os melhores são de ferro'}"`, cardX1 + cardWidth / 2, cardY2 + 43, { align: 'center' });

  // Rodapé do verso
  doc.setDrawColor(60, 60, 65);
  doc.line(cardX1 + 5, cardY2 + 48, cardX1 + cardWidth - 5, cardY2 + 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(113, 113, 122);
  doc.text('Validação Digital Instantânea através da leitura do QR Code acima.', cardX1 + 5, cardY2 + 53);
  doc.text('Dinastia System M.C. • Assinatura da Diretoria Executiva', cardX1 + cardWidth - 5, cardY2 + 53, { align: 'right' });

  // Instruções de Impressão na folha A4
  const infoY = cardY2 + cardHeight + 15;
  doc.setFillColor(25, 25, 30);
  doc.roundedRect(15, infoY, pageWidth - 30, 40, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('INSTRUÇÕES PARA IMPRESSÃO EM CRITÉRIO DE ALTA RESOLUÇÃO', 20, infoY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 212, 216);
  doc.text('1. Imprima esta folha em papel cartão ou papel fotográfico de gramatura 180g a 240g.', 20, infoY + 15);
  doc.text('2. Recorte as duas faces (Frente e Verso) nas linhas delimitadas e plastifique ou insira em porta-crachá impermeável.', 20, infoY + 21);
  doc.text('3. O documento possui validade e QR Code verificável em comboios, postos de combustíveis parceiros e eventos oficiais.', 20, infoY + 27);
  doc.text('4. Porte obrigatório em todas as viagens com o colete oficial do moto clube.', 20, infoY + 33);

  // Rodapé da página A4
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text(`Documento emitido eletronicamente em ${new Date().toLocaleString('pt-BR')} pelo Sistema Dinastia MC`, pageWidth / 2, 285, { align: 'center' });

  // Inicia download
  const cleanNumero = associado.numeroAssociado.replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`Carteirinha_Oficial_${cleanNumero}_${associado.nomeGuerra.replace(/\s+/g, '_')}.pdf`);
}
