import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAdminAuth } from "@/lib/auth";

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
			.select("id, username, real_name, is_verified, payment_account, balance, payment_password_hash, created_at")
			.eq("id", id)
			.single();

		if (error || !user) {
			return NextResponse.json({ error: "用户不存在" }, { status: 404 });
		}

		// 不返回密码hash
		const { payment_password_hash, ...safeUser } = user;

		return NextResponse.json({ user: safeUser });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "获取用户详情失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// 修改用户信息（重置密码、充值、扣款）
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
		const { action, newPassword, newPaymentPassword, amount, note } = body;

		const supabase = getSupabaseClient();

		// 验证用户存在
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("id, balance")
			.eq("id", id)
			.single();

		if (userError || !user) {
			return NextResponse.json({ error: "用户不存在" }, { status: 404 });
		}

		const bcrypt = require("bcryptjs");

		if (action === "reset_password" && newPassword) {
			const hash = await bcrypt.hash(newPassword, 10);
			const { error } = await supabase
				.from("users")
				.update({ password_hash: hash })
				.eq("id", id);

			if (error) {
				return NextResponse.json({ error: "重置密码失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "登录密码已重置" });
		}

		if (action === "reset_payment_password" && newPaymentPassword) {
			const hash = await bcrypt.hash(newPaymentPassword, 10);
			const { error } = await supabase
				.from("users")
				.update({ payment_password_hash: hash })
				.eq("id", id);

			if (error) {
				return NextResponse.json({ error: "重置支付密码失败" }, { status: 500 });
			}
			return NextResponse.json({ success: true, message: "支付密码已重置" });
		}

		if (action === "add_balance" && amount) {
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

		if (action === "deduct_balance" && amount) {
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

		return NextResponse.json({ error: "无效的操作" }, { status: 400 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "操作失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
