import { createClient } from '@supabase/supabase-js'

// Upewnij się, że URL zaczyna się od https://
const supabaseUrl = 'https://gcaugzcvwfwtmukmgiq.supabase.co'

// Tutaj wklej swój klucz ANON (ten, który zaczyna się od sb_publishable...)
const supabaseAnonKey = 'TUTAJ_WKLEJ_SWÓJ_KLUCZ_ANON'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)