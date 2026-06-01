import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const categoryId = searchParams.get("categoryId");
    const id = searchParams.get("id");

    const client = getSupabaseClient();

    if (id) {
      const { data: coupon, error } = await client
        .from("coupons")
        .select("*, grab_sessions(name, start_time, end_time)")
        .eq("id", id)
        .single();
      if (error) throw new Error(`查询优惠券失败: ${error.message}`);
      return NextResponse.json({ coupons: coupon ? [coupon] : [] });
    }

    let query = client
      .from("coupons")
      .select("id, name, description, price, original_price, discount, total_quantity, remaining_quantity, sold_count, image_url, session_id, category_id, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data: coupons, error } = await query;

    if (error) throw new Error(`查询优惠券失败: ${error.message}`);

    return NextResponse.json({ coupons: coupons || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询优惠券失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
