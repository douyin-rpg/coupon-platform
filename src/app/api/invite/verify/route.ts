import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET: 检查是否需要邀请码
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'invite_code_required')
      .single();

    const required = settings?.value === 'true';
    return NextResponse.json({ required });
  } catch {
    return NextResponse.json({ required: false });
  }
}

// POST: 验证邀请码
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '请输入邀请码' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 检查是否需要邀请码
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'invite_code_required')
      .single();

    if (settings?.value !== 'true') {
      return NextResponse.json({ success: true, message: '无需邀请码' });
    }

    // 查询邀请码表（独立表，无使用次数限制）
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.trim())
      .single();

    if (error || !inviteCode) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 400 });
    }

    if (!inviteCode.is_active) {
      return NextResponse.json({ error: '邀请码已失效' }, { status: 400 });
    }

    // 邀请码无使用次数限制，验证成功即可
    const response = NextResponse.json({ success: true, message: '验证成功' });
    response.cookies.set('invite_verified', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30天有效
      httpOnly: true,
      sameSite: 'lax',
    });
    return response;
  } catch (error) {
    console.error('Error verifying invite code:', error);
    return NextResponse.json({ error: '验证失败，请重试' }, { status: 500 });
  }
}
