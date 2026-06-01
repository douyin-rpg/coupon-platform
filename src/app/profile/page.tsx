"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  realName: string;
  isVerified: boolean;
  balance: number;
  paymentAccount: string | null;
  idCard: string | null;
  idCardName: string | null;
  createdAt: string;
}

interface UserCoupon {
  id: string;
  coupon_id: string;
  status: string;
  grabbed_at: string;
  coupons: {
    name: string;
    price: number;
    original_price: number;
    image_url: string | null;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  payment_account: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [couponFilter, setCouponFilter] = useState("pending_use");

  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPaymentAccountModal, setShowPaymentAccountModal] = useState(false);
  const [showPaymentPasswordModal, setShowPaymentPasswordModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Form states
  const [idCard, setIdCard] = useState("");
  const [idCardName, setIdCardName] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentPassword, setPaymentPassword] = useState("");
  const [confirmPaymentPassword, setConfirmPaymentPassword] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const loadUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadCoupons = useCallback(async () => {
    const res = await fetch("/api/user/coupons");
    if (res.ok) {
      const data = await res.json();
      setUserCoupons(data.coupons || []);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    const res = await fetch("/api/user/transactions");
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions || []);
    }
  }, []);

  const loadWithdrawals = useCallback(async () => {
    const res = await fetch("/api/user/withdrawals");
    if (res.ok) {
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (activeTab === "coupons") loadCoupons();
    if (activeTab === "transactions") loadTransactions();
    if (activeTab === "withdrawals") loadWithdrawals();
  }, [activeTab, loadCoupons, loadTransactions, loadWithdrawals]);

  const handleVerify = async () => {
    if (!idCard || !idCardName) { setMsg("请填写完整信息"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idCard, idCardName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("实名认证成功");
        setShowVerifyModal(false);
        loadUser();
      } else {
        setMsg(data.error || "认证失败");
      }
    } catch {
      setMsg("网络错误");
    }
    setLoading(false);
  };

  const handlePaymentAccount = async () => {
    if (!paymentAccount) { setMsg("请填写收款账号"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/payment-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAccount }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("绑定成功");
        setShowPaymentAccountModal(false);
        loadUser();
      } else {
        setMsg(data.error || "绑定失败");
      }
    } catch {
      setMsg("网络错误");
    }
    setLoading(false);
  };

  const handlePaymentPassword = async () => {
    if (!paymentPassword || paymentPassword.length < 6) { setMsg("支付密码至少6位"); return; }
    if (paymentPassword !== confirmPaymentPassword) { setMsg("两次密码不一致"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/payment-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("设置成功");
        setShowPaymentPasswordModal(false);
        loadUser();
      } else {
        setMsg(data.error || "设置失败");
      }
    } catch {
      setMsg("网络错误");
    }
    setLoading(false);
  };

  const handleRedeem = async (userCouponId: string) => {
    const pwd = prompt("请输入支付密码确认回兑");
    if (!pwd) return;
    try {
      const res = await fetch("/api/redemption/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCouponId, paymentPassword: pwd }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("回兑申请已提交");
        loadCoupons();
      } else {
        setMsg(data.error || "回兑失败");
      }
    } catch {
      setMsg("网络错误");
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) { setMsg("请输入有效金额"); return; }
    if (!withdrawPassword) { setMsg("请输入支付密码"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, paymentPassword: withdrawPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("提现申请已提交");
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawPassword("");
        loadUser();
        loadWithdrawals();
      } else {
        setMsg(data.error || "提现失败");
      }
    } catch {
      setMsg("网络错误");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const getCouponStatusText = (status: string) => {
    switch (status) {
      case "pending_use": return "待使用";
      case "pending_redemption": return "待回兑";
      case "redeemed": return "已回兑";
      case "expired": return "已过期";
      default: return status;
    }
  };

  const getCouponStatusColor = (status: string) => {
    switch (status) {
      case "pending_use": return "bg-blue-100 text-blue-700";
      case "pending_redemption": return "bg-amber-100 text-amber-700";
      case "redeemed": return "bg-green-100 text-green-700";
      case "expired": return "bg-gray-100 text-gray-500";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case "grab": return "抢券扣款";
      case "redemption_reward": return "回兑奖励";
      case "redemption_return": return "回兑返还";
      case "withdraw": return "提现";
      case "withdraw_return": return "提现退回";
      case "withdraw_success": return "提现成功";
      case "admin_deposit": return "管理员充值";
      case "admin_deduct": return "管理员扣款";
      default: return type;
    }
  };

  const menuItems = [
    { id: "overview", label: "个人总览", icon: "🏠" },
    { id: "coupons", label: "我的券包", icon: "🎫" },
    { id: "transactions", label: "资金明细", icon: "💰" },
    { id: "withdrawals", label: "提现记录", icon: "💳" },
    { id: "settings", label: "账户设置", icon: "⚙️" },
  ];

  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* 顶部渐变头部 */}
      <div className="bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white px-4 pt-12 pb-16 relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                {user.username[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold">{user.username}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {user.isVerified ? (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">已认证</span>
                  ) : (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-yellow-200">未认证</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-white/70 hover:text-white text-sm">退出</button>
          </div>
        </div>
      </div>

      {/* 钱包卡片 */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">账户余额</div>
              {user.isVerified ? (
                <div className="text-2xl font-bold text-[#1A1A1A] mt-1">¥{user.balance.toFixed(2)}</div>
              ) : (
                <div className="text-sm text-gray-400 mt-1">未完成认证</div>
              )}
            </div>
            <div className="flex gap-2">
              {user.isVerified && (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white text-sm font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  提现
                </button>
              )}
            </div>
          </div>
          {!user.isVerified && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700">完成实名认证后可查看余额、抢券和提现</p>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="mt-2 text-xs text-[#FE2C55] font-bold"
              >
                立即认证 →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0 transition-colors ${
                activeTab === item.id ? "bg-[#FFF0F0]" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className={`text-sm font-medium ${activeTab === item.id ? "text-[#FE2C55]" : "text-gray-700"}`}>
                  {item.label}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-5xl mx-auto px-4 mt-4 pb-24">
        {/* 消息 */}
        {msg && (
          <div className="mb-3 p-3 rounded-xl bg-white border border-[#FE2C55]/20 text-sm text-center">
            <span className={msg.includes("成功") || msg.includes("已提交") ? "text-green-600" : "text-[#FE2C55]"}>{msg}</span>
            <button onClick={() => setMsg("")} className="ml-2 text-gray-400">x</button>
          </div>
        )}

        {/* 个人总览 */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* 快捷功能 */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-[#1A1A1A] mb-4">快捷功能</h3>
              <div className="grid grid-cols-4 gap-3">
                <button onClick={() => setActiveTab("coupons")} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F0] flex items-center justify-center text-lg">🎫</div>
                  <span className="text-xs text-gray-600">我的券</span>
                </button>
                <button onClick={() => setActiveTab("transactions")} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">💰</div>
                  <span className="text-xs text-gray-600">资金明细</span>
                </button>
                <button onClick={() => setActiveTab("withdrawals")} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg">💳</div>
                  <span className="text-xs text-gray-600">提现记录</span>
                </button>
                <button onClick={() => setActiveTab("settings")} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">⚙️</div>
                  <span className="text-xs text-gray-600">设置</span>
                </button>
              </div>
            </div>

            {/* 认证状态 */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-[#1A1A1A] mb-3">认证信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">实名认证</span>
                  {user.isVerified ? (
                    <span className="text-sm text-green-600">已认证</span>
                  ) : (
                    <button onClick={() => setShowVerifyModal(true)} className="text-sm text-[#FE2C55] font-medium">去认证</button>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">收款账号</span>
                  {user.paymentAccount ? (
                    <span className="text-sm text-gray-800">{user.paymentAccount}</span>
                  ) : (
                    <button onClick={() => setShowPaymentAccountModal(true)} className="text-sm text-[#FE2C55] font-medium">去绑定</button>
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">支付密码</span>
                  <button onClick={() => setShowPaymentPasswordModal(true)} className="text-sm text-[#FE2C55] font-medium">
                    设置/修改
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 我的券包 */}
        {activeTab === "coupons" && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <div className="flex gap-2">
                {[
                  { id: "pending_use", label: "待使用" },
                  { id: "pending_redemption", label: "待回兑" },
                  { id: "redeemed", label: "已回兑" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCouponFilter(tab.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      couponFilter === tab.id ? "bg-[#FE2C55] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {userCoupons.filter((c) => c.status === couponFilter).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">📭</div>
                <p>暂无券</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userCoupons.filter((c) => c.status === couponFilter).map((uc) => (
                  <div key={uc.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex">
                      <div className="w-24 bg-gradient-to-b from-[#FE2C55] to-[#FF6B35] flex flex-col items-center justify-center text-white p-3">
                        <span className="text-lg font-bold">¥{uc.coupons.price}</span>
                        <span className="text-[10px] opacity-80">券面价</span>
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-[#1A1A1A]">{uc.coupons.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${getCouponStatusColor(uc.status)}`}>
                              {getCouponStatusText(uc.status)}
                            </span>
                            <span className="text-[10px] text-gray-400">{new Date(uc.grabbed_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {uc.status === "pending_use" && (
                          <button
                            onClick={() => handleRedeem(uc.id)}
                            className="mt-2 self-end px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                          >
                            申请回兑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 资金明细 */}
        {activeTab === "transactions" && (
          <div>
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">📊</div>
                <p>暂无记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#1A1A1A]">{getTransactionTypeText(tx.type)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{tx.description}</div>
                      <div className="text-[10px] text-gray-300 mt-0.5">{new Date(tx.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${tx.amount >= 0 ? "text-green-600" : "text-[#FE2C55]"}`}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400">余额: ¥{tx.balance_after.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 提现记录 */}
        {activeTab === "withdrawals" && (
          <div>
            {withdrawals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">💳</div>
                <p>暂无提现记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {withdrawals.map((w) => (
                  <div key={w.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-[#1A1A1A]">提现 ¥{w.amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">收款: {w.payment_account}</div>
                        <div className="text-[10px] text-gray-300 mt-0.5">{new Date(w.created_at).toLocaleString()}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        w.status === "pending" ? "bg-amber-100 text-amber-700" :
                        w.status === "approved" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {w.status === "pending" ? "审核中" : w.status === "approved" ? "已完成" : "已拒绝"}
                      </span>
                    </div>
                    {w.admin_note && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">备注: {w.admin_note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 账户设置 */}
        {activeTab === "settings" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-[#1A1A1A] mb-4">账户信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">用户名</span>
                  <span className="text-sm text-gray-800">{user.username}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">真实姓名</span>
                  <span className="text-sm text-gray-800">{user.realName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">实名认证</span>
                  {user.isVerified ? (
                    <span className="text-sm text-green-600">已认证</span>
                  ) : (
                    <button onClick={() => setShowVerifyModal(true)} className="text-sm text-[#FE2C55]">去认证</button>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">收款账号</span>
                  {user.paymentAccount ? (
                    <span className="text-sm text-gray-800">{user.paymentAccount}</span>
                  ) : (
                    <button onClick={() => setShowPaymentAccountModal(true)} className="text-sm text-[#FE2C55]">去绑定</button>
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">支付密码</span>
                  <button onClick={() => setShowPaymentPasswordModal(true)} className="text-sm text-[#FE2C55]">设置/修改</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40">
        <div className="max-w-5xl mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-[#FE2C55]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] mt-0.5">首页</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center text-gray-400 hover:text-[#FE2C55]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span className="text-[10px] mt-0.5">购物车</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-[#FE2C55]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span className="text-[10px] mt-0.5 font-medium">我的</span>
          </Link>
        </div>
      </div>

      {/* 实名认证弹窗 */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-center mb-4">实名认证</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">真实姓名</label>
                <input value={idCardName} onChange={(e) => setIdCardName(e.target.value)} placeholder="请输入真实姓名" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">身份证号</label>
                <input value={idCard} onChange={(e) => setIdCard(e.target.value)} placeholder="请输入身份证号" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">取消</button>
              <button onClick={handleVerify} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-xl font-bold disabled:opacity-50">确认</button>
            </div>
          </div>
        </div>
      )}

      {/* 绑定收款账号弹窗 */}
      {showPaymentAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-center mb-4">绑定收款账号</h3>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">收款账号（支付宝/微信/银行卡号）</label>
              <input value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} placeholder="请输入收款账号" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPaymentAccountModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">取消</button>
              <button onClick={handlePaymentAccount} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-xl font-bold disabled:opacity-50">确认绑定</button>
            </div>
          </div>
        </div>
      )}

      {/* 设置支付密码弹窗 */}
      {showPaymentPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-center mb-4">设置支付密码</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">支付密码</label>
                <input type="password" value={paymentPassword} onChange={(e) => setPaymentPassword(e.target.value)} placeholder="至少6位" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">确认密码</label>
                <input type="password" value={confirmPaymentPassword} onChange={(e) => setConfirmPaymentPassword(e.target.value)} placeholder="再次输入" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPaymentPasswordModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">取消</button>
              <button onClick={handlePaymentPassword} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-xl font-bold disabled:opacity-50">确认</button>
            </div>
          </div>
        </div>
      )}

      {/* 提现弹窗 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-center mb-4">申请提现</h3>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
              <div className="text-xs text-gray-400">可提现余额</div>
              <div className="text-xl font-bold text-[#1A1A1A]">¥{user.balance.toFixed(2)}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">提现金额</label>
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="请输入金额" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">支付密码</label>
                <input type="password" value={withdrawPassword} onChange={(e) => setWithdrawPassword(e.target.value)} placeholder="请输入支付密码" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowWithdrawModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">取消</button>
              <button onClick={handleWithdraw} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-xl font-bold disabled:opacity-50">确认提现</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
