'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface Withdrawal {
  id: string;
  amount: string;
  fee: string | null;
  actual_amount: string | null;
  bank_name: string | null;
  bank_card_number: string | null;
  bank_account_name: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

const STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: '待审核', badge: 'bg-amber-50 text-amber-600 border-amber-200' },
  approved: { label: '已通过', badge: 'bg-green-50 text-green-600 border-green-200' },
  rejected: { label: '已拒绝', badge: 'bg-red-50 text-red-600 border-red-200' },
};

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [payPassword, setPayPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feeRate, setFeeRate] = useState(1);
  const [records, setRecords] = useState<Withdrawal[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 拉取手续费率
  useEffect(() => {
    fetch('/api/user/withdraw/config')
      .then(r => r.json())
      .then(d => { if (d && typeof d.fee_rate === 'number') setFeeRate(d.fee_rate); })
      .catch(() => {});
  }, []);

  // 拉取提现记录明细
  const fetchRecords = useCallback(() => {
    if (!user) return;
    setRecordsLoading(true);
    fetch('/api/user/withdrawals')
      .then(r => r.json())
      .then(d => setRecords(d.withdrawals || []))
      .catch(() => {})
      .finally(() => setRecordsLoading(false));
  }, [user]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // 实时计算：手续费 = 金额 * 费率%，预计到账 = 金额 - 手续费
  const numAmount = parseFloat(amount);
  const fee = numAmount > 0 && !isNaN(numAmount) ? Math.round(numAmount * feeRate) / 100 : 0;
  const actualAmount = numAmount > 0 && !isNaN(numAmount) ? Math.round((numAmount - fee) * 100) / 100 : 0;

  const handleSubmit = async () => {
    if (!numAmount || numAmount <= 0) { alert('请输入有效金额'); return; }
    if (!payPassword) { alert('请输入支付密码'); return; }
    if (!user?.verifyStatus || user.verifyStatus !== "verified") { alert('请先完成实名认证'); return; }
    if (!user?.bankBound) { alert('请先绑定收款账号'); return; }
    if (actualAmount <= 0) { alert('提现金额过小，扣除手续费后无可提现余额'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, paymentPassword: payPassword }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('提现申请已提交，等待审核');
      setAmount('');
      setPayPassword('');
      setShowConfirm(false);
      refreshUser?.();
      fetchRecords();
    } catch { alert('操作失败'); }
    finally { setLoading(false); }
  };

  const fmtTime = (t: string) => new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">申请提现</h2>

      {/* 余额卡片 */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#00D4FF] rounded-2xl p-5 text-white shadow-sm">
        <p className="text-sm text-white/80">可用余额</p>
        <p className="text-3xl font-bold mt-1 tabular-nums">¥{user?.balance ? Number(user.balance).toFixed(2) : '0.00'}</p>
      </div>

      {user?.verifyStatus !== "verified" ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700 text-sm">请先完成实名认证后再申请提现</p>
          <a href="/profile/settings/verify" className="text-[#1890FF] text-sm mt-2 inline-block">去认证 →</a>
        </div>
      ) : !user?.bankBound ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700 text-sm">请先绑定收款账号后再申请提现</p>
          <a href="/profile/settings/bank" className="text-[#1890FF] text-sm mt-2 inline-block">去绑定 →</a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm text-gray-600 mb-1">提现金额</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="请输入提现金额"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1890FF]" />
          </div>

          {/* 手续费与预计到账实时计算 */}
          {numAmount > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">提现平台手续费（{feeRate}%）</span>
                <span className="text-[#FE2C55] font-medium tabular-nums">-¥{fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">预计到账</span>
                <span className="text-[#1890FF] font-bold text-base tabular-nums">¥{actualAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">提现收取 {feeRate}% 平台手续费，从提现金额中扣除</p>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">支付密码</label>
            <input type="password" value={payPassword} onChange={e => setPayPassword(e.target.value)} placeholder="请输入支付密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1890FF]" />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">提现到：<span className="text-gray-700">{user.bankName} ({user.bankCardNumber?.slice(-4)})</span></p>
          </div>

          <button onClick={() => setShowConfirm(true)} disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-lg font-medium disabled:opacity-50">
            {loading ? '提交中...' : '确认提现'}
          </button>

          {/* 确认弹窗 */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
              <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-gray-800 text-base text-center">确认提现</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">提现金额</span><span className="font-medium tabular-nums">¥{numAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">平台手续费（{feeRate}%）</span><span className="text-[#FE2C55] font-medium tabular-nums">-¥{fee.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="text-gray-500">预计到账</span>
                    <span className="text-[#1890FF] font-bold tabular-nums">¥{actualAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">收款账户</span><span className="text-gray-700">{user.bankName}（尾号{user.bankCardNumber?.slice(-4)}）</span></div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {loading ? '提交中...' : '确认提交'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 提现记录明细 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-gray-800">提现记录</h3>
          <a href="/profile/finance/withdrawals" className="text-xs text-[#1890FF]">查看全部 →</a>
        </div>
        {recordsLoading ? (
          <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm shadow-sm">暂无提现记录</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
            {records.slice(0, 5).map(w => {
              const st = STATUS[w.status] || { label: w.status, badge: 'bg-gray-50 text-gray-500 border-gray-200' };
              const wFee = w.fee || '0.00';
              const actual = w.actual_amount != null && w.actual_amount !== '' ? w.actual_amount : (parseFloat(w.amount) - parseFloat(wFee)).toFixed(2);
              return (
                <div key={w.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 tabular-nums">¥{parseFloat(w.amount).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${st.badge}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 tabular-nums">到账 ¥{parseFloat(actual).toFixed(2)}（手续费 ¥{wFee}）· {fmtTime(w.created_at)}</p>
                    {w.status === 'rejected' && w.admin_note && (
                      <p className="text-xs text-red-500 mt-1">拒绝原因：{w.admin_note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}