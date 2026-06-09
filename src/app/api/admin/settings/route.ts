import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/admin/settings
export async function GET(req: NextRequest) {
  const admin = await verifyAdminAuth(req);
  if (!admin) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('system_settings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Convert to key-value object
  const settings: Record<string, string> = {};
  (data || []).forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ settings });
}

// POST /api/admin/settings
export async function POST(req: NextRequest) {
  const admin = await verifyAdminAuth(req);
  if (!admin) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const body = await req.json();
  const supabase = getSupabaseClient();

  // Upsert each key-value pair
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'string') continue;
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
