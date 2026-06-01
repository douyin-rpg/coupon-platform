import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// 实名认证 + 绑定收款账号 + 设置支付密码
export async function POST(request: Request) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { realName, idCard, paymentAccount, paymentPassword } = await request.json();

    // 实名认证（只需要 realName + idCard）
    if (realName && idCard) {
      const client = getSupabaseClient();

      const { data: user, error: userError } = await client
        .from('users')
        .select('is_verified')
        .eq('id', payload.userId)
        .maybeSingle();

      if (userError) throw new Error(`查询用户失败: ${userError.message}`);
      if (user?.is_verified) {
        return NextResponse.json({ error: '已完成实名认证' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        id_card: idCard,
        id_card_name: realName,
        real_name: realName,
        updated_at: new Date().toISOString(),
      };

      // 如果同时设置了支付密码和收款账号，一起完成
      if (paymentPassword && paymentAccount) {
        if (paymentPassword.length < 6) {
          return NextResponse.json({ error: '支付密码至少6位' }, { status: 400 });
        }
        const paymentPasswordHash = await bcrypt.hash(paymentPassword, 10);
        updateData.is_verified = true;
        updateData.payment_account = paymentAccount;
        updateData.payment_password_hash = paymentPasswordHash;
      }

      const { error: updateError } = await client
        .from('users')
        .update(updateData)
        .eq('id', payload.userId);

      if (updateError) throw new Error(`认证失败: ${updateError.message}`);

      return NextResponse.json({ success: true, message: '实名认证成功' });
    }

    // 仅绑定收款账号 + 设置支付密码（老流程）
    if (!paymentAccount || !paymentPassword) {
      return NextResponse.json({ error: '请填写收款账号和支付密码' }, { status: 400 });
    }

    if (paymentPassword.length < 6) {
      return NextResponse.json({ error: '支付密码至少6位' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: user, error: userError } = await client
      .from('users')
      .select('is_verified')
      .eq('id', payload.userId)
      .maybeSingle();

    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (user?.is_verified) {
      return NextResponse.json({ error: '已完成实名认证' }, { status: 400 });
    }

    const paymentPasswordHash = await bcrypt.hash(paymentPassword, 10);

    const { error: updateError } = await client
      .from('users')
      .update({
        is_verified: true,
        payment_account: paymentAccount,
        payment_password_hash: paymentPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.userId);

    if (updateError) throw new Error(`认证失败: ${updateError.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
