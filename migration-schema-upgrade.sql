-- ============================================
-- 惠抢券 - 线上数据库结构升级脚本（幂等，可重复执行）
-- 适用场景：线上（Vercel/Supabase）提示表不存在、字段缺失时运行
-- 1. 打开你的 Supabase 项目 → SQL Editor
-- 2. 粘贴本脚本全部内容 → Run
-- 3. 执行成功后重新登录/刷新后台即可
-- 说明：所有语句均为 IF NOT EXISTS，重复执行安全，不影响已有数据
-- ============================================

-- ---------- 1. red_packets 红包表（待领取制） ----------
CREATE TABLE IF NOT EXISTS public.red_packets (
  id varchar DEFAULT gen_random_uuid() NOT NULL,
  user_id varchar NOT NULL,
  amount numeric NOT NULL,
  note text,
  status varchar DEFAULT 'pending'::varchar NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  claimed_at timestamptz,
  CONSTRAINT red_packets_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS red_packets_user_id_idx ON public.red_packets USING btree (user_id);
CREATE INDEX IF NOT EXISTS red_packets_status_idx ON public.red_packets USING btree (status);

-- ---------- 2. admin_notifications 后台强通知表 ----------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id varchar DEFAULT gen_random_uuid() NOT NULL,
  type varchar NOT NULL,
  title varchar NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT admin_notifications_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS admin_notifications_type_idx ON public.admin_notifications USING btree (type);
CREATE INDEX IF NOT EXISTS admin_notifications_is_read_idx ON public.admin_notifications USING btree (is_read);

-- ---------- 3. announcements 平台公告表 ----------
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title varchar NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);

-- ---------- 4. article_categories 文章分类表 ----------
CREATE TABLE IF NOT EXISTS public.article_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name varchar NOT NULL,
  icon varchar,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT article_categories_pkey PRIMARY KEY (id)
);

-- ---------- 5. articles 文章表（学习中心/公告详情） ----------
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title varchar NOT NULL,
  content text NOT NULL,
  category_id uuid,
  is_published boolean DEFAULT true,
  is_announcement boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  image_url text,
  view_count integer DEFAULT 0,
  CONSTRAINT articles_pkey PRIMARY KEY (id)
);

-- ---------- 6. footer_links 底部链接表 ----------
CREATE TABLE IF NOT EXISTS public.footer_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  section varchar NOT NULL,
  label varchar NOT NULL,
  url text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT footer_links_pkey PRIMARY KEY (id)
);

-- ---------- 7. invite_codes 邀请码表 ----------
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id bigserial NOT NULL,
  code text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by bigint,
  CONSTRAINT invite_codes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS invite_codes_code_idx ON public.invite_codes USING btree (code);

-- ---------- 8. users 表补充列（如已存在自动跳过） ----------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_card_front varchar;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_card_back varchar;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verify_status varchar DEFAULT 'unverified';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verify_rejected_reason text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account_name varchar;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_card_number varchar;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name varchar;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_bound boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_password_set boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credit_score integer DEFAULT 500;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_frozen boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS funds_frozen boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS register_ip varchar;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_ip varchar;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role varchar DEFAULT 'user';

-- ---------- 9. transaction_logs 补充列 ----------
ALTER TABLE public.transaction_logs ADD COLUMN IF NOT EXISTS transaction_no varchar;
ALTER TABLE public.transaction_logs ADD COLUMN IF NOT EXISTS reference_type varchar;
ALTER TABLE public.transaction_logs ADD COLUMN IF NOT EXISTS reference_id uuid;

-- ---------- 10. withdrawals 提现记录表（含 payment_account 修复） ----------
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id varchar DEFAULT gen_random_uuid() NOT NULL,
  user_id varchar NOT NULL,
  amount numeric NOT NULL,
  payment_account varchar,
  status varchar DEFAULT 'pending'::varchar NOT NULL,
  admin_note text,
  created_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz,
  CONSTRAINT withdrawals_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS withdrawals_user_id_idx ON public.withdrawals USING btree (user_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON public.withdrawals USING btree (status);

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS payment_account varchar;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS bank_card_number varchar;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS bank_name varchar;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS bank_account_name varchar;

-- ---------- 11. user_coupons 补充列 ----------
ALTER TABLE public.user_coupons ADD COLUMN IF NOT EXISTS verification_code varchar;
ALTER TABLE public.user_coupons ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- ---------- 完成提示 ----------
SELECT '数据库结构升级完成！' AS result,
       (SELECT to_regclass('public.red_packets')) AS red_packets_ok,
       (SELECT to_regclass('public.admin_notifications')) AS admin_notifications_ok,
       (SELECT to_regclass('public.withdrawals')) AS withdrawals_ok,
       (SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='withdrawals' AND column_name='payment_account'
        LIMIT 1) AS payment_account_ok;