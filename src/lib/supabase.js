// ─── lib/supabase.js ──────────────────────────────────────────────────────
// Единственный экземпляр клиента на всё приложение.
// Supabase Realtime использует WebSocket под капотом — не нужен Ably.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    '[Supabase] Не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.\n' +
    'Скопируй .env.example → .env и заполни значения из supabase.com → Settings → API'
  );
}

export const supabase = createClient(url, key, {
  realtime: {
    params: { eventsPerSecond: 20 }, // лимит событий в секунду
  },
});
