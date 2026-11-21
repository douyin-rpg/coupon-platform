import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const userId = await verifyAuth(request);
		if (!userId) {
			return NextResponse.json({ error: "未登录" }, { status: 401 });
		}

		const body = await request.json();
		const { amount, paymentPassword } = body;

		if (!amount || !paymentPassword) {
			return NextResponse.json({ error: "请填写提现金额和支付密码" }, { status: 400 });
		}

		const numAmount = parseFloat(amount);
		if (isNaN(numAmount) || numAmount <= 0) {
			return NextResponse.json({ error: "提现金额必须大于0" }, { status: 400 });
		}

		const supabase = getSupabaseClient();

		// 获取用户信息
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("id, balance, payment_password_hash, bank_card_number, bank_name, bank_account_name, payment_account, bank_bound, verify_status, funds_frozen")
			.eq("id", userId)
			.single();

		if (userError || !user) {
			return NextResponse.json({ error: "用户不存在" }, { status: 404 });
		}

		if (user.verify_status !== "verified") {
			return NextResponse.json({ error: "请先完成实名认证" }, { status: 400 });
		}

		if (user.funds_frozen) {
			return NextResponse.json({ error: "您的资金已被冻结，无法提现" }, { status: 400 });
		}

		if (!user.bank_bound) {
			return NextResponse.json({ error: "请先绑定收款账号" }, { status: 400 });
		}

		if (!user.payment_password_hash) {
			return NextResponse.json({ error: "请先设置支付密码" }, { status: 400 });
		}

		// 验证支付密码
		const bcrypt = require("bcryptjs");
		const validPassword = await bcrypt.compare(paymentPassword, user.payment_password_hash);
		if (!validPassword) {
			return NextResponse.json({ error: "支付密码错误" }, { status: 400 });
		}

		const currentBalance = parseFloat(user.balance);
		if (numAmount > currentBalance) {
			return NextResponse.json({ error: "余额不足" }, { status: 400 });
		}

		// 原子扣减余额（使用gte条件防止并发超额扣减）
		const newBalance = (currentBalance - numAmount).toFixed(2);
		const { error: updateError, count: updateCount } = await supabase
			.from("users")
			.update({ balance: newBalance })
			.eq("id", userId)
			.gte("balance", numAmount);

		if (updateError) {
			return NextResponse.json({ error: "余额扣减失败" }, { status: 500 });
		}
		if (updateCount === 0) {
			return NextResponse.json({ error: "余额不足" }, { status: 400 });
		}

		// 创建提现记录（payment_account 为 NOT NULL 字段，必须提供，取绑定收款账户信息）
		const paymentAccount =
			user.payment_account ||
			[user.bank_account_name, user.bank_name, user.bank_card_number].filter(Boolean).join(" ") ||
			"银行卡提现";
		const { data: withdrawal, error: wError } = await supabase
			.from("withdrawals")
			.insert({
				user_id: userId,
				amount: numAmount.toFixed(2),
				payment_account: paymentAccount,
				bank_card_number: user.bank_card_number, bank_name: user.bank_name, bank_account_name: user.bank_account_name,
				status: "pending",
			})
			.select()
			.single();

		if (wError) {
			// 回滚余额
			await supabase.from("users").update({ balance: user.balance }).eq("id", userId);

			// 识别线上库常见问题（表/字段缺失、schema cache 未刷新），给出可操作提示
			const raw = `${wError.message || ""} ${wError.details || ""}`;
			if (/schema cache|could not find|does not exist|relation/.test(raw)) {
				return NextResponse.json({
					error: "提现申请失败：线上数据库表结构不完整，请先执行升级 SQL 并刷新 schema（见 README「线上数据库升级」）",
				}, { status: 500 });
			}
			if (/column.*payment_account|payment_account.*violates|null value/.test(raw)) {
				return NextResponse.json({
					error: "提现申请失败：提现记录缺少收款账户字段，已自动修复，请重试",
				}, { status: 500 });
			}
			return NextResponse.json({ error: "提现申请失败" }, { status: 500 });
		}

		// 写入后台通知（强通知）
		await supabase.from("admin_notifications").insert({
			type: "withdrawal",
			title: "新提现申请",
			content: `用户申请提现 ¥${numAmount.toFixed(2)}，等待审核`,
			is_read: false,
		});

		return NextResponse.json({ success: true, withdrawal });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "提现失败";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
