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
    return <div className="p-8 text-gray-400 text-center">加载中...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">系统设置</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* 客服设置 */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-4">客服设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">客服链接</label>
              <input
                type="text"
                value={settings.customer_service_url || ''}
                onChange={e => setSettings({ ...settings, customer_service_url: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF]"
                placeholder="https://example.com/customer-service"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">客服按钮文字</label>
              <input
                type="text"
                value={settings.customer_service_text || ''}
                onChange={e => setSettings({ ...settings, customer_service_text: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF]"
                placeholder="在线客服"
              />
            </div>
          </div>
        </div>

        {/* 邀请码设置 */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-4">邀请码设置</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">首次访问需要邀请码</label>
              <button
                onClick={() => setSettings({ ...settings, invite_code_required: settings.invite_code_required === 'true' ? 'false' : 'true' })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.invite_code_required === 'true' ? 'bg-[#1890FF]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.invite_code_required === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-gray-400">{settings.invite_code_required === 'true' ? '已开启' : '已关闭'}</span>
            </div>
            <p className="text-xs text-gray-400">开启后，用户首次访问平台需输入有效的邀请码（注册码）才能进入</p>
          </div>
        </div>

        {/* 页脚设置 */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-4">页脚设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">公司信息（显示在页脚底部）</label>
              <input
                type="text"
                value={settings.company_info || ''}
                onChange={e => setSettings({ ...settings, company_info: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF]"
                placeholder="上海格物致品网络科技有限公司"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            页脚链接（关联官网/关联平台/联系我们）请在
            <a href="/admin/footer-links" className="text-[#1890FF] hover:underline">页脚链接管理</a>
            中编辑
          </p>
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#1890FF] text-white rounded-lg hover:bg-[#1890FF]/80 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
          {message && (
            <span className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
