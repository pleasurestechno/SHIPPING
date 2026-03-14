import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://frdnyopuifabdsmtwrof.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SaFFLpdTFRNTNtfMTmRwMg_ISHNV3Iy'; // Publishable key for client-side operations

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
