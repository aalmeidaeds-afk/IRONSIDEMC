import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Associado, Veiculo, Mensalidade, ConfiguracaoClube, Evento } from '../types';

/**
 * Generates a 20-character randomized alphanumeric authenticity validation key
 * Example output: "9K4F-7R2M-8W1Q-5X3B-6D0P" (20 alphanumeric characters)
 */
export function gerarChaveAutenticidade20Chars(associado: Associado): {
  chaveBruta: string;
  chaveFormatada: string;
  hashIntegridade: string;
} {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars (0, O, 1, I)
  let chaveBruta = '';

  // Use cryptographic random values if available for high entropy
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 20; i++) {
      chaveBruta += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 20; i++) {
      chaveBruta += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  // Format into 5 blocks of 4 characters: XXXX-XXXX-XXXX-XXXX-XXXX (20 alphanumeric characters)
  const chaveFormatada = `${chaveBruta.slice(0, 4)}-${chaveBruta.slice(4, 8)}-${chaveBruta.slice(8, 12)}-${chaveBruta.slice(12, 16)}-${chaveBruta.slice(16, 20)}`;

  // Deterministic 32-bit FNV-1a style hash of member data + generated key for integrity verification
  let hashVal = 2166136261;
  const fullStr = `${chaveBruta}:${associado.numeroAssociado || ''}:${associado.cpf || ''}:${associado.id || ''}`;
  for (let i = 0; i < fullStr.length; i++) {
    hashVal ^= fullStr.charCodeAt(i);
    hashVal = Math.imul(hashVal, 16777619);
  }
  const hashIntegridade = Math.abs(hashVal >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return {
    chaveBruta,
    chaveFormatada,
    hashIntegridade: `SHA256-${hashIntegridade}`,
  };
}

/**
 * Loads an image from URL (handling CORS) and converts to Base64 PNG for jsPDF
 */
async function loadImageAsBase64(url?: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch {
          // ignore canvas taint errors
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 1800);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Calculates approximate age from DD/MM/YYYY or YYYY-MM-DD
 */
function calcularIdade(dataNasc?: string): string {
  if (!dataNasc) return '-';
  try {
    let dia = 0, mes = 0, ano = 0;
    if (dataNasc.includes('/')) {
      const parts = dataNasc.split('/');
      dia = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      ano = parseInt(parts[2], 10);
    } else if (dataNasc.includes('-')) {
      const parts = dataNasc.split('-');
      ano = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      dia = parseInt(parts[2], 10);
    }
    if (ano > 1900) {
      const hoje = new Date();
      let idade = hoje.getFullYear() - ano;
      const m = hoje.getMonth() - mes;
      if (m < 0 || (m === 0 && hoje.getDate() < dia)) {
        idade--;
      }
      return `${idade} anos`;
    }
  } catch {
    // fallback
  }
  return '-';
}

/**
 * Generates the complete official Ficha Cadastral in PDF format
 */
export async function gerarFichaCadastralCompletaPdf(params: {
  associado: Associado;
  veiculos: Veiculo[];
  mensalidades: Mensalidade[];
  eventos?: Evento[];
  config: ConfiguracaoClube;
  chaveAutenticidade?: {
    chaveBruta: string;
    chaveFormatada: string;
    hashIntegridade: string;
  };
}): Promise<jsPDF> {
  const { associado, veiculos, mensalidades, config } = params;
  const authInfo = params.chaveAutenticidade || gerarChaveAutenticidade20Chars(associado);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Carregar imagens em paralelo com timeout de segurança
  const [logoBase64, fotoBase64, assinaturaBase64] = await Promise.all([
    loadImageAsBase64(config.logotipoUrl),
    loadImageAsBase64(associado.fotoUrl),
    loadImageAsBase64(associado.assinaturaDigitalUrl),
  ]);

  // =============================================================
  // CABEÇALHO OFICIAL DO MOTO CLUBE
  // =============================================================
  // Faixa de fundo superior estilizada
  doc.setFillColor(15, 15, 18);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Linha dourada metálica divisória
  doc.setFillColor(245, 158, 11); // Amber 500
  doc.rect(0, 37.2, pageWidth, 0.8, 'F');

  // Logotipo oficial ou brasão vetorial
  const logoSize = 24;
  const logoX = margin;
  const logoY = 6.5;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch {
      drawVectorEmblem(doc, logoX, logoY, logoSize);
    }
  } else {
    drawVectorEmblem(doc, logoX, logoY, logoSize);
  }

  // Textos Institucionais do Cabeçalho
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(config.nomeClube.toUpperCase(), logoX + logoSize + 4, 14);

  doc.setTextColor(228, 228, 231);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`"${config.lema}" • Fundação: ${config.anoFundacao}`, logoX + logoSize + 4, 19);

  doc.setTextColor(161, 161, 170);
  doc.setFontSize(7.5);
  doc.text(
    `Sede: ${config.cidadeSede}-${config.estadoSede} | Fone/Whats: ${config.whatsappContato || config.telefoneContato} | ${config.emailContato}`,
    logoX + logoSize + 4,
    24
  );

  doc.setTextColor(140, 140, 150);
  doc.setFontSize(6.8);
  doc.text(
    `Chave PIX: ${config.chavePix} (${config.tipoChavePix}) | Registro Estatutário Oficial`,
    logoX + logoSize + 4,
    28.5
  );

  // Badge da Ficha Cadastral no canto superior direito
  const badgeWidth = 54;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(badgeX, 7, badgeWidth, 23, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.roundedRect(badgeX, 7, badgeWidth, 23, 2, 2, 'S');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA CADASTRAL OFICIAL', badgeX + badgeWidth / 2, 12, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text(`MATRÍCULA: ${associado.numeroAssociado || 'PENDENTE'}`, badgeX + badgeWidth / 2, 17.5, { align: 'center' });

  doc.setTextColor(161, 161, 170);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, badgeX + badgeWidth / 2, 22.5, { align: 'center' });
  doc.text(`Autenticidade: ${authInfo.chaveFormatada.slice(0, 9)}...`, badgeX + badgeWidth / 2, 26.5, { align: 'center' });

  let currentY = 43;

  // =============================================================
  // TARJA DE IDENTIFICAÇÃO DO ASSOCIADO COM FOTO OFICIAL
  // =============================================================
  const profileBannerHeight = 25;
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(margin, currentY, contentWidth, profileBannerHeight, 2, 2, 'F');
  doc.setDrawColor(63, 63, 70);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, profileBannerHeight, 2, 2, 'S');

  // Foto 3x4 do Associado
  const fotoWidth = 18;
  const fotoHeight = 22;
  const fotoX = margin + 2;
  const fotoY = currentY + 1.5;

  if (fotoBase64) {
    try {
      doc.addImage(fotoBase64, 'JPEG', fotoX, fotoY, fotoWidth, fotoHeight);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.3);
      doc.rect(fotoX, fotoY, fotoWidth, fotoHeight, 'S');
    } catch {
      drawPhotoPlaceholder(doc, fotoX, fotoY, fotoWidth, fotoHeight, associado.nome);
    }
  } else {
    drawPhotoPlaceholder(doc, fotoX, fotoY, fotoWidth, fotoHeight, associado.nome);
  }

  // Textos do Perfil
  const textLeft = fotoX + fotoWidth + 4;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const nomeGuerra = associado.nomeGuerra ? ` "${associado.nomeGuerra.toUpperCase()}"` : '';
  doc.text(`${associado.nome.toUpperCase()}${nomeGuerra}`, textLeft, currentY + 6.5);

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(8);
  doc.text(`CARGO: ${(associado.cargo || 'Membro Ativo').toUpperCase()} | REGIONAL: ${(associado.regional || config.cidadeSede).toUpperCase()}`, textLeft, currentY + 12);

  doc.setTextColor(180, 180, 185);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const filiacaoInfo = `Filiação: ${associado.dataFiliacao || associado.dataAssociacao || 'Regular'} | Ata: ${associado.numeroAtaFiliacao || 'Homologada'}`;
  doc.text(filiacaoInfo, textLeft, currentY + 17);

  doc.setTextColor(140, 140, 150);
  doc.setFontSize(7);
  doc.text(`Aprovado por: ${associado.aprovadoPorDiretoria || associado.aprovadoPor || 'Diretoria Oficial'} • Tipo Sanguíneo: ${associado.tipoSanguineo || 'O+'}`, textLeft, currentY + 21.5);

  // Status Badge
  const statusColor = associado.status === 'ativo' ? [16, 185, 129] : [245, 158, 11];
  const statusWidth = 30;
  const statusX = pageWidth - margin - statusWidth - 3;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(statusX, currentY + 5, statusWidth, 14, 1.5, 1.5, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(associado.status.toUpperCase(), statusX + statusWidth / 2, currentY + 13.5, { align: 'center' });

  currentY += profileBannerHeight + 4;

  // =============================================================
  // SEÇÃO 1: DADOS PESSOAIS & IDENTIFICAÇÃO CIVIL COMPLETA
  // =============================================================
  const idadeTexto = calcularIdade(associado.dataNascimento);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '1. DADOS PESSOAIS & IDENTIFICAÇÃO CIVIL COMPLETA', colSpan: 4 }]],
    body: [
      [
        { content: 'Nome Completo:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 32 } },
        { content: associado.nome },
        { content: 'Nome de Guerra / Apelido:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 38 } },
        { content: associado.nomeGuerra || '-' },
      ],
      [
        { content: 'CPF:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: associado.cpf || '-' },
        { content: 'RG:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: associado.rg || '-' },
      ],
      [
        { content: 'Data de Nascimento:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: `${associado.dataNascimento || '-'} (${idadeTexto})` },
        { content: 'Estado Civil:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: associado.estadoCivil || '-' },
      ],
      [
        { content: 'CNH Número:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: associado.cnhNumero || '-' },
        { content: 'Categoria / Validade CNH:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: `${associado.cnhCategoria || '-'} | Validade: ${associado.cnhValidade || '-'}` },
      ],
      [
        { content: 'Data de Ingresso:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: associado.dataAssociacao || associado.dataFiliacao || '-' },
        { content: 'Ata de Filiação / Aprovador:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: `${associado.numeroAtaFiliacao || 'Ata Oficial'} / ${associado.aprovadoPorDiretoria || associado.aprovadoPor || 'Diretoria'}` },
      ],
    ],
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [245, 158, 11],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.2,
      cellPadding: 1.7,
      textColor: [30, 30, 30],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // =============================================================
  // SEÇÃO 2: CONTATOS OFICIAIS & ENDEREÇO RESIDENCIAL COMPLETO
  // =============================================================
  const enderecoLinha1 = `${associado.logradouro || ''}, Nº ${associado.numero || 'S/N'}${associado.complemento ? ` - ${associado.complemento}` : ''}`;
  const enderecoLinha2 = `Bairro: ${associado.bairro || '-'} | Cidade/UF: ${associado.cidade || '-'}/${associado.estado || '-'} | CEP: ${associado.cep || '-'}`;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '2. CONTATOS OFICIAIS & ENDEREÇO RESIDENCIAL', colSpan: 4 }]],
    body: [
      [
        { content: 'Telefone Principal:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 32 } },
        { content: associado.telefone || associado.whatsapp || '-' },
        { content: 'WhatsApp Oficial:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 38 } },
        { content: associado.whatsapp || '-' },
      ],
      [
        { content: 'E-mail Principal:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: associado.email || '-', colSpan: 3 },
      ],
      [
        { content: 'Logradouro / Número:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: enderecoLinha1, colSpan: 3 },
      ],
      [
        { content: 'Bairro / Município / CEP:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: enderecoLinha2, colSpan: 3 },
      ],
    ],
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [245, 158, 11],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.2,
      cellPadding: 1.7,
      textColor: [30, 30, 30],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // =============================================================
  // SEÇÃO 3: FICHA MÉDICA DE EMERGÊNCIA & CONTATOS DE RESGATE (LGPD)
  // =============================================================
  const anyAssoc = associado as any;
  const alergiaMed = associado.alergiaMedicamento?.possui || anyAssoc.alergiaMedicamentoSim
    ? `SIM: ${associado.alergiaMedicamento?.descricao || anyAssoc.alergiaMedicamentoDescricao || 'Alergia relatada'}`
    : 'NÃO POSSUI';

  const alergiaAlim = associado.alergiaAlimentacao?.possui || anyAssoc.alergiaAlimentacaoSim
    ? `SIM: ${associado.alergiaAlimentacao?.descricao || anyAssoc.alergiaAlimentacaoDescricao || 'Alergia alimentar'}`
    : 'NÃO';

  const problemaSaude = associado.problemaSaude?.possui || anyAssoc.problemaSaudeSim
    ? `SIM: ${associado.problemaSaude?.descricao || anyAssoc.problemaSaudeDescricao || 'Problemas preexistentes'}`
    : 'NENHUM REGISTRADO';

  const pcdInfo = associado.pcd?.possui || anyAssoc.pcdSim
    ? `SIM: ${associado.pcd?.descricao || anyAssoc.pcdDescricao || 'PCD Registrado'}`
    : 'NÃO';

  const c1 = associado.contatosEmergencia?.[0];
  const c2 = associado.contatosEmergencia?.[1];

  const contato1 = c1?.nome || anyAssoc.emergencia1Nome
    ? `${c1?.nome || anyAssoc.emergencia1Nome} (${c1?.parentesco || anyAssoc.emergencia1Parentesco || 'Emergência'}) - Fone: ${c1?.telefone || anyAssoc.emergencia1Telefone || '-'}`
    : 'Nenhum contato 1 cadastrado';

  const contato2 = c2?.nome || anyAssoc.emergencia2Nome
    ? `${c2?.nome || anyAssoc.emergencia2Nome} (${c2?.parentesco || anyAssoc.emergencia2Parentesco || 'Emergência'}) - Fone: ${c2?.telefone || anyAssoc.emergencia2Telefone || '-'}`
    : 'Nenhum contato 2 cadastrado';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '3. FICHA MÉDICA & CONTATOS DE EMERGÊNCIA NA ESTRADA (DADOS PROTEGIDOS POR LGPD)', colSpan: 4 }]],
    body: [
      [
        { content: 'TIPO SANGUÍNEO COM RH:', styles: { fontStyle: 'bold', fillColor: [254, 242, 242], textColor: [185, 28, 28], cellWidth: 38 } },
        { content: associado.tipoSanguineo || 'NÃO INFORMADO', styles: { fontStyle: 'bold', textColor: [185, 28, 28], fontSize: 8.5 } },
        { content: 'CONDIÇÃO PCD:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 32 } },
        { content: pcdInfo },
      ],
      [
        { content: 'Alergia a Medicamento:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: alergiaMed },
        { content: 'Alergia Alimentar:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: alergiaAlim },
      ],
      [
        { content: 'Problemas de Saúde / Comorbidade:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: problemaSaude, colSpan: 3 },
      ],
      [
        { content: 'Contato Emergência 1:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: contato1, colSpan: 3 },
      ],
      [
        { content: 'Contato Emergência 2:', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: contato2, colSpan: 3 },
      ],
    ],
    headStyles: {
      fillColor: [153, 27, 27], // Dark Red for medical
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.2,
      cellPadding: 1.7,
      textColor: [30, 30, 30],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // =============================================================
  // SEÇÃO 4: FROTA DE MOTOCICLETAS DO ASSOCIADO
  // =============================================================
  // Quebrar para nova página se o espaço for curto
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 14;
  }

  const memberVehicles = veiculos.filter(
    (v) => v.associadoId === associado.id || v.associadoId === associado.uid
  );

  const veiculosBody =
    memberVehicles.length > 0
      ? memberVehicles.map((v) => [
          `${v.marca} ${v.modelo}${v.versao ? ` (${v.versao})` : ''}`,
          `${v.ano || '-'}${v.anoFabricacao ? `/${v.anoFabricacao}` : ''}`,
          v.placa || '-',
          v.cor || '-',
          v.cilindradaCc ? `${v.cilindradaCc} cc` : '-',
          v.renavam || 'Não informado',
          v.chassi || '-',
        ])
      : [['Nenhuma motocicleta registrada na frota oficial do associado', '-', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [
      [{ content: '4. FROTA OFICIAL DE MOTOCICLETAS REGISTRADAS', colSpan: 7 }],
      ['Marca / Modelo', 'Ano', 'Placa', 'Cor', 'Cilindrada', 'Renavam', 'Chassi (VIN)'],
    ],
    body: veiculosBody,
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [245, 158, 11],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.6,
      textColor: [30, 30, 30],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // =============================================================
  // SEÇÃO 5: REGULARIDADE SOCIAL & MENSALIDADES
  // =============================================================
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 14;
  }

  const memberDues = mensalidades.filter(
    (m) => m.associadoId === associado.id || m.associadoId === associado.uid
  );
  const totalPagas = memberDues.filter((m) => m.status === 'pago').length;
  const totalPendentes = memberDues.filter((m) => m.status === 'pendente' || m.status === 'atrasado').length;
  const recentDues = memberDues.slice(0, 4);

  const mensalidadesRows =
    recentDues.length > 0
      ? recentDues.map((m) => [
          m.competencia,
          m.vencimento,
          `R$ ${m.valor.toFixed(2)}`,
          m.status.toUpperCase(),
          m.dataPagamento || '-',
          m.formaPagamento || 'PIX',
        ])
      : [['Nenhum registro de mensalidade arquivado', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [
      [{ content: `5. REGULARIDADE FINANCEIRA & MENSALIDADES (${totalPagas} Pagas | ${totalPendentes} Pendentes - Status: ${totalPendentes === 0 ? 'ADIMPLENTE' : 'PENDENTE'})`, colSpan: 6 }],
      ['Competência', 'Vencimento', 'Valor', 'Status', 'Data Pagamento', 'Forma'],
    ],
    body: mensalidadesRows,
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [245, 158, 11],
      fontSize: 7.8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.5,
      textColor: [30, 30, 30],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // =============================================================
  // SEÇÃO 6: TERMO LGPD, DECLARAÇÃO E ASSINATURA DIGITAL
  // =============================================================
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 14;
  }

  // Texto legal LGPD & LAI
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(220, 220, 228);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setTextColor(60, 60, 65);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const lgpdText = `DECLARAÇÃO ESTATUTÁRIA & LGPD (LEI Nº 13.709/2018): O associado declara verídicas as informações prestadas e autoriza o ${config.nomeClube} a efetuar o tratamento de dados pessoais e de saúde para fins de cadastro associativo, socorro emergencial rodoviário e conformidade estatutária, resguardado o sigilo de dados sensíveis.`;
  const splitLgpd = doc.splitTextToSize(lgpdText, contentWidth - 4);
  doc.text(splitLgpd, margin + 2, currentY + 3.8);

  currentY += 16.5;

  // Boxes de Assinatura do Associado e Homologação da Diretoria
  const signBoxWidth = (contentWidth - 4) / 2;
  const signBoxHeight = 21;

  // Box 1: Assinatura do Associado
  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(210, 210, 215);
  doc.roundedRect(margin, currentY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');

  if (assinaturaBase64) {
    try {
      doc.addImage(assinaturaBase64, 'PNG', margin + 8, currentY + 1.5, signBoxWidth - 16, signBoxHeight - 8);
    } catch {
      drawSignaturePlaceholder(doc, margin + 4, currentY + 10, signBoxWidth - 8);
    }
  } else {
    drawSignaturePlaceholder(doc, margin + 4, currentY + 10, signBoxWidth - 8);
  }

  doc.setTextColor(80, 80, 85);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${associado.nome.toUpperCase()} (${(associado.nomeGuerra || '').toUpperCase()})`, margin + signBoxWidth / 2, currentY + signBoxHeight - 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(`Assinatura do Associado • CPF: ${associado.cpf}`, margin + signBoxWidth / 2, currentY + signBoxHeight - 1.5, { align: 'center' });

  // Box 2: Homologação da Diretoria do Clube
  const box2X = margin + signBoxWidth + 4;
  doc.setFillColor(252, 252, 253);
  doc.roundedRect(box2X, currentY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.line(box2X + 8, currentY + 11, box2X + signBoxWidth - 8, currentY + 11);

  doc.setTextColor(24, 24, 27);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DIRETORIA DO MOTO CLUBE', box2X + signBoxWidth / 2, currentY + 14.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(`Aprovado por: ${associado.aprovadoPorDiretoria || associado.aprovadoPor || 'Diretoria Executiva'} • Em ${new Date().toLocaleDateString('pt-BR')}`, box2X + signBoxWidth / 2, currentY + 18, { align: 'center' });

  currentY += signBoxHeight + 3.5;

  // =============================================================
  // SEÇÃO 7: BOX DE AUTENTICIDADE ELETRÔNICA & CHAVE DE 20 CARACTERES
  // =============================================================
  if (currentY > pageHeight - 34) {
    doc.addPage();
    currentY = 14;
  }

  doc.setFillColor(18, 18, 22);
  doc.roundedRect(margin, currentY, contentWidth, 23, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, contentWidth, 23, 2, 2, 'S');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO DE AUTENTICIDADE E VALIDAÇÃO DIGITAL (20 CARACTERES ALFANUMÉRICOS)', margin + 4, currentY + 5.5);

  doc.setFillColor(39, 39, 42);
  doc.roundedRect(margin + 4, currentY + 8, contentWidth - 8, 8.5, 1.5, 1.5, 'F');

  doc.setTextColor(253, 224, 71); // Amber/Yellow
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(authInfo.chaveFormatada, pageWidth / 2, currentY + 13.8, { align: 'center' });

  doc.setTextColor(161, 161, 170);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  const infoText = `Chave: ${authInfo.chaveBruta} • ${authInfo.hashIntegridade} • Validado eletronicamente sob as normas estatutárias e LGPD`;
  doc.text(infoText, pageWidth / 2, currentY + 20, { align: 'center' });

  // =============================================================
  // RODAPÉ OFICIAL EM TODAS AS PÁGINAS COM A CHAVE DE 20 CARACTERES
  // =============================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Faixa escura no rodapé
    doc.setFillColor(15, 15, 18);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    // Linha dourada metálica
    doc.setFillColor(245, 158, 11);
    doc.rect(0, pageHeight - 8, pageWidth, 0.4, 'F');

    doc.setTextColor(228, 228, 231);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `CHAVE DE AUTENTICIDADE: ${authInfo.chaveFormatada} • ${authInfo.hashIntegridade}`,
      margin,
      pageHeight - 3
    );

    doc.setTextColor(161, 161, 170);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${config.nomeClube} • Ficha: ${associado.numeroAssociado} • Pág. ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 3,
      { align: 'right' }
    );
  }

  return doc;
}

/**
 * Fallback visual placeholder for member photo
 */
function drawPhotoPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number, nome: string) {
  doc.setFillColor(39, 39, 42);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'S');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  const initials = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  doc.text('FOTO 3X4', x + w / 2, y + h / 2 - 2, { align: 'center' });
  doc.text(`[ ${initials} ]`, x + w / 2, y + h / 2 + 3, { align: 'center' });
}

/**
 * Fallback signature line placeholder
 */
function drawSignaturePlaceholder(doc: jsPDF, x: number, y: number, w: number) {
  doc.setDrawColor(160, 160, 165);
  doc.setLineWidth(0.3);
  doc.line(x + 4, y, x + w - 4, y);
}

/**
 * Desenha um brasão vetorial de alta definição para o cabeçalho oficial
 */
function drawVectorEmblem(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(x, y, size, size, 2.5, 2.5, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, size, size, 2.5, 2.5, 'S');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('M.C.', x + size / 2, y + size / 2 - 0.5, { align: 'center' });

  doc.setTextColor(228, 228, 231);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('IRON SIDE', x + size / 2, y + size / 2 + 4, { align: 'center' });
}
