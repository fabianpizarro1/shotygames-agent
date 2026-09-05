#!/usr/bin/env node
/**
 * verificar-deploy.js — ¿el servidor está corriendo el código que tengo acá?
 *
 * El problema que resuelve: EasyPanel sigue sirviendo el contenedor viejo
 * mientras compila (y a veces ni compila). El /health devuelve 200 igual, así
 * que "está arriba" no prueba absolutamente nada. Ya pasó el 31/08 y el 05/09.
 *
 * Compara la HUELLA — un hash de los .js de la raíz — del código local contra
 * la que reporta /health. Si coinciden, el deploy entró. Si no, no entró, por
 * más que el panel diga "success".
 *
 *   node scripts/verificar-deploy.js              → compara una vez
 *   node scripts/verificar-deploy.js --esperar    → dispara el hook (si está
 *                                                   configurado) y espera hasta
 *                                                   5 min a que cambie
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch {}

const BASE = process.env.AGENTE_URL || 'https://shotygames-agent-appclaude.hetaxg.easypanel.host';
const HOOK = process.env.EASYPANEL_DEPLOY_HOOK_URL;
const RAIZ = path.join(__dirname, '..');

/**
 * Mismo cálculo que hace index.js sobre sí mismo (si uno cambia, cambiar los dos),
 * con una diferencia a propósito: acá la lista sale de **git**, no del disco.
 *
 * En el servidor solo existe lo que está commiteado, pero en local es normal
 * tener un `_prueba.js` tirado en la raíz. Si lo incluyéramos, la huella local
 * nunca coincidiría y el script diría "el deploy no entró" para siempre —
 * justo el tipo de falso negativo que hace que se deje de confiar en la
 * verificación. `git ls-files` deja exactamente lo que se despliega.
 */
function huellaLocal() {
  const hash = crypto.createHash('sha256');
  let archivos;
  try {
    archivos = require('child_process')
      .execSync('git ls-files -- *.js', { cwd: RAIZ, encoding: 'utf8' })
      .split('\n')
      .filter(f => f && !f.includes('/'))
      .sort();
  } catch {
    archivos = fs.readdirSync(RAIZ).filter(f => f.endsWith('.js')).sort();
  }
  for (const f of archivos) {
    hash.update(f);
    hash.update(fs.readFileSync(path.join(RAIZ, f)));
  }
  return hash.digest('hex').slice(0, 12);
}

async function salud() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(`${BASE}/health`, { signal: ctrl.signal });
    return await r.json();
  } finally { clearTimeout(t); }
}

const esperar = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const local = huellaLocal();
  console.log(`huella local    : ${local}`);

  if (process.argv.includes('--esperar')) {
    if (HOOK) {
      process.stdout.write('disparando el hook de EasyPanel… ');
      try {
        const r = await fetch(HOOK, { method: 'POST' });
        console.log(`HTTP ${r.status}`);
      } catch (e) {
        console.log(`❌ falló: ${e.message}`);
      }
    } else {
      console.log('sin EASYPANEL_DEPLOY_HOOK_URL en .env — redeployá a mano desde el panel.');
    }
    // 5 minutos: un build de este repo tarda ~1 min, el resto es margen.
    for (let i = 0; i < 30; i++) {
      await esperar(10000);
      try {
        const s = await salud();
        process.stdout.write(`\r  esperando… servidor: ${s.huella || '(sin huella)'} (${(i + 1) * 10}s)   `);
        if (s.huella === local) {
          console.log(`\n\n✅ DEPLOY CONFIRMADO — el servidor corre tu código.`);
          console.log(`   arranque: ${s.arranque}`);
          console.log(`   crons   : ${Object.entries(s.crons || {}).map(([k, v]) => `${k}=${v.activo ? 'on' : 'OFF'}`).join(' ') || '(ninguno)'}`);
          process.exit(0);
        }
      } catch { /* durante el swap el server puede no responder: es normal */ }
    }
    console.log('\n\n❌ Pasaron 5 minutos y el servidor sigue con otro código. El deploy NO entró.');
    process.exit(1);
  }

  const s = await salud();
  console.log(`huella servidor : ${s.huella || '(sin huella — corre código viejo, anterior al 05/09)'}`);
  console.log(`arranque        : ${s.arranque}`);
  console.log(`uptime          : ${Math.round((s.uptimeSegundos || 0) / 60)} min`);
  console.log(`crons           : ${Object.entries(s.crons || {}).map(([k, v]) => `${k}=${v.activo ? 'on' : 'OFF'}`).join(' ') || '(ninguno)'}`);
  if (s.huella === local) {
    console.log('\n✅ El servidor corre exactamente tu código.');
  } else {
    console.log('\n❌ El servidor NO corre tu código. El deploy no entró (o entró uno viejo).');
    process.exit(1);
  }
})().catch(e => { console.error('❌', e.message); process.exit(1); });
