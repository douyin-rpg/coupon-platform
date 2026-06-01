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
		image_url: varchar("image_url", { length: 500 }),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("coupons_session_id_idx").on(table.session_id),
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
