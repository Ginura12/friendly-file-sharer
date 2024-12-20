import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://piavnyhrnudrdwfjsknh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYXZueWhybnVkcmR3Zmpza25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwODQ0NjEsImV4cCI6MjA0OTY2MDQ2MX0.Ou7dTxP00BVL38qZbTvq6SDQsdKQDlRPDbi1vpEj8Uo";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage,
      storageKey: 'supabase.auth.token',
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  }
);