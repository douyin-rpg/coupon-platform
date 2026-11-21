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

		// 拒绝时必须填写原因（用户端可见）
		if (status === "rejected" && !adminNote?.trim()) {
			return NextResponse.json({ error: "请填写拒绝原因，用户将看到该原因" }, { status: 400 });
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

		// 如果拒绝，返还余额（全额，含手续费）
		if (status === "rejected") {
			const { data: user } = await supabase
				.from("users")
				.select("balance")
				.eq("id", withdrawal.user_id)
				.single();

			if (user) {
				const newBalance = (parseFloat(user.balance) + parseFloat(withdrawal.amount)).toFixed(2);
				const { error: balanceError } = await supabase
					.from("users")
					.update({ balance: newBalance })
					.eq("id", withdrawal.user_id);

				if (!balanceError) {
					// 记录交易明细（退回全额，原因透出给用户）
					const txnNo = `TXN${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
					await supabase.from("transaction_logs").insert({
						user_id: withdrawal.user_id,
						type: "withdrawal_rejected",
						amount: parseFloat(withdrawal.amount),
						balance_after: parseFloat(newBalance),
						description: `提现被拒绝，退回 ${withdrawal.amount}元${adminNote ? `（原因：${adminNote}）` : ""}`,
						transaction_no: txnNo,
						reference_type: "withdrawal",
						reference_id: id,
					});
				}
			}
		}

		// 如果通过，资金明细中的提现流水标记为到账
		if (status === "approved") {
			const fee = parseFloat(withdrawal.fee || 0);
			const actual = parseFloat(withdrawal.actual_amount || (parseFloat(withdrawal.amount) - fee));
			// 更新申请时写入的流水描述（reference_id 对应提现记录）
			const { data: pendingTxns } = await supabase
				.from("transaction_logs")
				.select("id")
				.eq("reference_type", "withdrawal")
				.eq("reference_id", id)
				.eq("type", "withdraw");
			if (pendingTxns && pendingTxns.length > 0) {
				await supabase
					.from("transaction_logs")
					.update({ description: `提现成功到账 ${actual.toFixed(2)}元（手续费 ${fee.toFixed(2)}元）` })
					.in("id", pendingTxns.map((t: { id: string }) => t.id));
			}
		}

		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "操作失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
