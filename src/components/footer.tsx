'use client';

import { useEffect, useState } from 'react';

interface FooterLink {
  id: string;
  label: string;
  url: string;
}

type SectionKey = 'official' | 'platform' | 'contact';

interface FooterData {
  official?: FooterLink[];
  platform?: FooterLink[];
  contact?: FooterLink[];
}

const sectionLabels: Record<SectionKey, string> = {
  official: '关联官网',
  platform: '关联平台',
  contact: '联系我们',
};

const sectionKeys: SectionKey[] = ['official', 'platform', 'contact'];

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
    <footer className="bg-[#0A1628] text-white/70 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {sectionKeys.map(section => {
            const links = footerData[section];
            if (!links || links.length === 0) return null;
            return (
              <div key={section}>
                <h4 className="text-white font-semibold text-base mb-4 pb-2 border-b border-white/10">
                  {sectionLabels[section]}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link: FooterLink) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/60 hover:text-[#00D4FF] transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Divider */}
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
