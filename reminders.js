const axios = require('axios');
const calendar = require('./calendar');
const sheetsPersonal = require('./sheets-personal');

const notifiedEvents = new Set();
let lastMorningBriefing = null;
let lastEODBriefing = null;
let lastTaskCheck = null;

function nowEcuador() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_PERSONAL_TOKEN;
  const chatId = (process.env.TELEGRAM_ADMIN_IDS || '').split(',')[0]?.trim();
  if (!token || !chatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: text.replace(/\*\*(.+?)\*\*/gs, '*$1*'),
      parse_mode: 'Markdown'
    });
  } catch (e) {
    console.error('[REMINDERS] Error enviando mensaje:', e.message);
  }
}

async function checkEventReminders() {
  try {
    const now = nowEcuador();
    const eventos = await calendar.listarEventos(1);

    for (const ev of eventos) {
      if (!ev.inicio || ev.allDay) continue;
      const inicio = new Date(ev.inicio);
      const diffMin = (inicio - now) / 60000;

      if (diffMin >= 9 && diffMin <= 11 && !notifiedEvents.has(ev.id)) {
        notifiedEvents.add(ev.id);
        const horaStr = inicio.toLocaleTimeString('es-EC', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil'
        });
        await sendTelegram(
          `⏰ *En 10 minutos:*\n\n*${ev.titulo}*\n🕐 ${horaStr}` +
          (ev.descripcion ? `\n📝 ${ev.descripcion}` : '')
        );
      }
    }
  } catch (e) {
    console.error('[REMINDERS] checkEventReminders:', e.message);
  }
}

async function sendMorningBriefing() {
  try {
    const now = nowEcuador();
    if (now.getHours() !== 8) return;
    const today = now.toDateString();
    if (lastMorningBriefing === today) return;
    lastMorningBriefing = today;

    notifiedEvents.clear();

    const [eventos, tareas] = await Promise.all([
      calendar.listarEventos(1),
      sheetsPersonal.listarTareas('PENDIENTE')
    ]);

    const fechaStr = now.toLocaleDateString('es-EC', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil'
    });

    let msg = `🌅 *Buenos días, Fabián*\n_${fechaStr}_\n\n`;

    if (eventos.length) {
      msg += `📅 *Hoy:*\n`;
      for (const ev of eventos) {
        const h = ev.allDay
          ? 'Todo el día'
          : new Date(ev.inicio).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' });
        msg += `• ${h} — ${ev.titulo}\n`;
      }
    } else {
      msg += `📅 *Sin eventos agendados hoy*\n`;
    }

    const urgentes = tareas.filter(t => t.prioridad === 'ALTA').slice(0, 5);
    if (urgentes.length) {
      msg += `\n🔥 *Urgente:*\n`;
      for (const t of urgentes) {
        msg += `• ${t.tarea}${t.proyecto ? ` _(${t.proyecto})_` : ''}\n`;
      }
    }

    msg += `\n📋 *${tareas.length} tarea${tareas.length !== 1 ? 's' : ''} pendiente${tareas.length !== 1 ? 's' : ''}*`;
    msg += `\n\n_¿Qué atacas hoy?_`;

    await sendTelegram(msg);
  } catch (e) {
    console.error('[REMINDERS] morningBriefing:', e.message);
  }
}

async function sendEODBriefing() {
  try {
    const now = nowEcuador();
    if (now.getHours() !== 19) return;
    const today = now.toDateString();
    if (lastEODBriefing === today) return;
    lastEODBriefing = today;

    const [eventos, tareas] = await Promise.all([
      calendar.listarEventos(2),
      sheetsPersonal.listarTareas('PENDIENTE')
    ]);

    const mañana = new Date(now);
    mañana.setDate(mañana.getDate() + 1);
    const eventosManana = eventos.filter(ev => {
      if (!ev.inicio) return false;
      return new Date(ev.inicio).toDateString() === mañana.toDateString();
    });

    const tareasVencidas = tareas.filter(t => t.fecha_limite && new Date(t.fecha_limite) < now);

    let msg = `🌙 *Cierre del día*\n\n`;

    if (tareasVencidas.length) {
      msg += `⚠️ *Vencidas (${tareasVencidas.length}):*\n`;
      for (const t of tareasVencidas.slice(0, 3)) msg += `• ${t.tarea}\n`;
      if (tareasVencidas.length > 3) msg += `• _...y ${tareasVencidas.length - 3} más_\n`;
      msg += '\n';
    }

    if (eventosManana.length) {
      msg += `📅 *Mañana:*\n`;
      for (const ev of eventosManana) {
        const h = ev.allDay
          ? 'Todo el día'
          : new Date(ev.inicio).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' });
        msg += `• ${h} — ${ev.titulo}\n`;
      }
      msg += '\n';
    }

    msg += `📋 *${tareas.length} pendientes en total*\n`;
    msg += `_Descansa. Mañana el briefing a las 8am._`;

    await sendTelegram(msg);
  } catch (e) {
    console.error('[REMINDERS] eodBriefing:', e.message);
  }
}

async function checkOverdueTasks() {
  try {
    const now = nowEcuador();
    if (now.getHours() !== 10) return;
    const today = now.toDateString();
    if (lastTaskCheck === today) return;
    lastTaskCheck = today;

    const tareas = await sheetsPersonal.listarTareas('PENDIENTE');
    const vencidas = tareas.filter(t => t.fecha_limite && new Date(t.fecha_limite) < now);

    if (!vencidas.length) return;

    let msg = `⚠️ *${vencidas.length} tarea${vencidas.length > 1 ? 's vencidas' : ' vencida'}*\n\n`;
    for (const t of vencidas.slice(0, 5)) {
      msg += `• *${t.tarea}*${t.fecha_limite ? ` _(venció ${t.fecha_limite})_` : ''}\n`;
    }
    if (vencidas.length > 5) msg += `\n_...y ${vencidas.length - 5} más_`;
    msg += '\n\n_¿Las reprogramamos o las tachamos?_';

    await sendTelegram(msg);
  } catch (e) {
    console.error('[REMINDERS] overdueTasks:', e.message);
  }
}

function startReminders() {
  const token = process.env.TELEGRAM_PERSONAL_TOKEN;
  const chatId = (process.env.TELEGRAM_ADMIN_IDS || '').split(',')[0]?.trim();

  if (!token || !chatId) {
    console.log('[REMINDERS] Sin TELEGRAM_PERSONAL_TOKEN o TELEGRAM_ADMIN_IDS — desactivado');
    return;
  }

  console.log('[REMINDERS] Recordatorios automáticos activos');

  setInterval(async () => {
    await checkEventReminders();
    await sendMorningBriefing();
    await sendEODBriefing();
    await checkOverdueTasks();
  }, 60 * 1000);
}

module.exports = { startReminders };
