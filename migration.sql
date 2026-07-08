-- ============================================
-- 惠抢券 - 数据迁移脚本
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 插入分类数据
INSERT INTO categories (id, name, icon, sort_order, is_active) VALUES
('cat-001', '抖音电商', '🛍️', 1, true),
('cat-002', '抖音商城', '🏪', 2, true),
('cat-003', '抖+商城', '⚡', 3, true);

-- 2. 插入场次数据
INSERT INTO grab_sessions (id, name, start_time, end_time, is_active) VALUES
('session-001', '10:00场', '10:00', '12:00', true),
('session-002', '15:00场', '15:00', '18:00', true),
('session-003', '20:00场', '20:00', '22:00', true),
('session-004', '22:00场', '22:00', '23:59', true);

-- 3. 插入优惠券数据（20张券，分4个场次）
-- 10:00场
INSERT INTO coupons (id, name, description, price, total_quantity, remaining_quantity, session_id, category_id, image_url, sold_count, is_active) VALUES
('coupon-001', '抖音1000元无门槛优惠券', '抖音电商官方优惠券', 100000, 50, 50, 'session-001', 'cat-001', '/images/coupons/product_01.png', 0, true),
('coupon-002', '抖音2000元无门槛优惠券', '抖音电商官方优惠券', 200000, 50, 50, 'session-001', 'cat-001', '/images/coupons/product_02.png', 0, true),
('coupon-003', '抖音3000元无门槛优惠券', '抖音电商官方优惠券', 300000, 50, 50, 'session-001', 'cat-001', '/images/coupons/product_03.png', 0, true),
('coupon-004', '抖音5000元无门槛优惠券', '抖音电商官方优惠券', 500000, 50, 50, 'session-001', 'cat-001', '/images/coupons/product_04.png', 0, true),
('coupon-005', '抖音10000元无门槛优惠券', '抖音电商官方优惠券', 1000000, 50, 50, 'session-001', 'cat-001', '/images/coupons/product_05.png', 0, true),

-- 15:00场
('coupon-006', '抖音20000元无门槛优惠券', '抖音电商官方优惠券', 2000000, 50, 50, 'session-002', 'cat-002', '/images/coupons/product_06.png', 0, true),
('coupon-007', '抖音30000元无门槛优惠券', '抖音电商官方优惠券', 3000000, 50, 50, 'session-002', 'cat-002', '/images/coupons/product_07.png', 0, true),
('coupon-008', '抖音50000元无门槛优惠券', '抖音电商官方优惠券', 5000000, 50, 50, 'session-002', 'cat-002', '/images/coupons/product_08.png', 0, true),
('coupon-009', '抖音100000元无门槛优惠券', '抖音电商官方优惠券', 10000000, 50, 50, 'session-002', 'cat-002', '/images/coupons/product_09.png', 0, true),
('coupon-010', '抖音200000元无门槛优惠券', '抖音电商官方优惠券', 20000000, 50, 50, 'session-002', 'cat-002', '/images/coupons/product_10.png', 0, true),

-- 20:00场
('coupon-011', '抖音300000元无门槛优惠券', '抖音电商官方优惠券', 30000000, 50, 50, 'session-003', 'cat-003', '/images/coupons/product_11.png', 0, true),
('coupon-012', '抖音500000元无门槛优惠券', '抖音电商官方优惠券', 50000000, 50, 50, 'session-003', 'cat-003', '/images/coupons/product_12.png', 0, true),
('coupon-013', '抖音1000000元无门槛优惠券', '抖音电商官方优惠券', 100000000, 50, 50, 'session-003', 'cat-003', '/images/coupons/product_13.png', 0, true),
('coupon-014', '抖音2000000元无门槛优惠券', '抖音电商官方优惠券', 200000000, 50, 50, 'session-003', 'cat-003', '/images/coupons/product_14.png', 0, true),
('coupon-015', '抖音3000000元无门槛优惠券', '抖音电商官方优惠券', 300000000, 50, 50, 'session-003', 'cat-003', '/images/coupons/product_15.png', 0, true),

-- 22:00场
('coupon-016', '抖音5000000元无门槛优惠券', '抖音电商官方优惠券', 500000000, 50, 50, 'session-004', 'cat-001', '/images/coupons/product_16.png', 0, true),
('coupon-017', '抖音10000000元无门槛优惠券', '抖音电商官方优惠券', 1000000000, 50, 50, 'session-004', 'cat-001', '/images/coupons/product_17.png', 0, true),
('coupon-018', '抖音20000000元无门槛优惠券', '抖音电商官方优惠券', 2000000000, 50, 50, 'session-004', 'cat-002', '/images/coupons/product_18.png', 0, true),
('coupon-019', '抖音50000000元无门槛优惠券', '抖音电商官方优惠券', 5000000000, 50, 50, 'session-004', 'cat-002', '/images/coupons/product_19.png', 0, true),
('coupon-020', '抖音100000000元无门槛优惠券', '抖音电商官方优惠券', 10000000000, 50, 50, 'session-004', 'cat-003', '/images/coupons/product_20.png', 0, true);

-- 4. 插入轮播图数据
INSERT INTO banners (id, image_url, link_url, title, sort_order, is_active) VALUES
('banner-001', '/images/banners/banner1.jpg', '/coupon/coupon-001', '抖音电商入驻全流程', 1, true),
('banner-002', '/images/banners/banner2.jpg', '/coupon/coupon-006', '九大商家扶持政策', 2, true),
('banner-003', '/images/banners/banner3.jpg', '/coupon/coupon-011', '货架运营必修课', 3, true);

-- 5. 插入注册码数据
INSERT INTO registration_codes (id, code, is_used, max_uses, current_uses, description) VALUES
('reg-001', 'DY2024', false, 100, 0, '通用注册码'),
('reg-002', 'VIP888', false, 50, 0, 'VIP专属注册码'),
('reg-003', 'NEWUSER', false, 200, 0, '新用户注册码');

-- 6. 插入邀请码数据
INSERT INTO invite_codes (id, code, description, is_active) VALUES
(1, 'DY2024', '抖音电商专属邀请码', true),
(2, 'VIP888', 'VIP专属通道', true),
(3, 'NEWUSER', '新用户邀请码', true);

-- 7. 插入系统设置
INSERT INTO system_settings (key, value) VALUES
('company_name', '惠抢券'),
('invite_code_required', 'true'),
('customer_service_url', 'https://example.com/support');

-- 完成提示
SELECT '数据迁移完成！' as result,
       (SELECT count(*) FROM categories) as categories_count,
       (SELECT count(*) FROM grab_sessions) as sessions_count,
       (SELECT count(*) FROM coupons) as coupons_count,
       (SELECT count(*) FROM banners) as banners_count,
       (SELECT count(*) FROM registration_codes) as reg_codes_count,
       (SELECT count(*) FROM invite_codes) as invite_codes_count,
       (SELECT count(*) FROM system_settings) as settings_count;
