import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/invite/verify - Verify invitation code
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '请输入邀请码' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if invite code is required
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'invite_code_required')
      .single();

    if (!settings || settings.value !== 'true') {
      // Invite code not required, auto-pass
      const response = NextResponse.json({ success: true, message: '无需邀请码' });
      response.cookies.set('invite_verified', 'true', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
      return response;
    }

    // Look up the code in registration_codes
    const { data: codeData, error } = await supabase
      .from('registration_codes')
      .select('id, code, is_used, max_uses, current_uses')
      .eq('code', code.trim())
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    if (!codeData) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 400 });
    }

    // Check if the code has reached max uses
    if (codeData.current_uses >= codeData.max_uses) {
      return NextResponse.json({ error: '邀请码已被使用完' }, { status: 400 });
    }

    // Code is valid - set cookie and return success
    const response = NextResponse.json({ success: true, message: '验证成功' });
    response.cookies.set('invite_verified', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// GET /api/invite/verify - Check if invite code is required
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
