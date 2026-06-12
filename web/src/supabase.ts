import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://giznbbrfbnsxflfsmefr.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpem5iYnJmYm5zeGZsZnNtZWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDE3MTcsImV4cCI6MjA5NTk3NzcxN30.4hTLxGLqCYoPElYSv0ewKQx9GW49pgthzKe3Mvcd0qY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
