import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

// GET /api/ingresos/top10
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

// POST /api/ingresos/stats
export async function POST(req: Request) {
  try {
    const { range } = await req.json();
    
    const { data, error } = await supabase.rpc('filter_by_income_range', {
      income_range: range
    });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in income stats:', error);
    return NextResponse.json({ error: 'Error getting income stats' }, { status: 500 });
  }
}
