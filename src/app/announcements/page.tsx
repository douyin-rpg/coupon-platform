'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';

interface ArticleCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string;
  image_url?: string;
  is_announcement: boolean;
  created_at: string;
  article_categories: { name: string; icon: string };
}

export default function AnnouncementsPage() {
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/article-categories').then(r => r.json()),
      fetch('/api/articles').then(r => r.json())
    ]).then(([catData, artData]) => {
      if (catData.categories) setCategories(catData.categories);
      if (artData.articles) setArticles(artData.articles);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetch(`/api/articles?category_id=${selectedCategory}`)
        .then(r => r.json())
        .then(data => { if (data.articles) setArticles(data.articles); })
        .catch(() => {});
    } else {
      fetch('/api/articles')
        .then(r => r.json())
        .then(data => { if (data.articles) setArticles(data.articles); })
        .catch(() => {});
    }
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1890FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A1628] to-[#132742] text-white px-4 py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#1890FF]/10 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-[#7B61FF]/10 translate-y-1/2 -translate-x-1/3" />
        <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-bold">平台资讯</h1>
          </div>
          <p className="text-sm text-white/60 ml-8">公告、教程、活动资讯</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* Category tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedCategory ? 'bg-[#1890FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}>
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat.id ? 'bg-[#1890FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}>
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Articles list */}
        <div className="space-y-3 pb-8">
          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              <p className="text-gray-400 text-sm">暂无文章</p>
            </div>
          ) : articles.map(article => (
            <Link
              key={article.id}
              href={`/announcements/${article.id}`}
              className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {article.image_url && (
                <div className="w-full h-36 bg-gray-100 overflow-hidden">
                  <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {!article.image_url && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                      {article.article_categories?.icon || '📄'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">{article.title}</h3>
                    {article.is_announcement && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-medium rounded">公告</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{article.content.substring(0, 80)}...</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#1890FF] bg-blue-50 px-1.5 py-0.5 rounded">{article.article_categories?.name || '未分类'}</span>
                    <span className="text-[10px] text-gray-300">{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
      <BottomNav active="messages" />
    </div>
  );
}
