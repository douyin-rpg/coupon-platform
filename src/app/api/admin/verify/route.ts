import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAdminAuth } from "@/lib/auth";
import { S3Storage } from "coze-coding-dev-sdk";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 获取待审核/所有实名认证列表
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const status = request.nextUrl.searchParams.get("status") || "pending";

  let query = supabase
    .from("users")
    .select("id, username, real_name, id_card_name, id_card, id_card_front, id_card_back, verify_status, verify_rejected_reason, created_at")
    .gt("id_card_name", "") // 只查有提交信息的
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("verify_status", status);
  }

  const { data: users, error } = await query;

  if (error) {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }

  // 为身份证照片生成签名URL
  const usersWithUrls = await Promise.all(
    (users || []).map(async (user: Record<string, unknown>) => {
      let frontUrl = null;
      let backUrl = null;
      if (user.id_card_front) {
        try {
          frontUrl = await storage.generatePresignedUrl({
            key: user.id_card_front as string,
            expireTime: 3600,
          });
        } catch { /* ignore */ }
      }
      if (user.id_card_back) {
        try {
          backUrl = await storage.generatePresignedUrl({
            key: user.id_card_back as string,
            expireTime: 3600,
          });
        } catch { /* ignore */ }
      }
      return { ...user, id_card_front_url: frontUrl, id_card_back_url: backUrl };
    })
  );

  return NextResponse.json({ users: usersWithUrls });
}

// 审核实名认证
export async function PATCH(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, action, reason, id_card_name, id_card, id_card_front, id_card_back } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  if (action === "approve") {
    const { error } = await supabase
      .from("users")
      .update({ verify_status: "verified", verify_rejected_reason: null })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: "操作失败" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "审核通过" });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("users")
      .update({ verify_status: "rejected", verify_rejected_reason: reason || "审核未通过" })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: "操作失败" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "已拒绝" });
  }

  if (action === "update_verify") {
    // 管理员修改用户实名信息
    const updateData: Record<string, unknown> = {};
    if (id_card_name !== undefined) updateData.id_card_name = id_card_name;
    if (id_card !== undefined) updateData.id_card = id_card;
    if (id_card_front !== undefined) updateData.id_card_front = id_card_front;
    if (id_card_back !== undefined) updateData.id_card_back = id_card_back;

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: "修改失败" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "修改成功" });
  }

  if (action === "delete_verify") {
    // 管理员删除用户实名信息
    const { error } = await supabase
      .from("users")
      .update({
        verify_status: "unverified",
        id_card_name: null,
        id_card: null,
        id_card_front: null,
        id_card_back: null,
        verify_rejected_reason: null,
      })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "已删除实名信息" });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
