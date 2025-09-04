import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { range } = await req.json();
    
    const { data, error } = await supabase.rpc('filter_by_income_range', {
      income_range: range
    });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in income range:', error);
    return NextResponse.json({ error: 'Error getting income range data' }, { status: 500 });
  }
}
