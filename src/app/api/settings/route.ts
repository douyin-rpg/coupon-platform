import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/settings - Public settings for frontend
export async function GET() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['customer_service_url', 'customer_service_text']);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  (data || []).forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ settings });
}
