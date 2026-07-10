import { createClient } from '@supabase/supabase-js';

// Hanya untuk tool migrasi/admin lokal opsional. Runtime aplikasi publik tidak
// mengakses Supabase langsung; seluruh operasi data berjalan melalui Apps Script
// dengan Firebase idToken dan Supabase service key di Script Properties.
const env = import.meta.env;
const supabaseUrl = String(env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'public-anon-key-placeholder'
);
