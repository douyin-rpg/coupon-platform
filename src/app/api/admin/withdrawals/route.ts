import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAdminAuth } from "@/lib/auth";

// 获取所有提现申请
export async function GET(request: NextRequest) {
	try {
		const isAdmin = await verifyAdminAuth(request);
		if (!isAdmin) {
			return NextResponse.json({ error: "未授权" }, { status: 401 });
		}

		const supabase = getSupabaseClient();
		const { data: withdrawals, error } = await supabase
			.from("withdrawals")
			.select("*, users(username, real_name)")
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

// 审核提现申请
export async function PATCH(request: NextRequest) {
	try {
		const isAdmin = await verifyAdminAuth(request);
		if (!isAdmin) {
			return NextResponse.json({ error: "未授权" }, { status: 401 });
		}

		const body = await request.json();
		const { id, status, adminNote } = body;

		if (!id || !status || !["approved", "rejected"].includes(status)) {
			return NextResponse.json({ error: "参数无效" }, { status: 400 });
		}

		const supabase = getSupabaseClient();

		// 获取提现申请
		const { data: withdrawal, error: wError } = await supabase
			.from("withdrawals")
			.select("*")
			.eq("id", id)
			.single();

		if (wError || !withdrawal) {
			return NextResponse.json({ error: "提现申请不存在" }, { status: 404 });
		}

		if (withdrawal.status !== "pending") {
			return NextResponse.json({ error: "该提现申请已处理" }, { status: 400 });
		}

		// 更新提现状态
		const { error: updateError } = await supabase
			.from("withdrawals")
			.update({
				status,
				admin_note: adminNote || null,
				processed_at: new Date().toISOString(),
			})
			.eq("id", id);

		if (updateError) {
			return NextResponse.json({ error: "更新提现状态失败" }, { status: 500 });
		}

		// 如果拒绝，返还余额
		if (status === "rejected") {
			const { data: user } = await supabase
				.from("users")
				.select("balance")
				.eq("id", withdrawal.user_id)
				.single();

			if (user) {
				const newBalance = (parseFloat(user.balance) + parseFloat(withdrawal.amount)).toFixed(2);
				await supabase
					.from("users")
					.update({ balance: newBalance })
					.eq("id", withdrawal.user_id);
			}
		}

		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "操作失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
