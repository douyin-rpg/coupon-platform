'use client';

import { useEffect, useState } from 'react';

interface FooterLink {
  id: string;
  section: string;
  label: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

const sectionOptions = [
  { value: 'official', label: '关联官网' },
  { value: 'platform', label: '关联平台' },
  { value: 'contact', label: '联系我们' },
];

export default function AdminFooterLinks() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ section: 'official', label: '', url: '', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/admin/footer-links');
      const data = await res.json();
      if (data.links) setLinks(data.links);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleSave = async () => {
    if (!form.label || !form.url) return alert('请填写完整信息');
    setSaving(true);
    try {
      if (editingId) {
        await fetch('/api/admin/footer-links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form }),
        });
      } else {
        await fetch('/api/admin/footer-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setEditingId(null);
      setForm({ section: 'official', label: '', url: '', sort_order: 0, is_active: true });
      fetchLinks();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (link: FooterLink) => {
    setEditingId(link.id);
    setForm({
      section: link.section,
      label: link.label,
      url: link.url,
      sort_order: link.sort_order,
      is_active: link.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此链接？')) return;
    await fetch(`/api/admin/footer-links?id=${id}`, { method: 'DELETE' });
    fetchLinks();
  };

  const handleToggle = async (link: FooterLink) => {
    await fetch('/api/admin/footer-links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: link.id, is_active: !link.is_active }),
    });
    fetchLinks();
  };

  const getSectionLabel = (section: string) => {
    return sectionOptions.find(s => s.value === section)?.label || section;
  };

  if (loading) return <div className="p-8 text-gray-400 text-center">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">页脚链接管理</h1>

      {/* Add/Edit Form */}
      <div className="bg-gray-800 rounded-lg p-5">
        <h2 className="text-lg font-medium text-white mb-4">
          {editingId ? '编辑链接' : '添加链接'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">分组</label>
            <select
              value={form.section}
              onChange={e => setForm({ ...form, section: e.target.value })}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600"
            >
              {sectionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">显示文本</label>
            <input
              type="text"
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
              placeholder="如：抖音电商"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">跳转链接</label>
            <input
              type="text"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">排序</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#1890FF] text-white rounded-lg text-sm hover:bg-[#40a9ff] disabled:opacity-50"
          >
            {saving ? '保存中...' : editingId ? '更新' : '添加'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ section: 'official', label: '', url: '', sort_order: 0, is_active: true });
              }}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
            >
              取消
            </button>
          )}
        </div>
      </div>

      {/* Links List by Section */}
      {sectionOptions.map(section => {
        const sectionLinks = links.filter(l => l.section === section.value);
        if (sectionLinks.length === 0) return null;
        return (
          <div key={section.value} className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-700">
              <h3 className="text-base font-medium text-white">{section.label}</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {sectionLinks.map(link => (
                <div key={link.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-750">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${link.is_active ? 'text-white' : 'text-gray-500 line-through'}`}>
                        {link.label}
                      </span>
                      {!link.is_active && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">已隐藏</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <span className="text-xs text-gray-500">排序: {link.sort_order}</span>
                    <button
                      onClick={() => handleToggle(link)}
                      className={`px-2 py-1 rounded text-xs ${
                        link.is_active ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {link.is_active ? '显示' : '隐藏'}
                    </button>
                    <button
                      onClick={() => handleEdit(link)}
                      className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs hover:bg-blue-900/50"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs hover:bg-red-900/50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
