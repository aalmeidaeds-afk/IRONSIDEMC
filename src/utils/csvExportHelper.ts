import { AuditoriaLog } from '../types';

/**
 * Converte a lista de logs de auditoria do Firebase em CSV com codificação UTF-8 BOM
 * para visualização perfeita no Microsoft Excel, LibreOffice e Google Planilhas.
 */
export function exportarAuditoriaCsv(logs: AuditoriaLog[], nomeArquivoPrefix = 'auditoria_ironside_mc'): boolean {
  if (!logs || logs.length === 0) {
    return false;
  }

  // Cabeçalho CSV
  const headers = ['ID', 'Data e Hora', 'Ação / Operação', 'Identificador Alvo', 'E-mail do Autor', 'UID do Autor', 'Detalhes da Operação'];

  // Função para sanitizar valores e evitar injeção de fórmulas CSV
  const formatCell = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    // Previne execução de macros se iniciar com = + - @
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const rows = logs.map((log) => {
    const dataHoraStr = log.timestamp
      ? new Date(log.timestamp).toLocaleString('pt-BR')
      : 'Data desconhecida';

    return [
      formatCell(log.id),
      formatCell(dataHoraStr),
      formatCell(log.acao),
      formatCell(log.alvo),
      formatCell(log.autorEmail || 'diretoria@ironsidemc.com.br'),
      formatCell(log.autorUid || 'sistema'),
      formatCell(log.detalhes),
    ].join(';');
  });

  // UTF-8 BOM (\uFEFF) para garantir caracteres acentuados em português no Excel
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivoPrefix}_${timestampStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
