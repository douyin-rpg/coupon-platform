import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAdminAuth } from "@/lib/auth";

// 获取所有用户列表
export async function GET(request: NextRequest) {
	try {
		const isAdmin = await verifyAdminAuth(request);
		if (!isAdmin) {
			return NextResponse.json({ error: "未授权" }, { status: 401 });
		}

		const supabase = getSupabaseClient();
		const { data: users, error } = await supabase
			.from("users")
			.select("id, username, real_name, is_verified, payment_account, balance, created_at")
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
		}

		return NextResponse.json({ users });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "获取用户列表失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
