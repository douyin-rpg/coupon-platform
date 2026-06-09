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
      .select('*, user_coupons(user_id, payment_amount, status, coupons(name))')
      .eq('id', id)
      .maybeSingle();

    if (reqError) throw new Error(`查询回兑申请失败: ${reqError.message}`);
    if (!redemptionRequest) {
      return NextResponse.json({ error: '回兑申请不存在' }, { status: 404 });
    }

    if (redemptionRequest.status !== 'pending') {
      return NextResponse.json({ error: '该申请已处理' }, { status: 400 });
    }

    const userCoupon = redemptionRequest.user_coupons as unknown as { user_id: string; payment_amount: string; status: string; coupons: { name: string } };
    const couponName = userCoupon?.coupons?.name || '优惠券';

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

    // 更新用户券状态
    const couponNewStatus = action === 'approve' ? 'redeemed' : 'redemption_rejected';
    const { error: updateCouponError } = await client
      .from('user_coupons')
      .update({
        status: couponNewStatus,
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

    // 记录交易明细
    const txnNo = 'TXN' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const logType = action === 'approve' ? 'redemption_approved' : 'redemption_rejected';
    const logDesc = action === 'approve'
      ? `回兑 - ${couponName} +${refundAmount.toFixed(2)}`
      : `回兑退回 - ${couponName} +${refundAmount.toFixed(2)}`;
    await client
      .from('transaction_logs')
      .insert({
        user_id: userCoupon.user_id,
        type: logType,
        amount: refundAmount,
        balance_after: parseFloat(newBalance),
        description: logDesc,
        reference_type: 'redemption',
        reference_id: id,
        transaction_no: txnNo,
      });

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

// POST: Batch process all pending redemption requests
export async function POST(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { action } = await request.json();
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: '无效的操作，必须为 approve 或 reject' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // Get all pending redemption requests
    const { data: pendingRequests, error: fetchError } = await client
      .from('redemption_requests')
      .select('id, user_coupon_id, user_coupons(user_id, payment_amount, status, coupons(name))')
      .eq('status', 'pending');

    if (fetchError) throw new Error(`查询待审核回兑失败: ${fetchError.message}`);

    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: '没有待处理的回兑申请' });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const req of pendingRequests) {
      try {
        const userCoupon = req.user_coupons as unknown as { user_id: string; payment_amount: string; status: string; coupons: { name: string } };
        const couponName = userCoupon?.coupons?.name || '优惠券';
        
        // Update redemption request status
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const { error: updateReqError } = await client
          .from('redemption_requests')
          .update({
            status: newStatus,
            processed_at: new Date().toISOString(),
          })
          .eq('id', req.id);

        if (updateReqError) { errors.push(`更新申请${req.id}失败`); continue; }

        // Update user coupon status
        const couponNewStatus = action === 'approve' ? 'redeemed' : 'redemption_rejected';
        const { error: updateCouponError } = await client
          .from('user_coupons')
          .update({
            status: couponNewStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', req.user_coupon_id);

        if (updateCouponError) { errors.push(`更新券${req.user_coupon_id}失败`); continue; }

        // Calculate refund
        const paymentAmount = parseFloat(userCoupon.payment_amount);
        let refundAmount: number;
        if (action === 'approve') {
          refundAmount = paymentAmount + paymentAmount * 0.05;
        } else {
          refundAmount = paymentAmount;
        }

        // Update user balance
        const { data: userData } = await client
          .from('users')
          .select('balance')
          .eq('id', userCoupon.user_id)
          .maybeSingle();

        const currentBalance = parseFloat(userData?.balance || '0');
        const newBalance = (currentBalance + refundAmount).toFixed(2);

        const { error: balanceError } = await client
          .from('users')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', userCoupon.user_id);

        if (balanceError) { errors.push(`更新用户${userCoupon.user_id}余额失败`); continue; }

        // Record transaction log
        const txnNo = 'TXN' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const logType = action === 'approve' ? 'redemption_approved' : 'redemption_rejected';
        const logDesc = action === 'approve'
          ? `回兑 - ${couponName} +${refundAmount.toFixed(2)}`
          : `回兑退回 - ${couponName} +${refundAmount.toFixed(2)}`;
        await client
          .from('transaction_logs')
          .insert({
            user_id: userCoupon.user_id,
            type: logType,
            amount: refundAmount,
            balance_after: parseFloat(newBalance),
            description: logDesc,
            reference_type: 'redemption',
            reference_id: req.id,
            transaction_no: txnNo,
          });

        processed++;
      } catch {
        errors.push(`处理申请${req.id}异常`);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: pendingRequests.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `已${action === 'approve' ? '通过' : '拒绝'} ${processed}/${pendingRequests.length} 条回兑申请`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '批量处理失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
