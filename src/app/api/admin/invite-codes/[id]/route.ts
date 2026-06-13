import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

const supabase = getSupabaseClient();

// PUT: 更新邀请码
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const { code, description, is_active } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code.trim();
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('invite_codes')
      .update(updateData)
      .eq('id', id)
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
    console.error('Error updating invite code:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE: 删除邀请码
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invite code:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
