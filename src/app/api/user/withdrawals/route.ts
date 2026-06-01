import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const userId = await verifyAuth(request);
		if (!userId) {
			return NextResponse.json({ error: "未登录" }, { status: 401 });
		}

		const supabase = getSupabaseClient();
		const { data: withdrawals, error } = await supabase
			.from("withdrawals")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json({ error: "获取提现记录失败" }, { status: 500 });
		}

		return NextResponse.json({ withdrawals });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "获取提现记录失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
