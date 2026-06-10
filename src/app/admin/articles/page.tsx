'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface ArticleCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string;
  image_url?: string;
  view_count?: number;
  is_published: boolean;
  is_announcement: boolean;
  sort_order: number;
  created_at: string;
  category_name?: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category_id: '',
    image_url: '',
    view_count: 0,
    is_published: true,
    is_announcement: false,
    sort_order: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [artRes, catRes] = await Promise.all([
        fetch('/api/admin/articles'),
        fetch('/api/admin/article-categories'),
      ]);
      const artData = await artRes.json();
      const catData = await catRes.json();
      if (artData.articles) setArticles(artData.articles);
      if (catData.categories) setCategories(catData.categories);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '未分类';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/articles?id=${editingId}` : '/api/admin/articles';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setShowForm(false);
      setEditingId(null);
      setForm({ title: '', content: '', category_id: '', image_url: '', view_count: 0, is_published: true, is_announcement: false, sort_order: 0 });
      fetchData();
    } catch { alert('操作失败'); }
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      content: article.content,
      category_id: article.category_id,
      image_url: article.image_url || '',
      view_count: article.view_count || 0,
      is_published: article.is_published,
      is_announcement: article.is_announcement,
      sort_order: article.sort_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此文章？')) return;
    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      fetchData();
    } catch { alert('删除失败'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">文章管理</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', content: '', category_id: '', image_url: '', view_count: 0, is_published: true, is_announcement: false, sort_order: 0 }); }}
            className="px-4 py-2 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow">
            + 新增文章
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
              <h2 className="text-lg font-bold mb-4">{editingId ? '编辑文章' : '新增文章'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1890FF] focus:border-[#1890FF]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1890FF]">
                    <option value="">选择分类</option>
                    {categories.filter(c => c.is_active).map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.url) setForm(f => ({ ...f, image_url: data.url }));
                        else alert('上传失败');
                      } catch { alert('上传失败'); }
                    }} className="text-sm" />
                    {form.image_url && (
                      <img src={form.image_url} alt="preview" className="w-16 h-16 object-cover rounded-lg border" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={10} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1890FF]" required />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                    发布
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_announcement} onChange={e => setForm(f => ({ ...f, is_announcement: e.target.checked }))} />
                    公告
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-32 border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">浏览量</label>
                  <input type="number" value={form.view_count} onChange={e => setForm(f => ({ ...f, view_count: parseInt(e.target.value) || 0 }))}
                    className="w-32 border rounded-lg px-3 py-2 text-sm" />
                  <p className="text-xs text-gray-400 mt-1">设置前端显示的浏览量数值</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
                  <button type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-lg text-sm font-medium">
                    {editingId ? '保存' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Articles table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无文章</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">标题</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">分类</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">公告</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">浏览量</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">排序</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
                  <tr key={article.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{article.title}</td>
                    <td className="px-4 py-3 text-gray-600">{getCategoryName(article.category_id)}</td>
                    <td className="px-4 py-3 text-center">
                      {article.is_announcement ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">公告</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {article.is_published ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">已发布</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">草稿</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{article.view_count || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{article.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleEdit(article)} className="text-[#1890FF] hover:underline text-xs mr-3">编辑</button>
                      <button onClick={() => handleDelete(article.id)} className="text-red-500 hover:underline text-xs">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
