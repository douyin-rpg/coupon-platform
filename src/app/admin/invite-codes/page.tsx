'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon, EditIcon } from '@/components/icons';

interface InviteCode {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editCode, setEditCode] = useState<InviteCode | null>(null);
  const [form, setForm] = useState({ code: '', description: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invite-codes');
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleSubmit = async () => {
    if (!form.code.trim()) { setError('邀请码不能为空'); return; }
    setSubmitting(true);
    setError('');
    try {
      if (editCode) {
        const res = await fetch(`/api/admin/invite-codes/${editCode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || '更新失败'); return; }
      } else {
        const res = await fetch('/api/admin/invite-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || '创建失败'); return; }
      }
      setShowDialog(false);
      setEditCode(null);
      setForm({ code: '', description: '', is_active: true });
      fetchCodes();
    } catch (err) {
      console.error(err);
      setError('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此邀请码？')) return;
    try {
      await fetch(`/api/admin/invite-codes/${id}`, { method: 'DELETE' });
      fetchCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (code: InviteCode) => {
    setEditCode(code);
    setForm({ code: code.code, description: code.description || '', is_active: code.is_active });
    setShowDialog(true);
    setError('');
  };

  const openCreate = () => {
    setEditCode(null);
    setForm({ code: '', description: '', is_active: true });
    setShowDialog(true);
    setError('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">邀请码管理</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1890FF] hover:bg-[#1890FF]/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" /> 新增邀请码
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">邀请码</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">描述</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">状态</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">创建时间</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm">{c.id}</td>
                <td className="px-4 py-3 text-sm font-mono font-semibold text-[#1890FF]">{c.code}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.description || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {c.is_active ? '有效' : '已禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-[#1890FF]">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">暂无邀请码</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑弹窗 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editCode ? '编辑邀请码' : '新增邀请码'}</h2>
            {error && <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">邀请码</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1890FF]/30 focus:border-[#1890FF]"
                  placeholder="请输入邀请码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1890FF]/30 focus:border-[#1890FF]"
                  placeholder="可选描述"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#1890FF]"
                />
                <label htmlFor="is_active" className="text-sm">启用</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowDialog(false); setEditCode(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-[#1890FF] hover:bg-[#1890FF]/80 text-white rounded-lg transition-colors disabled:opacity-50">
                {submitting ? '提交中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
