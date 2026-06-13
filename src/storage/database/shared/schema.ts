import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		username: varchar("username", { length: 50 }).notNull().unique(),
		real_name: varchar("real_name", { length: 50 }).notNull(),
		password_hash: varchar("password_hash", { length: 255 }).notNull(),
		is_verified: boolean("is_verified").default(false).notNull(),
		payment_account: varchar("payment_account", { length: 100 }),
		payment_password_hash: varchar("payment_password_hash", { length: 255 }),
		id_card: varchar("id_card", { length: 30 }),
		id_card_name: varchar("id_card_name", { length: 50 }),
		balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("users_username_idx").on(table.username),
	]
);

// 注册码表
export const registrationCodes = pgTable(
	"registration_codes",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		code: varchar("code", { length: 50 }).notNull().unique(),
		is_used: boolean("is_used").default(false).notNull(),
		used_by: varchar("used_by", { length: 36 }).references(() => users.id),
		max_uses: integer("max_uses").default(1).notNull(),
		current_uses: integer("current_uses").default(0).notNull(),
		description: text("description"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("registration_codes_code_idx").on(table.code),
		index("registration_codes_used_by_idx").on(table.used_by),
	]
);

// 抢券场次表
export const grabSessions = pgTable(
	"grab_sessions",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 100 }).notNull(),
		start_time: varchar("start_time", { length: 5 }).notNull(), // "HH:mm"
		end_time: varchar("end_time", { length: 5 }).notNull(),     // "HH:mm"
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("grab_sessions_is_active_idx").on(table.is_active),
	]
);

// 分类表
export const categories = pgTable(
	"categories",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 50 }).notNull(),
		icon: varchar("icon", { length: 255 }),
		sort_order: integer("sort_order").default(0).notNull(),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("categories_sort_order_idx").on(table.sort_order),
	]
);

// 优惠券表
export const coupons = pgTable(
	"coupons",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		price: numeric("price", { precision: 10, scale: 2 }).notNull(),
		total_quantity: integer("total_quantity").notNull(),
		remaining_quantity: integer("remaining_quantity").notNull(),
		session_id: varchar("session_id", { length: 36 }).notNull().references(() => grabSessions.id),
		category_id: varchar("category_id", { length: 36 }).references(() => categories.id),
		image_url: varchar("image_url", { length: 500 }),
		sold_count: integer("sold_count").default(0).notNull(),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("coupons_session_id_idx").on(table.session_id),
		index("coupons_category_id_idx").on(table.category_id),
		index("coupons_is_active_idx").on(table.is_active),
	]
);

// 用户抢到的券
export const userCoupons = pgTable(
	"user_coupons",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		coupon_id: varchar("coupon_id", { length: 36 }).notNull().references(() => coupons.id),
		status: varchar("status", { length: 20 }).notNull().default("pending"), // pending / redemption_pending / redeemed / expired
		payment_amount: numeric("payment_amount", { precision: 10, scale: 2 }).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("user_coupons_user_id_idx").on(table.user_id),
		index("user_coupons_coupon_id_idx").on(table.coupon_id),
		index("user_coupons_status_idx").on(table.status),
	]
);

// 回兑申请表
export const redemptionRequests = pgTable(
	"redemption_requests",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_coupon_id: varchar("user_coupon_id", { length: 36 }).notNull().references(() => userCoupons.id),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		status: varchar("status", { length: 20 }).notNull().default("pending"), // pending / approved / rejected
		admin_note: text("admin_note"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		processed_at: timestamp("processed_at", { withTimezone: true }),
	},
	(table) => [
		index("redemption_requests_user_coupon_id_idx").on(table.user_coupon_id),
		index("redemption_requests_user_id_idx").on(table.user_id),
		index("redemption_requests_status_idx").on(table.status),
	]
);

// 提现记录表
export const withdrawals = pgTable(
	"withdrawals",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		payment_account: varchar("payment_account", { length: 100 }).notNull(),
		status: varchar("status", { length: 20 }).notNull().default("pending"), // pending / approved / rejected
		admin_note: text("admin_note"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		processed_at: timestamp("processed_at", { withTimezone: true }),
	},
	(table) => [
		index("withdrawals_user_id_idx").on(table.user_id),
		index("withdrawals_status_idx").on(table.status),
	]
);

// 交易明细表
export const transactionLogs = pgTable(
	"transaction_logs",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		type: varchar("type", { length: 30 }).notNull(), // grab / redemption_approved / redemption_rejected / deposit / withdraw / admin_deposit / admin_deduct
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		balance_after: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
		description: text("description"),
		related_id: varchar("related_id", { length: 36 }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("transaction_logs_user_id_idx").on(table.user_id),
		index("transaction_logs_type_idx").on(table.type),
	]
);

// 购物车表
export const cartItems = pgTable(
	"cart_items",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		coupon_id: varchar("coupon_id", { length: 36 }).notNull().references(() => coupons.id),
		quantity: integer("quantity").default(1).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("cart_items_user_id_idx").on(table.user_id),
	]
);

// 轮播图表
export const banners = pgTable(
	"banners",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		image_url: varchar("image_url", { length: 500 }).notNull(),
		link_url: varchar("link_url", { length: 500 }),
		title: varchar("title", { length: 100 }),
		sort_order: integer("sort_order").default(0).notNull(),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	}
);

// 邀请码表（独立于注册码，无使用次数限制）
export const inviteCodes = pgTable(
	"invite_codes",
	{
		id: serial().notNull().primaryKey(),
		code: varchar("code", { length: 50 }).notNull().unique(),
		description: text("description"),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		created_by: integer("created_by"),
	},
	(table) => [
		index("invite_codes_code_idx").on(table.code),
	]
);

// 收货地址表
export const addresses = pgTable(
	"addresses",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		name: varchar("name", { length: 50 }).notNull(),
		phone: varchar("phone", { length: 20 }).notNull(),
		province: varchar("province", { length: 50 }),
		city: varchar("city", { length: 50 }),
		district: varchar("district", { length: 50 }),
		detail: varchar("detail", { length: 200 }).notNull(),
		is_default: boolean("is_default").default(false).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("addresses_user_id_idx").on(table.user_id),
	]
);
