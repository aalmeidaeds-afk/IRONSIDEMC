import { Evento } from '../types';

/**
 * Converte data DD/MM/AAAA e hora HH:MM em formato Date
 */
function parseDataHoraEvento(dataStr: string, horaStr: string): Date {
  let dia = 1, mes = 0, ano = 2026;
  if (dataStr.includes('/')) {
    const parts = dataStr.split('/');
    dia = parseInt(parts[0], 10);
    mes = parseInt(parts[1], 10) - 1;
    ano = parseInt(parts[2], 10);
  } else if (dataStr.includes('-')) {
    const parts = dataStr.split('-');
    ano = parseInt(parts[0], 10);
    mes = parseInt(parts[1], 10) - 1;
    dia = parseInt(parts[2], 10);
  }

  let hora = 8, min = 0;
  if (horaStr && horaStr.includes(':')) {
    const hParts = horaStr.split(':');
    hora = parseInt(hParts[0], 10);
    min = parseInt(hParts[1], 10);
  }

  return new Date(ano, mes, dia, hora, min);
}

/**
 * Formata Date para formato UTC iCalendar (YYYYMMDDTHHMMSSZ)
 */
function toIcsFormat(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Agenda notificação e alarme no dispositivo do usuário mesmo estando offline:
 * 1. Gera arquivo padrão universal .ICS (iCalendar) com VALARM (despertador offline 2h antes)
 * 2. Solicita permissão e dispara notificação local no navegador
 */
export async function agendarLembreteNoDispositivo(evento: Evento): Promise<{
  sucesso: boolean;
  mensagem: string;
}> {
  const dataEvento = parseDataHoraEvento(evento.data, evento.hora);
  const dataFim = new Date(dataEvento.getTime() + 4 * 60 * 60 * 1000); // Duração padrão estimada 4h

  // 1. Gera o arquivo .ics para agendamento offline nativo no iOS / Android / Windows
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dinastia System//Iron Side Road Rider M.C.//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:evento-${evento.id}@dinastiasystem.mc`,
    `DTSTAMP:${toIcsFormat(new Date())}`,
    `DTSTART:${toIcsFormat(dataEvento)}`,
    `DTEND:${toIcsFormat(dataFim)}`,
    `SUMMARY:🏍️ ${evento.titulo.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(evento.descricao || 'Comboio oficial do Moto Clube').replace(/\n/g, '\\n')}`,
    `LOCATION:${(evento.local + (evento.cidade ? ' - ' + evento.cidade : '')).replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    // Alarme local no dispositivo 2 horas antes do evento (funciona sem sinal de internet)
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Lembrete de Comboio: ${evento.titulo} em 2 horas!`,
    'END:VALARM',
    // Alarme 30 minutos antes (tolerância de concentração)
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Atenção! Concentração do evento ${evento.titulo} em 30 minutos!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Dispara o download automático do .ics para o calendário do dispositivo
  try {
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `evento-${evento.titulo.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.warn('Erro ao disparar download do arquivo .ics:', err);
  }

  // 2. Permissão de notificação web local
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        const agora = new Date().getTime();
        const diffMs = dataEvento.getTime() - agora;

        new Notification(`Lembrete Agendado: ${evento.titulo}`, {
          body: `Data: ${evento.data} às ${evento.hora} • Local: ${evento.local}. Alarme offline salvo no calendário!`,
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    sucesso: true,
    mensagem: `Lembrete offline do evento "${evento.titulo}" salvo com sucesso no seu dispositivo!`,
  };
}
