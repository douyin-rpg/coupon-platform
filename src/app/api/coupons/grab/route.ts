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
      .select('verify_status, payment_password_hash, balance, funds_frozen')
      .eq('id', payload.userId)
      .maybeSingle();

    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (user?.funds_frozen) {
      return NextResponse.json({ error: '资金已被冻结，无法抢券' }, { status: 403 });
    }
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
      .select('id, name, price, remaining_quantity, sold_count, is_active')
      .eq('id', couponId)
      .maybeSingle();

    if (couponError) throw new Error(`查询优惠券失败: ${couponError.message}`);
    if (!coupon || !coupon.is_active) {
      return NextResponse.json({ error: '优惠券不存在或已下架' }, { status: 400 });
    }

    // 检查是否有任何场次当前开放抢购
    const { data: sessions, error: sessionsError } = await client
      .from('grab_sessions')
      .select('start_time, end_time, is_active')
      .eq('is_active', true);

    if (sessionsError) throw new Error(`查询场次失败: ${sessionsError.message}`);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const activeSession = sessions?.find((s: { start_time: string; end_time: string }) => {
      const [startH, startM] = s.start_time.split(':').map(Number);
      const [endH, endM] = s.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });

    if (!activeSession) {
      return NextResponse.json({ error: '当前不在抢券时间内，请在活动时间段内抢购' }, { status: 400 });
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

    // 生成核销码
    const verificationCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // 创建用户券记录
    const { data: userCoupon, error: insertError } = await client
      .from('user_coupons')
      .insert({
        user_id: payload.userId,
        coupon_id: couponId,
        status: 'pending_use',
        payment_amount: coupon.price,
        verification_code: verificationCode,
        paid_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`抢券失败: ${insertError.message}`);

    // 记录交易明细
    const txnNo = 'TXN' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await client
      .from('transaction_logs')
      .insert({
        user_id: payload.userId,
        type: 'grab',
        amount: -couponPrice,
        balance_after: parseFloat(newBalance),
        description: `抢券 - ${coupon.name}`,
        reference_type: 'user_coupon',
        reference_id: userCoupon.id,
        transaction_no: txnNo,
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
