import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuth } from '@/lib/auth';

// 用户领取红包：入账并记录交易流水
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // 查询红包记录（必须是当前用户、待领取状态）
    const { data: packet, error: packetError } = await supabase
      .from('red_packets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (packetError || !packet) {
      return NextResponse.json({ error: '红包不存在或已领取' }, { status: 404 });
    }

    const numAmount = Number(packet.amount);

    // 查询用户当前余额
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const newBalance = Number(user.balance) + numAmount;

    // 更新用户余额
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Claim red packet update balance failed:', updateError);
      return NextResponse.json({ error: '领取失败' }, { status: 500 });
    }

    // 更新红包状态为已领取
    const { error: claimError } = await supabase
      .from('red_packets')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', id);

    if (claimError) {
      console.error('Claim red packet update status failed:', claimError);
    }

    // 记录交易流水
    const transactionNo = `RP${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const { error: txnError } = await supabase.from('transaction_logs').insert({
      user_id: userId,
      transaction_no: transactionNo,
      type: 'red_packet',
      amount: numAmount,
      balance_after: newBalance,
      description: packet.note ? `红包领取(${packet.note})` : '红包领取',
      reference_type: 'red_packet',
      reference_id: id,
    });
    if (txnError) {
      console.error('Claim red packet txn insert failed:', txnError);
    }

    return NextResponse.json({
      success: true,
      message: `领取成功，余额已增加 ¥${numAmount.toFixed(2)}`,
      newBalance: newBalance.toFixed(2),
    });
  } catch (error) {
    console.error('Claim red packet error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}