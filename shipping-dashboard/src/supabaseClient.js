import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frdnyopuifabdsmtwrof.supabase.co';
const supabaseAnonKey = 'sb_publishable_SaFFLpdTFRNTNtfMTmRwMg_ISHNV3Iy'; // Use the publishable key for client-side operations

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
