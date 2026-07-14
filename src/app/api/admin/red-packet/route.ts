import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, amount, note } = body;

    if (!user_id || !amount || amount <= 0) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, balance')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const numAmount = Number(amount);

    // 更新用户余额
    const { error: updateError } = await supabase
      .from('users')
      .update({
        balance: Number(user.balance) + numAmount,
      })
      .eq('id', user_id);

    if (updateError) {
      return NextResponse.json({ error: '更新余额失败' }, { status: 500 });
    }

    // 记录交易流水
    const transactionNo = `RP${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await supabase.from('transaction_logs').insert({
      user_id,
      transaction_no: transactionNo,
      type: 'red_packet',
      amount: numAmount,
      balance_before: Number(user.balance),
      balance_after: Number(user.balance) + numAmount,
      description: note || '红包',
      reference_type: 'red_packet',
    });

    return NextResponse.json({
      success: true,
      message: `红包发送成功，${user.username} 余额已增加 ¥${numAmount.toFixed(2)}`,
    });
  } catch (error) {
    console.error('Red packet error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
