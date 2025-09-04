import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('get_top_10_ingresos');
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in top10 ingresos:', error);
    return NextResponse.json({ error: 'Error getting top 10 ingresos' }, { status: 500 });
  }
}
