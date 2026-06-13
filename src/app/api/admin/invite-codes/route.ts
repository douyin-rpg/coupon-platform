import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

const supabase = getSupabaseClient();

// GET: 获取所有邀请码
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ codes: data });
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    return NextResponse.json({ error: '获取邀请码失败' }, { status: 500 });
  }
}

// POST: 创建邀请码
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { code, description, is_active } = await request.json();

    if (!code) {
      return NextResponse.json({ error: '邀请码不能为空' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        code: code.trim(),
        description: description || '',
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '邀请码已存在' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ code: data });
  } catch (error) {
    console.error('Error creating invite code:', error);
    return NextResponse.json({ error: '创建邀请码失败' }, { status: 500 });
  }
}
