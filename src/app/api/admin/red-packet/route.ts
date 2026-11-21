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

    // 创建待领取红包记录（暂不入账，等待用户在前端点击领取）
    const { data: packet, error: insertError } = await supabase
      .from('red_packets')
      .insert({
        user_id,
        amount: numAmount,
        note: note || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Red packet insert failed:', insertError);
      const msg = (insertError.message || '').toLowerCase();
      if (msg.includes('relation') && msg.includes('does not exist')) {
        return NextResponse.json({
          error: '创建红包失败：线上数据库缺少 red_packets 表，请在 Supabase SQL Editor 执行 migration-schema-upgrade.sql 后重试',
        }, { status: 500 });
      }
      return NextResponse.json({ error: `创建红包失败：${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `红包已发送给 ${user.username}，等待用户领取 ¥${numAmount.toFixed(2)}`,
      red_packet: packet,
    });
  } catch (error) {
    console.error('Red packet error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}