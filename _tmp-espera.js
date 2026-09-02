const URL = 'https://shotygames-agent-appclaude.hetaxg.easypanel.host/health';
const ARRANQUE_VIEJO = '2026-09-02T01:41:39.325Z';
(async () => {
  for (let i = 1; i <= 30; i++) {
    await new Promise(r => setTimeout(r, 20000));
    try {
      const r = await fetch(URL, { signal: AbortSignal.timeout(12000) });
      const j = await r.json();
      const hora = new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil' });
      if (j.arranque !== ARRANQUE_VIEJO) {
        console.log(`[${hora}] SERVIDOR NUEVO ARRIBA (arranque ${j.arranque})`);
        console.log('');
        if (j.crons) {
          console.log('CRONS REPORTADOS:');
          for (const [k, v] of Object.entries(j.crons)) console.log(`  ${k}: ${v.activo ? 'ACTIVO' : 'INACTIVO'} — ${v.motivo}`);
          console.log('');
          console.log(j.crons.publicidad?.activo
            ? '=> Código nuevo + env var OK. El cron va a correr en el próximo :00/:15/:30/:45.'
            : '=> Código nuevo, pero el cron NO arrancó. Motivo arriba.');
        } else {
          console.log('=> El servidor NO tiene el campo "crons": todavía es código viejo.');
        }
        process.exit(0);
      }
      console.log(`[${hora}] esperando... (todavía el contenedor viejo)`);
    } catch (e) {
      console.log(`[${new Date().toLocaleTimeString('es-EC',{timeZone:'America/Guayaquil'})}] servidor reiniciando (${e.message.slice(0,40)})`);
    }
  }
  console.log('TIMEOUT: el servidor no levantó con código nuevo en 10 min.');
  process.exit(1);
})();
