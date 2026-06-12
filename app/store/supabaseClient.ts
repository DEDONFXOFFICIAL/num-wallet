import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/config';

// Initialize Supabase production client
export const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY);
