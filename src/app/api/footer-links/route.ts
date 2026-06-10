import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('footer_links')
    .select('*')
    .eq('is_active', true)
    .order('section')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by section
  const grouped: Record<string, { id: string; label: string; url: string }[]> = {};
  for (const link of data || []) {
    if (!grouped[link.section]) grouped[link.section] = [];
    grouped[link.section].push({ id: link.id, label: link.label, url: link.url });
  }

  return NextResponse.json({ footerLinks: grouped });
}
