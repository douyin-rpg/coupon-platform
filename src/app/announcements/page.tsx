'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';
import { AnnounceIcon, ArrowLeftIcon, EyeIcon, ClockIcon, RemindIcon, EditIcon, StarIcon, FileTextIcon, AllApplicationIcon } from '@/components/icons';

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
  view_count?: number;
  is_announcement: boolean;
  created_at: string;
  article_categories: { name: string; icon: string };
}

// Modern category icon mapping - colorful gradient backgrounds with IconPark icons
const categoryStyleMap: Record<string, { bg: string; IconComponent: React.FC<{ className?: string }>; activeBg: string }> = {
  '平台公告': { bg: 'bg-red-50', IconComponent: AnnounceIcon, activeBg: 'bg-gradient-to-r from-red-500 to-rose-500' },
  '使用教程': { bg: 'bg-blue-50', IconComponent: EditIcon, activeBg: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  '活动资讯': { bg: 'bg-amber-50', IconComponent: StarIcon, activeBg: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  '规则说明': { bg: 'bg-emerald-50', IconComponent: FileTextIcon, activeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
};

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
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
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1890FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header - Premium aurora style */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #060E1A 0%, #0A1A30 40%, #0D2244 100%)' }}>
        {/* Grid dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Aurora glow */}
        <div className="absolute w-80 h-80 rounded-full opacity-[0.12] -top-20 -right-10"
          style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.5) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute w-60 h-60 rounded-full opacity-[0.08] -bottom-16 -left-8"
          style={{ background: 'radial-gradient(ellipse, rgba(123,97,255,0.4) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 py-5 md:py-6">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">平台资讯</h1>
          </div>
          <p className="text-xs text-white/40 ml-8">公告 · 教程 · 活动资讯</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-3">
        {/* Category tabs - Modern pill style */}
        <div className="bg-white rounded-2xl shadow-sm p-2.5 mb-4 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              !selectedCategory
                ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm shadow-blue-500/20'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}>
            <AllApplicationIcon className="w-3.5 h-3.5" />
            全部
          </button>
          {categories.map(cat => {
            const style = categoryStyleMap[cat.name];
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? `${style?.activeBg || 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF]'} text-white shadow-sm`
                    : `${style?.bg || 'bg-gray-50'} text-gray-500 hover:bg-gray-100`
                }`}>
                {style?.IconComponent ? <style.IconComponent className="w-3.5 h-3.5" /> : <span>{cat.icon}</span>}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Articles list - Modern card design */}
        <div className="space-y-3 pb-24 md:pb-8">
          {articles.length === 0 ? (            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
                <AnnounceIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">暂无文章</p>
            </div>
          ) : articles.map(article => {
            const catStyle = categoryStyleMap[article.article_categories?.name];
            return (
              <Link
                key={article.id}
                href={`/announcements/${article.id}`}
                className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                {article.image_url && (
                  <div className="w-full h-40 bg-gray-100 overflow-hidden relative">
                    <img src={article.image_url} alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {!article.image_url && (
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${catStyle?.bg || 'bg-blue-50'} flex items-center justify-center`}>
                        {catStyle?.IconComponent ? <catStyle.IconComponent className="w-5 h-5 text-gray-500" /> : <AnnounceIcon className="w-5 h-5 text-gray-500" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-[#1890FF] transition-colors line-clamp-1">{article.title}</h3>
                        {article.is_announcement && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-medium rounded-full">公告</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{article.content.substring(0, 100)}</p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          catStyle?.bg || 'bg-blue-50'
                        } ${selectedCategory === article.category_id ? 'text-white' : 'text-gray-500'}`}>
                          {article.article_categories?.name || '未分类'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-300">
                          <EyeIcon className="w-3 h-3" />
                          {formatViewCount(article.view_count || 0)}浏览
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Footer />
      <BottomNav active="messages" />
    </div>
  );
}
