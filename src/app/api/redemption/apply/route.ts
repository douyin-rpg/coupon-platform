import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { userCouponId, paymentPassword } = await request.json();

    if (!userCouponId || !paymentPassword) {
      return NextResponse.json({ error: '请选择券并输入支付密码' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 验证支付密码
    const { data: user, error: userError } = await client
      .from('users')
      .select('payment_password_hash, funds_frozen')
      .eq('id', payload.userId)
      .maybeSingle();

    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (!user?.payment_password_hash) {
      return NextResponse.json({ error: '请先设置支付密码' }, { status: 400 });
    }

    const match = await bcrypt.compare(paymentPassword, user.payment_password_hash);
    if (!match) {
      return NextResponse.json({ error: '支付密码错误' }, { status: 400 });
    }

    if (user.funds_frozen) {
      return NextResponse.json({ error: '您的资金已被冻结，无法申请回收' }, { status: 400 });
    }

    // 查询用户券
    const { data: userCoupon, error: couponError } = await client
      .from('user_coupons')
      .select('id, status, payment_amount, user_id')
      .eq('id', userCouponId)
      .eq('user_id', payload.userId)
      .maybeSingle();

    if (couponError) throw new Error(`查询券失败: ${couponError.message}`);
    if (!userCoupon) {
      return NextResponse.json({ error: '券不存在' }, { status: 404 });
    }

    // 只有待使用的券才能申请回收
    if (userCoupon.status !== 'pending_use') {
      return NextResponse.json({ error: '该券当前状态无法申请回收' }, { status: 400 });
    }

    // 更新券状态为待回收
    const { error: updateError } = await client
      .from('user_coupons')
      .update({
        status: 'pending_redemption',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userCouponId);

    if (updateError) throw new Error(`更新券状态失败: ${updateError.message}`);

    // 创建回兑申请
    const { error: insertError } = await client
      .from('redemption_requests')
      .insert({
        user_coupon_id: userCouponId,
        user_id: payload.userId,
        status: 'pending',
      });

    if (insertError) throw new Error(`创建回兑申请失败: ${insertError.message}`);

    // 创建后台通知
    await client
      .from('admin_notifications')
      .insert({
        type: 'redemption',
        title: '新回收申请',
        content: `用户 ${payload.username} 申请回收，券ID: ${userCouponId}`,
        is_read: false,
      });

    return NextResponse.json({ success: true, message: '回收申请已提交，等待审核' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '申请回收失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
