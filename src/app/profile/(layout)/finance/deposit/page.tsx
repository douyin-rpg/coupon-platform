'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface WithdrawalRecord {
  id: string;
  amount: number;
  bank_name: string | null;
  bank_card_number: string | null;
  bank_account_name: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

export default function WithdrawRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<WithdrawalRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/withdrawals').then(r => r.json()).then(d => setRecords(d.withdrawals || [])).catch(() => {});
  }, [user]);

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '审核中', color: 'text-yellow-500' },
    approved: { label: '已通过', color: 'text-green-500' },
    rejected: { label: '已拒绝', color: 'text-red-500' },
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">提现记录</h2>
      {records.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><span className="text-4xl block mb-3">💸</span>暂无提现记录</div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className={`font-medium text-sm ${statusMap[r.status]?.color || 'text-gray-500'}`}>
                  {statusMap[r.status]?.label || r.status}
                </span>
                <span className="text-[#1890FF] font-bold">-¥{Number(r.amount).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">收款账号：{r.bank_name} 尾号{r.bank_card_number?.slice(-4) || '未知'}</p>
              <p className="text-xs text-gray-400">申请时间：{new Date(r.created_at).toLocaleString()}</p>
              {r.admin_note && <p className="text-xs text-orange-500 mt-1">备注：{r.admin_note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
