"use client";

/**
 * 页脚 - 仿抖音电商抖店官网（fxg.jinritemai.com）样式（白底）
 * 左侧：Logo 图片
 * 右侧：廉洁举报 / 关联平台 / 资质证照（三栏链接，静态数据与官网一致）
 * 底部：版权声明
 */
type FooterLink = { id: string; label: string; url: string };

/** 页脚链接数据（与 https://fxg.jinritemai.com 页脚一致） */
const FOOTER_GROUPS: Record<string, FooterLink[]> = {
  "廉洁举报": [
    {
      id: "jb-email",
      label: "lianjie@bytedance.com",
      url: "mailto:lianjie@bytedance.com",
    },
    {
      id: "jb-entry",
      label: "举报入口",
      url: "https://bytedance.larkoffice.com/share/base/form/shrcnTMx4X98p1ISCrklZnxvHHf",
    },
  ],
  "关联平台": [
    { id: "pt-rzzx", label: "热招行业", url: "https://fxg.jinritemai.com/hot-category" },
    { id: "pt-jdfw", label: "基地服务", url: "https://fuwu.jinritemai.com/optimus/60dc30bd05420d0040d2f289" },
    { id: "pt-kfpt", label: "开放平台", url: "https://op.jinritemai.com/home" },
    { id: "pt-fwsc", label: "服务市场", url: "https://fuwu.jinritemai.com/?from=fxg_home_more" },
    { id: "pt-qqg", label: "全球购", url: "https://b.guantou.com/welcome?source=doudian" },
    { id: "pt-lmrz", label: "类目入驻", url: "https://fxg.jinritemai.com/category" },
    { id: "pt-wd", label: "问答列表", url: "https://fxg.jinritemai.com/ask" },
    {
      id: "pt-pmd",
      label: "拍卖店",
      url: "https://fxg.jinritemai.com/login/common?next=https%3A%2F%2Ffxg.jinritemai.com%2Fffa%2Fgov%2Fsettle%2Fhome%3Fshop_type%3D14%26vType%3D0",
    },
    { id: "pt-zjtd", label: "字节跳动", url: "https://www.bytedance.com/zh/" },
    { id: "pt-dy", label: "抖音", url: "https://www.douyin.com/" },
    { id: "pt-jrtt", label: "今日头条", url: "https://www.toutiao.com/" },
    { id: "pt-xgsp", label: "西瓜视频", url: "https://www.ixigua.com/" },
    { id: "pt-dyhsb", label: "抖音火山版", url: "https://www.huoshanzhibo.com/" },
    { id: "pt-jlyq", label: "巨量引擎", url: "https://www.oceanengine.com/?source=doudian" },
    { id: "pt-jlby", label: "巨量百应", url: "https://buyin.jinritemai.com/" },
    { id: "pt-dyds", label: "抖音电商", url: "https://douyinec.com/" },
  ],
  "资质证照": [
    {
      id: "zz-yyzz",
      label: "营业执照",
      url: "https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/20250814-171406.png",
    },
    {
      id: "zz-icp",
      label: "沪ICP备2021017807号-10",
      url: "https://beian.miit.gov.cn/#/Integrated/index",
    },
    {
      id: "zz-gawb",
      label: "沪公网安备 31011002005972号",
      url: "http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=31011002005972",
    },
    {
      id: "zz-dxdk",
      label: "增值电信业务经营许可证(沪B2-20220149)",
      url: "https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/footer/434-01-089-上海格物致品网络科技有限公司-增值电信业务经营许可证（ICP、EDI）20241213-20270130.pdf",
    },
    {
      id: "zz-wxpt",
      label: "(沪)网械平台备字[2022]第00002号",
      url: "https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/footer/434-07-019-上海格物致品网络科技有限公司-医疗器械网络交易服务第三方平台备案凭证20250103.jpg",
    },
    { id: "zz-wyxb", label: "沪网药信备字〔2025〕00219号", url: "" },
    { id: "zz-ws", label: "沪网食备0000515号(第三方平台)", url: "" },
    {
      id: "zz-wypx",
      label: "(沪)网药平台备字[2023]第00004-007号",
      url: "https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/footer/(沪)网药平台备字[2023]第00004-007号.png",
    },
    { id: "zz-jy", label: "集邮市场开办者备案：沪集邮备006", url: "" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white text-[#666] mt-auto">
      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* 左侧：Logo 图片 */}
          <div className="shrink-0 w-full md:w-72 flex flex-col items-center md:items-start">
            <img src="/logo-douyin.png" alt="惠抢券 Logo" className="w-48 h-auto md:w-56 object-contain" />
          </div>

          {/* 右侧：三栏链接 */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {Object.entries(FOOTER_GROUPS).map(([section, links]) => (
              <div key={section}>
                <h4 className="text-[#1A1A1A] text-sm font-semibold mb-4">{section}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.id}>
                      {link.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="nofollow noopener"
                          className="text-[#8C8C8C] text-[13px] hover:text-[#1890FF] transition-colors break-all"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <span className="text-[#8C8C8C] text-[13px] break-all">{link.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部版权条 */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-[#8C8C8C] text-xs">© 2027 惠抢券 版权所有</p>
        </div>
      </div>
    </footer>
  );
}