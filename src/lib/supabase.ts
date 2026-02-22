import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vqbbeqbzhqdtflrbifnl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxYmJlcWJ6aHFkdGZscmJpZm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDM0NzksImV4cCI6MjA4NzE3OTQ3OX0.iE0T6bNM5zq1GV9nRJhODdkxtsHEFZZ99NyUnSHuWI8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
