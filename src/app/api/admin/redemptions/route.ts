import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: requests, error } = await client
      .from('redemption_requests')
      .select('*, user_coupons(payment_amount, coupons(name, price)), users(username, real_name)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询回兑申请失败: ${error.message}`);

    return NextResponse.json({ requests: requests || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询回兑申请失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id, action, adminNote } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 查询回兑申请
    const { data: redemptionRequest, error: reqError } = await client
      .from('redemption_requests')
      .select('*, user_coupons(user_id, payment_amount, status)')
      .eq('id', id)
      .maybeSingle();

    if (reqError) throw new Error(`查询回兑申请失败: ${reqError.message}`);
    if (!redemptionRequest) {
      return NextResponse.json({ error: '回兑申请不存在' }, { status: 404 });
    }

    if (redemptionRequest.status !== 'pending') {
      return NextResponse.json({ error: '该申请已处理' }, { status: 400 });
    }

    const userCoupon = redemptionRequest.user_coupons as unknown as { user_id: string; payment_amount: string; status: string };

    // 更新回兑申请状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateReqError } = await client
      .from('redemption_requests')
      .update({
        status: newStatus,
        admin_note: adminNote || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateReqError) throw new Error(`更新回兑申请失败: ${updateReqError.message}`);

    // 更新用户券状态为已回兑
    const { error: updateCouponError } = await client
      .from('user_coupons')
      .update({
        status: 'redeemed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', redemptionRequest.user_coupon_id);

    if (updateCouponError) throw new Error(`更新券状态失败: ${updateCouponError.message}`);

    // 计算返还金额
    const paymentAmount = parseFloat(userCoupon.payment_amount);
    let refundAmount: number;
    if (action === 'approve') {
      // 通过：返还支付金额 + 5%
      refundAmount = paymentAmount + paymentAmount * 0.05;
    } else {
      // 拒绝：仅返还支付金额
      refundAmount = paymentAmount;
    }

    // 查询用户当前余额
    const { data: userData, error: userError } = await client
      .from('users')
      .select('balance')
      .eq('id', userCoupon.user_id)
      .maybeSingle();

    if (userError) throw new Error(`查询用户余额失败: ${userError.message}`);

    const currentBalance = parseFloat(userData?.balance || '0');
    const newBalance = (currentBalance + refundAmount).toFixed(2);

    // 更新用户余额
    const { error: balanceError } = await client
      .from('users')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userCoupon.user_id);

    if (balanceError) throw new Error(`更新用户余额失败: ${balanceError.message}`);

    return NextResponse.json({
      success: true,
      refundAmount: refundAmount.toFixed(2),
      message: action === 'approve' ? '已通过，返还金额含5%奖励' : '已拒绝，返还支付金额',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '处理回兑申请失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
