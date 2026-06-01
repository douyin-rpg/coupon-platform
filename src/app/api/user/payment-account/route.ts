import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';

// 修改收款账号
export async function POST(request: Request) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { paymentAccount } = await request.json();

    if (!paymentAccount) {
      return NextResponse.json({ error: '请填写收款账号' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('users')
      .update({
        payment_account: paymentAccount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.userId);

    if (error) throw new Error(`修改收款账号失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '修改收款账号失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
