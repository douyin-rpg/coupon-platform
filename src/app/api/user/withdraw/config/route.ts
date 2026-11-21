import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAuth } from "@/lib/auth";

// 提现配置（手续费率百分比，如 1 表示 1%），供前端实时计算预计到账
export async function GET(request: NextRequest) {
	try {
		const userId = await verifyAuth(request);
		if (!userId) {
			return NextResponse.json({ error: "未登录" }, { status: 401 });
		}

		const supabase = getSupabaseClient();
		const { data } = await supabase
			.from("system_settings")
			.select("value")
			.eq("key", "withdraw_fee_rate")
			.maybeSingle();

		const feeRate = parseFloat(data?.value as string);
		return NextResponse.json({ fee_rate: isNaN(feeRate) || feeRate < 0 ? 1 : feeRate });
	} catch {
		return NextResponse.json({ fee_rate: 1 });
	}
}