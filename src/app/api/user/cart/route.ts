import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, coupons(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ items: data || [] });
  } catch {
    return NextResponse.json({ error: '获取购物车失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const { couponId, quantity = 1 } = await request.json();
    if (!couponId) {
      return NextResponse.json({ error: '缺少优惠券ID' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if already in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('coupon_id', couponId)
      .single();

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, coupon_id: couponId, quantity });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '添加购物车失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const { id, quantity } = await request.json();
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '更新购物车失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const supabase = getSupabaseClient();

    if (id) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      // Clear all
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除购物车失败' }, { status: 500 });
  }
}
