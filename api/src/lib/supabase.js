import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY

if (!url || !key) {
  throw new Error(
    'SUPABASE_URL et SUPABASE_SECRET_KEY doivent être définies dans api/.env (voir api/.env.example)',
  )
}

// Client Supabase côté serveur (la clé secrète contourne la RLS : elle ne doit jamais quitter l'API).
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})
