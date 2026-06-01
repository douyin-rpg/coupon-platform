'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  coupon_id: string;
  status: string;
  payment_amount: string;
  created_at: string;
  coupons: { name: string; price: string; description: string | null } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Verify dialog
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentPassword, setPaymentPassword] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Redemption dialog
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemCouponId, setRedeemCouponId] = useState('');
  const [redeemPassword, setRedeemPassword] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
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

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/user/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchCoupons();
  }, [fetchUser, fetchCoupons]);

  const handleVerify = async () => {
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/user/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentAccount, paymentPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyOpen(false);
        setMessage({ type: 'success', text: '实名认证成功！' });
        fetchUser();
      } else {
        setVerifyError(data.error || '认证失败');
      }
    } catch {
      setVerifyError('网络错误');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRedeem = async () => {
    setRedeemLoading(true);
    setRedeemError('');
    try {
      const res = await fetch('/api/redemption/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCouponId: redeemCouponId, paymentPassword: redeemPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRedeemOpen(false);
        setRedeemPassword('');
        setMessage({ type: 'success', text: '回兑申请已提交！' });
        fetchCoupons();
      } else {
        setRedeemError(data.error || '申请失败');
      }
    } catch {
      setRedeemError('网络错误');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待使用', color: 'bg-blue-500 text-white' },
    redemption_pending: { label: '待回兑', color: 'bg-amber-500 text-white' },
    redeemed: { label: '已回兑', color: 'bg-green-500 text-white' },
    expired: { label: '已过期', color: 'bg-gray-400 text-white' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (!user) return null;

  const pendingCoupons = coupons.filter((c) => c.status === 'pending');
  const redemptionPendingCoupons = coupons.filter((c) => c.status === 'redemption_pending');
  const redeemedCoupons = coupons.filter((c) => c.status === 'redeemed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition">
              <span className="text-lg font-bold">惠抢券</span>
            </Link>
            <span className="text-red-200">|</span>
            <span className="text-red-100">个人中心</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/30 text-white hover:bg-white/10">
            退出登录
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* User Info Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">{user.username[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <p className="text-red-100 text-sm">{user.realName}</p>
                </div>
              </div>
              <Badge className={user.isVerified ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                {user.isVerified ? '已认证' : '未认证'}
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Balance */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">账户余额</p>
                {user.isVerified ? (
                  <p className="text-2xl font-bold text-amber-600 tabular-nums">¥{parseFloat(user.balance).toFixed(2)}</p>
                ) : (
                  <div>
                    <p className="text-gray-400 text-sm">未完成认证</p>
                    <Button
                      size="sm"
                      className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        setPaymentAccount('');
                        setPaymentPassword('');
                        setVerifyError('');
                        setVerifyOpen(true);
                      }}
                    >
                      去认证
                    </Button>
                  </div>
                )}
              </div>
              {/* Payment Account */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">收款账号</p>
                <p className="text-sm font-medium">{user.paymentAccount || '未绑定'}</p>
              </div>
              {/* Stats */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">持有券数</p>
                <p className="text-2xl font-bold text-red-600">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupon List */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">我的优惠券</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">待使用 ({pendingCoupons.length})</TabsTrigger>
                <TabsTrigger value="redemption_pending">待回兑 ({redemptionPendingCoupons.length})</TabsTrigger>
                <TabsTrigger value="redeemed">已回兑 ({redeemedCoupons.length})</TabsTrigger>
              </TabsList>

              {['pending', 'redemption_pending', 'redeemed'].map((tab) => {
                const list = tab === 'pending' ? pendingCoupons : tab === 'redemption_pending' ? redemptionPendingCoupons : redeemedCoupons;
                return (
                  <TabsContent key={tab} value={tab}>
                    {list.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">暂无券</p>
                    ) : (
                      <div className="space-y-3">
                        {list.map((uc) => {
                          const couponInfo = uc.coupons as unknown as { name: string; price: string; description: string | null } | null;
                          const st = statusMap[uc.status] || { label: uc.status, color: 'bg-gray-400 text-white' };
                          return (
                            <div key={uc.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                  <span className="text-red-600 font-bold text-lg">券</span>
                                </div>
                                <div>
                                  <p className="font-medium">{couponInfo?.name || '优惠券'}</p>
                                  <p className="text-sm text-gray-500">
                                    支付金额：<span className="text-amber-600 font-medium">¥{parseFloat(uc.payment_amount).toFixed(2)}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={st.color}>{st.label}</Badge>
                                {uc.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                    onClick={() => {
                                      setRedeemCouponId(uc.id);
                                      setRedeemPassword('');
                                      setRedeemError('');
                                      setRedeemOpen(true);
                                    }}
                                  >
                                    申请回兑
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>完成实名认证</DialogTitle>
            <DialogDescription>
              完成实名认证后即可查看余额、抢购优惠券。请绑定收款账号并设置余额支付密码。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="paymentAccount">收款账号</Label>
              <Input
                id="paymentAccount"
                placeholder="请输入收款账号（如支付宝账号）"
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentPwd">余额支付密码</Label>
              <Input
                id="paymentPwd"
                type="password"
                placeholder="设置支付密码（至少6位）"
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value)}
              />
            </div>
            {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={handleVerify}
              disabled={verifyLoading || !paymentAccount || !paymentPassword}
            >
              {verifyLoading ? '认证中...' : '完成认证'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemption Dialog */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>申请回兑</DialogTitle>
            <DialogDescription>
              申请回兑后，管理员审核通过将返还支付金额+5%奖励，拒绝则仅返还支付金额。请输入支付密码确认。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">回兑说明：审核通过返还 <span className="font-bold">支付金额 + 5%</span>，拒绝仅返还支付金额。</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="redeemPwd">支付密码</Label>
              <Input
                id="redeemPwd"
                type="password"
                placeholder="请输入支付密码"
                value={redeemPassword}
                onChange={(e) => setRedeemPassword(e.target.value)}
              />
            </div>
            {redeemError && <p className="text-sm text-red-600">{redeemError}</p>}
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              onClick={handleRedeem}
              disabled={redeemLoading || !redeemPassword}
            >
              {redeemLoading ? '提交中...' : '确认申请回兑'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
