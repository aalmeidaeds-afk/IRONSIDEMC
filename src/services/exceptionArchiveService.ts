/**
 * Serviço de Arquivamento Automático de Falhas e Exceções do Sistema (Módulo 12)
 *
 * Registra automaticamente qualquer erro ou exceção capturada em tempo de execução
 * com data, hora, código de erro, módulo, stack trace e severidade.
 * As falhas críticas são marcadas em vermelho e as correções validadas em verde.
 */

import { DiagnosticoItem, DIAGNOSTICOS_INICIAIS } from '../types/diagnostico';

const STORAGE_KEY = 'ironside_diagnosticos_db';

/**
 * Obtém todos os itens arquivados
 */
export function getItensArquivados(): DiagnosticoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[ExceptionArchive] Falha ao ler itens arquivados:', err);
  }
  return DIAGNOSTICOS_INICIAIS;
}

/**
 * Salva a lista completa no storage e notifica a aplicação
 */
export function salvarItensArquivados(itens: DiagnosticoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ironside-diagnosticos-updated'));
    }
  } catch (err) {
    console.warn('[ExceptionArchive] Falha ao salvar itens no storage:', err);
  }
}

/**
 * Gera um código de erro padronizado caso não fornecido
 */
function gerarCodigoErroPadrao(mensagem: string, tipo?: string): string {
  const upper = (mensagem || '').toUpperCase();
  if (upper.includes('NETWORK') || upper.includes('FETCH') || upper.includes('OFFLINE')) {
    return 'ERR_NETWORK_CONN_FAIL';
  }
  if (upper.includes('PERMISSION') || upper.includes('UNAUTHORIZED') || upper.includes('DENIED')) {
    return 'ERR_SECURITY_PERM_DENIED';
  }
  if (upper.includes('TIMEOUT')) {
    return 'ERR_SOCKET_TIMEOUT';
  }
  if (upper.includes('SYNTAX') || upper.includes('JSON')) {
    return 'ERR_SYNTAX_JSON_PARSE';
  }
  if (upper.includes('FIRESTORE') || upper.includes('DATABASE')) {
    return 'ERR_FIRESTORE_DATA_FAIL';
  }
  if (tipo) {
    return `ERR_${tipo.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  }
  const hash = Math.floor(1000 + Math.random() * 9000);
  return `ERR_CRIT_EXCP_${hash}`;
}

/**
 * Registra automaticamente uma falha ou exceção capturada
 */
export function registrarExcecaoAutomatica(dados: {
  mensagem: string;
  codigoErro?: string;
  modulo?: string;
  recurso?: string;
  stack?: string;
  severidade?: 'alta' | 'media' | 'baixa' | 'informativa';
  categoria?: string;
  isFalhaCritica?: boolean;
}): DiagnosticoItem {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const hora = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dataHora = `${data} ${hora}`;

  const codigo = dados.codigoErro || gerarCodigoErroPadrao(dados.mensagem);
  const idUnico = `ERR-${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}${agora.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

  const novoItem: DiagnosticoItem = {
    id: idUnico,
    codigoErro: codigo,
    data,
    hora,
    dataHora,
    timestamp: Date.now(),
    modulo: dados.modulo || 'Módulo 12 - Diagnóstico & Sistema',
    recurso: dados.recurso || 'Capturador Global de Exceções',
    descricaoFalha: dados.mensagem,
    correcaoEfetuada: 'Pendente de validação pela equipe de administração. Fallback resiliente ativado.',
    status: 'critica',
    executor: 'Sistema (Auto-Capture)',
    severidade: dados.severidade || 'alta',
    isFalhaCritica: dados.isFalhaCritica !== undefined ? dados.isFalhaCritica : true,
    validadoPeloSistema: false,
    categoriaFalha: dados.categoria || 'Runtime Exception',
    origemExcecao: 'automatica',
    stackTrace: dados.stack,
  };

  const listaAtual = getItensArquivados();
  // Evitar duplicatas em massa do exato mesmo erro no mesmo minuto
  const duplicado = listaAtual.find(
    (item) =>
      item.codigoErro === codigo &&
      item.descricaoFalha === dados.mensagem &&
      Math.abs(item.timestamp - novoItem.timestamp) < 5000
  );

  if (!duplicado) {
    const atualizada = [novoItem, ...listaAtual];
    salvarItensArquivados(atualizada);
  }

  return novoItem;
}

/**
 * Marca uma falha crítica como resolvida e validada pelo sistema (muda para verde)
 */
export function marcarFalhaResolvida(
  id: string,
  notaCorrecao: string,
  resolvidoPor: string = 'Administrador'
): boolean {
  const lista = getItensArquivados();
  const index = lista.findIndex((item) => item.id === id);
  if (index === -1) return false;

  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR');

  lista[index] = {
    ...lista[index],
    status: 'resolvida',
    isFalhaCritica: false,
    validadoPeloSistema: true,
    correcaoEfetuada: notaCorrecao || 'Correção validada e homologada pelo Administrador.',
    resolvidoEm: `${data} ${hora}`,
    resolvidoPor,
  };

  salvarItensArquivados(lista);
  return true;
}

/**
 * Simula uma captura automática de exceção para fins de teste e auditoria
 */
export function simularExcecaoTeste(tipo: 'critica' | 'resolvida' = 'critica'): DiagnosticoItem {
  const cenarios = [
    {
      codigoErro: 'ERR_FIRESTORE_WRITE_RETRY_099',
      mensagem: 'FirebaseError: [code=permission-denied]: Falha de escrita no snapshot de contingência.',
      modulo: 'Módulo 12 - Backup & Contingência',
      recurso: 'Sync de Segurança Cloud',
      stack: 'FirebaseError: Missing permissions at Firestore.doc.set (db.ts:1450:12)\n  at Contingencia.backup (PainelBackupContingencia.tsx:88)',
      categoria: 'Permissões & Cloud',
    },
    {
      codigoErro: 'ERR_PAYMENT_WEBHOOK_TIMEOUT_105',
      mensagem: 'GatewayTimeoutException: O gateway de conciliação bancária demorou mais de 10s para responder.',
      modulo: 'Módulo 05 - Extrato Financeiro',
      recurso: 'Sincronização PIX em Lote',
      stack: 'GatewayTimeoutException: Request aborted at fetchPixStatus (FinanceiroView.tsx:320)\n  at async handleSync (ExtratoFinanceiroBancario.tsx:180)',
      categoria: 'Conexão & Gateway',
    },
    {
      codigoErro: 'ERR_OFFLINE_STORAGE_LIMIT_112',
      mensagem: 'QuotaExceededError: Limite de armazenamento local excedido ao cachear imagens de eventos.',
      modulo: 'Módulo 06 - Eventos & Galeria',
      recurso: 'Cache Offline IndexedDB',
      stack: 'DOMException: QuotaExceededError at IDBObjectStore.put (dexie.js:420)\n  at EventosView.handlePhotoSave (EventosView.tsx:610)',
      categoria: 'Armazenamento Local',
    },
  ];

  const sorteio = cenarios[Math.floor(Math.random() * cenarios.length)];

  if (tipo === 'critica') {
    return registrarExcecaoAutomatica({
      codigoErro: sorteio.codigoErro,
      mensagem: `[Auto-Capture] ${sorteio.mensagem}`,
      modulo: sorteio.modulo,
      recurso: sorteio.recurso,
      stack: sorteio.stack,
      categoria: sorteio.categoria,
      severidade: 'alta',
      isFalhaCritica: true,
    });
  } else {
    const item = registrarExcecaoAutomatica({
      codigoErro: sorteio.codigoErro,
      mensagem: `[Auto-Capture Validado] ${sorteio.mensagem}`,
      modulo: sorteio.modulo,
      recurso: sorteio.recurso,
      stack: sorteio.stack,
      categoria: sorteio.categoria,
      severidade: 'baixa',
      isFalhaCritica: false,
    });
    marcarFalhaResolvida(
      item.id,
      'Ajuste automático de parâmetros e contingência offline implementada com sucesso.',
      'Sistema Automatizado (Certificado)'
    );
    return item;
  }
}

/**
 * Inicializa os ouvintes globais de erro no navegador
 */
let ouvintesInstalados = false;
export function initGlobalExceptionCapture(): void {
  if (typeof window === 'undefined' || ouvintesInstalados) return;
  ouvintesInstalados = true;

  // 1. Ouvinte para erros não tratados de runtime (window.onerror)
  window.addEventListener('error', (event: ErrorEvent) => {
    // Ignorar erros cosméticos de extensões ou HMR do Vite
    if (
      event.message?.includes('ResizeObserver') ||
      event.message?.includes('Extension') ||
      event.filename?.includes('chrome-extension')
    ) {
      return;
    }

    registrarExcecaoAutomatica({
      codigoErro: 'ERR_RUNTIME_UNCAUGHT_EXCEPTION',
      mensagem: event.message || 'Erro de execução não tratado capturado na janela.',
      modulo: 'Módulo 12 - Runtime Global',
      recurso: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'Janela do Navegador',
      stack: event.error?.stack || `Em ${event.filename}:${event.lineno}:${event.colno}`,
      severidade: 'alta',
      isFalhaCritica: true,
      categoria: 'Runtime Exception',
    });
  });

  // 2. Ouvinte para rejeições de Promises não tratadas
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg =
      typeof reason === 'string'
        ? reason
        : reason?.message || 'Rejeição de Promise não tratada capturada.';

    // Ignorar desconexões normais de socket ou HMR
    if (msg.includes('WebSocket') || msg.includes('vite:ws')) {
      return;
    }

    registrarExcecaoAutomatica({
      codigoErro: 'ERR_UNHANDLED_PROMISE_REJECTION',
      mensagem: msg,
      modulo: 'Módulo 12 - Async & Promises',
      recurso: 'Promessa Assíncrona Não Tratada',
      stack: reason?.stack || String(reason),
      severidade: 'alta',
      isFalhaCritica: true,
      categoria: 'Async / Rejection',
    });
  });

  console.info('[ExceptionArchive] Ouvintes globais de arquivamento de falhas ativados com sucesso.');
}
