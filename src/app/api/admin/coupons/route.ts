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
    const { data: coupons, error } = await client
      .from('coupons')
      .select('*, grab_sessions(name)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询优惠券失败: ${error.message}`);

    return NextResponse.json({ coupons: coupons || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询优惠券失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { name, description, price, totalQuantity, sessionId, imageUrl } = await request.json();

    if (!name || !price || !totalQuantity || !sessionId) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('coupons')
      .insert({
        name,
        description: description || null,
        price: price.toString(),
        total_quantity: totalQuantity,
        remaining_quantity: totalQuantity,
        session_id: sessionId,
        image_url: imageUrl || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(`创建优惠券失败: ${error.message}`);

    return NextResponse.json({ success: true, coupon: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建优惠券失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id, name, description, price, totalQuantity, sessionId, imageUrl, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少优惠券ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price.toString();
    if (totalQuantity !== undefined) {
      updateData.total_quantity = totalQuantity;
      // 如果总数量增加，相应增加剩余数量
      const { data: coupon } = await client.from('coupons').select('total_quantity, remaining_quantity').eq('id', id).maybeSingle();
      if (coupon) {
        const diff = totalQuantity - coupon.total_quantity;
        updateData.remaining_quantity = Math.max(0, coupon.remaining_quantity + diff);
      }
    }
    if (sessionId !== undefined) updateData.session_id = sessionId;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await client
      .from('coupons')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`更新优惠券失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新优惠券失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少优惠券ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除优惠券失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除优惠券失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
