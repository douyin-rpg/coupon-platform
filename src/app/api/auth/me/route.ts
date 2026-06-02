import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, real_name, balance, verify_status, bank_bound, bank_account_name, bank_card_number, bank_name, payment_password_hash, id_card, id_card_name, id_card_front, id_card_back, verify_rejected_reason, credit_score")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[/api/auth/me] Supabase query error:", error.message);
    return NextResponse.json({ error: "查询失败: " + error.message }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    realName: user.real_name,
    balance: parseFloat(user.balance) || 0,
    verifyStatus: user.verify_status || "unverified",
    bankBound: user.bank_bound || false,
    bankAccountName: user.bank_account_name,
    bankCardNumber: user.bank_card_number
      ? user.bank_card_number.slice(0, 4) + " **** **** " + user.bank_card_number.slice(-4)
      : null,
    bankName: user.bank_name,
    paymentPasswordSet: !!user.payment_password_hash,
    idCardName: user.id_card_name,
    idCard: user.id_card ? user.id_card.slice(0, 3) + "***********" + user.id_card.slice(-4) : null,
    idCardFront: user.id_card_front,
    idCardBack: user.id_card_back,
    verifyRejectedReason: user.verify_rejected_reason,
    creditScore: user.credit_score || 100,
  });
}

// 修改登录密码
export async function PATCH(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { oldPassword, newPassword } = body;

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "请输入旧密码和新密码" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "新密码至少6位" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "旧密码不正确" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("users")
    .update({ password_hash: hashed })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "修改失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
