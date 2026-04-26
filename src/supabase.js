import { createClient } from '@supabase/supabase-js'

// Upewnij się, że URL zaczyna się od https://
const supabaseUrl = 'https://gcaugzcvwfytmukmgiq.supabase.co'

// Tutaj wklej swój klucz ANON (ten, który zaczyna się od sb_publishable...)
const supabaseAnonKey = 'sb_publishable_VI4cwSrJSd8P4XjTqT9xSQ_YtQk27TT'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)