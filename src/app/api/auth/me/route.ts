import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .select('id, username, real_name, is_verified, payment_account, balance, id_card')
      .eq('id', payload.userId)
      .maybeSingle();

    if (error) throw new Error(`查询用户失败: ${error.message}`);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        isVerified: user.is_verified,
        paymentAccount: user.payment_account,
        balance: user.balance,
        idCard: user.id_card,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户信息失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { action, oldPassword, newPassword } = body;

    if (action === 'change_login_password') {
      if (!oldPassword || !newPassword) {
        return NextResponse.json({ error: '请填写完整' }, { status: 400 });
      }

      const client = getSupabaseClient();
      const { data: user, error: userError } = await client
        .from('users')
        .select('password_hash')
        .eq('id', payload.userId)
        .maybeSingle();

      if (userError || !user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      const valid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!valid) {
        return NextResponse.json({ error: '原密码错误' }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await client
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', payload.userId);

      if (updateError) throw new Error(`修改密码失败: ${updateError.message}`);

      return NextResponse.json({ success: true, message: '登录密码修改成功' });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
