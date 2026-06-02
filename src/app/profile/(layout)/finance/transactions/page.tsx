'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  grab: '抢券', redemption_bonus: '回兑奖励', redemption_return: '回兑返还',
  redemption_rejected: '回兑拒绝', withdraw: '提现', withdraw_return: '提现返还',
  withdraw_success: '提现成功', admin_deposit: '管理员充值', admin_deduct: '管理员扣款',
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/transactions').then(r => r.json()).then(d => setTransactions(d.transactions || [])).catch(() => {});
  }, [user]);

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">资金明细</h2>
      {transactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><span className="text-4xl block mb-3">💰</span>暂无记录</div>
      ) : (
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{typeLabels[t.type] || t.type}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                <p className="text-xs text-gray-300 mt-0.5">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${t.amount >= 0 ? 'text-green-500' : 'text-[#1890FF]'}`}>
                  {t.amount >= 0 ? '+' : ''}{Number(t.amount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">余额 {Number(t.balance_after).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
