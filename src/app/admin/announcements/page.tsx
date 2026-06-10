'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', is_active: true, sort_order: 0 });

  const sidebarLinks = [
    { href: '/admin/sessions', label: '场次管理' },
    { href: '/admin/coupons', label: '优惠券管理' },
    { href: '/admin/codes', label: '注册码管理' },
    { href: '/admin/verify', label: '实名审核' },
    { href: '/admin/redemptions', label: '回兑审核' },
    { href: '/admin/withdrawals', label: '提现审核' },
    { href: '/admin/users', label: '用户管理' },
    { href: '/admin/announcements', label: '公告管理' },
    { href: '/admin/categories', label: '分类管理' },
    { href: '/admin/banners', label: '轮播图管理' },
  ];

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/announcements');
    const data = await res.json();
    if (data.announcements) setAnnouncements(data.announcements);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const url = editId ? `/api/admin/announcements/${editId}` : '/api/admin/announcements';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditOpen(false);
      setEditId(null);
      setForm({ title: '', content: '', is_active: true, sort_order: 0 });
      fetchAnnouncements();
    }
  };

  const handleEdit = (a: Announcement) => {
    setEditId(a.id);
    setForm({ title: a.title, content: a.content, is_active: a.is_active, sort_order: a.sort_order });
    setEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此公告？')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    fetchAnnouncements();
  };

  const toggleActive = async (a: Announcement) => {
    await fetch(`/api/admin/announcements/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, is_active: !a.is_active }),
    });
    fetchAnnouncements();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gradient-to-b from-[#0A1628] to-[#132742] text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="text-lg font-bold">管理后台</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 hover:text-[#1890FF] hover:bg-blue-50/10 rounded-lg text-sm ${link.href === '/admin/announcements' ? 'text-[#1890FF] bg-blue-500/10' : 'text-gray-300'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">公告管理</h1>
          <button
            onClick={() => { setEditId(null); setForm({ title: '', content: '', is_active: true, sort_order: 0 }); setEditOpen(true); }}
            className="bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition"
          >
            + 新建公告
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无公告</div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {a.is_active ? '已发布' : '已下线'}
                      </span>
                      <span className="text-xs text-gray-400">排序: {a.sort_order}</span>
                    </div>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap">{a.content}</p>
                    <p className="text-xs text-gray-300 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleActive(a)}
                      className={`text-xs px-3 py-1 rounded-lg transition ${a.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      {a.is_active ? '下线' : '发布'}
                    </button>
                    <button
                      onClick={() => handleEdit(a)}
                      className="text-xs text-[#1890FF] hover:bg-blue-50 px-3 py-1 rounded-lg transition"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-xs text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold mb-4">{editId ? '编辑公告' : '新建公告'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">公告标题</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]"
                    placeholder="请输入公告标题"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">公告内容</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF] min-h-[120px]"
                    placeholder="请输入公告内容"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                    立即发布
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">排序:</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-20 border rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setEditOpen(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
                <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-lg font-medium hover:shadow-lg transition">
                  {editId ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
