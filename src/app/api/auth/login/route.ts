import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请填写用户名和密码' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: user, error } = await client
      .from('users')
      .select('id, username, password_hash, real_name, is_verified, payment_account, balance')
      .eq('username', username)
      .maybeSingle();

    if (error) throw new Error(`查询用户失败: ${error.message}`);
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        isVerified: user.is_verified,
        paymentAccount: user.payment_account,
        balance: user.balance,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
