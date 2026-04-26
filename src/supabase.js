import { createClient } from '@supabase/supabase-js'

// Te dane znajdziesz w Supabase -> Project Settings -> API
const supabaseUrl = 'https://gcaugzcvwfwtmukmgiq.supabase.co'
const supabaseAnonKey = 'sb_publishable_VI4cwSrJSd8P4XjTqT9xSQ_YtQk27TT'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)