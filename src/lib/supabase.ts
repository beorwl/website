import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for contract submissions
export interface ContractSubmission {
  id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  additional_context?: string;
  contact_method: 'email' | 'discord' | 'telegram';
  contact_info: string;
  status: 'pending' | 'reviewing' | 'completed';
  created_at?: string;
  updated_at?: string;
}


