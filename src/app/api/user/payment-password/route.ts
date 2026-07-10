import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 修改支付密码
export async function PATCH(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { oldPaymentPassword, newPaymentPassword } = body;

  if (!oldPaymentPassword || !newPaymentPassword) {
    return NextResponse.json({ error: "请输入原支付密码和新支付密码" }, { status: 400 });
  }

  if (newPaymentPassword.length < 6) {
    return NextResponse.json({ error: "新支付密码至少6位" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("payment_password_hash")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (!user.payment_password_hash) {
    return NextResponse.json({ error: "尚未设置支付密码" }, { status: 400 });
  }

  const valid = await bcrypt.compare(oldPaymentPassword, user.payment_password_hash);
  if (!valid) {
    return NextResponse.json({ error: "原支付密码不正确" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPaymentPassword, 10);
  const { error } = await supabase
    .from("users")
    .update({ payment_password_hash: hashed })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "修改失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
