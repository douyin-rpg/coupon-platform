'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';
import { ArrowLeftIcon, EyeIcon } from '@/components/icons';

interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string;
  image_url?: string;
  view_count?: number;
  is_announcement: boolean;
  created_at: string;
  article_categories: { name: string; icon: string };
}

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
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
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1890FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">文章不存在</p>
          <Link href="/announcements" className="text-[#1890FF] text-sm">返回资讯列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header - Premium aurora style */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #060E1A 0%, #0A1A30 40%, #0D2244 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute w-80 h-80 rounded-full opacity-[0.10] -top-20 -right-10"
          style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.5) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="max-w-4xl mx-auto relative z-10 px-4 py-5">
          <div className="flex items-center gap-3">
            <Link href="/announcements" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <span className="text-sm text-white/50">资讯详情</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          {/* Article Image */}
          {article.image_url && (
            <div className="w-full max-h-72 overflow-hidden">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-5 md:p-6">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-3">
              {article.is_announcement && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-medium rounded-full">公告</span>
              )}
              <span className="px-2 py-0.5 bg-blue-50 text-[#1890FF] text-[10px] font-medium rounded-full">
                {article.article_categories?.icon} {article.article_categories?.name || '未分类'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{article.title}</h1>

            {/* View count */}
            <div className="flex items-center gap-1.5 text-xs text-gray-300 mb-4">
              <EyeIcon className="w-3.5 h-3.5" />
              <span>{formatViewCount(article.view_count || 0)}浏览</span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-5" />

            {/* Content */}
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <BottomNav active="messages" />
    </div>
  );
}
