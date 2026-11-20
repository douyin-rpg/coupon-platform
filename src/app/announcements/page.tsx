'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';
import { AnnounceIcon, ArrowLeftIcon, EyeIcon, StarIcon, EditIcon, FileTextIcon, AllApplicationIcon, HelpIcon, RemindIcon } from '@/components/icons';
import { learningGroups, officialHomeUrl } from '@/lib/learning-center';

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

// Learning center tag color mapping
const learningTagColors: Record<string, string> = {
  '了解平台': 'bg-blue-50 text-blue-600 border-blue-100',
  '开店指南': 'bg-cyan-50 text-cyan-600 border-cyan-100',
  '开单攻略': 'bg-sky-50 text-sky-600 border-sky-100',
  '爆单秘籍': 'bg-amber-50 text-amber-600 border-amber-100',
  '爆款打造': 'bg-orange-50 text-orange-600 border-orange-100',
  '数据复盘': 'bg-violet-50 text-violet-600 border-violet-100',
  '达人须知': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
  '达人合作': 'bg-pink-50 text-pink-600 border-pink-100',
  '选品技巧': 'bg-rose-50 text-rose-600 border-rose-100',
  '经营案例': 'bg-teal-50 text-teal-600 border-teal-100',
  '短视频运营': 'bg-slate-50 text-slate-600 border-slate-200',
  '千川投放': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  '直播运营': 'bg-red-50 text-red-600 border-red-100',
  '商城运营': 'bg-green-50 text-green-600 border-green-100',
  '搜索运营': 'bg-blue-50 text-blue-600 border-blue-100',
  '营销工具': 'bg-amber-50 text-amber-600 border-amber-100',
  '新品运营': 'bg-cyan-50 text-cyan-600 border-cyan-100',
  '大促指南': 'bg-orange-50 text-orange-600 border-orange-100',
};

function getTagColor(tag: string): string {
  return learningTagColors[tag] || 'bg-gray-50 text-gray-600 border-gray-200';
}

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

type MainTab = 'announce' | 'learning';

export default function AnnouncementsPage() {
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>('announce');

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

  if (loading && mainTab === 'announce') {
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
          <p className="text-xs text-white/40 ml-8">{mainTab === 'announce' ? '公告 · 教程 · 活动资讯' : '抖音电商学习中心 · 官方免费课程'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-3">
        {/* Main tabs - 平台公告 / 学习中心 */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5 mb-4 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setMainTab('announce')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              mainTab === 'announce'
                ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-md shadow-blue-500/20'
                : 'bg-transparent text-gray-500 hover:bg-gray-50'
            }`}>
            <AnnounceIcon className="w-4 h-4" />
            平台公告
          </button>
          <button
            onClick={() => setMainTab('learning')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              mainTab === 'learning'
                ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-md shadow-blue-500/20'
                : 'bg-transparent text-gray-500 hover:bg-gray-50'
            }`}>
            <HelpIcon className="w-4 h-4" />
            学习中心
          </button>
        </div>

        {mainTab === 'announce' && (
          <>
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
              {articles.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
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
          </>
        )}

        {mainTab === 'learning' && (
          <div className="pb-24 md:pb-8">
            {/* Official learning center banner */}
            <div className="relative overflow-hidden rounded-2xl mb-5 p-5 md:p-7 text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1890FF 0%, #00B4FF 50%, #7B61FF 100%)' }}>
              <div className="absolute inset-0 opacity-[0.12]" style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }} />
              <div className="absolute w-44 h-44 rounded-full opacity-20 -top-16 -right-10"
                style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)', filter: 'blur(24px)' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-[10px] font-medium">官方内容</span>
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-[10px] font-medium">免费学习</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold mb-1">抖音电商学习中心</h2>
                <p className="text-xs md:text-sm text-white/85 mb-4 max-w-lg leading-relaxed">
                  新商成长 / 达人必修 / 经营实操三大路径，千川投放、短视频、直播、商城、搜索运营全场景实战课程，助你从 0 到 1 做好电商。
                </p>
                <a
                  href={officialHomeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1890FF] rounded-full text-xs font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  前往官方学习中心
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Learning groups */}
            {learningGroups.map(group => (
              <section key={group.key} className="mb-7">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${group.gradient} text-white flex items-center justify-center text-base shadow-sm`}>
                    {group.emoji}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{group.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{group.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                  {group.courses.map((course, idx) => (
                    <a
                      key={`${group.key}-${idx}`}
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white rounded-2xl shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-blue-100"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${getTagColor(course.tag)}`}>
                          {course.tag}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1890FF] transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7M9 7h8v8" />
                        </svg>
                      </div>
                      <h4 className="text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-[#1890FF] transition-colors min-h-[2.5rem]">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-2.5 mt-2.5 text-[10px] text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <RemindIcon className="w-3 h-3" />
                          {course.learners}人学习
                        </span>
                        {course.rating && (
                          <span className="inline-flex items-center gap-0.5 text-amber-500">
                            <StarIcon className="w-3 h-3" />
                            {course.rating}
                          </span>
                        )}
                        {course.lessons && (
                          <span className="inline-flex items-center gap-1">
                            <EditIcon className="w-3 h-3" />
                            {course.lessons}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))}

            {/* Bottom disclaimer */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-2.5">
              <HelpIcon className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-400 leading-relaxed">
                学习中心课程内容来自抖音电商官方学习中心（school.jinritemai.com），课程链接均为官方地址，点击卡片即可前往学习。
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <BottomNav active="messages" />
    </div>
  );
}