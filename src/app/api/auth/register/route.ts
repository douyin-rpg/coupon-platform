import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, realName, password, payPassword, registrationCode } = await request.json();

    if (!username || !realName || !password || !registrationCode) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ error: '用户名长度应在3-50之间' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    if (!payPassword || payPassword.length < 6) {
      return NextResponse.json({ error: '支付密码至少6位' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 验证注册码
    const { data: codeData, error: codeError } = await client
      .from('registration_codes')
      .select('*')
      .eq('code', registrationCode)
      .maybeSingle();

    if (codeError) throw new Error(`查询注册码失败: ${codeError.message}`);
    if (!codeData) {
      return NextResponse.json({ error: '注册码无效' }, { status: 400 });
    }

    // Check if code has reached max uses
    if (codeData.current_uses >= codeData.max_uses) {
      return NextResponse.json({ error: '注册码已被使用完' }, { status: 400 });
    }

    // 检查用户名是否已存在
    const { data: existingUser, error: userCheckError } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (userCheckError) throw new Error(`查询用户失败: ${userCheckError.message}`);
    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, 10);
    const payPasswordHash = await bcrypt.hash(payPassword, 10);
    // 获取注册IP
    const registerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown';

    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert({
        username,
        real_name: realName,
        password_hash: passwordHash,
        payment_password_hash: payPasswordHash,
        payment_password_set: true,
        balance: '0',
        verify_status: 'unverified',
        bank_bound: false,
        credit_score: 500,
        register_ip: registerIp,
      })
      .select('id, username')
      .single();

    if (insertError) throw new Error(`创建用户失败: ${insertError.message}`);

    // 更新注册码使用次数
    const newUses = (codeData.current_uses || 0) + 1;
    const updateData: Record<string, unknown> = {
      current_uses: newUses,
      used_by: newUser.id,
    };
    if (newUses >= codeData.max_uses) {
      updateData.is_used = true;
    }
    await client
      .from('registration_codes')
      .update(updateData)
      .eq('id', codeData.id);

    const token = await signToken({
      userId: newUser.id,
      username: newUser.username,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: newUser.id, username: newUser.username },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '注册失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
