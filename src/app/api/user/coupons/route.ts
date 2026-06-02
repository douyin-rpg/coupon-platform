import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: coupons, error } = await client
      .from("user_coupons")
      .select("id, coupon_id, status, payment_amount, created_at, verification_code, paid_at, coupons(name, price, original_price, image_url, description)")
      .eq("user_id", payload.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`查询我的券失败: ${error.message}`);

    // Map field names for frontend compatibility
    const mapped = (coupons || []).map((c: Record<string, unknown>) => ({
      id: c.id,
      coupon_id: c.coupon_id,
      status: c.status,
      payment_amount: c.payment_amount,
      grabbed_at: c.created_at,
      verification_code: c.verification_code,
      paid_at: c.paid_at,
      coupons: c.coupons,
    }));

    return NextResponse.json({ coupons: mapped });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询我的券失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
