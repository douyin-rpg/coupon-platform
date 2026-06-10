'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';
import { ArrowLeftIcon } from '@/components/icons';

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

export default function ArticleDetailPage() {
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/articles/${params.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.article) setArticle(data.article);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1890FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">文章不存在</p>
          <Link href="/announcements" className="text-[#1890FF] text-sm">返回资讯列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A1628] to-[#132742] text-white px-4 py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#1890FF]/10 -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/announcements" className="text-white/70 hover:text-white">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <span className="text-sm text-white/60">资讯详情</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          {/* Title */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {article.is_announcement && (
                <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs font-medium rounded">公告</span>
              )}
              <span className="px-2 py-0.5 bg-blue-50 text-[#1890FF] text-xs font-medium rounded">
                {article.article_categories?.name || '未分类'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{article.title}</h1>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(article.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-4" />

          {/* Article Image */}
          {article.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img src={article.image_url} alt={article.title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>
        </div>
      </div>

      <Footer />
      <BottomNav active="messages" />
    </div>
  );
}
