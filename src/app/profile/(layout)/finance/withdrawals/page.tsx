'use client';

import { useState, useEffect } from 'react';
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

const STATUS: Record<string, { label: string; badge: string; text: string }> = {
  pending: { label: '待审核', badge: 'bg-amber-50 text-amber-600 border-amber-200', text: '审核中，请耐心等待' },
  approved: { label: '已通过', badge: 'bg-green-50 text-green-600 border-green-200', text: '提现已通过，请注意查收' },
  rejected: { label: '已拒绝', badge: 'bg-red-50 text-red-600 border-red-200', text: '提现未通过' },
};

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/withdrawals')
      .then(r => r.json())
      .then(d => setRecords(d.withdrawals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const fmtTime = (t: string) => new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">提现记录</h2>

      {loading ? (
        <div className="text-center py-16 text-gray-400">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">💳</span>
          <p className="text-gray-400">暂无提现记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(w => {
            const st = STATUS[w.status] || { label: w.status, badge: 'bg-gray-50 text-gray-500 border-gray-200', text: '' };
            const fee = w.fee || '0.00';
            const actual = w.actual_amount != null && w.actual_amount !== '' ? w.actual_amount : (parseFloat(w.amount) - parseFloat(fee)).toFixed(2);
            return (
              <div key={w.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold tabular-nums text-gray-800">¥{parseFloat(w.amount).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${st.badge}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 tabular-nums">
                      手续费 ¥{fee}，预计到账 ¥{parseFloat(actual).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      提现至 {w.bank_name || '-'}（尾号{w.bank_card_number?.slice(-4) || '-'}）· {fmtTime(w.created_at)}
                    </p>
                    {w.status === 'rejected' && w.admin_note && (
                      <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-600">
                        <span className="font-medium">拒绝原因：</span>{w.admin_note}
                      </div>
                    )}
                    {w.status === 'approved' && w.processed_at && (
                      <p className="mt-1 text-xs text-gray-300">审核通过时间：{fmtTime(w.processed_at)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}