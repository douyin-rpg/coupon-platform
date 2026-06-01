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

    const { couponId, paymentPassword } = await request.json();

    if (!couponId || !paymentPassword) {
      return NextResponse.json({ error: '请选择优惠券并输入支付密码' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查用户是否已认证
    const { data: user, error: userError } = await client
      .from('users')
      .select('verify_status, payment_password_hash, balance')
      .eq('id', payload.userId)
      .maybeSingle();

    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (user?.verify_status !== "verified") {
      return NextResponse.json({ error: '请先完成实名认证' }, { status: 400 });
    }

    // 验证支付密码
    if (!user.payment_password_hash) {
      return NextResponse.json({ error: '请先设置支付密码' }, { status: 400 });
    }
    const passwordMatch = await bcrypt.compare(paymentPassword, user.payment_password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: '支付密码错误' }, { status: 400 });
    }

    // 查询优惠券信息
    const { data: coupon, error: couponError } = await client
      .from('coupons')
      .select('id, name, price, remaining_quantity, sold_count, is_active, session_id, grab_sessions(start_time, end_time, is_active)')
      .eq('id', couponId)
      .maybeSingle();

    if (couponError) throw new Error(`查询优惠券失败: ${couponError.message}`);
    if (!coupon || !coupon.is_active) {
      return NextResponse.json({ error: '优惠券不存在或已下架' }, { status: 400 });
    }

    // 检查是否在可抢时间内
    const session = coupon.grab_sessions as unknown as { start_time: string; end_time: string; is_active: boolean };
    if (!session || !session.is_active) {
      return NextResponse.json({ error: '该场次未开放' }, { status: 400 });
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = session.start_time.split(':').map(Number);
    const [endH, endM] = session.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return NextResponse.json({ error: '当前不在抢券时间内' }, { status: 400 });
    }

    if (coupon.remaining_quantity <= 0) {
      return NextResponse.json({ error: '优惠券已抢光' }, { status: 400 });
    }

    // 检查余额
    const userBalance = parseFloat(user.balance || '0');
    const couponPrice = parseFloat(coupon.price);
    if (userBalance < couponPrice) {
      return NextResponse.json({ error: '余额不足' }, { status: 400 });
    }

    // 检查是否已抢过该券
    const { data: existingGrab, error: existingError } = await client
      .from('user_coupons')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('coupon_id', couponId)
      .maybeSingle();

    if (existingError) throw new Error(`查询抢购记录失败: ${existingError.message}`);
    if (existingGrab) {
      return NextResponse.json({ error: '您已抢过该优惠券' }, { status: 400 });
    }

    // 扣减余额
    const newBalance = (userBalance - couponPrice).toFixed(2);
    const { error: balanceError } = await client
      .from('users')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', payload.userId);

    if (balanceError) throw new Error(`扣减余额失败: ${balanceError.message}`);

    // 减少库存 + 增加已售数
    const { error: stockError } = await client
      .from('coupons')
      .update({
        remaining_quantity: coupon.remaining_quantity - 1,
        sold_count: ((coupon as Record<string, unknown>).sold_count as number || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', couponId);

    if (stockError) throw new Error(`更新库存失败: ${stockError.message}`);

    // 创建用户券记录
    const { data: userCoupon, error: insertError } = await client
      .from('user_coupons')
      .insert({
        user_id: payload.userId,
        coupon_id: couponId,
        status: 'pending_use',
        payment_amount: coupon.price,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`抢券失败: ${insertError.message}`);

    // 记录交易明细
    await client
      .from('transaction_logs')
      .insert({
        user_id: payload.userId,
        type: 'grab',
        amount: -couponPrice,
        balance_after: parseFloat(newBalance),
        description: `抢购优惠券: ${coupon.name}`,
        related_id: userCoupon.id,
      });

    // 创建后台通知
    await client
      .from('admin_notifications')
      .insert({
        type: 'grab',
        title: '新抢券通知',
        content: `用户 ${payload.username} 抢购了 ${coupon.name}，金额 ${couponPrice.toFixed(2)} 元`,
        is_read: false,
      });

    return NextResponse.json({
      success: true,
      userCouponId: userCoupon.id,
      message: '抢券成功！',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '抢券失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
