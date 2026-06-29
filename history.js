require('dotenv').config();

const memoryStore = {};
const MAX_HISTORY = 20;

let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    redisClient.on('error', () => { redisClient = null; });
  }
} catch (e) {}

let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Supabase conectado');
  }
} catch (e) { console.error('Supabase error:', e.message); }

function sanitizeHistory(history) {
  let h = history.slice(-MAX_HISTORY);

  while (h.length > 0 && h[0].role === 'assistant') h = h.slice(1);

  while (h.length > 0 && h[0].role === 'user') {
    const content = Array.isArray(h[0].content) ? h[0].content : [];
    if (content.some(b => b.type === 'tool_result')) h = h.slice(2);
    else break;
  }

  while (h.length > 0) {
    const last = h[h.length - 1];
    if (last.role === 'assistant') {
      const content = Array.isArray(last.content) ? last.content : [];
      if (content.some(b => b.type === 'tool_use')) { h = h.slice(0, -1); continue; }
    }
    break;
  }

  return h;
}

async function getHistory(phone, prefix = 'chat') {
  try {
    if (supabase) {
      const { data } = await supabase
        .from('conversation_history')
        .select('messages')
        .eq('phone', phone)
        .eq('prefix', prefix)
        .single();
      return sanitizeHistory(data?.messages || []);
    }
    if (redisClient) {
      const raw = await redisClient.get(`${prefix}:${phone}`);
      return sanitizeHistory(raw ? JSON.parse(raw) : []);
    }
  } catch (e) {}
  return sanitizeHistory(memoryStore[`${prefix}:${phone}`] || []);
}

async function saveHistory(phone, history, prefix = 'chat') {
  const trimmed = sanitizeHistory(history);
  try {
    if (supabase) {
      await supabase.from('conversation_history').upsert(
        { phone, prefix, messages: trimmed, updated_at: new Date().toISOString() },
        { onConflict: 'phone,prefix' }
      );
      return;
    }
    if (redisClient) {
      await redisClient.set(`${prefix}:${phone}`, JSON.stringify(trimmed), 'EX', 86400);
      return;
    }
  } catch (e) { console.error('saveHistory error:', e.message); }
  memoryStore[`${prefix}:${phone}`] = trimmed;
}

async function clearHistory(phone) {
  const keysDeleted = [];

  if (supabase) {
    await supabase.from('conversation_history').delete().eq('phone', phone).catch(() => {});
    keysDeleted.push(`supabase:${phone}`);
  }

  for (const prefix of ['chat', 'ventas', 'telegram']) {
    const key = `${prefix}:${phone}`;
    if (memoryStore[key]) { delete memoryStore[key]; keysDeleted.push(key); }
    if (redisClient) {
      await redisClient.del(key).catch(() => {});
      keysDeleted.push(`redis:${key}`);
    }
  }

  return keysDeleted;
}

module.exports = { getHistory, saveHistory, clearHistory, sanitizeHistory };
