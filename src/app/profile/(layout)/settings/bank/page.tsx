'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function BankPage() {
  const { user, refreshUser } = useAuth();
  const [accountName, setAccountName] = useState(user?.bankAccountName || '');
  const [cardNumber, setCardNumber] = useState(user?.bankCardNumber || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [payPassword, setPayPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isBound = user?.bankBound;

  const handleBind = async () => {
    if (!accountName) { alert('请输入持卡人姓名'); return; }
    if (!cardNumber) { alert('请输入银行卡号'); return; }
    if (!bankName) { alert('请输入开户行'); return; }
    if (!payPassword) { alert('请输入支付密码'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/user/payment-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bank_account_name: accountName, 
          bank_card_number: cardNumber, 
          bank_name: bankName, 
          payment_password: payPassword 
        }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('收款账户绑定成功！');
      setPayPassword('');
      refreshUser?.();
    } catch { alert('操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">收款账户</h2>
      
      {isBound ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm font-medium">已绑定收款账户</p>
            <p className="text-gray-400 text-xs mt-1">收款账户绑定后不可自行修改，如需修改请联系管理员</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">持卡人姓名</label>
              <input type="text" value={user?.bankAccountName || ''} disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">银行卡号</label>
              <input type="text" value={user?.bankCardNumber ? `****${user.bankCardNumber.slice(-4)}` : ''} disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">开户行</label>
              <input type="text" value={user?.bankName || ''} disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700 text-sm font-medium">未绑定收款账户</p>
            <p className="text-gray-400 text-xs mt-1">绑定后不可自行修改，请仔细核对信息</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">持卡人姓名</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="请输入持卡人姓名"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">银行卡号</label>
            <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))} placeholder="请输入银行卡号" maxLength={23}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">开户行</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="例如：中国工商银行XX支行"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">支付密码验证</label>
            <input type="password" value={payPassword} onChange={e => setPayPassword(e.target.value)} placeholder="请输入支付密码以确认"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
          </div>
          <button onClick={handleBind} disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-lg font-medium disabled:opacity-50">
            {loading ? '提交中...' : '确认绑定'}
          </button>
        </div>
      )}
    </div>
  );
}
