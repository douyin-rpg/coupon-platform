'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserInfo {
  id: string;
  username: string;
  realName: string;
  isVerified: boolean;
  paymentAccount: string | null;
  balance: string;
}

interface UserCoupon {
  id: string;
  status: string;
  payment_amount: string;
  coupons: { name: string; price: string } | null;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: string;
  payment_account: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [couponTab, setCouponTab] = useState<'pending' | 'redemption_pending' | 'redeemed'>('pending');
  const [loading, setLoading] = useState(true);

  // Verify dialog
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [realName, setRealName] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentPassword, setPaymentPassword] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Withdraw dialog
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Redemption dialog
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [redeemPassword, setRedeemPassword] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchUserCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/user/coupons');
      if (res.ok) {
        const data = await res.json();
        setUserCoupons(data.coupons || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/user/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUser().then(() => setLoading(false));
    fetchUserCoupons();
    fetchWithdrawals();
  }, [fetchUser, fetchUserCoupons, fetchWithdrawals]);

  const handleVerify = async () => {
    if (!realName || !paymentAccount || !paymentPassword) return;
    setVerifyLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realName, paymentAccount, paymentPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '实名认证成功！' });
        setVerifyDialogOpen(false);
        fetchUser();
      } else {
        setMessage({ type: 'error', text: data.error || '认证失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawPassword) return;
    setWithdrawLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount, paymentPassword: withdrawPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '提现申请已提交，请等待审核' });
        setWithdrawDialogOpen(false);
        setWithdrawAmount('');
        setWithdrawPassword('');
        fetchUser();
        fetchWithdrawals();
      } else {
        setMessage({ type: 'error', text: data.error || '提现失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedCouponId || !redeemPassword) return;
    setRedeemLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/redemption/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCouponId: selectedCouponId, paymentPassword: redeemPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '回兑申请已提交！' });
        setRedeemDialogOpen(false);
        setRedeemPassword('');
        fetchUserCoupons();
      } else {
        setMessage({ type: 'error', text: data.error || '回兑失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const filteredCoupons = userCoupons.filter(c => c.status === couponTab);

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '待使用', color: 'text-blue-600', bg: 'bg-blue-50' },
    redemption_pending: { label: '待回兑', color: 'text-amber-600', bg: 'bg-amber-50' },
    redeemed: { label: '已回兑', color: 'text-green-600', bg: 'bg-green-50' },
  };

  const withdrawalStatusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '审核中', color: 'text-amber-600' },
    approved: { label: '已通过', color: 'text-green-600' },
    rejected: { label: '已拒绝', color: 'text-red-500' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] px-4 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-white text-lg font-bold">个人中心</h1>
            <button onClick={handleLogout} className="text-white/70 hover:text-white text-xs transition">退出登录</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border-2 border-white/30">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{user.username}</h2>
              <div className="flex items-center gap-2 mt-1">
                {user.isVerified ? (
                  <span className="bg-green-500/20 text-green-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    已认证
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full">未认证</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card - overlaps header */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">账户余额</p>
              {user.isVerified ? (
                <p className="text-3xl font-bold text-[#1A1A1A] tabular-nums">
                  <span className="text-base font-normal text-gray-400">¥</span>
                  {parseFloat(user.balance).toFixed(2)}
                </p>
              ) : (
                <button
                  onClick={() => {
                    setRealName(user.realName);
                    setVerifyDialogOpen(true);
                    setMessage(null);
                  }}
                  className="text-sm text-[#FE2C55] font-medium"
                >
                  完成实名认证后查看余额 →
                </button>
              )}
            </div>
            {user.isVerified && (
              <button
                onClick={() => {
                  setWithdrawDialogOpen(true);
                  setMessage(null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #FE2C55, #FF6B35)' }}
              >
                提现
              </button>
            )}
          </div>
          {!user.isVerified && (
            <button
              onClick={() => {
                setRealName(user.realName);
                setVerifyDialogOpen(true);
                setMessage(null);
              }}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-[#FE2C55] bg-[#FFF0F0] transition hover:bg-[#FFE0E0]"
            >
              立即完成实名认证
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-6xl mx-auto px-4 mt-4 p-3 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-100'
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Function Grid */}
      {user.isVerified && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-4 gap-4">
            <button
              onClick={() => setCouponTab('pending')}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="text-lg">🎫</span>
              </div>
              <span className="text-[10px] text-gray-500">待使用</span>
            </button>
            <button
              onClick={() => setCouponTab('redemption_pending')}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <span className="text-[10px] text-gray-500">待回兑</span>
            </button>
            <button
              onClick={() => setCouponTab('redeemed')}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <span className="text-lg">✅</span>
              </div>
              <span className="text-[10px] text-gray-500">已回兑</span>
            </button>
            <button
              onClick={() => setWithdrawDialogOpen(true)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <span className="text-lg">💳</span>
              </div>
              <span className="text-[10px] text-gray-500">提现</span>
            </button>
          </div>
        </div>
      )}

      {/* Coupon List */}
      {user.isVerified && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {([
                { key: 'pending', label: '待使用' },
                { key: 'redemption_pending', label: '待回兑' },
                { key: 'redeemed', label: '已回兑' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCouponTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium transition relative ${
                    couponTab === tab.key
                      ? 'text-[#FE2C55]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                  {couponTab === tab.key && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#FE2C55] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
              {filteredCoupons.length === 0 ? (
                <div className="text-center py-10 text-gray-300">
                  <span className="text-3xl">📭</span>
                  <p className="text-sm mt-2">暂无{statusMap[couponTab]?.label || ''}的券</p>
                </div>
              ) : (
                filteredCoupons.map(uc => {
                  const st = statusMap[uc.status] || { label: uc.status, color: 'text-gray-500', bg: 'bg-gray-50' };
                  return (
                    <div key={uc.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1A1A1A] truncate">{uc.coupons?.name || '优惠券'}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${st.bg} ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">支付 ¥{parseFloat(uc.payment_amount).toFixed(2)}</span>
                          <span className="text-[10px] text-gray-300">{new Date(uc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {uc.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedCouponId(uc.id);
                            setRedeemDialogOpen(true);
                            setRedeemPassword('');
                            setMessage(null);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                          style={{ background: 'linear-gradient(135deg, #FE2C55, #FF6B35)' }}
                        >
                          申请回兑
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Records */}
      {user.isVerified && withdrawals.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">提现记录</h3>
            <div className="space-y-2">
              {withdrawals.map(w => {
                const ws = withdrawalStatusMap[w.status] || { label: w.status, color: 'text-gray-500' };
                return (
                  <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">-¥{parseFloat(w.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">{new Date(w.created_at).toLocaleString()}</p>
                      {w.admin_note && <p className="text-[10px] text-gray-400 mt-0.5">备注: {w.admin_note}</p>}
                    </div>
                    <span className={`text-xs font-medium ${ws.color}`}>{ws.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payment Account Info */}
      {user.isVerified && user.paymentAccount && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">收款账号</h3>
            <p className="text-sm text-gray-500">{user.paymentAccount}</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-6xl mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-[10px] font-medium">首页</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 text-[#FE2C55]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[10px] font-medium">我的</span>
          </Link>
        </div>
      </nav>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">实名认证</DialogTitle>
            <DialogDescription className="text-center">
              完成认证后可查看余额、抢券和提现
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">真实姓名</Label>
              <Input
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="请输入真实姓名"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">收款账号</Label>
              <Input
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
                placeholder="请输入支付宝/微信收款账号"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">余额支付密码</Label>
              <Input
                type="password"
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value)}
                placeholder="设置6位数字支付密码"
                className="rounded-xl"
              />
            </div>
            {message && message.type === 'error' && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{message.text}</p>
            )}
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: (verifyLoading || !realName || !paymentAccount || !paymentPassword) ? '#ccc' : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                color: (verifyLoading || !realName || !paymentAccount || !paymentPassword) ? '#999' : '#fff',
              }}
              onClick={handleVerify}
              disabled={verifyLoading || !realName || !paymentAccount || !paymentPassword}
            >
              {verifyLoading ? '认证中...' : '完成认证'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">申请提现</DialogTitle>
            <DialogDescription className="text-center">
              当前余额: <span className="font-bold text-[#FFC107]">¥{parseFloat(user.balance).toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">提现金额</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="请输入提现金额"
                className="rounded-xl"
              />
              <p className="text-[10px] text-gray-400">提现至收款账号: {user.paymentAccount}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">支付密码</Label>
              <Input
                type="password"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                placeholder="请输入支付密码"
                className="rounded-xl"
              />
            </div>
            {message && message.type === 'error' && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{message.text}</p>
            )}
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: (withdrawLoading || !withdrawAmount || !withdrawPassword) ? '#ccc' : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                color: (withdrawLoading || !withdrawAmount || !withdrawPassword) ? '#999' : '#fff',
              }}
              onClick={handleWithdraw}
              disabled={withdrawLoading || !withdrawAmount || !withdrawPassword}
            >
              {withdrawLoading ? '提交中...' : '提交提现申请'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">申请回兑</DialogTitle>
            <DialogDescription className="text-center">
              回兑通过后返还支付金额 + 5% 奖励金
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
              回兑审核通过后，将返还支付金额 + 5% 奖励至余额
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">支付密码</Label>
              <Input
                type="password"
                value={redeemPassword}
                onChange={(e) => setRedeemPassword(e.target.value)}
                placeholder="请输入支付密码确认"
                className="rounded-xl"
              />
            </div>
            {message && message.type === 'error' && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{message.text}</p>
            )}
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: (redeemLoading || !redeemPassword) ? '#ccc' : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                color: (redeemLoading || !redeemPassword) ? '#999' : '#fff',
              }}
              onClick={handleRedeem}
              disabled={redeemLoading || !redeemPassword}
            >
              {redeemLoading ? '提交中...' : '确认申请回兑'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
