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
			.select("id, username, real_name, balance, verify_status, bank_bound, bank_account_name, bank_card_number, bank_name, payment_password_set, credit_score, login_frozen, funds_frozen, register_ip, last_login_ip, last_login_at, is_online, created_at, password_hash, payment_password_hash, id_card, id_card_name, id_card_front, id_card_back")
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
		}

		// 返回用户列表，密码字段转为布尔值（不暴露哈希），在线状态基于 last_login_at 判断
		const now = new Date();
		const safeUsers = (users || []).map((u: Record<string, unknown>) => {
			const lastLoginAt = u.last_login_at ? new Date(u.last_login_at as string) : null;
			// 10分钟内有活动视为在线
			const isOnline = lastLoginAt ? (now.getTime() - lastLoginAt.getTime()) < 10 * 60 * 1000 : false;
			return {
				...u,
				is_online: isOnline,
				has_password: !!u.password_hash,
				has_payment_password: !!(u.payment_password_hash || u.payment_password_set),
				password_hash: undefined,
				payment_password_hash: undefined,
			};
		});

		return NextResponse.json({ users: safeUsers });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "获取用户列表失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
