import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAuth } from "@/lib/auth";

// 中国身份证号码校验（格式校验）
function isValidChineseID(id: string): boolean {
  // 18位：前17位数字，最后一位数字或X/x
  if (!/^\d{17}[\dXx]$/.test(id)) return false;
  return true;
}

// 提交实名认证
export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseClient();

  // 检查当前状态
  const { data: user } = await supabase
    .from("users")
    .select("verify_status, id_card_name")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (user.verify_status === "verified") {
    return NextResponse.json({ error: "已完成实名认证，不可更改" }, { status: 400 });
  }

  if (user.verify_status === "pending") {
    return NextResponse.json({ error: "认证审核中，请耐心等待" }, { status: 400 });
  }

  const body = await request.json();
  const { id_card_name, id_card, id_card_front, id_card_back } = body;

  if (!id_card_name || !id_card || !id_card_front || !id_card_back) {
    return NextResponse.json({ error: "请填写完整信息并上传身份证正反面照片" }, { status: 400 });
  }

  // 校验身份证号
  if (!isValidChineseID(id_card)) {
    return NextResponse.json({ error: "身份证号码格式不正确" }, { status: 400 });
  }

  // 检查身份证是否已被使用
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id_card", id_card)
    .neq("id", userId)
    .single();

  if (existingUser) {
    return NextResponse.json({ error: "该身份证号已被其他用户使用" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      id_card_name,
      id_card,
      id_card_front,
      id_card_back,
      verify_status: "pending",
      verify_rejected_reason: null,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "提交失败，请重试" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "实名认证已提交，等待审核" });
}

// 获取实名认证状态
export async function GET(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("verify_status, id_card_name, id_card, id_card_front, id_card_back, verify_rejected_reason")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    verifyStatus: user.verify_status || "unverified",
    idCardName: user.id_card_name,
    idCard: user.id_card ? user.id_card.slice(0, 4) + "**********" + user.id_card.slice(-4) : null,
    idCardFront: user.id_card_front,
    idCardBack: user.id_card_back,
    rejectedReason: user.verify_rejected_reason,
  });
}
