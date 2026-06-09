'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  transaction_no: string | null;
  created_at: string;
}

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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{t.description || t.type}</p>
                {t.transaction_no && (
                  <p className="text-xs text-gray-300 mt-0.5 font-mono">流水号: {t.transaction_no}</p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right ml-3 flex-shrink-0">
                <p className={`font-bold text-sm ${t.amount >= 0 ? 'text-green-500' : 'text-[#FE2C55]'}`}>
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
