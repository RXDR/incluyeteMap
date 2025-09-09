import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Trae todos los registros de la tabla survey_responses
export async function fetchSurveyResponses() {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*');
  if (error) throw error;
  return data || [];
}
