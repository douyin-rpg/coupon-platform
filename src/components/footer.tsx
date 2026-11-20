'use client';

import { useEffect, useState } from 'react';

interface FooterLink {
  id: string;
  label: string;
  url: string;
}

type SectionKey = 'contact' | 'platform' | 'qualification';

interface FooterData {
  contact?: FooterLink[];
  platform?: FooterLink[];
  qualification?: FooterLink[];
}

const sectionLabels: Record<SectionKey, string> = {
  contact: '联系我们',
  platform: '关联平台',
  qualification: '资质证照',
};

const sectionKeys: SectionKey[] = ['contact', 'platform', 'qualification'];

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData>({});
  const [companyInfo, setCompanyInfo] = useState('上海格物致品网络科技有限公司');

  useEffect(() => {
    fetch('/api/footer-links')
      .then(r => r.json())
      .then(d => {
        if (d.footerLinks) setFooterData(d.footerLinks);
      })
      .catch(() => {});

    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.company_info) setCompanyInfo(d.settings.company_info);
      })
      .catch(() => {});
  }, []);

  if (Object.keys(footerData).length === 0) return null;

  return (
    <footer className="bg-[#0A1628] text-white/70">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left: Logo & Slogan (hidden on mobile, shown on desktop) */}
          <div className="hidden md:block md:col-span-3">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">惠抢券</span>
              </div>
              <p className="text-white/50 text-sm italic">总能发现好优惠！</p>
            </div>
            <div className="text-xs text-white/40 space-y-1">
              <p>关注或联系我们</p>
              <div className="flex gap-3 mt-2">
                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-[10px] text-white/40">
                  APP下载
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-[10px] text-white/40">
                  官方账号
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-[10px] text-white/40">
                  公众号
                </div>
              </div>
            </div>
          </div>

          {/* Right: Links Grid */}
          <div className="md:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {sectionKeys.map(section => {
                const links = footerData[section];
                if (!links || links.length === 0) return null;
                return (
                  <div key={section}>
                    <h4 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4 pb-2 border-b border-white/10">
                      {sectionLabels[section]}
                    </h4>
                    {section === 'contact' ? (
                      <ul className="space-y-2">
                        {links.map((link: FooterLink) => (
                          <li key={link.id} className="flex items-center gap-2 text-sm">
                            <span className="text-white/50 min-w-[80px]">{link.label}:</span>
                            {link.url.startsWith('mailto:') ? (
                              <a
                                href={link.url}
                                className="text-white/70 hover:text-[#00D4FF] transition-colors"
                              >
                                {link.url.replace('mailto:', '')}
                              </a>
                            ) : link.url.startsWith('http') ? (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
                              >
                                {link.label === '举报入口' ? '举报入口' : link.url}
                              </a>
                            ) : (
                              <span className="text-white/70">{link.url}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : section === 'qualification' ? (
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                        {links.map((link: FooterLink) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white/50 hover:text-[#00D4FF] transition-colors"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                        {links.map((link: FooterLink) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs md:text-sm text-white/60 hover:text-[#00D4FF] transition-colors"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Logo & Slogan */}
        <div className="md:hidden mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z"/>
              </svg>
            </div>
            <span className="text-white font-bold">惠抢券</span>
          </div>
          <p className="text-white/50 text-xs italic">总能发现好优惠！</p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/40">
            <p>{companyInfo}</p>
            <p>© {new Date().getFullYear()} 惠抢券 版权所有</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
