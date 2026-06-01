'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function VerifyPage() {
  const { user, refreshUser } = useAuth();
  const [realName, setRealName] = useState(user?.realName || '');
  const [idCard, setIdCard] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.verifyStatus === "verified") {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">实名认证</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <span className="text-4xl block mb-3">✅</span>
          <p className="text-green-700 font-medium">已完成实名认证</p>
          <p className="text-sm text-gray-500 mt-2">姓名：{user.realName}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!realName || !idCard) { alert('请填写完整信息'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/user/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realName, idCard }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('实名认证成功！');
      refreshUser?.();
    } catch { alert('操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">实名认证</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">真实姓名</label>
          <input type="text" value={realName} onChange={e => setRealName(e.target.value)} placeholder="请输入真实姓名"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">身份证号</label>
          <input type="text" value={idCard} onChange={e => setIdCard(e.target.value)} placeholder="请输入身份证号"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-lg font-medium disabled:opacity-50">
          {loading ? '提交中...' : '提交认证'}
        </button>
      </div>
    </div>
  );
}
