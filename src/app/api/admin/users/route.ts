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
			.select("id, username, real_name, balance, verify_status, bank_bound, bank_account_name, bank_card_number, bank_name, payment_password_set, credit_score, login_frozen, funds_frozen, register_ip, last_login_ip, last_login_at, is_online, created_at, password_hash, payment_password_hash")
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
