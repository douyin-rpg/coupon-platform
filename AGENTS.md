# AGENTS.md

## 项目概览

优惠券抢购平台（惠抢券），支持限时抢券、回兑赚5%奖励、提现、管理后台配置。

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
├── public/                          # 静态资源
├── src/
│   ├── app/                         # 页面路由
│   │   ├── page.tsx                 # 首页 - 优惠券抢购
│   │   ├── login/page.tsx           # 用户登录
│   │   ├── register/page.tsx        # 用户注册
│   │   ├── profile/page.tsx         # 个人中心（含提现）
│   │   ├── admin/                   # 管理后台
│   │   │   ├── page.tsx             # 管理员登录
│   │   │   ├── sessions/            # 场次管理
│   │   │   ├── coupons/             # 优惠券管理
│   │   │   ├── codes/               # 注册码管理
│   │   │   ├── users/               # 用户管理
│   │   │   ├── redemptions/         # 回兑审核
│   │   │   └── withdrawals/         # 提现审核
│   │   └── api/                     # API 路由
│   │       ├── auth/                # 认证 API
│   │       ├── admin/               # 管理 API（含 users, withdrawals）
│   │       ├── coupons/             # 优惠券 API
│   │       ├── sessions/            # 场次 API
│   │       ├── redemption/          # 回兑 API
│   │       └── user/                # 用户 API（含 withdraw, withdrawals）
│   ├── components/ui/               # Shadcn UI 组件库
│   ├── lib/
│   │   ├── auth.ts                  # JWT 认证工具（verifyAuth, verifyAdminAuth）
│   │   └── utils.ts                 # 通用工具函数
│   └── storage/database/            # 数据库
│       ├── supabase-client.ts       # Supabase 客户端
│       └── shared/schema.ts         # 数据库表结构 (Drizzle)
├── DESIGN.md                        # 设计规范
└── .coze                            # 部署配置
```

## 核心业务逻辑

1. **注册流程**: 用户填写用户名+真实姓名+密码+注册码 → 注册码验证通过 → 创建账户
2. **实名认证**: 绑定收款账号 + 设置支付密码 → 认证完成后可查看余额和抢券
3. **抢券流程**: 选择场次内的券 → 输入支付密码 → 余额扣减 → 券状态变为"待使用"
4. **回兑流程**: 用户申请回兑(输入支付密码) → 券状态变为"待回兑" → 管理员审核
5. **审核结果**: 通过 → 返还支付金额+5%; 拒绝 → 仅返还支付金额
6. **提现流程**: 用户申请提现(输入支付密码) → 余额预扣 → 管理员审核 → 通过则完成/拒绝则返还
7. **用户管理**: 管理员可查看用户信息、重置密码/支付密码、充值/扣款

## 数据库表（7张）

- users, registration_codes, grab_sessions, coupons, user_coupons, redemption_requests, withdrawals

## 包管理规范

**仅允许使用 pnpm**，严禁 npm 或 yarn。

## 开发规范

- 字段名统一 snake_case（Supabase SDK）
- 所有 API 操作必须检查 `{ data, error }` 并 throw
- 禁止隐式 any
- 禁止 Mock 数据，所有接口真实调用
