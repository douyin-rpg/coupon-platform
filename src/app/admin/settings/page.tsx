'use client';

import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('保存成功');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage(data.error || '保存失败');
      }
    } catch {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white text-center">加载中...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">系统设置</h1>

      <div className="bg-gray-800 rounded-xl p-6 space-y-6">
        {/* 客服设置 */}
        <div>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span>🎧</span> 客服设置
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">客服链接</label>
              <input
                type="text"
                value={settings.customer_service_url || ''}
                onChange={e => setSettings({ ...settings, customer_service_url: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#1890FF]"
                placeholder="https://example.com/customer-service"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">客服按钮文字</label>
              <input
                type="text"
                value={settings.customer_service_text || ''}
                onChange={e => setSettings({ ...settings, customer_service_text: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#1890FF]"
                placeholder="在线客服"
              />
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#1890FF] text-white rounded-lg hover:bg-[#1890FF]/80 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
          {message && (
            <span className={`text-sm ${message.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
