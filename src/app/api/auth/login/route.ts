import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请填写用户名和密码' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: user, error } = await client
      .from('users')
      .select('id, username, password_hash, real_name, login_frozen, role, register_ip')
      .eq('username', username)
      .maybeSingle();

    if (error) throw new Error(`查询用户失败: ${error.message}`);
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // Check if login is frozen
    if (user.login_frozen && user.role !== 'admin') {
      return NextResponse.json({ error: '账号已被冻结，请联系管理员' }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const clientIP = getClientIP(request);
    const now = new Date().toISOString();

    // Update login info
    await client
      .from('users')
      .update({
        last_login_ip: clientIP,
        last_login_at: now,
        is_online: true,
        ...(user.register_ip ? {} : { register_ip: clientIP }),
      })
      .eq('id', user.id);

    const token = await signToken({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '登录失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
