'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

export default function AddressPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', province: '', city: '', district: '', detail: '' });
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = () => {
    if (!user) return;
    fetch('/api/user/addresses').then(r => r.json()).then(d => setAddresses(d.addresses || [])).catch(() => {});
  };
  useEffect(fetchAddresses, [user]);

  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.detail) { alert('请填写完整信息'); return; }
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isDefault }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setShowForm(false);
      setForm({ name: '', phone: '', province: '', city: '', district: '', detail: '' });
      fetchAddresses();
    } catch { alert('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/user/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchAddresses();
    } catch { alert('操作失败'); }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">收货地址</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-[#1890FF] text-white text-xs rounded-lg">
          {showForm ? '取消' : '+ 新增地址'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="收货人" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" placeholder="手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="省" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" placeholder="市" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" placeholder="区" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <input type="text" placeholder="详细地址" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="w-4 h-4" />
            设为默认地址
          </label>
          <button onClick={handleAdd} className="w-full py-2 bg-[#1890FF] text-white rounded-lg text-sm">保存地址</button>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><span className="text-4xl block mb-3">📍</span>暂无收货地址</div>
      ) : (
        <div className="space-y-3">
          {addresses.map(a => (
            <div key={a.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-sm">{a.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{a.phone}</span>
                  {a.is_default && <span className="ml-2 text-xs bg-[#1890FF] text-white px-1.5 py-0.5 rounded">默认</span>}
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400">删除</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{[a.province, a.city, a.district, a.detail].filter(Boolean).join(' ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
