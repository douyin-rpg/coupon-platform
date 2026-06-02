import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAdminAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 获取单个用户详情
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const isAdmin = await verifyAdminAuth(request);
		if (!isAdmin) {
			return NextResponse.json({ error: "未授权" }, { status: 401 });
		}

		const { id } = await params;
		const supabase = getSupabaseClient();
		const { data: user, error } = await supabase
			.from("users")
			.select("id, username, real_name, balance, verify_status, verify_rejected_reason, id_card_name, id_card, id_card_front, id_card_back, bank_bound, bank_account_name, bank_card_number, bank_name, payment_password_set, credit_score, created_at")
			.eq("id", id)
			.single();

		if (error || !user) {
			return NextResponse.json({ error: "用户不存在" }, { status: 404 });
		}

		return NextResponse.json({ user });
	} catch {
		return NextResponse.json({ error: "服务器错误" }, { status: 500 });
	}
}

// 管理员操作用户
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const isAdmin = await verifyAdminAuth(request);
		if (!isAdmin) {
			return NextResponse.json({ error: "未授权" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { action, note } = body;

		const supabase = getSupabaseClient();

		// 获取用户当前信息
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("id, balance, verify_status, bank_name")
			.eq("id", id)
			.single();

		if (userError || !user) {
			return NextResponse.json({ error: "用户不存在" }, { status: 404 });
		}

		if (action === "reset_login_password") {
			const { new_password } = body;
			if (!new_password || new_password.length < 6) {
				return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
			}
			const hashed = await bcrypt.hash(new_password, 10);
			const { error } = await supabase
				.from("users")
				.update({ password_hash: hashed })
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "重置失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "登录密码已重置" });
		}

		if (action === "reset_payment_password") {
			const { new_password } = body;
			if (!new_password || new_password.length < 6) {
				return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
			}
			const hashed = await bcrypt.hash(new_password, 10);
			const { error } = await supabase
				.from("users")
				.update({ payment_password_hash: hashed, payment_password_set: true })
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "重置失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "支付密码已重置" });
		}

		if (action === "add_balance") {
			const { amount } = body;
			const addAmount = parseFloat(amount);
			if (isNaN(addAmount) || addAmount <= 0) {
				return NextResponse.json({ error: "金额必须大于0" }, { status: 400 });
			}
			const newBalance = (parseFloat(user.balance) + addAmount).toFixed(2);
			const { error } = await supabase
				.from("users")
				.update({ balance: newBalance })
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "充值失败" }, { status: 500 });
			}
			// 记录交易明细
			await supabase.from("transaction_logs").insert({
				user_id: id,
				type: "admin_deposit",
				amount: addAmount,
				balance_after: parseFloat(newBalance),
				description: note || `管理员充值: ${addAmount.toFixed(2)}元`,
			});
			return NextResponse.json({ success: true, message: `已充值 ${addAmount} 元`, newBalance });
		}

		if (action === "deduct_balance") {
			const { amount } = body;
			const deductAmount = parseFloat(amount);
			if (isNaN(deductAmount) || deductAmount <= 0) {
				return NextResponse.json({ error: "金额必须大于0" }, { status: 400 });
			}
			const currentBalance = parseFloat(user.balance);
			if (deductAmount > currentBalance) {
				return NextResponse.json({ error: "余额不足，无法扣款" }, { status: 400 });
			}
			const newBalance = (currentBalance - deductAmount).toFixed(2);
			const { error } = await supabase
				.from("users")
				.update({ balance: newBalance })
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "扣款失败" }, { status: 500 });
			}
			// 记录交易明细
			await supabase.from("transaction_logs").insert({
				user_id: id,
				type: "admin_deduct",
				amount: -deductAmount,
				balance_after: parseFloat(newBalance),
				description: note || `管理员扣款: ${deductAmount.toFixed(2)}元`,
			});
			return NextResponse.json({ success: true, message: `已扣款 ${deductAmount} 元`, newBalance });
		}

		// 管理员修改用户实名信息
		if (action === "update_verify") {
			const { id_card_name, id_card } = body;
			const updateData: Record<string, unknown> = {};
			if (id_card_name !== undefined) updateData.id_card_name = id_card_name;
			if (id_card !== undefined) updateData.id_card = id_card;
			const { error } = await supabase
				.from("users")
				.update(updateData)
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "修改失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "实名信息已修改" });
		}

		// 管理员删除用户实名信息
		if (action === "delete_verify") {
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
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "删除失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "实名信息已删除" });
		}

		// 管理员修改用户收款账户
		if (action === "update_bank") {
			const { bank_account_name, bank_card_number, bank_name } = body;
			const updateData: Record<string, unknown> = {};
			if (bank_account_name !== undefined) updateData.bank_account_name = bank_account_name;
			if (bank_card_number !== undefined) {
				updateData.bank_card_number = bank_card_number;
				
			}
			if (bank_name !== undefined) updateData.bank_name = bank_name;
			if (bank_account_name || bank_card_number || bank_name) {
				updateData.bank_bound = true;
			}
			const { error } = await supabase
				.from("users")
				.update(updateData)
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "修改失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "收款账户已修改" });
		}

		// 管理员删除用户收款账户
		if (action === "delete_bank") {
			const { error } = await supabase
				.from("users")
				.update({
					bank_bound: false,
					bank_account_name: null,
					bank_card_number: null,
					bank_name: null,
				})
				.eq("id", id);
			if (error) {
				return NextResponse.json({ error: "删除失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "收款账户已删除" });
		}

		// 管理员修改信用分
			if (action === "update_credit_score") {
				const { credit_score } = body;
				const score = parseInt(credit_score);
				if (isNaN(score) || score < 0 || score > 1000) {
					return NextResponse.json({ error: "信用分范围0-1000" }, { status: 400 });
				}
				const { error } = await supabase
					.from("users")
					.update({ credit_score: score })
					.eq("id", id);
				if (error) {
					return NextResponse.json({ error: "修改失败" }, { status: 500 });
				}
				return NextResponse.json({ success: true, message: `信用分已更新为 ${score}` });
			}

			return NextResponse.json({ error: "未知操作" }, { status: 400 });
	} catch {
		return NextResponse.json({ error: "服务器错误" }, { status: 500 });
	}
}
