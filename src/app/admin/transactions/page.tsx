'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  transaction_no: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  users: {
    username: string;
    real_name: string;
  };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  recharge: { label: '充值', color: 'bg-green-100 text-green-700' },
  admin_deposit: { label: '管理员充值', color: 'bg-green-100 text-green-700' },
  grab: { label: '抢券', color: 'bg-red-100 text-red-700' },
  redemption: { label: '回兑', color: 'bg-blue-100 text-blue-700' },
  withdrawal: { label: '提现', color: 'bg-orange-100 text-orange-700' },
  red_packet: { label: '红包', color: 'bg-pink-100 text-pink-700' },
  deduction: { label: '扣款', color: 'bg-gray-100 text-gray-700' },
  admin_deduct: { label: '管理员扣款', color: 'bg-gray-100 text-gray-700' },
};

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('');
  const [transactionNo, setTransactionNo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const pageSize = 20;

  useEffect(() => {
    fetchTransactions();
  }, [page, type, transactionNo, startDate, endDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (type) params.set('type', type);
      if (transactionNo) params.set('transactionNo', transactionNo);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatAmount = (amount: number) => {
    const yuan = Math.abs(amount) / 100;
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}¥${yuan.toFixed(2)}`;
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">资金明细</h1>
        <p className="text-gray-500 text-sm mt-1">查看所有用户的交易流水记录</p>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">交易类型</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部类型</option>
              <option value="admin_deposit">管理员充值</option>
              <option value="recharge">充值</option>
              <option value="grab">抢券</option>
              <option value="redemption">回兑</option>
              <option value="withdrawal">提现</option>
              <option value="red_packet">红包</option>
              <option value="admin_deduct">管理员扣款</option>
              <option value="deduction">扣款</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">流水号</label>
            <input
              type="text"
              value={transactionNo}
              onChange={(e) => setTransactionNo(e.target.value)}
              onBlur={() => setPage(1)}
              placeholder="搜索流水号"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setType(''); setTransactionNo(''); setStartDate(''); setEndDate(''); setPage(1); }}
              className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">总记录数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">充值笔数</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {transactions.filter(t => t.type === 'recharge').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">抢券笔数</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {transactions.filter(t => t.type === 'grab').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">提现笔数</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {transactions.filter(t => t.type === 'withdrawal').length}
          </p>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">流水号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">用户</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">类型</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">金额</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">余额</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">说明</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">加载中...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">暂无记录</td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const typeInfo = TYPE_LABELS[txn.type] || { label: txn.type, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-600">{txn.transaction_no || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{txn.users?.username || '-'}</p>
                          <p className="text-xs text-gray-400">{txn.users?.real_name || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(txn.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">¥{(txn.balance_after / 100).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{txn.description || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{formatTime(txn.created_at)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              共 {total} 条，第 {page}/{totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
