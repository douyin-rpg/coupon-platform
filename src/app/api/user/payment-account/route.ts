import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAuth } from "@/lib/auth";

// 绑定收款账户
export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseClient();

  // 检查是否已绑定
  const { data: user } = await supabase
    .from("users")
    .select("bank_bound, verify_status")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (user.bank_bound) {
    return NextResponse.json({ error: "已绑定收款账户，不可自行更改，如需修改请联系客服" }, { status: 400 });
  }

  if (user.verify_status !== "verified") {
    return NextResponse.json({ error: "请先完成实名认证" }, { status: 400 });
  }

  const body = await request.json();
  const { bank_account_name, bank_card_number, bank_name } = body;

  if (!bank_account_name || !bank_card_number || !bank_name) {
    return NextResponse.json({ error: "请填写完整的收款账户信息" }, { status: 400 });
  }

  // 校验银行卡号（16-19位数字）
  if (!/^\d{16,19}$/.test(bank_card_number)) {
    return NextResponse.json({ error: "银行卡号格式不正确" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      bank_account_name,
      bank_card_number,
      bank_name,
      bank_bound: true,
      payment_account: `${bank_name} 尾号${bank_card_number.slice(-4)}`,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "绑定失败，请重试" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "收款账户绑定成功" });
}

// 获取收款账户信息
export async function GET(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("bank_bound, bank_account_name, bank_card_number, bank_name, verify_status")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    bankBound: user.bank_bound || false,
    bankAccountName: user.bank_account_name,
    bankCardNumber: user.bank_card_number
      ? user.bank_card_number.slice(0, 4) + " **** **** " + user.bank_card_number.slice(-4)
      : null,
    bankName: user.bank_name,
    isVerified: user.verify_status === "verified",
  });
}
