-- ============================================
-- 生产环境数据同步脚本
-- 在 Supabase SQL Editor 中运行此脚本
-- 会清空并重新写入：分类、场次、优惠券、轮播图、注册码、邀请码、系统设置
-- ============================================

-- 1. 清空依赖表（按外键顺序）
DELETE FROM coupons;
DELETE FROM user_coupons;
DELETE FROM redemption_requests;
DELETE FROM banners;
DELETE FROM grab_sessions;
DELETE FROM categories;
DELETE FROM invite_codes;
DELETE FROM registration_codes;
DELETE FROM system_settings;

-- 2. 插入分类
INSERT INTO categories (id, name, icon, sort_order, is_active) VALUES
  (gen_random_uuid(), '官方优惠券', '🎫', 1, true),
  (gen_random_uuid(), '优惠券说明', '📦', 1, true),
  (gen_random_uuid(), '主播优惠券', '🎤', 2, true),
  (gen_random_uuid(), '商品优惠券', '🛍️', 3, true),
  (gen_random_uuid(), '黄金实物', '🥇', 4, true);

-- 3. 插入场次
INSERT INTO grab_sessions (id, name, start_time, end_time, is_active) VALUES
  (gen_random_uuid(), '上午场', '10:00', '11:00', true),
  (gen_random_uuid(), '下午场', '15:30', '16:30', true),
  (gen_random_uuid(), '晚上场', '19:00', '20:00', true);

-- 4. 插入优惠券（关联分类和场次）
-- 官方优惠券 → 上午场
INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音1000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 100000, 100000, 500, 498,
  (SELECT id FROM grab_sessions WHERE name = '上午场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 2;

INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音5000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 500000, 500000, 200, 194,
  (SELECT id FROM grab_sessions WHERE name = '上午场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 6;

INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音10000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 1000000, 1000000, 100, 97,
  (SELECT id FROM grab_sessions WHERE name = '上午场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 3;

-- 官方优惠券 → 下午场
INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音30000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 3000000, 3000000, 50, 48,
  (SELECT id FROM grab_sessions WHERE name = '下午场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 2;

INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音50000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 5000000, 5000000, 30, 28,
  (SELECT id FROM grab_sessions WHERE name = '下午场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 2;

INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音100000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 10000000, 10000000, 20, 18,
  (SELECT id FROM grab_sessions WHERE name = '下午场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 2;

INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音200000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 20000000, 20000000, 10, 9,
  (SELECT id FROM grab_sessions WHERE name = '下午场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 1;

-- 官方优惠券 → 晚上场
INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音300000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 30000000, 30000000, 10, 9,
  (SELECT id FROM grab_sessions WHERE name = '晚上场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 1;

INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音500000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 50000000, 50000000, 5, 4,
  (SELECT id FROM grab_sessions WHERE name = '晚上场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 1;

INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '抖音1000000元无门槛优惠券', '成功抢购后可至您的商家工作台进行拆分上架', 100000000, 100000000, 5, 4,
  (SELECT id FROM grab_sessions WHERE name = '晚上场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '官方优惠券' LIMIT 1),
  '/images/coupons/product_01.png', true, 1;

-- 黄金实物 → 晚上场
INSERT INTO coupons (name, description, price, original_price, total_quantity, remaining_quantity, session_id, category_id, image_url, is_active, sold_count)
SELECT '黄金百分百', '黄金实物', 1000000, 1000000, 9999, 9999,
  (SELECT id FROM grab_sessions WHERE name = '晚上场' LIMIT 1),
  (SELECT id FROM categories WHERE name = '黄金实物' LIMIT 1),
  '/images/coupons/product_01.png', true, 0;

-- 5. 插入轮播图
INSERT INTO banners (id, title, image_url, sort_order, is_active) VALUES
  (gen_random_uuid(), '抖音电商入驻全流程', '/images/banners/banner1.jpg', 1, true),
  (gen_random_uuid(), '九大商家扶持政策', '/images/banners/banner2.jpg', 2, true),
  (gen_random_uuid(), '货架运营必修课', '/images/banners/banner3.jpg', 3, true);

-- 6. 插入注册码
INSERT INTO registration_codes (code, max_uses, used_count, is_active) VALUES
  ('REG2024', 100, 0, true),
  ('VIP888', 50, 0, true),
  ('NEWUSER', 200, 0, true);

-- 7. 插入邀请码
INSERT INTO invite_codes (code, is_active) VALUES
  ('DY2024', true),
  ('VIP888', true),
  ('NEWUSER', true);

-- 8. 插入系统设置
INSERT INTO system_settings (key, value) VALUES
  ('company_info', '上海格物致品网络科技有限公司'),
  ('customer_service_text', '在线客服'),
  ('customer_service_url', 'https://example.com/customer-service'),
  ('invite_code_required', 'true');

-- 验证
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'grab_sessions', COUNT(*) FROM grab_sessions
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'registration_codes', COUNT(*) FROM registration_codes
UNION ALL
SELECT 'invite_codes', COUNT(*) FROM invite_codes
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings;
