import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// 修改支付密码
export async function POST(request: Request) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请填写旧密码和新密码' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新支付密码至少6位' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data: user, error: userError } = await client
      .from('users')
      .select('payment_password_hash')
      .eq('id', payload.userId)
      .maybeSingle();

    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (!user?.payment_password_hash) {
      return NextResponse.json({ error: '请先完成实名认证' }, { status: 400 });
    }

    const match = await bcrypt.compare(oldPassword, user.payment_password_hash);
    if (!match) {
      return NextResponse.json({ error: '旧支付密码错误' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await client
      .from('users')
      .update({
        payment_password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.userId);

    if (updateError) throw new Error(`修改支付密码失败: ${updateError.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '修改支付密码失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
