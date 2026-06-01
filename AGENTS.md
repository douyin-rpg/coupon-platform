# AGENTS.md

## 项目概览

优惠券抢购平台（惠抢券），对标抖音电商商城风格，支持限时抢券、快捷回兑（+5%奖励）、提现、交易明细、管理后台配置。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT (jose) + bcryptjs

## 目录结构

```
├── src/
│   ├── app/                         # 页面路由
│   │   ├── page.tsx                 # 首页 - 优惠券抢购商城
│   │   ├── login/page.tsx           # 用户登录
│   │   ├── register/page.tsx        # 用户注册
│   │   ├── coupon/[id]/page.tsx     # 商品详情页
│   │   ├── cart/page.tsx            # 购物车
│   │   ├── profile/(layout)/        # 个人中心（共享侧边栏布局）
│   │   │   ├── page.tsx             # 个人中心概览
│   │   │   ├── order/               # 我的订单
│   │   │   ├── back/                # 快捷回兑
│   │   │   ├── finance/             # 财务中心
│   │   │   │   ├── deposit/         # 提现记录
│   │   │   │   ├── withdraw/        # 申请提现
│   │   │   │   └── transactions/    # 资金明细
│   │   │   └── settings/            # 用户设置
│   │   │       ├── info/            # 个人信息
│   │   │       ├── verify/          # 实名认证
│   │   │       ├── password/        # 修改密码
│   │   │       ├── bank/            # 收款账户
│   │   │       └── address/         # 收货地址
│   │   ├── admin/                   # 管理后台
│   │   │   ├── page.tsx             # 管理员登录
│   │   │   ├── sessions/            # 场次管理
│   │   │   ├── coupons/             # 优惠券管理
│   │   │   ├── codes/               # 注册码管理
│   │   │   ├── users/               # 用户管理
│   │   │   ├── redemptions/         # 回兑审核
│   │   │   ├── withdrawals/         # 提现审核
│   │   │   ├── categories/          # 分类管理
│   │   │   └── banners/             # 轮播图管理
│   │   └── api/                     # API 路由
│   ├── contexts/
│   │   └── auth-context.tsx         # 全局认证上下文
│   ├── lib/
│   │   ├── auth.ts                  # JWT 认证工具
│   │   └── utils.ts                 # 通用工具函数
│   └── storage/database/
│       ├── supabase-client.ts       # Supabase 客户端
│       └── shared/schema.ts         # 数据库表结构 (Drizzle)
├── DESIGN.md                        # 设计规范
└── AGENTS.md                        # 项目文档
```

## 数据库表（11张）

- users, registration_codes, grab_sessions, coupons, user_coupons, redemption_requests, withdrawals
- transaction_logs（交易明细）, categories（分类）, cart_items（购物车）, banners（轮播图）, addresses（收货地址）

## 核心业务流程

1. **注册**: 用户名+真实姓名+密码+注册码 → 注册码验证 → 创建账户
2. **实名认证**: 填写姓名+身份证 → 绑定收款账号+设置支付密码 → 认证完成可抢券
3. **抢券**: 选择场次内的券 → 输入支付密码 → 余额扣减 → 券状态"待使用"
4. **回兑**: 批量选择待使用的券 → 输入支付密码 → 券状态"待回兑" → 管理员审核
5. **审核结果**: 通过→返还金额+5%; 拒绝→仅返还金额
6. **提现**: 申请提现(输入支付密码) → 余额预扣 → 管理员审核
7. **交易明细**: 抢券/回兑/提现/充值/扣款全流程记录

## 响应式适配

- 桌面端：左侧边栏导航 + 右侧内容区（个人中心/管理端）
- 手机端：顶部水平Tab + 底部导航栏（首页/我的）
- 首页：桌面端多列网格 + 手机端2列瀑布流

## 包管理规范

**仅允许使用 pnpm**，严禁 npm 或 yarn。

## 开发规范

- 字段名统一 snake_case（Supabase SDK）
- 所有 API 操作必须检查 `{ data, error }` 并 throw
- 禁止隐式 any
- 禁止 Mock 数据，所有接口真实调用
